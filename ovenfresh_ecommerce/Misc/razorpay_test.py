import razorpay
import base64


def base64_to_text(b64_text):
    # Decode the Base64 string back to bytes, then to text
    return base64.b64decode(b64_text.encode()).decode()

# Your Razorpay API keys
RAZORPAY_KEY_ID = base64_to_text("cnpwX2xpdmVfUjVFMkdsQUtjeWVpZEQ=")
RAZORPAY_KEY_SECRET = base64_to_text("UkFYTXVZcGs2TEJkejcxTnBtTjRrVUdP")

# Initialize Razorpay client
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

def check_order_payment(order_id: str):
    """
    Check if a Razorpay order is paid or not.
    Returns dict with order details and payment status.
    """
    try:
        # Fetch order details
        order = client.order.fetch(order_id)

        # Fetch all payments linked to this order
        payments = client.order.payments(order_id)

        # Check if any payment is captured
        is_paid = False
        successful_payment = None
        for payment in payments.get("items", []):
            if payment["status"] == "captured":
                is_paid = True
                successful_payment = payment
                break

        return {
            "success": True,
            "order_id": order_id,
            "is_paid": is_paid,
            "order_details": order,
            "payment_details": successful_payment
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# Example usage:
if __name__ == "__main__":
    result = check_order_payment("order_R8ix6m0jDGN5Em")
    print("Paymen details for ", result)
