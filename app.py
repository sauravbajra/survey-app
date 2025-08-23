import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate 
from sqlalchemy import func, cast, text
from sqlalchemy.dialects.postgresql import JSONB

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://surveydbuser:surveydbpass@localhost:5432/surveydb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# ==============================================================================
#  SQLALCHEMY ORM MODELS 
# ==============================================================================

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
    question_type = db.Column(db.String(50), nullable=False) # question_type could be enum i.e. TEXT/
    
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

# ==============================================================================
#  WEBHOOK AND HEALTHCHECK ENDPOINTS
# ==============================================================================

@app.route('/check-db-connection', methods=['GET'])
def health_check():
    try:
        db.session.execute(text('SELECT 1'))
        return jsonify({"status": "ok", "database": "connected"}), 200
    except Exception as e:
        return jsonify({"status": "error", "database": "disconnected"}), 503

@app.route('/webhook', methods=['POST'])
def handle_survey_submission():
    payload = request.get_json()
    if not payload:
        return jsonify({"status": "error", "message": "Invalid JSON payload"}), 400

    try:
        survey_id = payload['surveyId'] 
        
        survey = Survey.query.get(survey_id)
        if not survey:
            survey = Survey(survey_id=survey_id, survey_title="New Survey via Webhook")
            db.session.add(survey)

        question_map = {}
        for q_data in payload['questions']:
            question = Question.query.filter_by(survey_id=survey_id, question_title=q_data['title']).first()
            if not question:
                question = Question(survey=survey, question_title=q_data['title'], question_type=q_data['type'])
                db.session.add(question)
            question_map[q_data['title']] = question
        
        new_submission = Submission(survey=survey)
        db.session.add(new_submission)

        for i, answer_data in enumerate(payload['answers']):
            question_title = payload['questions'][i]['title']
            question_obj = question_map[question_title]
            answer = Answer(submission=new_submission, question=question_obj, answer_value=answer_data)
            db.session.add(answer)
            
        db.session.commit()
        return jsonify({"status": "success", "submission_id": new_submission.submission_id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": "An internal server error occurred"}), 500

# ==============================================================================
#  CRUD ENDPOINTS FOR SURVEYS
# ==============================================================================

@app.route('/surveys', methods=['POST'])
def create_survey():
    """Creates a new, empty survey."""
    data = request.get_json()
    if not data or not data.get('survey_id') or not data.get('survey_title'):
        return jsonify({"status": "error", "message": "survey_id and survey_title are required"}), 400
    
    if Survey.query.get(data['survey_id']):
        return jsonify({"status": "error", "message": "Survey with this ID already exists"}), 409 # Conflict

    new_survey = Survey(survey_id=data['survey_id'], survey_title=data['survey_title'])
    db.session.add(new_survey)
    db.session.commit()
    return jsonify(new_survey.to_dict()), 201

@app.route('/surveys', methods=['GET'])
def get_all_surveys():
    surveys = Survey.query.order_by(Survey.created_at.desc()).all()
    return jsonify([survey.to_dict() for survey in surveys])

@app.route('/surveys/<string:survey_id>', methods=['GET'])
def get_survey_by_id(survey_id):
    survey = Survey.query.get_or_404(survey_id)
    survey_details = survey.to_dict()
    survey_details['questions'] = [q.to_dict() for q in survey.questions]
    return jsonify(survey_details)

@app.route('/surveys/<string:survey_id>/questions', methods=['POST'])
def create_question_for_survey(survey_id):
    """Adds a new question to an existing survey."""
    survey = Survey.query.get_or_404(survey_id)
    data = request.get_json()
    if not data or not data.get('question_title') or not data.get('question_type'):
        return jsonify({"status": "error", "message": "question_title and question_type are required"}), 400

    new_question = Question(survey=survey, question_title=data['question_title'], question_type=data['question_type'])
    db.session.add(new_question)
    db.session.commit()
    return jsonify(new_question.to_dict()), 201

@app.route('/surveys/<string:survey_id>', methods=['PUT'])
def update_survey_title(survey_id):
    survey = Survey.query.get_or_404(survey_id)
    data = request.get_json()
    if not data or 'survey_title' not in data:
        return jsonify({"status": "error", "message": "survey_title is required"}), 400
    
    survey.survey_title = data['survey_title']
    db.session.commit()
    return jsonify({"status": "success", "message": "Survey title updated successfully"})

@app.route('/surveys/<string:survey_id>', methods=['DELETE'])
def delete_survey(survey_id):
    survey = Survey.query.get_or_404(survey_id)
    db.session.delete(survey)
    db.session.commit()
    return jsonify({"status": "success", "message": "Survey deleted successfully"})

# ==============================================================================
#  CRUD ENDPOINTS FOR SUBMISSIONS
# ==============================================================================

@app.route('/surveys/<string:survey_id>/submissions', methods=['POST'])
def create_submission_for_survey(survey_id):
    """Creates a submission with answers for a survey."""
    survey = Survey.query.get_or_404(survey_id)
    answers_data = request.get_json()
    if not isinstance(answers_data, list):
        return jsonify({"status": "error", "message": "Request body must be a list of answers"}), 400

    try:
        new_submission = Submission(survey=survey)
        db.session.add(new_submission)

        valid_question_ids = {q.question_id for q in survey.questions}
        for answer_item in answers_data:
            question_id = answer_item.get('question_id')
            if not question_id or question_id not in valid_question_ids:
                raise ValueError(f"Invalid or missing question_id: {question_id}")
            
            new_answer = Answer(
                submission=new_submission,
                question_id=question_id,
                answer_value=answer_item.get('answer_value')
            )
            db.session.add(new_answer)
        
        db.session.commit()
        return jsonify({"status": "success", "submission_id": new_submission.submission_id}), 201
    except ValueError as ve:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(ve)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": "An internal server error occurred"}), 500

@app.route('/surveys/<string:survey_id>/submissions', methods=['GET'])
def get_submissions_for_survey(survey_id):
    survey = Survey.query.get_or_404(survey_id)
    submissions = Submission.query.filter_by(survey_id=survey.survey_id).order_by(Submission.submitted_at.desc()).all()
    return jsonify([s.to_dict() for s in submissions])

@app.route('/submissions/<int:submission_id>', methods=['GET'])
def get_submission_by_id(submission_id):
    submission = Submission.query.get_or_404(submission_id)
    responses = [{"question": a.question.question_title, "type": a.question.question_type, "answer": a.answer_value} for a in submission.answers]
    return jsonify({
        "submission_id": submission.submission_id,
        "submitted_at": submission.submitted_at.isoformat(),
        "survey_id": submission.survey.survey_id,
        "survey_title": submission.survey.survey_title,
        "responses": responses
    })

@app.route('/submissions/<int:submission_id>', methods=['DELETE'])
def delete_submission(submission_id):
    submission = Submission.query.get_or_404(submission_id)
    db.session.delete(submission)
    db.session.commit()
    return jsonify({"status": "success", "message": "Submission deleted successfully"})

# ==============================================================================
#  --- ANALYTICS ENDPOINT ---
# ==============================================================================

@app.route('/surveys/<string:survey_id>/analytics', methods=['GET'])
def get_survey_analytics(survey_id):
    survey = Survey.query.get_or_404(survey_id)
    
    total_submissions = Submission.query.filter_by(survey_id=survey.survey_id).count()
    
    question_analytics = []
    for question in survey.questions:
        if question.question_type == 'CHECKBOX':
            subquery = db.session.query(
                func.jsonb_array_elements_text(Answer.answer_value).label('option')
            ).join(Submission).filter(
                Submission.survey_id == survey_id,
                Answer.question_id == question.question_id
            ).subquery()
            
            results = db.session.query(
                subquery.c.option,
                func.count(subquery.c.option)
            ).group_by(subquery.c.option).all()
        else:
            answer_as_text = Answer.answer_value.op('->>')(0)
            
            results = db.session.query(
                answer_as_text,
                func.count(Answer.answer_id)
            ).join(Submission).filter(
                Submission.survey_id == survey_id,
                Answer.question_id == question.question_id
            ).group_by(answer_as_text).all()
        
        answer_frequencies = {value: count for value, count in results}
        
        question_analytics.append({
            "question_id": question.question_id,
            "question_title": question.question_title,
            "question_type": question.question_type,
            "answer_frequencies": answer_frequencies
        })

    return jsonify({
        "survey_id": survey.survey_id,
        "survey_title": survey.survey_title,
        "total_submissions": total_submissions,
        "results": question_analytics
    })
# ==============================================================================
#  APP RUNNER (Note: init-db command is now removed)
# ==============================================================================

if __name__ == '__main__':
    app.run(debug=True)
