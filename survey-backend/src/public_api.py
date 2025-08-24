from flask import Blueprint, request, jsonify
from .models import db, Survey, Submission, Answer, SurveyStatus

public_bp = Blueprint('public_api', __name__)

@public_bp.route('/surveys/<string:survey_id>', methods=['GET'])
def get_public_survey(survey_id):
    """
    Public endpoint to get the details of a published survey.
    """
    survey = Survey.query.filter_by(
        survey_id=survey_id,
        status=SurveyStatus.PUBLISHED
    ).first_or_404("This survey is not available.")
    survey_details = survey.to_dict()
    survey_details['questions'] = [q.to_dict() for q in survey.questions]

    return jsonify(survey_details)

@public_bp.route('/surveys/<string:survey_id>/submit', methods=['POST'])
def submit_public_survey(survey_id):
    """
    Public endpoint to create a submission for a published survey.
    """
    survey = Survey.query.filter_by(
        survey_id=survey_id,
        status=SurveyStatus.PUBLISHED
    ).first_or_404("This survey is not available for submissions.")

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
