#this is just to get the baseurl
import os 
from dotenv import load_dotenv
#why do this?
baseurl = os.path.abspath(os.path.dirname(__file__))
#__file__ represents the current file 
load_dotenv()

#This is similar to how inheritance works in python
class Config(object):
    DEBUG = False #python boolean starts with caps
    TESTING = False #diables error catching
    CSRF_ENABLED = True #when set to true prevents Cross-Site Request Forgery protection
    SECRET_KEY = 'Not sure what to put in' #something related to security
   

    @staticmethod
    def get_database_uri():
        database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:test@db:5432/visualobjectsdb')
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        return database_url
     
    SQLALCHEMY_DATABASE_URI = get_database_uri()

class ProductionConfig(Config):
    DEBUG = False  #isnt this already false

class StagingConfig(Config):
    DEVELOPMENT = True  #No special property compared to others but can be used to render code selectively
    DEBUG = True

class DevelopmentConfig(Config):
    DEVELOPMENT = True
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
