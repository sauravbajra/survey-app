from flask import Blueprint, request, jsonify
from .models import db, Survey, Submission, Answer
from flask_jwt_extended import jwt_required

submissions_bp = Blueprint('submissions_api', __name__)

@submissions_bp.route('/surveys/<string:survey_id>/submissions', methods=['GET'])
@jwt_required()
def get_submissions_for_survey(survey_id):
    survey = Survey.query.get_or_404(survey_id)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    submissions_pagination = Submission.query.filter_by(survey_id=survey.survey_id).order_by(
        Submission.submitted_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    results = [s.to_dict() for s in submissions_pagination.items]

    return jsonify({
        "submissions": results,
        "total_pages": submissions_pagination.pages,
        "current_page": submissions_pagination.page,
        "total_items": submissions_pagination.total
    })

# @submissions_bp.route('/surveys/<string:survey_id>/submissions', methods=['POST'])
# def create_submission_for_survey(survey_id):
#     survey = Survey.query.get_or_404(survey_id)
#     answers_data = request.get_json()
#     if not isinstance(answers_data, list):
#         return jsonify({"status": "error", "message": "Request body must be a list of answers"}), 400
#     try:
#         new_submission = Submission(survey=survey)
#         db.session.add(new_submission)
#         valid_question_ids = {q.question_id for q in survey.questions}
#         for answer_item in answers_data:
#             question_id = answer_item.get('question_id')
#             if not question_id or question_id not in valid_question_ids:
#                 raise ValueError(f"Invalid or missing question_id: {question_id}")
#             new_answer = Answer(submission=new_submission, question_id=question_id, answer_value=answer_item.get('answer_value'))
#             db.session.add(new_answer)
#         db.session.commit()
#         return jsonify({"status": "success", "submission_id": new_submission.submission_id}), 201
#     except ValueError as ve:
#         db.session.rollback()
#         return jsonify({"status": "error", "message": str(ve)}), 400

@submissions_bp.route('/submissions/<int:submission_id>', methods=['GET'])
@jwt_required()
def get_submission_by_id(submission_id):
    submission = Submission.query.get_or_404(submission_id)
    responses = [{"question": a.question.question_title, "type": a.question.question_type, "answer": a.answer_value} for a in submission.answers]
    return jsonify({
        "submission_id": submission.submission_id, "submitted_at": submission.submitted_at.isoformat(),
        "survey_id": submission.survey.survey_id, "survey_title": submission.survey.survey_title,
        "responses": responses
    })

@submissions_bp.route('/submissions/<int:submission_id>', methods=['DELETE'])
@jwt_required()
def delete_submission(submission_id):
    submission = Submission.query.get_or_404(submission_id)
    db.session.delete(submission)
    db.session.commit()
    return jsonify({"status": "success", "message": "Submission deleted successfully"})
