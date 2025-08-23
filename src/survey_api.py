from flask import Blueprint, request, jsonify
from .models import db, Survey, Question

surveys_bp = Blueprint('surveys_api', __name__)

@surveys_bp.route('/', methods=['POST'])
def create_survey():
    data = request.get_json()
    if not data or not data.get('survey_id') or not data.get('survey_title'):
        return jsonify({"status": "error", "message": "survey_id and survey_title are required"}), 400

    if Survey.query.get(data['survey_id']):
        return jsonify({"status": "error", "message": "Survey with this ID already exists"}), 409 # Conflict

    new_survey = Survey(survey_id=data['survey_id'], survey_title=data['survey_title'])
    db.session.add(new_survey)
    db.session.commit()
    return jsonify(new_survey.to_dict()), 201

@surveys_bp.route('/', methods=['GET'])
def get_all_surveys():
    surveys = Survey.query.order_by(Survey.created_at.desc()).all()
    return jsonify([survey.to_dict() for survey in surveys])

@surveys_bp.route('/<string:survey_id>', methods=['GET'])
def get_survey_by_id(survey_id):
    survey = Survey.query.get_or_404(survey_id)
    survey_details = survey.to_dict()
    survey_details['questions'] = [q.to_dict() for q in survey.questions]
    return jsonify(survey_details)

@surveys_bp.route('/<string:survey_id>/questions', methods=['POST'])
def create_question_for_survey(survey_id):
    survey = Survey.query.get_or_404(survey_id)
    data = request.get_json()
    if not data or not data.get('question_title') or not data.get('question_type'):
        return jsonify({"status": "error", "message": "question_title and question_type are required"}), 400

    new_question = Question(survey=survey, question_title=data['question_title'], question_type=data['question_type'])
    db.session.add(new_question)
    db.session.commit()
    return jsonify(new_question.to_dict()), 201

@surveys_bp.route('/<string:survey_id>', methods=['PUT'])
def update_survey_title(survey_id):
    survey = Survey.query.get_or_404(survey_id)
    data = request.get_json()
    if not data or 'survey_title' not in data:
        return jsonify({"status": "error", "message": "survey_title is required"}), 400

    survey.survey_title = data['survey_title']
    db.session.commit()
    return jsonify({"status": "success", "message": "Survey title updated successfully"})

@surveys_bp.route('/<string:survey_id>', methods=['DELETE'])
def delete_survey(survey_id):
    survey = Survey.query.get_or_404(survey_id)
    db.session.delete(survey)
    db.session.commit()
    return jsonify({"status": "success", "message": "Survey deleted successfully"})

