from flask import Blueprint, request, jsonify
from .models import db, Survey, Question, SurveyStatus
from flask_jwt_extended import jwt_required
from datetime import datetime, timezone
import uuid

surveys_bp = Blueprint('surveys_api', __name__)

@surveys_bp.route('/', methods=['POST'])
@jwt_required()
def create_survey():
    data = request.get_json()
    if not data or not data.get('survey_title'):
        return jsonify({"status": "error", "message": "survey_title is required"}), 400

    title = data['survey_title']
    survey_id = str(uuid.uuid4()) # Generate a random UUID and convert it to a string

    new_survey = Survey(
        survey_id=survey_id,
        survey_title=title
    )

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
@jwt_required()
def create_question_for_survey(survey_id):
    survey = Survey.query.get_or_404(survey_id)

    if survey.is_external:
        return jsonify({"status": "error", "message": "Cannot add questions to an external survey."}), 403

    data = request.get_json()
    if not data or not data.get('question_title') or not data.get('question_type'):
        return jsonify({"status": "error", "message": "question_title and question_type are required"}), 400

    new_question = Question(survey=survey, question_title=data['question_title'], question_type=data['question_type'],options=data.get('options'))
    db.session.add(new_question)
    db.session.commit()
    return jsonify(new_question.to_dict()), 201

@surveys_bp.route('/<string:survey_id>', methods=['PUT'])
@jwt_required()
def update_survey(survey_id):
    """Updates a survey's title, status, or publish date."""
    survey = Survey.query.get_or_404(survey_id)

    if survey.is_external:
        return jsonify({"status": "error", "message": "External surveys cannot be modified."}), 403

    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "Request body cannot be empty"}), 400

    # Handle status update and its validation first
    if 'status' in data:
        status_value = data['status']
        if status_value not in [s.value for s in SurveyStatus]:
            return jsonify({"status": "error", "message": f"Invalid status. Must be one of {', '.join([s.value for s in SurveyStatus])}"}), 400

        survey.status = SurveyStatus(status_value)

    if 'publish_date' in data:
        if data['publish_date']:
            try:
                publish_date = datetime.fromisoformat(data['publish_date'].replace('Z', '+00:00'))
                survey.publish_date = publish_date
            except (ValueError, TypeError):
                return jsonify({"status": "error", "message": "Invalid publish_date format. Use ISO 8601 format."}), 400
        else:
            survey.publish_date = None

    # Final check: if the survey is now scheduled, its publish date must be in the future
    if survey.status == SurveyStatus.SCHEDULED:
        if not survey.publish_date:
            return jsonify({"status": "error", "message": "Publish date is required for scheduled surveys."}), 400
        if survey.publish_date <= datetime.now(timezone.utc):
            return jsonify({"status": "error", "message": "Publish date for scheduled surveys must be in the future."}), 400

    if 'survey_title' in data:
        survey.survey_title = data['survey_title']

    db.session.commit()
    return jsonify(survey.to_dict())

@surveys_bp.route('/questions/<int:question_id>', methods=['PUT'])
@jwt_required()
def update_question(question_id):
    """Updates a question's title, type, or options."""
    question = Question.query.get_or_404(question_id)

    if question.survey.is_external:
        return jsonify({"status": "error", "message": "Questions of an external survey cannot be modified."}), 403

    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "Request body cannot be empty"}), 400

    # Temporarily store potential new values
    new_title = data.get('question_title', question.question_title)
    new_type = data.get('question_type', question.question_type)
    new_options = data.get('options', question.options)

    if new_type.upper() == 'TEXT':
        if new_options is not None and new_options != []:
            return jsonify({"status": "error", "message": "Options must be null or empty for TEXT questions."}), 400
        new_options = None

    elif new_type.upper() in ['MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN']:
        if not isinstance(new_options, list) or not new_options:
            return jsonify({"status": "error", "message": f"A non-empty list of options is required for {new_type} questions."}), 400

    # Apply the changes after validation
    question.question_title = new_title
    question.question_type = new_type
    question.options = new_options

    db.session.commit()
    return jsonify(question.to_dict())

@surveys_bp.route('/questions/<int:question_id>', methods=['DELETE'])
@jwt_required()
def delete_question(question_id):
    """Deletes a single question."""
    question = Question.query.get_or_404(question_id)
    db.session.delete(question)
    db.session.commit()
    return jsonify({"status": "success", "message": "Question deleted successfully"})

@surveys_bp.route('/<string:survey_id>', methods=['DELETE'])
@jwt_required()
def delete_survey(survey_id):
    survey = Survey.query.get_or_404(survey_id)
    db.session.delete(survey)
    db.session.commit()
    return jsonify({"status": "success", "message": "Survey deleted successfully"})

