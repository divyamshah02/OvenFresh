from rest_framework import viewsets, status
from rest_framework.response import Response
from django.utils.crypto import get_random_string
from django.utils import timezone

from .models import Cart, CartItem
from .serializers import CartItemSerializer
from utils.decorators import *


def generate_unique_cart_id():
    while True:
        cart_id = get_random_string(10, allowed_chars='0123456789')
        if not Cart.objects.filter(cart_id=cart_id).exists():
            return cart_id


class CartViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication
    def list(self, request):
        cart_id = request.query_params.get('cart_id')
        session_id = request.query_params.get('session_id')
        user_id = request.query_params.get('user_id')

        if not cart_id and not session_id and not user_id:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Missing cart_id, session_id or user_id"
            }, status=status.HTTP_400_BAD_REQUEST)

        cart = None
        if cart_id:
            cart = Cart.objects.filter(cart_id=cart_id).first()
        elif user_id:
            cart = Cart.objects.filter(user_id=user_id, status="open").first()
        elif session_id:
            cart = Cart.objects.filter(session_id=session_id, status="open").first()

        if not cart:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Cart not found"
            }, status=status.HTTP_404_NOT_FOUND)

        items = CartItem.objects.filter(cart_id=cart.cart_id)
        serializer = CartItemSerializer(items, many=True)

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "cart_id": cart.cart_id,
                "items": serializer.data
            },
            "error": None
        }, status=status.HTTP_200_OK)

    @handle_exceptions
    @check_authentication
    def create(self, request):
        session_id = request.data.get('session_id')
        user_id = request.data.get('user_id')
        product_id = request.data.get('product_id')
        product_variation_id = request.data.get('product_variation_id')
        quantity = request.data.get('quantity', 1)

        if not product_id or not product_variation_id:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Missing product_id or product_variation_id"
            }, status=status.HTTP_400_BAD_REQUEST)

        cart = None
        if user_id:
            cart = Cart.objects.filter(user_id=user_id, status="open").first()
        elif session_id:
            cart = Cart.objects.filter(session_id=session_id, status="open").first()

        if not cart:
            cart_id = generate_unique_cart_id()
            cart = Cart.objects.create(
                cart_id=cart_id,
                user_id=user_id,
                session_id=session_id,
                status='open'
            )

        # Check if item already exists in cart
        existing_item = CartItem.objects.filter(
            cart_id=cart.cart_id,
            product_id=product_id,
            product_variation_id=product_variation_id
        ).first()

        if existing_item:
            existing_item.quantity = quantity
            existing_item.save()
        else:
            CartItem.objects.create(
                cart_id=cart.cart_id,
                product_id=product_id,
                product_variation_id=product_variation_id,
                quantity=quantity
            )

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"cart_id": cart.cart_id},
            "error": None
        }, status=status.HTTP_201_CREATED)

    @handle_exceptions
    @check_authentication
    def update(self, request):
        cart_id = request.data.get('cart_id')
        product_id = request.data.get('product_id')
        product_variation_id = request.data.get('product_variation_id')
        quantity = request.data.get('quantity')

        if not all([cart_id, product_id, product_variation_id, quantity]):
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Missing required data"
            }, status=status.HTTP_400_BAD_REQUEST)

        item = CartItem.objects.filter(
            cart_id=cart_id,
            product_id=product_id,
            product_variation_id=product_variation_id
        ).first()

        if not item:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Item not found in cart"
            }, status=status.HTTP_404_NOT_FOUND)

        item.quantity = quantity
        item.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"message": "Cart item updated"},
            "error": None
        }, status=status.HTTP_200_OK)

    @handle_exceptions
    @check_authentication
    def delete(self, request):
        cart_id = request.data.get('cart_id')
        product_id = request.data.get('product_id')
        product_variation_id = request.data.get('product_variation_id')

        if not all([cart_id, product_id, product_variation_id]):
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Missing required fields"
            }, status=status.HTTP_400_BAD_REQUEST)

        item = CartItem.objects.filter(
            cart_id=cart_id,
            product_id=product_id,
            product_variation_id=product_variation_id
        ).first()

        if not item:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Item not found in cart"
            }, status=status.HTTP_404_NOT_FOUND)

        item.delete()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"message": "Item removed from cart"},
            "error": None
        }, status=status.HTTP_200_OK)

    @handle_exceptions
    @check_authentication
    def transfer(self, request):
        session_id = request.data.get('session_id')
        user_id = request.data.get('user_id')

        if not session_id or not user_id:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Missing session_id or user_id"
            }, status=status.HTTP_400_BAD_REQUEST)

        cart = Cart.objects.filter(session_id=session_id, status="open").first()
        if not cart:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Cart not found for session"
            }, status=status.HTTP_404_NOT_FOUND)

        cart.user_id = user_id
        cart.session_id = None
        cart.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"cart_id": cart.cart_id, "message": "Cart transferred"},
            "error": None
        }, status=status.HTTP_200_OK)
