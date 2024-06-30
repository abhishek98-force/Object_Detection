from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_cors import CORS
import cv2
import numpy as np
from io import BytesIO
import base64
from ultralytics import YOLO

from coordinate import Coordinate

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
CORS(app)

db = SQLAlchemy(app)

class Image(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    data_url = db.Column(db.Text, nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    markers = db.relationship('Marker', backref='image')
    def __repr__(self):
        return '<Image %r>' % self.id

class Marker(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    label = db.Column(db.String)
    image_id = db.Column(db.Integer, db.ForeignKey('image.id'), nullable=False)
    coordinates = db.Column(db.JSON)

    def __repr__(self):
        return '<Marker %r>' % self.id

with app.app_context():   
    db.create_all()
    
def preprocess_image(image):
    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    return blurred

def find_contours(blurred):
    edges = cv2.Canny(blurred, 50, 150)
    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    return contours


def filter_and_extract_rectangles(contours, threshold_area):
    rectangles = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        if w * h > threshold_area:  # Filter out small rectangles
            rectangles.append(((x, y, x + w, y + h), None))
    rectangles = merge_overlapping_rectangles(rectangles)
    return rectangles

def merge_overlapping_rectangles(rectangles_with_labels):
    merged_rectangles_with_labels = []
    rectangles = [rect for rect, _ in rectangles_with_labels]
    labels = [label for _, label in rectangles_with_labels]

    while rectangles:
        rect = rectangles.pop(0)
        label = labels.pop(0)
        merged = False
        for i in range(len(rectangles)):
            other_rect = rectangles[i]
            other_label = labels[i]
            if rectangles_overlap(rect, other_rect):
                merged_rect = merge_two_rectangles(rect, other_rect)
                rectangles.pop(i)
                labels.pop(i)
                if other_label is not None:
                    label = other_label  # Model label takes precedence
                rectangles.append(merged_rect)
                labels.append(label)
                merged = True
                break
        if not merged:
            merged_rectangles_with_labels.append((rect, label))
    return merged_rectangles_with_labels

def rectangles_overlap(rect1, rect2):
    return not (rect1[2] < rect2[0] or rect1[0] > rect2[2] or rect1[3] < rect2[1] or rect1[1] > rect2[3])

def merge_two_rectangles(rect1, rect2):
    x1 = min(rect1[0], rect2[0])
    y1 = min(rect1[1], rect2[1])
    x2 = max(rect1[2], rect2[2])
    y2 = max(rect1[3], rect2[3])
    return (x1, y1, x2, y2)

def add_yolov8_detections(image, score_threshold=0.5):

    model = YOLO('yolov8l.pt')
    results = model(image)
    result = results[0] 
    boxes = result.boxes

    model_rectangles_with_labels = []
    detection_boxes = boxes.xyxy.cpu().numpy()
    detection_scores = boxes.conf.cpu().numpy()
    detection_classes = boxes.cls.cpu().numpy().astype(int)

    for i in range(len(detection_boxes)):
        if detection_scores[i] >= score_threshold:
            box = detection_boxes[i]
            x_min, y_min, x_max, y_max = int(box[0]), int(box[1]), int(box[2]), int(box[3])
            label_int = detection_classes[i]
            label_str = results[0].names.get(label_int)
            model_rectangles_with_labels.append(((x_min, y_min, x_max, y_max), label_str))
    
    return model_rectangles_with_labels


def merge_rectangles_from_model_and_opencv(image, score_threshold=0.5, threshold_area=10):
    final_rectangles = []
    try:
        blurred_img = preprocess_image(image)
        contours = find_contours(blurred_img)
        final_rectangles_with_labels = filter_and_extract_rectangles(contours, threshold_area)

        model_rectangles_with_labels = add_yolov8_detections(image, score_threshold)
        all_rectangles_with_labels = final_rectangles_with_labels + model_rectangles_with_labels

        final_rectangles = [[(x1, y1), (x2, y2), label] for ((x1, y1, x2, y2), label) in all_rectangles_with_labels]
    except Exception as e:  
        print(e)
    return final_rectangles

def get_rectangle_vertices(rectangles):
    rectangle_vertices = []
    for rectangle in rectangles:
       (x1, y1), (x2, y2), label = rectangle
       rectangle_vertices.append([(x1, y1),(x2,y1),(x2, y2),(x1,y2)])

    print(rectangle_vertices)
    return rectangle_vertices
    
@app.route('/')

def index():
    return "Visual objects"

@app.route('/api/images', methods=['POST'])
def insertImgAndReturnRec():
    try:
        data = request.get_json()

        new_img = Image(data_url = data['image_url'])
        base64_bytes = base64.b64decode(data['image_url'])
        image_data = BytesIO(base64_bytes)
        image = cv2.imdecode(np.frombuffer(image_data.read(), np.uint8), cv2.IMREAD_COLOR)

        rectangles = merge_rectangles_from_model_and_opencv(image, score_threshold=0.5, threshold_area=100)
        print('rectangle ', rectangles)
        rectangles = get_rectangle_vertices(rectangles)
        print(rectangles) 
       
      
        for data in rectangles:
            point = [Coordinate(x, y) for (x, y) in data]
            point_dict = [coordinate.to_dict() for coordinate in point]
            new_marker = Marker(label = '', coordinates = point_dict)
            new_img.markers.append(new_marker)

        try:
            db.session.add(new_img)
            db.session.commit()
            rectangle_objects = []
            image = Image.query.get(new_img.id)
            if image is None:
                return jsonify({'error': 'Image not found'}), 404
            for marker in image.markers:
                    coordinates = list(marker.coordinates)
                    rectangle_objects.append({
                            'id': marker.id,
                            'vertices': coordinates, 
                            'objectVal': '',  # replace with actual object value
                            'probability': 95.0,  # replace with actual probability
                    })
            imgRectData = {
                'id' : new_img.id,
                'rectangles' : rectangle_objects
            }
            jsonify_rect = jsonify(imgRectData)   
        except Exception as e:
            print('Error', e)
            jsonify_rect = 'Error: ' + str(e)
            return jsonify({'error': 'Database error: ' + str(e)}), 500
        


        return jsonify_rect
    except Exception as e:
        print("Error", e)
        return jsonify({'error': 'Database error: ' + str(e)}), 500
   
@app.route('/api/label_modify', methods=['PUT'])   
def label_modify():
    try:
        data = request.get_json()
        marker = Marker.query.get(data['id'])
        if marker is None:
            return jsonify({'error': 'Marker not found'}), 404
        marker.label = data['label']
        print(marker)
        db.session.commit()
        return jsonify({'message': 'Image updated successfully'}), 200
    except:
        return jsonify({'error': 'Database error'}), 500
    
@app.route('/api/add_constructed_marker', methods=['POST'])
def add_constructed_marker():
    try:
        print('request', request)
        data = request.get_json()
        print('data', data)
        image = Image.query.get(data['id'])
        if image is None:
            return jsonify({'error': 'Image not found'}), 404
        coordinates = data['path']
        point = [Coordinate(coord['x'], coord['y']) for coord in coordinates]
        point_dict = [coordinate.to_dict() for coordinate in point]
        new_marker = Marker(label = '', coordinates = point_dict)
        image.markers.append(new_marker)
        db.session.add(new_marker)
        db.session.commit()
        marker_data = {
            'id': new_marker.id,
            'vertices': list(new_marker.coordinates),
            'objectVal': '',  # replace with actual object value
            'probability': 95.0, 
        }
        jsonify_rect = jsonify(marker_data)   
        return jsonify_rect
    except:
        return jsonify({'error': 'Database error'}), 500
if __name__ == '__main__':
    app.run(app.run(host='0.0.0.0'),debug=True)