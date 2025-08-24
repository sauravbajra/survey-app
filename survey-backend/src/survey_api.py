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
    status_value = data.get('status', 'draft') # Default to 'draft' if not provided
    publish_date_str = data.get('publish_date')

    if status_value not in [s.value for s in SurveyStatus]:
        return jsonify({"status": "error", "message": f"Invalid status. Must be one of {', '.join([s.value for s in SurveyStatus])}"}), 400

    survey_id = str(uuid.uuid4())
    publish_date = None

    if publish_date_str:
        try:
            publish_date = datetime.fromisoformat(publish_date_str.replace('Z', '+00:00'))
        except (ValueError, TypeError):
            return jsonify({"status": "error", "message": "Invalid publish_date format. Use ISO 8601 format."}), 400

    if status_value == SurveyStatus.SCHEDULED.value:
        if not publish_date:
            return jsonify({"status": "error", "message": "publish_date is required for scheduled surveys"}), 400
        if publish_date <= datetime.now(timezone.utc):
            return jsonify({"status": "error", "message": "Publish date for scheduled surveys must be in the future."}), 400

    new_survey = Survey(
      survey_id=survey_id,
      survey_title=title,
      status=SurveyStatus(status_value), # Use the Enum object
      publish_date=publish_date # Use the parsed date or None
    )

    db.session.add(new_survey)
    db.session.commit()
    return jsonify(new_survey.to_dict()), 201

@surveys_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_surveys():
    """
    Retrieves a paginated and filterable list of all surveys.
    Accepts query parameters for pagination, status, and is_external.
    """
    # --- Pagination Parameters ---
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    # --- Filter Parameters ---
    status_filter = request.args.get('status', 'all', type=str)
    is_external_filter = request.args.get('is_external', 'all', type=str)

    # Start with a base query
    query = Survey.query

    # Apply status filter if it's not 'all'
    if status_filter != 'all':
        try:
            # Validate and convert string to Enum member
            status_enum = SurveyStatus(status_filter)
            query = query.filter(Survey.status == status_enum)
        except ValueError:
            return jsonify({"status": "error", "message": f"Invalid status value: {status_filter}"}), 400

    # Apply is_external filter if it's not 'all'
    if is_external_filter != 'all':
        if is_external_filter.lower() == 'true':
            query = query.filter(Survey.is_external == True)
        elif is_external_filter.lower() == 'false':
            query = query.filter(Survey.is_external == False)

    # Apply ordering before pagination
    query = query.order_by(Survey.created_at.desc())

    # Execute the paginated query
    surveys_pagination = query.paginate(page=page, per_page=per_page, error_out=False)

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

@surveys_bp.route('/<string:survey_id>/publish', methods=['PATCH'])
@jwt_required()
def publish_survey(survey_id):
    """Updates a survey's status to 'published'."""
    survey = Survey.query.get_or_404(survey_id)

    if survey.is_external:
        return jsonify({"status": "error", "message": "External surveys cannot be modified."}), 403

    survey.status = SurveyStatus.PUBLISHED
    # Clear the publish date as it's no longer needed
    survey.publish_date = None

    db.session.commit()
    return jsonify(survey.to_dict())

@surveys_bp.route('/<string:survey_id>/draft', methods=['PATCH'])
@jwt_required()
def move_survey_to_drafts(survey_id):
    """Updates a survey's status to 'draft'."""
    survey = Survey.query.get_or_404(survey_id)

    if survey.is_external:
        return jsonify({"status": "error", "message": "External surveys cannot be modified."}), 403

    survey.status = SurveyStatus.DRAFT

    db.session.commit()
    return jsonify(survey.to_dict())

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

