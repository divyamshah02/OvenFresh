from rest_framework import viewsets, status
from rest_framework.response import Response
from utils.decorators import handle_exceptions, check_authentication
from UserDetail.models import User
from Order.models import Order, OrderItem
from Order.serializers import OrderItemSerializer

class DeliveryPartnerViewSet(viewsets.ViewSet):
    """
    Get all active delivery partners (Admin use)
    """
    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        partners = User.objects.filter(role="delivery", is_active=True)
        data = [{"id": p.user_id, "name": p.name, "contact": p.contact_number} for p in partners]
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": data,
            "error": None
        }, status=200)


class AssignPartnerViewSet(viewsets.ViewSet):
    """
    Assign a delivery partner to an order (Admin use)
    """
    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        order_id = request.data.get("order_id")
        delivery_partner_id = request.data.get("delivery_partner_id")

        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Order not found.",
                             "user_not_logged_in": False, "user_unauthorized": False}, status=404)

        order.assigned_delivery_partner_id = delivery_partner_id
        order.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"message": "Delivery partner assigned."},
            "error": None
        }, status=200)


class DeliveryStatusViewSet(viewsets.ViewSet):
    """
    Delivery partner updates status (picked_up / delivered)
    """
    @handle_exceptions
    @check_authentication(required_role="delivery")
    def create(self, request):
        order_id = request.data.get("order_id")
        status_type = request.data.get("status")  # expected: "picked_up" or "delivered"

        if status_type not in ["picked_up", "delivered"]:
            return Response({
                "success": False, "user_not_logged_in": False, "user_unauthorized": False,
                "data": None, "error": "Invalid status."
            }, status=400)

        try:
            order = Order.objects.get(order_id=order_id, assigned_delivery_partner_id=request.user.user_id)
        except Order.DoesNotExist:
            return Response({
                "success": False, "user_not_logged_in": False, "user_unauthorized": False,
                "data": None, "error": "Order not found or unauthorized."
            }, status=404)

        order.status = status_type
        order.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"message": f"Order marked as {status_type}."},
            "error": None
        }, status=200)


class MyOrdersViewSet(viewsets.ViewSet):
    """
    Get delivery partner's assigned orders that are pending
    """
    @handle_exceptions
    @check_authentication(required_role="delivery")
    def list(self, request):
        orders = Order.objects.filter(
            assigned_delivery_partner_id=request.user.user_id,
            status__in=["order_placed", "picked_up"]
        )
        result = []
        for order in orders:
            items = OrderItem.objects.filter(order_id=order.order_id)
            result.append({
                "order_id": order.order_id,
                "status": order.status,
                "delivery_address": order.delivery_address,
                "payment_method": order.payment_method,
                "is_cod": order.is_cod,
                "items": OrderItemSerializer(items, many=True).data
            })

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": result,
            "error": None
        }, status=200)


class ConfirmCashViewSet(viewsets.ViewSet):
    """
    Delivery partner confirms COD payment
    """
    @handle_exceptions
    @check_authentication(required_role="delivery")
    def create(self, request):
        order_id = request.data.get("order_id")

        try:
            order = Order.objects.get(
                order_id=order_id,
                assigned_delivery_partner_id=request.user.user_id,
                is_cod=True,
                status="delivered"
            )
        except Order.DoesNotExist:
            return Response({
                "success": False, "user_not_logged_in": False, "user_unauthorized": False,
                "data": None, "error": "COD Order not found or not delivered yet."
            }, status=404)

        order.payment_received = True
        order.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"message": "COD payment confirmed."},
            "error": None
        }, status=200)
