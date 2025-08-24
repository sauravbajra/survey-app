from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config
from flask_jwt_extended import JWTManager
from apscheduler.schedulers.background import BackgroundScheduler # Import scheduler
from datetime import datetime, timezone
from sqlalchemy import text
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()

def publish_scheduled_surveys(app):
    """
    Job function to find scheduled surveys that are past their publish date
    and update their status to 'published'.
    """
    from .models import Survey, SurveyStatus
    with app.app_context():
        print("Running scheduled job: Checking for surveys to publish...")
        try:
            now = datetime.now(timezone.utc)
            scheduled_surveys = Survey.query.filter(
                Survey.status == SurveyStatus.SCHEDULED,
                Survey.publish_date <= now
            ).all()

            if not scheduled_surveys:
                print("No surveys to publish at this time.")
                return

            for survey in scheduled_surveys:
                survey.status = SurveyStatus.PUBLISHED
                print(f"Publishing survey '{survey.survey_title}' (ID: {survey.survey_id})")

            db.session.commit()
            print(f"Successfully published {len(scheduled_surveys)} surveys.")
        except Exception as e:
            print(f"Error during scheduled job: {e}")
            db.session.rollback()

def create_app(config_class=Config):
    """Creates and configures the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(
        app,
        resources={r"/*": {"origins": "http://localhost:5173"}},
        supports_credentials=True,
        # Add the methods and headers your frontend needs
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"]
    )
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt = JWTManager(app)

        # --- CONFIGURE AND START SCHEDULER ---
    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(publish_scheduled_surveys, 'interval', minutes=5, args=[app])
    scheduler.start()

    # Import and register blueprints
    from .survey_api import surveys_bp
    from .submission_api import submissions_bp
    from .analytics_api import analytics_bp
    from .webhook import webhook_bp
    from .auth_api import auth_bp
    from .email_api import email_bp

    app.register_blueprint(surveys_bp, url_prefix='/surveys')
    app.register_blueprint(submissions_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(webhook_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(email_bp)

    @app.route('/check-db-connection', methods=['GET'])
    def health_check():
        try:
            db.session.execute(text('SELECT 1'))
            return {"status": "ok", "database": "connected"}, 200
        except Exception:
            return {"status": "error", "database": "disconnected"}, 503

    return app
