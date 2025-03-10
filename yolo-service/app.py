import base64
from yolo_onnx.yolov8_onnx import YOLOv8
from PIL import Image
from io import BytesIO
import json
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

YOLO_DICT = {
    0: 'person', 1: 'bicycle', 2: 'car', 3: 'motorcycle', 4: 'airplane', 5: 'bus', 6: 'train', 7: 'truck', 8: 'boat', 9: 'traffic light', 10: 'fire hydrant', 11: 'stop sign', 12: 'parking meter', 13: 'bench', 14: 'bird', 15: 'cat', 16: 'dog', 17: 'horse', 18: 'sheep', 19: 'cow', 20: 'elephant', 21: 'bear', 22: 'zebra', 23: 'giraffe', 24: 'backpack', 25: 'umbrella', 26: 'handbag', 27: 'tie', 28: 'suitcase', 29: 'frisbee', 30: 'skis', 31: 'snowboard', 32: 'sports ball', 33: 'kite', 34: 'baseball bat', 35: 'baseball glove', 36: 'skateboard', 37: 'surfboard', 38: 'tennis racket', 39: 'bottle', 40: 'wine glass', 41: 'cup', 42: 'fork', 43: 'knife', 44: 'spoon', 45: 'bowl', 46: 'banana', 47: 'apple', 48: 'sandwich', 49: 'orange', 50: 'broccoli', 51: 'carrot', 52: 'hot dog', 53: 'pizza', 54: 'donut', 55: 'cake', 56: 'chair', 57: 'couch', 58: 'potted plant', 59: 'bed', 60: 'dining table', 61: 'toilet', 62: 'tv', 63: 'laptop', 64: 'mouse', 65: 'remote', 66: 'keyboard', 67: 'cell phone', 68: 'microwave', 69: 'oven', 70: 'toaster', 71: 'sink', 72: 'refrigerator', 73: 'book', 74: 'clock', 75: 'vase', 76: 'scissors', 77: 'teddy bear', 78: 'hair drier', 79: 'toothbrush'
}

yolov8_detector = YOLOv8("yolov8l.onnx")


def detect_using_YOLO(event, context):
    try:
        logger.info("Starting YOLO detection")
        logger.info("The input event is: %s", json.dumps(event)[:1000])
        # Open image with PIL
        score_threshold = 0.5
        request = None
        img_b64 = None
        if 'body' in event:  
            request = json.loads(event['body'])
            logger.info("request after getting body: %s", json.dumps(request)[:100])
            img_b64 = request['image']
            logger.info("Request received: %s", img_b64[:100])
        else: 
            img_b64 = event['image'] 
        

        size = 640
        conf_thres = 0.3
        iou_thres = 0.5
        img = Image.open(BytesIO(base64.b64decode(img_b64)))
        
        if img.mode == 'RGBA':
            img = img.convert('RGB')
            logger.info("Converted image from RGBA to RGB")

        buffered = BytesIO()
        img.save(buffered, format="JPEG") 

        logger.info("Running model prediction")
        detections = yolov8_detector(img, size=size, conf_thres=conf_thres, iou_thres=iou_thres)
        
        logger.info("Processing results")
        detection_result = []
        for obj in detections:
            coordinates = tuple(obj['bbox'])
            label = YOLO_DICT.get(obj['class_id'], 'unknown')
            detect_object = (coordinates, label)
            detection_result.append(detect_object)
        
        logger.info("Detection result: %s", detection_result)
        
        return {
            'rectangles': detection_result
        }
    
    except Exception as e:
        logger.error("Error: %s", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error: {str(e)}")
        }