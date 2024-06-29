import { useState, useRef, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { createPortal } from 'react-dom';
import Button from 'react-bootstrap/Button';

import './App.css';
import ModalContent from './components/ModelContent';
import DrawConsole from './components/DrawConsole';

function App() {
  const noImageUrl = '../public/image.png';
  const canvasRef = useRef(null);
  const [image, setImage] = useState(noImageUrl);
  const [updateCanvas, setUpdateCanvas] = useState(false);
  const [base64Image, setbase64ImageData] = useState('');
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [rectangles, setRectangles] = useState(null);
  const [showInput, setShowInput] = useState(false);
  const [inputCordinate, setInputCordinate] = useState({ x: 0, y: 0 });
  const [inputTextValue, setInputTextValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRectangle, setSelectedRectangle] = useState(null);
  const [imageBound, setImageBound] = useState(null);
  const [imageBound1, setImageBound1] = useState(null);
  const [imgObject, setImgObject] = useState(null);

  const [undo, setUndo] = useState(false);
  const [pathCompleted, setPathCompelted] = useState([]);

  const isFirstRectanglesUpdate = useRef(true);
  const imageId = useRef(null);

  let isFirstClick = true;
  let previousPoint = null;
  let setDrawing = false;
  let firstUndo = true;
  let initialPreviousPoint;
  let path = [];

  function startDraw() {
    setDrawing = true;
  }

  function stopDraw() {
    setDrawing = false;
    isFirstClick = true;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.beginPath();
    context.moveTo(previousPoint.x, previousPoint.y);
    context.lineTo(initialPreviousPoint.x, initialPreviousPoint.y);
    path.push({ x: initialPreviousPoint.x, y: initialPreviousPoint.y });
    context.strokeStyle = 'red';
    context.stroke();
    context.closePath();
    setPathCompelted([...pathCompleted, path]);
    let body = {
      id: imageId.current,
      path: path,
    };
    console.log('json body', JSON.stringify(body));
    console.log('rectangles are', rectangles);
    fetch('http://localhost:5000/api/add_constructed_marker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        setRectangles((prevRectangles) => [...prevRectangles, data]);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }
  function uploadFile(event) {
    console.log(event.target.files[0]);
    let canvas = document.querySelector('.ImageHolder');
    setImageBound1({
      x: canvas.getBoundingClientRect().left,
      y: canvas.getBoundingClientRect().top,
    });
    setImage(event.target.files[0]);
  }

  const handleLabel = (id) => (labelVal) => {
    const updatedRectangles = rectangles.map((rectangle) => {
      if (rectangle.id === id) {
        return { ...rectangle, objectType: labelVal };
      } else {
        return rectangle;
      }
    });
    const data = {
      id: id,
      label: labelVal,
    };
    fetch('http://localhost:5000/api/label_modify', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Success:', data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });

    setRectangles(updatedRectangles);
    setShowModal(false);
    setShowInput(true);
  };

  useEffect(() => {
    if (image !== noImageUrl && rectangles === null) {
      drawImage();
    }
    if (isFirstRectanglesUpdate.current && rectangles !== null) {
      drawDetectedRectangles(rectangles);
      setIsButtonDisabled(true);
      isFirstRectanglesUpdate.current = false;
    }

    if ((undo === true && imgObject != null) || pathCompleted.length > 0) {
      constructImage(imgObject);
      if (rectangles !== null) {
        drawDetectedRectangles(rectangles);
      }
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (pathCompleted.length > 0) {
        pathCompleted.forEach((path) => {
          path.forEach((point, index) => {
            if (index === 0) {
              context.beginPath();
              context.moveTo(point.x, point.y);
            } else {
              context.lineTo(point.x, point.y);
            }
          });
          context.strokeStyle = 'red';
          context.stroke();
          context.closePath();
        });
      }
      firstUndo = false;
      setUndo(false);
    }
  }, [image, rectangles, undo, pathCompleted]);

  function convertImageToBase64() {
    const canvas = canvasRef.current;
    const base64ImageData = canvas.toDataURL('image/jpg');
    const base64String = base64ImageData.split(',')[1];
    setbase64ImageData(base64String);
    console.log('data is' + base64String);
  }

  function drawDetectedRectangles(rectangles) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    rectangles.forEach((item) => {
      ctx.moveTo(item.vertices[0][0], item.vertices[0][1]);
      for (let i = 1; i < item.vertices.length; i++) {
        ctx.lineTo(item.vertices[i][0], item.vertices[i][1]);
      }
      ctx.lineTo(item.vertices[0][0], item.vertices[0][1]);
    });
    ctx.stroke();
    ctx.closePath();
    setIsButtonDisabled(true);
  }

  function drawImage() {
    const file = image;
    console.log('file is' + file);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        constructImage(img);
        setIsImageUploaded(true);
        convertImageToBase64();
        setImgObject(img);
      };
    };
    reader.readAsDataURL(file);
  }

  function constructImage(img) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 716;
    canvas.height = 411;
    console.log('Width of canvas is' + canvas.width + 'x' + canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  function handleCanvasClick(event) {
    if (setDrawing) {
      if (isFirstClick) {
        isFirstClick = false;
        previousPoint = detectMousePoint(event);
        drawDot(previousPoint);
        path.push(previousPoint);
        initialPreviousPoint = previousPoint;
        return;
      }
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const clickedPoint = detectMousePoint(event);
      path.push(clickedPoint);
      if (previousPoint) {
        drawDot(clickedPoint);
        context.beginPath();
        context.moveTo(previousPoint.x, previousPoint.y);
        context.lineTo(clickedPoint.x, clickedPoint.y);
        context.strokeStyle = 'red';
        context.stroke();
        context.closePath();
        previousPoint = clickedPoint;
      }
    } else {
      const rect = event.target.getBoundingClientRect();
      setImageBound({ x: rect.left, y: top.rect });
      const clickedX = event.clientX - rect.left;
      const clickedY = event.clientY - rect.top;

      // const rectObj = rectangles.find((rectangle) => {
      //   return (
      //     clickedX >= rectangle.x &&
      //     clickedX < rectangle.x + rectangle.width &&
      //     clickedY >= rectangle.y &&
      //     clickedY < rectangle.y + rectangle.height
      //   );
      // });

      let clickedRect;
      for (let i = 0; i < rectangles.length; i++) {
        if (is_inside(rectangles[i].vertices, clickedX, clickedY)) {
          setSelectedRectangle(rectangles[i]);
          clickedRect = rectangles[i];
          break;
        }
      }

      setShowModal(true);
      setInputCordinate({
        x: rect.left + clickedRect[0][0],
        y: rect.top + clickedRect[0][1],
      });
    }
  }

  function is_inside(vertices, x, y) {
    let cnt = 0;
    for (let i = 0; i < vertices.length; i++) {
      let x1 = vertices[i][0];
      let y1 = vertices[i][1];
      let x2 = vertices[(i + 1) % vertices.length][0];
      let y2 = vertices[(i + 1) % vertices.length][1];
      if (y1 == y2) {
        continue;
      }
      if (y < Math.min(y1, y2)) {
        continue;
      }
      if (y >= Math.max(y1, y2)) {
        continue;
      }
      let x_inters = ((y - y1) * (x2 - x1)) / (y2 - y1) + x1;
      if (x_inters > x) {
        cnt++;
      }
    }
    return cnt % 2 == 1;
  }

  function detectMousePoint(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x, y };
  }

  function drawDot(point) {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.beginPath();
    context.arc(point.x, point.y, 2, 0, 2 * Math.PI);
    context.fillStyle = 'red';
    context.fill();
    context.closePath();
  }

  // post api request to send the image to backend
  //get api request to get the array of rectangle coordinates to display
  // put api to update the label of the seleced rectang;e
  async function drawRec() {
    await fetchRectangleData();

    // ctx.strokeRect(250, 80, 20, 20);
    // ctx.lineWidth = 2;
    // ctx.strokeStyle = 'red';
    // ctx.font = '20px Arial';
    // ctx.fillStyle = 'red';
    console.log('Rectangle ' + rectangles);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function fetchRectangleData() {
    let postData = {
      image_url: base64Image,
    };
    console.log('image data is ' + postData);
    fetch('http://localhost:5000/api/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        imageId.current = data.id;
        setRectangles(data.rectangles);
      })
      .catch((error) => console.log('Error: ' + error));
  }

  return (
    <div
      className="App"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div
          className="ImageHolder"
          style={{ width: '716px', height: '411px' }}
        >
          <canvas
            ref={canvasRef}
            style={{
              border: '1px solid black',
              width: '716px',
              height: '411px',
              display: isImageUploaded ? 'block' : 'none',
            }}
            onClick={handleCanvasClick}
          />

          {rectangles &&
            rectangles.map((rectangle, index) => {
              return (
                <output
                  key={index}
                  style={{
                    position: 'absolute',
                    top: `${imageBound1.y + rectangle.vertices[0][1]}px`,
                    left: `${imageBound1.x + rectangle.vertices[0][0]}px`,
                    color: 'red',
                    zIndex: 100,
                  }}
                >
                  {rectangle.objectType}
                </output>
              );
            })}

          <img
            src={noImageUrl}
            alt="missing image"
            style={{
              objectFit: 'cover',
              height: '100%',
              width: '100%',
              display: isImageUploaded === false ? 'block' : 'none',
            }}
          />
        </div>
        <DrawConsole
          initiateDraw={startDraw}
          completeDraw={stopDraw}
          performUndo={() => setUndo(true)}
        />
      </div>
      {showModal &&
        selectedRectangle &&
        createPortal(
          <ModalContent
            onClose={closeModal}
            sendLabelToApp={handleLabel(selectedRectangle.id)}
          />,
          document.body
        )}
      <div
        className="buttonGroup"
        style={{ marginTop: '30px', display: 'flex', flexDirection: 'row' }}
      >
        <Button variant="dark">
          <input type="file" onChange={uploadFile} />
        </Button>
        &nbsp; &nbsp; &nbsp;
        <Button variant="dark" onClick={drawRec} disabled={isButtonDisabled}>
          Detect
        </Button>
      </div>
    </div>
  );
}

export default App;
