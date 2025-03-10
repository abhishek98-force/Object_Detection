import { useState, useRef, useLayoutEffect } from 'react';
import { Stage, Layer, Image } from 'react-konva';
import Konva from 'konva';
import './App.css';

import LabelBox from './components/LabelBox';
import { PolygonType } from './types';
import {
  updatePolygonDB,
  fetchPolygons,
  addConstructedPolygon,
} from './services/updateDB';
import Polygon from './components/Polygon';
import MultipleOption from './components/MultipleOption';

import PolygonDrawLayer from './components/PolygonDrawLayer';
import { PartialPolygonType } from './types';

function App() {
  const [polygons, setPolygons] = useState<PolygonType[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedId, selectShape] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [optionIndex, setOptionIndex] = useState<number>(0);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setDrawing] = useState<boolean>(false);

  const stageRef = useRef<Konva.Stage>(null);
  const imageid = useRef<string>('');

  const [canvasDimension, setCanvasDimension] = useState({
    height: 0,
    width: 0,
  });

  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const [canvaScale, setCanvaScale] = useState(0);

  useLayoutEffect(() => {
    function updateWidth() {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const updatedWidth =
        viewportWidth > 640 ? 0.7 * viewportWidth : 0.8 * viewportWidth;
      const updatedHeight =
        viewportWidth > 640 ? updatedWidth / 2 : updatedWidth * 2.0;

      // Ensure dimensions do not exceed viewport
      const constrainedHeight = Math.min(updatedHeight, viewportHeight);
      const constrainedWidth = Math.min(updatedWidth, viewportWidth);

      setCanvasDimension({
        height: constrainedHeight,
        width: constrainedWidth,
      });
    }

    window.addEventListener('resize', updateWidth);
    updateWidth();

    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  async function updatePolygon(polygon: PolygonType) {
    const newPolygons = polygons.map((pg) => {
      if (pg.id === polygon.id) {
        updatePolygonDB(polygon);
        return polygon;
      } else {
        return pg;
      }
    });
    if (newPolygons) {
      setPolygons(newPolygons);
      console.log({ polygon: polygons });
    }
  }

  function handleSubmit(labelVal: string) {
    setShowModal(false);
    const updatedPolygons = polygons.map((pg) => {
      if (pg.id === selectedId) {
        const updatedPg = {
          ...pg,
          label: labelVal,
        };
        updatePolygonDB(updatedPg);
        return updatedPg;
      } else {
        return pg;
      }
    });

    setPolygons(updatedPolygons);
    console.log({ polygon: polygons });
  }

  function changeOpenValue(data: boolean) {
    setShowModal(data);
  }

  async function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
    const outputTest = await fetch('/api/healthz');
    console.log({ outputTest: outputTest });
    if (event.target.files !== null && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.src = String(reader.result);
        img.onload = () => {
          const imageRatio = img.width / img.height;
          let newWidth = 0;
          let newHeight = 0;
          if (img.width > canvasDimension.width) {
            newWidth = canvasDimension.width;
            newHeight = canvasDimension.width / imageRatio;
          } else {
            newWidth = img.width;
            newHeight = img.height;
          }

          const centeredX = (canvasDimension.width - newWidth) / 2;
          const centeredY = (canvasDimension.height - newHeight) / 2;

          setImagePosition({ x: centeredX, y: centeredY });

          setImageSize((prev) => {
            return { ...prev, width: newWidth, height: newHeight };
          });

          setImage(img);
        };
      };
      reader.readAsDataURL(file);
    }
  }

  async function detectImageAndObtainPolygons(
    e: React.MouseEvent<HTMLButtonElement>
  ) {
    console.log(e);
    const base64Data = convertImageToBase64();
    console.log({ base64: base64Data });

    const postData = {
      image_url: base64Data,
    };
    console.log('image data is ' + postData);
    const { id, polygons } = await fetchPolygons(postData);
    imageid.current = id;
    console.log({ image_id: imageid.current });
    console.log({ polygonRes: polygons });
    setPolygons(polygons);
    console.log({ polygon: polygons });
  }

  function convertImageToBase64() {
    if (stageRef.current) {
      const base64ImageData = stageRef.current.toDataURL();
      const base64String = base64ImageData.split(',')[1];
      return base64String;
    }
  }

  function handlePolygonSelection(
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>
  ) {
    try {
      console.log(e);
      if (stageRef.current) {
        const pos = stageRef.current.getPointerPosition();
        const result = stageRef.current.getAllIntersections(pos);
        if (result.length > 0) {
          const resArr = result
            .map((e) => {
              if (
                (e.className === 'Rect' || e.className == 'Line') &&
                e.parent !== null
              ) {
                return e.parent.attrs.id;
              } else {
                return;
              }
            })
            .filter(Boolean);
          if (resArr.length === 1) {
            selectShape(resArr[0]);
          } else {
            selectShape(resArr[optionIndex]);
            setOptions(resArr);
          }
        }
        console.log(result);
      }
    } catch (e) {
      console.log(e);
    }
  }

  function cancelMultipleOption() {
    selectShape('');
    setOptionIndex(0);
    setOptions([]);
  }

  function iterateOptions() {
    selectShape((prev) => {
      console.log(prev);
      if (optionIndex === options.length - 1) {
        setOptionIndex(0);
        return options[0];
      } else {
        setOptionIndex(optionIndex + 1);
        return options[optionIndex + 1];
      }
    });
  }

  function stopDrawing() {
    setDrawing(false);
  }

  async function sendPolygonDataToParent(polygondata: PartialPolygonType) {
    const reqData = { image_id: imageid.current, ...polygondata };
    console.log('inside sendPolygonData ', { reqData: reqData });
    const newPolygon: PolygonType = await addConstructedPolygon(reqData);
    console.log({ reqData: reqData });
    setPolygons((prevPolygons) => {
      return [...prevPolygons, newPolygon];
    });
    console.log({ polygon: polygons });
  }

  function handleWheel(event: Konva.KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault();
    const scaleBy = 1.009;
    const stage = event.target.getStage();
    const oldScale = stage?.scaleX();

    const pointerPosition = stage?.getPointerPosition();
    if (pointerPosition && stage && oldScale) {
      const mousePointTo = {
        x: (pointerPosition.x - stage?.x()) / oldScale,
        y: (pointerPosition.y - stage?.y()) / oldScale,
      };

      const newScale =
        event.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

      stage?.scale({ x: newScale, y: newScale });
      setCanvaScale(newScale);
      const newPos = {
        x: pointerPosition.x - mousePointTo.x * newScale,
        y: pointerPosition.y - mousePointTo.y * newScale,
      };
      stage.position(newPos);
      stage.batchDraw();
    }
  }

  return (
    <div className="flex flex-col items-center justify-center max-h-screen max-w-screen">
      <div className="fixed top-2 flex flex-wrap md:flex-row justify-center mt-3">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
          <input type="file" onChange={(e) => uploadFile(e)} />
        </button>
        <div className="flex flex-row mt-3 md:mt-0 md:static">
          <button
            className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
            disabled={selectedId ? false : true}
            onClick={() => setShowModal(true)}
          >
            Label
          </button>
          <button
            className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
            onClick={(e) => {
              detectImageAndObtainPolygons(e);
            }}
          >
            Detect
          </button>
          <button
            className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => setDrawing(true)}
          >
            Draw
          </button>
        </div>
      </div>
      <div
        className="mt-40 mx-auto bg-white"
        style={{
          height: `${canvasDimension.height}px`,
          width: `${canvasDimension.width}px`,
        }}
      >
        <Stage
          width={canvasDimension.width}
          height={canvasDimension.height}
          ref={stageRef}
          style={{ backgroundColor: 'white' }}
          onWheel={handleWheel}
          draggable
        >
          <Layer>
            {image && (
              <Image
                x={imagePosition.x}
                y={imagePosition.y}
                image={image}
                width={imageSize.width}
                height={imageSize.height}
                onClick={(e) => {
                  if (e.target.className === 'Image') {
                    selectShape('');
                  }
                }}
              />
            )}
            {polygons.length > 0 &&
              polygons.map((polygon, index) => {
                return (
                  <Polygon
                    key={index}
                    polygon={polygon}
                    isSelected={polygon.id === selectedId}
                    onClick={handlePolygonSelection}
                    updatePolygonParent={updatePolygon}
                  />
                );
              })}
          </Layer>
          {isDrawing && stageRef.current && (
            <PolygonDrawLayer
              isDrawing={isDrawing}
              stageRef={stageRef.current}
              stopDrawing={stopDrawing}
              sendPolygonDataToParent={sendPolygonDataToParent}
              canvaScale={canvaScale}
              canvasDimension={canvasDimension}
            />
          )}
        </Stage>
      </div>
      {selectedId && (
        <LabelBox
          openDialog={showModal}
          changeOpenValue={changeOpenValue}
          handleSubmit={handleSubmit}
        />
      )}
      {options.length > 1 && (
        <div>
          <MultipleOption
            cancelMultipleOption={cancelMultipleOption}
            iterateOptions={iterateOptions}
          />
        </div>
      )}
    </div>
  );
}

export default App;
