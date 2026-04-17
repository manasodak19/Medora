import smtplib
import os
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def send_pharmacy_status_email(to_email: str, status: str, pharmacy_name: str):
    """
    Sends an email to the pharmacist when their pharmacy status changes.
    """
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"Skipping email to {to_email}. SMTP_EMAIL or SMTP_PASSWORD not configured.")
        return

    subject = ""
    body = ""

    if status == "verified":
        subject = f"Verification Approved - {pharmacy_name}"
        body = (f"Hello,\n\n"
                f"Great news! Your pharmacy '{pharmacy_name}' has been verified and approved by the administrator.\n\n"
                f"You can now access your dashboard and start managing your inventory and orders.\n\n"
                f"Thank you,\nThe Medora Team")
    elif status == "banned":
        subject = f"Account Banned - {pharmacy_name}"
        body = (f"Hello,\n\n"
                f"Your pharmacy '{pharmacy_name}' has been banned from the platform by the administrator.\n\n"
                f"If you believe this is a mistake, please contact support.\n\n"
                f"The Medora Team")
    else:
        # We only send emails for verified and banned
        return

    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = SMTP_EMAIL
    msg['To'] = to_email

    try:
        # Use SMTP_SSL for standard secure connection (port 465 is typical for Gmail SSL)
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(SMTP_EMAIL, SMTP_PASSWORD)
            smtp.send_message(msg)
            print(f"Successfully sent {status} email to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")

