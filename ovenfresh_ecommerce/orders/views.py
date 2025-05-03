from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer
from django.shortcuts import get_object_or_404

class CheckoutAPIView(APIView):
    """
    Handle the checkout process (cart data, address form)
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # You will receive cart items and user details here
        cart_items = request.data.get('cart_items', [])
        is_logged_in = request.data.get('is_logged_in', False)

        # just sending back cart data for now
        return Response({
            "message": "Checkout successful",
            "cart_items": cart_items,
            "is_logged_in": is_logged_in
        }, status=status.HTTP_200_OK)

class PlaceOrderAPIView(APIView):
    """
    Create Order and OrderItems
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        data = request.data

        order = Order.objects.create(
            user=user,
            pincode_id=data.get('pincode_id'),
            timeslot_id=data.get('timeslot_id'),
            status='processing',
            total_amount=data.get('total_amount'),
            delivery_address=data.get('delivery_address'),
            payment_method=data.get('payment_method'),
            is_cod=data.get('is_cod', False),
            order_note=data.get('order_note', '')
        )

        cart_items = data.get('cart_items', [])
        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product_id=item['product_id'],
                product_variation_id=item['product_variation_id'],
                quantity=item['quantity'],
                amount=item['amount'],
                discount=item.get('discount', 0),
                final_amount=item['final_amount'],
            )

        serializer = OrderSerializer(order)
        return Response({
            "message": "Order placed successfully!",
            "order": serializer.data
        }, status=status.HTTP_201_CREATED)

class CompletePaymentAPIView(APIView):
    """
    Update Payment and Order Status
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)

        payment_id = request.data.get('payment_id')
        payment_received = request.data.get('payment_received', False)

        order.payment_id = payment_id
        order.payment_recieved = payment_received
        order.status = 'placed'
        order.save()

        return Response({"message": "Payment completed and order status updated"}, status=status.HTTP_200_OK)

class OrderListAPIView(APIView):
    """
    Get all orders for a user
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

class OrderDetailAPIView(APIView):
    """
    Get single order details
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id):
        order = get_object_or_404(Order, id=order_id, user=request.user)
        serializer = OrderSerializer(order)
        return Response(serializer.data)
