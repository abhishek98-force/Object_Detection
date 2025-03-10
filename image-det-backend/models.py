#db has to be referenced here
from extensions import db
from datetime import datetime

#its also possible to add a __init__ method which can be used to instantiate the class
class Image(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    data_url = db.Column(db.Text, nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    polygons = db.relationship('Polygon', backref='image')
     
    def __init__(self, data_url):
        self.data_url = data_url


    def __repr__(self):
        return '<Image %r>' % self.id

class Polygon(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    label = db.Column(db.String)
    image_id = db.Column(db.Integer, db.ForeignKey('image.id'), nullable=False)
    coords = db.Column(db.JSON)

    def __init__(self, label, coords):
        self.label = label
        self.coords = coords

    def __repr__(self):
        return '<Polygon %r>' % self.id
