import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# SMTP configuration
smtp_server = "smtp.titan.email"
smtp_port = 465  # Use 587 for STARTTLS
smtp_username = "feedback@ovenfresh.in"
smtp_password = "Ovenfresh@123"  # Be careful with storing plain passwords

# Email content
sender_email = smtp_username
receiver_email = "divyamshah1234@gmail.com"  # Replace with actual recipient
subject = "Test Email from Python"
body = "This is a test email sent using Python SMTP with SSL."

# Create the email
message = MIMEMultipart()
message["From"] = sender_email
message["To"] = receiver_email
message["Subject"] = subject
message.attach(MIMEText(body, "plain"))

# Send the email using SSL
try:
    with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
        server.login(smtp_username, smtp_password)
        server.sendmail(sender_email, receiver_email, message.as_string())
        print("Email sent successfully!")
except Exception as e:
    print("Failed to send email:", e)