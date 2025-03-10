from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import base64
import io
import os
import requests
import json
from config import DevelopmentConfig, ProductionConfig
from datetime import datetime, timedelta
from extensions import db

# from botocore.auth import SigV4Auth
# from botocore.awsrequest import AWSRequest
#hidennn

# from memory_profiler import profile

from coordinate import Coordinate
from flask_migrate import Migrate



frontend_dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../imgdet-frtend/dist'))

app = Flask(__name__, static_folder=frontend_dist_path)
app.config.from_object(os.getenv('APP_SETTINGS', DevelopmentConfig))
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'

db.init_app(app)

from models import Image, Polygon

migrate = Migrate(app, db)


load_dotenv()

rie_url = "http://yolo-service:8080/2015-03-31/functions/function/invocations"
data_url = os.getenv('AWS_LAMBDA_URL', rie_url )

print("Data url is "+data_url)
    

# @profile
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
                    label = other_label
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



# @profile
def merge_rectangles_from_model_and_opencv(image, score_threshold=0.5, threshold_area=10):
    final_rectangles = []
    try:
    
        payload = {
        "image": image,
        "score_threshold": score_threshold
        }

        # response = requests.post(
        # link_url,
        # data=json.dumps(payload),
        # headers={'Content-Type': 'application/json'},
        # timeout=30
        # )

        # session = boto3.Session(
        # aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        # aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        # region_name=os.getenv('AWS_DEFAULT_REGION')
        # )

        # credentials = session.get_credentials()
        # region = session.region_name

        # request = AWSRequest(method='POST', url=aws_url, data=payload)
        # SigV4Auth(credentials, "lambda", region).add_auth(request)
        # prepared_request = request.prepare()
        # print('before response')
        # print('headers are ', prepared_request.headers)
        # print('After adding ', json.dumps({**prepared_request.headers, 'Content-Type': 'application/json'}))
        response = requests.post(
        data_url,
        data=json.dumps(payload),
        headers={'Content-Type': 'application/json'},
        timeout=30
        )
        response_data = []
        print(f"Response status code: {response.status_code}")
        print(f"response data json ", response.text)
        print('response is ', response.content)
        print('response json is  ', json.dumps(response.json()))
        # print('rectangles are ', response_data.get('rectangles'))
        response_data = response.json()
        print(f"response data final is: ", response_data)
        model_rectangles_with_labels = response_data.get('rectangles')
        all_rectangles_with_labels = model_rectangles_with_labels
        final_rectangles = [[(x1, y1), (x2, y2), label] for [[x1, y1, x2, y2], label] in all_rectangles_with_labels]
        print(final_rectangles)

    except Exception as e:  
        print(e)
    return final_rectangles

# @profile
def get_rectangle_vertices(rectangles):
    rectangle_vertices = []
    for rectangle in rectangles:
       (x1, y1), (x2, y2), label = rectangle
       rectangle_vertices.append([(x1, y1),(x2,y1),(x2, y2),(x1,y2), label])

    print('rectangle vertices: ', rectangle_vertices)

    return rectangle_vertices

# @profile
def get_markers(image_id):
    image = Image.query.get(image_id)
    if image is None:
        return jsonify({'error': 'Image not foun'}), 404

    markers = []
    for polygon in image.polygons:
        coordinates = list(polygon.coords)
        markers.append({
            'id': polygon.id,
            'coords': coordinates, 
            'label': polygon.label,
            'probability': 95.0,
        })
    return markers

# @profile
def plot_coordinates(data, image_id):
    # Decode the base64 image string
    image = Image.query.get(image_id)
    if image is not None:
        image_url = image.data_url
    image_data = base64.b64decode(image_url)
    image = PILImage.open(io.BytesIO(image_data))
    draw = ImageDraw.Draw(image)

    # Find the object with the specified image ID
    for obj in data:
        coords = obj['coords']
        label = obj['label']
        probability = obj['probability']

        # Extract the coordinates as a list of tuples
        coord_tuples = [(coord['x'], coord['y']) for coord in coords]

        # Draw the polygon on the image
        draw.polygon(coord_tuples, outline='red', width=2)
        
        # Add the label and probability text
        if label:
            draw.text(coord_tuples[0], f"{label} ({probability}%)", fill='red')

    # Show the image with drawn coordinates
    plt.imshow(image)
    plt.axis('off')
    plt.savefig('output.png', format='png', dpi=300)

@app.route('/api/healthz')
def healthCheck():
    response = {
        'status': 'success',
        'message': 'Visual objects'
    }
    return jsonify(response), 200

