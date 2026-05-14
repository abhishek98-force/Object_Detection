# VisionAnnotator

identifying and demarcating objects from images and videos using sota libraries/ecosystem for object detection

## How It Works

1. **Upload Phase**: Users upload images or videos through the web interface
2. **Detection Phase**: The backend sends images to the YOLO service which processes them using YOLOv8 (Large) ONNX model
3. **Post-Processing**: The backend merges overlapping detections and applies filters based on confidence scores
4. **Visualization**: Detected objects are displayed on the canvas with bounding boxes and class labels
5. **Manual Annotation**: Users can manually draw polygons (rectangles or free-form shapes) on the canvas to mark objects that the model missed or to correct existing detections. Support includes:
   - Drawing rectangular bounding boxes
   - Drawing free-form polygons with multiple points
   - Dragging and resizing annotations
   - Labeling each annotation with custom text
6. **Data Persistence**: All detections (automatic + manual) and their metadata (coordinates, labels) are persisted to PostgreSQL database for future reference and retraining
   
## To use locally

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/visualobjects.git

2. Navigate to the project directory:

    ```bash
   cd visualobjects

3. Copy yolo.onnx file from release into the yolo-service

4. Build and start Docker containers:

    ```bash
   docker compose up -d --build

5. Access the frontend through http://localhost:5173.
   

