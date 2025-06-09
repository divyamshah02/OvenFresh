import random

def generate_send_otp(contact_number):
    otp = ''.join(random.choices('0123456789', k=6))
    print(f"Sending OTP {otp} to {contact_number}")

    return otp
