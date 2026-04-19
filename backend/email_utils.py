import smtplib
import os
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465

def _send_email(to_email: str, subject: str, body: str):
    """
    Private helper to send an email using SMTP_SSL.
    """
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"Skipping email to {to_email}. SMTP_EMAIL or SMTP_PASSWORD not configured.")
        return False

    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = SMTP_EMAIL
    msg['To'] = to_email

    try:
        # Added timeout (10s) to prevent hanging on network issues
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10) as smtp:
            smtp.login(SMTP_EMAIL, SMTP_PASSWORD)
            smtp.send_message(msg)
            return True
    except Exception as e:
        print(f"SMTP Error for {to_email}: {str(e)}")
        return False

def send_pharmacy_status_email(to_email: str, status: str, pharmacy_name: str):
    """
    Sends an email to the pharmacist when their pharmacy status changes.
    """
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
        return

    if _send_email(to_email, subject, body):
        print(f"Successfully sent {status} email to {to_email}")

def send_booking_confirmation_email(to_email: str, pharmacy_name: str, items: list, qr_token: str):
    """
    Sends an email to the customer with their booking details and QR token.
    """
    subject = f"Booking Confirmation - {pharmacy_name}"
    
    items_list = ""
    total = 0
    for i in items:
        sub = i['quantity'] * i['price']
        total += sub
        items_list += f"- {i['medicine_id']}: {i['quantity']} unit(s) @ ₹{i['price']} = ₹{sub}\n"

    body = (f"Hello,\n\n"
            f"Your booking at '{pharmacy_name}' has been confirmed!\n\n"
            f"Items:\n{items_list}\n"
            f"Total Amount: ₹{total}\n\n"
            f"Your Security Code (QR Token): {qr_token}\n"
            f"Please show this code at the pharmacy to collect your medicine.\n\n"
            f"Note: This booking is valid for 30 minutes.\n\n"
            f"Thank you,\nThe Medora Team")

    if _send_email(to_email, subject, body):
        print(f"Successfully sent booking email to {to_email}")

