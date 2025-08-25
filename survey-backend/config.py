import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'default_db_url')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Add a secret key for signing JWTs
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'a-super-secret-jwt-key')
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    JWT_ACCESS_TOKEN_EXPIRES = 3600

    # SMTP configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', 'your_email@gmail.com')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', 'your_app_password')
    MAIL_PORT = 465
    MAIL_USE_TLS = False
    MAIL_USE_SSL = True