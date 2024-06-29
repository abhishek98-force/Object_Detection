from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_cors import CORS
import cv2
import numpy as np
from io import BytesIO
import base64

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
            rectangles.append((x, y, x + w, y + h))
    return rectangles

def merge_rectangles(rectangles):
    if not rectangles:
        return []

    merged = True
    while merged:
        merged = False
        new_rectangles = []
        while rectangles:
            r1 = rectangles.pop()
            if not rectangles:
                new_rectangles.append(r1)
                break
            merged_rectangles = []
            for r2 in rectangles:
                if (r1[0] < r2[2] and r1[2] > r2[0] and
                    r1[1] < r2[3] and r1[3] > r2[1]):
                    r1 = (min(r1[0], r2[0]), min(r1[1], r2[1]),
                          max(r1[2], r2[2]), max(r1[3], r2[3]))
                    merged = True
                else:
                    merged_rectangles.append(r2)
            rectangles = merged_rectangles
            new_rectangles.append(r1)
        rectangles = new_rectangles
    return rectangles

def find_and_merge_rectangles(image, threshold_area=100):
    # Preprocess image
    blurred = preprocess_image(image)

    # Apply threshold
    # thresh = apply_threshold(blurred)

    # Find contours
    contours = find_contours(blurred)

    # Filter and extract rectangles
    rectangles = filter_and_extract_rectangles(contours, threshold_area)

    # Merge rectangles
    merged_rectangles = merge_rectangles(rectangles)

    # Prepare the final list of rectangles
    final_rectangles = [[(x1, y1), (x2, y2)] for (x1, y1, x2, y2) in merged_rectangles]

    return final_rectangles

# Flask route

def get_rectangle_vertices(rectangles):
    rectangle_vertices = []
    for rectangle in rectangles:
       (x1, y1), (x2, y2) = rectangle
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

        image = cv2.imdecode(np.fromstring(image_data.read(), np.uint8), cv2.IMREAD_COLOR)
        rectangles = find_and_merge_rectangles(image, threshold_area=100)
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