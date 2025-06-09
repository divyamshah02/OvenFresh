# utils/razorpay_utils.py
import razorpay
from django.conf import settings
import json

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def create_razorpay_order(order_id, amount, currency="INR"):
    """
    Create a Razorpay order
    Returns: Razorpay order object or None
    """
    try:
        data = {
            "amount": int(amount * 100),  # Convert to paise
            "currency": currency,
            "receipt": order_id,
            "payment_capture": 1  # Auto-capture payment
        }
        return client.order.create(data=data)
    except Exception as e:
        print(f"Razorpay order creation failed: {str(e)}")
        return None


def verify_payment_signature(params_dict):
    """
    Verify Razorpay payment signature
    Returns: Boolean indicating verification status
    """
    try:
        client.utility.verify_payment_signature(params_dict)
        return True
    except razorpay.errors.SignatureVerificationError as e:
        print(f"Signature verification failed: {str(e)}")
        return False
    except Exception as e:
        print(f"Error in payment verification: {str(e)}")
        return False


def fetch_payment_status(payment_id):
    """
    Fetch actual payment status from Razorpay
    """
    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        payment = client.payment.fetch(payment_id)
        return payment.get('status')
    except Exception as e:
        print(f"Error fetching payment status: {str(e)}")
        return None
