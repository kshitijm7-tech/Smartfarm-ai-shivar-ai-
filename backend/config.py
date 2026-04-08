import os
from dotenv import load_dotenv

# Load environment variables from .env file (if present)
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

class Config:
    # Flask secret key — read from env, with a fallback for development only
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-smart-farm-ai-change-in-prod'

    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'smart_farm.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ML Model path
    MODEL_PATH = os.environ.get('MODEL_PATH') or 'crop_disease_model.h5'

    # OpenWeatherMap API key (empty string means simulation will be used)
    OWM_API_KEY = os.environ.get('OWM_API_KEY') or ''
