from flask import Blueprint, request, jsonify
from .models import db, Survey, Question, Submission, Answer, SurveyStatus

webhook_bp = Blueprint('webhook', __name__)
@webhook_bp.route('/webhook', methods=['POST'])
def handle_survey_submission():
    from .models import Survey, Question, Submission, Answer
    from flask import request, jsonify

    payload = request.get_json()
    if not payload:
        return jsonify({"status": "error", "message": "Invalid JSON payload"}), 400
    try:
        survey_id = payload['surveyId']
        survey_title = payload['surveyTitle']
        survey = Survey.query.get(survey_id)
        if not survey:
            survey = Survey(survey_id=survey_id, survey_title=survey_title, is_external=True, status=SurveyStatus.PUBLISHED)
            db.session.add(survey)

        question_map = {}
        for q_data in payload['questions']:
            question = Question.query.filter_by(survey_id=survey_id, question_title=q_data['title']).first()
            if not question:
                question = Question(survey=survey, question_title=q_data['title'], question_type=q_data['type'], options=q_data.get('options'))
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
        print(f"Webhook Error: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred"}), 500