# @profile
@app.route('/api/images', methods=['POST'])
def insertImgAndReturnRec():
    try:
        print('Starting rectangle construction....')
        data = request.get_json()
        if 'image_url' not in data:
            return jsonify({'error': 'image_url not found in data'}), 400
        
        base64_image = data['image_url']
        new_img = Image(data_url=base64_image)

        try:
            print('Starting rectangle construction....')
            rectangles = merge_rectangles_from_model_and_opencv(base64_image, score_threshold=0.5, threshold_area=100)
            print('rectangle are ',rectangles)
            rectangles = get_rectangle_vertices(rectangles)
        except Exception as e:
            return jsonify({'error': 'Error processing image: ' + str(e)}), 500

        for data in rectangles:
            points = data[:-1]
            label = data[-1]
            if isinstance(label, tuple):
                label = str(label)
            point = [Coordinate(x, y) for (x, y) in points]
           
            point_dict = [coordinate.to_dict() for coordinate in point]
            new_polygon = Polygon(label=label, coords=point_dict)
            new_img.polygons.append(new_polygon)
            print('data', new_img.polygons)
        try:
            print("db commit started")
            db.session.add(new_img)
            db.session.commit()

            rectangle_objects = []
            image = Image.query.get(new_img.id)
            print('imga is ', image)
            if image is None:
                return jsonify({'error': 'Image not found'}), 404

            for polygon in image.polygons:
                coordinates = list(polygon.coords)
                rectangle_objects.append({
                    'id': polygon.id,
                    'coords': coordinates,
                    'label': polygon.label,
                    'probability': 95.0,
                })
            imgRectData = {
                'id': new_img.id,
                'polygons': rectangle_objects,
            }

            print('rectangle_objects : ', rectangle_objects)

            jsonify_rect = jsonify(imgRectData)
        except Exception as e:
            print(str(e))
            return jsonify({'error': 'Database error: ' + str(e)}), 500

        return jsonify_rect
    except Exception as e:
        return jsonify({'error': 'Unexpected error: ' + str(e)}), 500
    
# @profile 
@app.route('/api/label_modify', methods=['PUT'])   
def label_modify():
 
    try:
        data = request.get_json()
        marker = Polygon.query.get(data['id'])
        if marker is None:
            return jsonify({'error': 'Marker not found'}), 404
        marker.label = data['label']
        db.session.commit()
        return jsonify({'message': 'Image updated successfully'}), 200
    except:
        return jsonify({'error': 'Database error'}), 500

# @profile    
@app.route('/api/add_constructed_marker', methods=['POST'])
def add_constructed_marker():
    try:
     
        data = request.get_json()
        image = Image.query.get(data['image_id'])
        label = data['label']
        if image is None:
            return jsonify({'error': 'Image not found'}), 404
        coordinates = data['coords']
        point = [Coordinate(coord['x'], coord['y']) for coord in coordinates]
        point_dict = [coordinate.to_dict() for coordinate in point]
        new_polygon = Polygon(label = label, coords = point_dict)
        image.polygons.append(new_polygon)
        db.session.add(new_polygon)
        db.session.commit()
        polygon_data = {
            'id': new_polygon.id,
            'coords': coordinates, 
            'label': label,
            'probability': 95.0, 
        }
        polys = get_markers(data['image_id'])
        jsonify_rect = jsonify(polygon_data)   
        return jsonify_rect
    except Exception as e:
        return jsonify({'error': 'Database error'}), 500

@app.route('/api/get_data')
def extract_data_from_db():
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')
    no_of_days = request.args.get('no_of_days')
    response_data = []

    try:
        if from_date and to_date:
            from_date = datetime.strptime(from_date, '%Y-%m-%d')
            to_date = datetime.strptime(to_date, '%Y-%m-%d')
            images = Image.query.filter(Image.date_created.between(from_date, to_date)).all()
        elif no_of_days:
            no_of_days = int(no_of_days)
            to_date = datetime.utcnow()
            from_date = to_date - timedelta(days=no_of_days)
            images = Image.query.filter(Image.date_created.between(from_date, to_date)).all()
        else:
            return jsonify({'error': 'Invalid parameters'}), 400
        
        for image in images:
            polygons = Polygon.query.filter_by(image_id=image.id).all()
            polygon_data = [{'id': polygon.id, 'label': polygon.label, 'coords': polygon.coords} for polygon in polygons]
            response_data.append({
                'id': image.id,
                'data_url': image.data_url,
                'date_created': image.date_created,
                'polygons': polygon_data
            })

        return jsonify(response_data)
    except Exception as e:
        return jsonify({'error': 'Database error', 'message': str(e)}), 500



    
if __name__ == '__main__':
    app.run()
