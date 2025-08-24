from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

def send_email(to_email, subject, html_content):
    """Sends an email using the SendGrid API."""

    # Your verified sender email address
    from_email = SENDGRID_SENDER_EMAIL

    message = Mail(
        from_email=from_email,
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )

    try:
        sendgrid_client = SendGridAPIClient(SENDGRID_API_KEY)
        response = sendgrid_client.send(message)
        print(f"Email sent with status code: {response.status_code}")
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False



email_bp = Blueprint('email_api', __name__)

# ... (register and login routes) ...

@email_bp.route('/test-email', methods=['POST'])
@jwt_required()
def test_email():
    """An endpoint to test sending an email."""
    subject = "Hello from Flask and SendGrid!"
    recipient = "recipient-email@example.com"
    html_content = "<strong>This is a test email sent from our survey application.</strong>"

    if send_email(recipient, subject, html_content):
        return jsonify({"message": "Test email sent successfully!"}), 200
    else:
        return jsonify({"message": "Failed to send email."}), 500
