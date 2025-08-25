from flask_mail import Message
from . import mail
from .models import Survey, SurveyStatus
from flask_jwt_extended import jwt_required
from flask import Blueprint, jsonify, request
import os

def send_email(to_email, subject, html_content):
    """Sends an email using the Flask-Mail extension."""
    try:
        sender_email = os.environ.get('MAIL_USERNAME')
        msg = Message(subject, sender=sender_email, recipients=[to_email])
        msg.html = html_content
        mail.send(msg)
        print(f"Email successfully sent to {to_email}")
    except Exception as e:
        print(f"Error sending email: {e}")

email_bp = Blueprint('email_api', __name__)

@email_bp.route('/surveys/<string:survey_id>/send', methods=['POST'])
@jwt_required()
def send_survey_email(survey_id):
    """
    Sends the public link of a published survey to a list of emails.
    """
    survey = Survey.query.get_or_404(survey_id)

    if survey.status != SurveyStatus.PUBLISHED:
        return jsonify({"status": "error", "message": "Only published surveys can be sent."}), 400

    data = request.get_json()
    emails = data.get('emails')

    if not emails or not isinstance(emails, list):
        return jsonify({"status": "error", "message": "A list of emails is required."}), 400

    # Construct the public URL using a base URL from environment variables
    frontend_url = os.environ.get('FRONTEND_BASE_URL', 'http://localhost')
    public_link = f"{frontend_url}/surveys/{survey_id}/viewForm"

    subject = f"You're invited to take the survey: {survey.survey_title}"
    html_content = f"""
        <h1>{survey.survey_title}</h1>
        <p>Please provide your feedback by completing the following survey.</p>
        <p><a href="{public_link}">Click here to start the survey</a></p>
        <br>
        <p>Thank you!</p>
    """

    for email in emails:
        send_email(email, subject, html_content)

    return jsonify({"status": "success", "message": f"Survey sent to {len(emails)} recipient(s)."}), 200



