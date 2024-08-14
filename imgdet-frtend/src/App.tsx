import {
  useState,
  useRef,
  useEffect,
  Fragment,
  createRef,
  useLayoutEffect,
} from 'react';
import {
  Stage,
  Layer,
  Rect,
  Text,
  Group,
  Transformer,
  Image,
  Circle,
} from 'react-konva';
import Konva from 'konva';
import './App.css';

import LabelBox from './components/labelBox';
import { RectangleType, PolygonType } from './types';
import {
  updatePolygonDB,
  fetchPolygons,
  addConstructedPolygon,
} from './services/updateDB';
import Polygon from './components/Polygon';
import MultipleOption from './components/MultipleOption';

import PolygonDrawLayer from './components/PolygonDrawLayer';

const port = 5000;

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
  const polygonLayer = createRef<Konva.Layer>();

  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);

  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const [canvaScale, setCanvaScale] = useState(0);

  useLayoutEffect(() => {
    function updateWidth() {
      let updatedWidth =
        window.innerWidth > 640
          ? 0.7 * window.innerWidth
          : 0.8 * window.innerWidth;
      let updatedHeight =
        window.innerWidth > 640 ? updatedWidth / 2 : updatedWidth * 1.5;

      setCanvasWidth(updatedWidth);
      setCanvasHeight(updatedHeight);
      console.log(updatedWidth, updatedHeight);
    }
    window.addEventListener('resize', updateWidth);
    updateWidth();
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  async function updatePolygon(polygon: PolygonType) {
    const newPolygons = polygons.map((pg, index) => {
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
    let updatedPolygons = polygons.map((pg, index) => {
      if (pg.id === selectedId) {
        let updatedPg = {
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

  function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
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
          if (img.width > canvasWidth) {
            newWidth = canvasWidth;
            newHeight = canvasWidth / imageRatio;
          } else {
            newWidth = img.width;
            newHeight = img.height;
          }

          let centeredX = (canvasWidth - newWidth) / 2;
          let centeredY = (canvasHeight - newHeight) / 2;

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
    let base64Data = convertImageToBase64();
    let postData = {
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

  function handlePolygonSelection(e: Konva.KonvaEventObject<MouseEvent>) {
    try {
      if (stageRef.current) {
        const pos = stageRef.current.getPointerPosition();
        let result = stageRef.current.getAllIntersections(pos);
        if (result.length > 0) {
          let resArr = result
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

  async function sendPolygonDataToParent(polygondata: any) {
    const reqData = { image_id: imageid.current, ...polygondata };
    console.log('inside sendPolygonData ', { reqData: reqData });
    let newPolygon: PolygonType = await addConstructedPolygon(reqData);
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
        y: (pointerPosition.y - stage.y()) / oldScale,
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
    <>
      <div
        style={{
          height: `${canvasHeight}px`,
          width: `${canvasWidth}px`,
          marginTop: '20px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <Stage
          width={canvasWidth}
          height={canvasHeight}
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
            />
          )}
        </Stage>
      </div>
      <div className="flex justify-center mt-3">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
          <input type="file" onChange={(e) => uploadFile(e)} />
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
          disabled={selectedId ? false : true}
          onClick={() => setShowModal(true)}
        >
          Label
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
          onClick={(e) => {
            detectImageAndObtainPolygons(e);
          }}
        >
          Detect
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={(e) => setDrawing(true)}
        >
          Draw
        </button>
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
    </>
  );
}

export default App;
