from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    """Creates and configures the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Import and register blueprints
    from .survey_api import surveys_bp
    from .submission_api import submissions_bp
    from .analytics_api import analytics_bp
    from .webhook import webhook_bp
    
    app.register_blueprint(surveys_bp, url_prefix='/surveys')
    app.register_blueprint(submissions_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(webhook_bp)

    @app.route('/check-db-connection', methods=['GET'])
    def health_check():
        try:
            db.session.execute('SELECT 1')
            return {"status": "ok", "database": "connected"}, 200
        except Exception:
            return {"status": "error", "database": "disconnected"}, 503

    return app
