from rest_framework import viewsets, status
from rest_framework.response import Response
from django.conf import settings
import razorpay
from .models import Payment
from Order.models import Order
from utils.decorators import *

class PaymentViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="customer")
    def create(self, request):
        """
        Initialize a payment with Razorpay and create a payment record.
        """
        user_id = request.user.user_id
        data = request.data

        order_id = data.get("order_id")
        if not order_id:
            return Response({"success": False, "error": "Order ID is required."}, status=400)

        try:
            order = Order.objects.get(order_id=order_id, user_id=user_id)
        except Order.DoesNotExist:
            return Response({"success": False, "error": "Order not found."}, status=404)

        if order.status != "not_placed":
            return Response({"success": False, "error": "Order is already placed or cancelled."}, status=400)

        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

        amount = int(float(order.total_amount) * 100)

        razorpay_order = client.order.create({
            "amount": amount,
            "currency": "INR",
            "payment_capture": "1"
        })

        payment = Payment.objects.create(
            order=order,
            payment_id=razorpay_order['id'],
            razorpay_order_id=razorpay_order['id'],
            amount=order.total_amount,
        )

        return Response({
            "success": True,
            "data": {
                "razorpay_order_id": razorpay_order['id'],
                "razorpay_key_id": settings.RAZORPAY_KEY_ID,
                "amount": amount,
                "currency": "INR"
            }
        }, status=200)

    @handle_exceptions
    @check_authentication(required_role="customer")
    def confirm(self, request):
        """
        Confirm and verify the Razorpay payment.
        """
        data = request.data

        payment_id = data.get("payment_id")
        razorpay_order_id = data.get("razorpay_order_id")
        razorpay_signature = data.get("razorpay_signature")

        try:
            payment = Payment.objects.get(razorpay_order_id=razorpay_order_id)
        except Payment.DoesNotExist:
            return Response({"success": False, "error": "Payment not found."}, status=404)

        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': razorpay_signature
            })

            payment.razorpay_payment_id = payment_id
            payment.status = "success"
            payment.save()

            order = payment.order
            order.status = "placed"
            order.save()

            return Response({"success": True, "data": "Payment successful."}, status=200)
            # return redirect('/cart/')  # Need to check

        except razorpay.errors.SignatureVerificationError:
            payment.status = "failed"
            payment.save()

            return Response({"success": False, "error": "Payment verification failed."}, status=400)