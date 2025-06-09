from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer
from utils.decorators import *
from django.utils.crypto import get_random_string
from Cart.models import Cart, CartItem
from UserDetail.models import User
import datetime
from utils.razorpay_utils import create_razorpay_order, verify_payment_signature, fetch_payment_status


class OrderViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="customer")
    def list(self, request):
        """
        Just fetch order data for confirmation display before placing.
        """
        user_id = request.user.user_id
        cart = Cart.objects.filter(user_id=user_id).first()
        if not cart:
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Cart not found."}, status=404)

        cart_items = CartItem.objects.filter(cart_id=cart.cart_id)
        if not cart_items.exists():
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Cart is empty."}, status=400)

        total = sum(float(item.total_price) for item in cart_items)

        item_data = [
            {
                "product_id": item.product_id,
                "variation_id": item.product_variation_id,
                "quantity": item.quantity,
                "price": item.total_price
            }
            for item in cart_items
        ]

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": {"items": item_data, "total": total}, "error": None}, status=200)

    @handle_exceptions
    @check_authentication(required_role="customer")
    def create(self, request):
        """
        Place order from cart (status = not_placed)
        """
        user_id = request.user.user_id
        data = request.data
        required = ["pincode_id", "timeslot_id", "delivery_address", "payment_method"]
        if any(key not in data for key in required):
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Missing required fields."}, status=400)

        cart = Cart.objects.filter(user_id=user_id).first()
        cart_items = CartItem.objects.filter(cart_id=cart.cart_id)
        if not cart_items.exists():
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Cart is empty."}, status=400)

        order_id = self.generate_unique_order_id()
        total_amount = sum(float(item.total_price) for item in cart_items)
        order = Order.objects.create(
            order_id=order_id,
            user_id=user_id,
            pincode_id=data["pincode_id"],
            timeslot_id=data["timeslot_id"],
            delivery_address=data["delivery_address"],
            status="not_placed",
            total_amount=str(total_amount),
            payment_method=data["payment_method"],
            is_cod=data.get("is_cod", False),
            order_note=data.get("order_note", ""),
            razorpay_order_id=""
        )

        for item in cart_items:
            OrderItem.objects.create(
                order_id=order.order_id,
                product_id=item.product_id,
                product_variation_id=item.product_variation_id,
                quantity=item.quantity,
                amount=item.price,
                discount=item.discount,
                final_amount=item.total_price,
                item_note=item.notes or ""
            )

        if not order.is_cod:
            razorpay_order = create_razorpay_order(
                order_id=order.order_id,
                amount=float(total_amount)
            )

            if razorpay_order:
                # Update order with Razorpay ID
                order.razorpay_order_id = razorpay_order['id']
                order.save()

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": {"order_id": order.order_id}, "error": None}, status=201)

    def generate_unique_order_id(self):
        while True:
            order_id = get_random_string(10, allowed_chars='0123456789')
            if not Order.objects.filter(order_id=order_id).exists():
                return order_id


class ConfirmOrderViewSet(viewsets.ViewSet):

    @handle_exceptions
    def create(self, request):
        """
        Called by payment redirect URL to confirm order.
        """
        order_id = request.data.get("order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")
        razorpay_order_id = request.data.get("razorpay_order_id")

        if not order_id:
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Missing order_id."}, status=400)

        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Order not found."}, status=404)

        if razorpay_payment_id and razorpay_signature and razorpay_order_id:
            # Verify payment signature for immediate payments
            params_dict = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            }

            if verify_payment_signature(params_dict):
                # Signature valid - mark payment received
                order.payment_received = True
                order.razorpay_payment_id = razorpay_payment_id
                order.payment_id = razorpay_payment_id
            else:
                # Signature invalid - mark for later verification
                order.payment_received = False
                order.razorpay_payment_id = razorpay_payment_id
                order.payment_id = razorpay_payment_id

        else:
            # No payment info yet - mark as pending
            order.payment_received = False

        # Always mark order as placed regardless of payment status
        order.status = "order_placed"
        order.save()

        OrderItem.objects.filter(order_id=order_id).update(payment_id=order.payment_id or "")

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": {"message": "Order placed."}, "error": None}, status=200)


class PaymentStatusCheckViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        """
        Cronjob: Check for payment status for not_placed orders.
        """
        pending_orders = Order.objects.filter(status="not_placed", created_at__gte=datetime.datetime.now()-datetime.timedelta(days=2))
        updated = []

        for order in pending_orders:
            if self.external_payment_check(order.payment_id):  # You will implement this utility
                order.payment_received = True
                order.status = "order_placed"
                order.save()
                updated.append(order.order_id)

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": {"updated_orders": updated}, "error": None}, status=200)

    def external_payment_check(self, payment_id):
        # Placeholder for actual payment status check logic
        # This should call the payment gateway API to check the status of the payment
        return True

class KitchenNoteViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        orders = Order.objects.filter(status="order_placed")
        result = []
        for order in orders:
            items = OrderItem.objects.filter(order_id=order.order_id)
            result.append({"order_id": order.order_id, "items": OrderItemSerializer(items, many=True).data})

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": result, "error": None}, status=200)


class AssignDeliveryPartnerViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        order_id = request.data.get("order_id")
        delivery_partner_id = request.data.get("delivery_partner_id")

        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Order not found."}, status=404)

        order.assigned_delivery_partner_id = delivery_partner_id
        order.save()

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": {"message": "Delivery partner assigned."}, "error": None}, status=200)


class DeliveryStatusViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="delivery")
    def create(self, request):
        order_id = request.data.get("order_id")
        status_type = request.data.get("status")  # "picked_up" or "delivered"

        # to be changed to out_for_delivery
        if status_type not in ["picked_up", "delivered"]:
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Invalid status."}, status=400)

        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Order not found."}, status=404)

        order.status = status_type
        order.save()

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": {"message": f"Order marked as {status_type}."}, "error": None}, status=200)


class CODApprovalViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        order_id = request.data.get("order_id")

        try:
            order = Order.objects.get(order_id=order_id, is_cod=True)
        except Order.DoesNotExist:
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "COD Order not found."}, status=404)

        order.payment_received = True
        order.status = "delivered"
        order.save()

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": {"message": "COD Order completed."}, "error": None}, status=200)
