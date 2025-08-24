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

    # SendGrid configuration
    SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', 'your-sendgrid-api-key')
    SENDGRID_SENDER_EMAIL = os.environ.get('SENDGRID_SENDER_EMAIL', 'your-verified-sender-email@example.com')
