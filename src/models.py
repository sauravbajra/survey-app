from . import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB

class Survey(db.Model):
    __tablename__ = 'surveys'
    survey_id = db.Column(db.String(255), primary_key=True)
    survey_title = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    questions = db.relationship('Question', back_populates='survey', cascade="all, delete-orphan")
    submissions = db.relationship('Submission', back_populates='survey', cascade="all, delete-orphan")

    def to_dict(self):
        return {"survey_id": self.survey_id, "survey_title": self.survey_title, "created_at": self.created_at.isoformat()}

class Question(db.Model):
    __tablename__ = 'questions'
    question_id = db.Column(db.Integer, primary_key=True)
    survey_id = db.Column(db.String(255), db.ForeignKey('surveys.survey_id'), nullable=False)
    question_title = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), nullable=False)

    survey = db.relationship('Survey', back_populates='questions')
    answers = db.relationship('Answer', back_populates='question', cascade="all, delete-orphan")

    def to_dict(self):
        return {"question_id": self.question_id, "title": self.question_title, "type": self.question_type}

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
