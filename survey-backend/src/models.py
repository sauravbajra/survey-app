import enum
from . import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB
from passlib.hash import pbkdf2_sha256 as sha256

class SurveyStatus(enum.Enum):
    DRAFT = 'draft'
    PUBLISHED = 'published'
    SCHEDULED = 'scheduled'

class Survey(db.Model):
    __tablename__ = 'surveys'
    survey_id = db.Column(db.String(255), primary_key=True)
    survey_title = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    status = db.Column(db.Enum(SurveyStatus), nullable=False, default=SurveyStatus.DRAFT)
    publish_date = db.Column(db.DateTime, nullable=True) # Nullable because only scheduled surveys need it
    is_external = db.Column(db.Boolean, nullable=False, default=False)

    questions = db.relationship('Question', back_populates='survey', cascade="all, delete-orphan")
    submissions = db.relationship('Submission', back_populates='survey', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "survey_id": self.survey_id,
            "survey_title": self.survey_title,
            "created_at": self.created_at.isoformat(),
            "status": self.status.value,
            "publish_date": self.publish_date.isoformat() if self.publish_date else None,
            "is_external": self.is_external
        }

class Question(db.Model):
    __tablename__ = 'questions'
    question_id = db.Column(db.Integer, primary_key=True)
    survey_id = db.Column(db.String(255), db.ForeignKey('surveys.survey_id'), nullable=False)
    question_title = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), nullable=False)

    options = db.Column(JSONB, nullable=True) # To store choices like ["Option A", "Option B"]

    survey = db.relationship('Survey', back_populates='questions')
    answers = db.relationship('Answer', back_populates='question', cascade="all, delete-orphan")

    def to_dict(self):
        return {"question_id": self.question_id, "title": self.question_title, "type": self.question_type, "options": self.options}

class Submission(db.Model):
    __tablename__ = 'submissions'
    submission_id = db.Column(db.Integer, primary_key=True)
    survey_id = db.Column(db.String(255), db.ForeignKey('surveys.survey_id'), nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

    survey = db.relationship('Survey', back_populates='submissions')
    answers = db.relationship('Answer', back_populates='submission', cascade="all, delete-orphan")

    def to_dict(self):
        return {"submission_id": self.submission_id, "submitted_at": self.submitted_at.isoformat()}

class Answer(db.Model):
    __tablename__ = 'answers'
    answer_id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('submissions.submission_id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.question_id'), nullable=False)
    answer_value = db.Column(JSONB, nullable=False)

    submission = db.relationship('Submission', back_populates='answers')
    question = db.relationship('Question', back_populates='answers')

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

    @classmethod
    def hash_password(cls, password):
        return sha256.hash(password)

    @classmethod
    def verify_password(cls, password, hash):
        return sha256.verify(password, hash)
