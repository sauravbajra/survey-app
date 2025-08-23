from flask import Blueprint, jsonify
from sqlalchemy import func
from .models import db, Survey, Submission, Answer, Question

analytics_bp = Blueprint('analytics_api', __name__)

@analytics_bp.route('/surveys/<string:survey_id>/analytics', methods=['GET'])
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