from flask import Blueprint, request, jsonify
from .models import db, Survey, Question
from flask_jwt_extended import jwt_required

surveys_bp = Blueprint('surveys_api', __name__)

@surveys_bp.route('/', methods=['POST'])
@jwt_required()
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
@jwt_required()
def get_all_surveys():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    surveys_pagination = Survey.query.order_by(Survey.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    results = [survey.to_dict() for survey in surveys_pagination.items]
    
    return jsonify({
        "surveys": results,
        "total_pages": surveys_pagination.pages,
        "current_page": surveys_pagination.page,
        "total_items": surveys_pagination.total
    })

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

    new_question = Question(survey=survey, question_title=data['question_title'], question_type=data['question_type'],options=data.get('options'))
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

@surveys_bp.route('/questions/<int:question_id>', methods=['PUT'])
def update_question(question_id):
    """Updates a question's title, type, or options."""
    question = Question.query.get_or_404(question_id)
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "Request body cannot be empty"}), 400

    # Update fields if they are provided in the request body
    if 'question_title' in data:
        question.question_title = data['question_title']
    if 'question_type' in data:
        question.question_type = data['question_type']
    if 'options' in data:
        question.options = data['options']
        
    db.session.commit()
    return jsonify(question.to_dict())

@surveys_bp.route('/questions/<int:question_id>', methods=['DELETE'])
def delete_question(question_id):
    """Deletes a single question."""
    question = Question.query.get_or_404(question_id)
    db.session.delete(question)
    db.session.commit()
    return jsonify({"status": "success", "message": "Question deleted successfully"})

@surveys_bp.route('/<string:survey_id>', methods=['DELETE'])
def delete_survey(survey_id):
    survey = Survey.query.get_or_404(survey_id)
    db.session.delete(survey)
    db.session.commit()
    return jsonify({"status": "success", "message": "Survey deleted successfully"})

