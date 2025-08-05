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
    def list(self, request):
        cart_id = request.query_params.get('cart_id')

        user = request.user if request.user.is_authenticated else None
        # session_id = request.session.session_key
        session_id = request.session.get('session_token')

        # if not cart_id and not session_id and not user_id:
        #     return Response({
        #         "success": False,
        #         "user_not_logged_in": False,
        #         "user_unauthorized": False,
        #         "data": None,
        #         "error": "Missing cart_id, session_id or user_id"
        #     }, status=status.HTTP_400_BAD_REQUEST)

        cart = None
        if cart_id:
            cart = Cart.objects.filter(cart_id=cart_id).first()
        elif user:
            cart = Cart.objects.filter(user_id=user.user_id, active_cart=True).first()
        elif session_id:
            cart = Cart.objects.filter(session_id=session_id, active_cart=True).first()

        if cart:
            items = CartItem.objects.filter(cart_id=cart.cart_id)
            serializer = CartItemSerializer(items, many=True)

            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {
                    "cart_id": cart.cart_id,
                    "cart_items": serializer.data
                },
                "error": None
            }, status=status.HTTP_200_OK)

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"cart_items": []},
            "error": "Cart not found"
        }, status=status.HTTP_200_OK)

    # @handle_exceptions
    def create(self, request):
        user = request.user if request.user.is_authenticated else None
        
        # session_id = request.session.session_key
        if request.session.get('session_token') is None:
            request.session['session_token'] = request.COOKIES.get('csrftoken')
        session_id = request.session.get('session_token')
        
        product_id = request.data.get('product_id')
        product_variation_id = request.data.get('product_variation_id')
        quantity = request.data.get('quantity', 1)

        if not product_id or not product_variation_id:
            return Response({
                "success": False,
                "user_not_logged_in": not bool(user),
                "user_unauthorized": False,
                "data": None,
                "error": "Missing product_id or product_variation_id"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Determine cart owner: user or session
        if user:
            # Get or create cart for logged-in user
            cart = Cart.objects.filter(user_id=user.user_id, active_cart=True).first()
            if not cart:
                cart_id = generate_unique_cart_id()
                cart = Cart.objects.create(
                    cart_id=cart_id,
                    user_id=user.user_id
                )
        else:
            # Not logged in, session_id is required
            if not session_id:
                return Response({
                    "success": False,
                    "user_not_logged_in": True,
                    "user_unauthorized": False,
                    "data": None,
                    "error": "Session ID is required for guests"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            cart = Cart.objects.filter(session_id=session_id, active_cart=True).first()
            if not cart:
                cart_id = generate_unique_cart_id()
                cart = Cart.objects.create(
                    cart_id=cart_id,
                    session_id=session_id
                )

        # Check if product already in cart, then update quantity, else create new cart item
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
            "user_not_logged_in": not bool(user),
            "user_unauthorized": False,
            "data": {"cart_id": cart.cart_id},
            "error": None
        }, status=status.HTTP_201_CREATED)

    @handle_exceptions
    def update(self, request, pk):
        cart_item_id = pk
        quantity = request.data.get('quantity')

        if not all([cart_item_id, quantity]):
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Missing required data"
            }, status=status.HTTP_400_BAD_REQUEST)

        item = CartItem.objects.filter(
            id=cart_item_id            
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
    def delete(self, request, pk):
        cart_item_id = pk

        if not cart_item_id:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Missing required fields"
            }, status=status.HTTP_400_BAD_REQUEST)

        item = CartItem.objects.filter(id=cart_item_id).first()

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


class CartTransferViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role=None)
    def create(self, request):
        user = request.user
        session_id = request.data.get('session_id')
        if not session_id:
            session_id = request.session.get('session_token')

        if not session_id:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "No session ID available"
            }, status=status.HTTP_400_BAD_REQUEST)

        guest_cart = Cart.objects.filter(session_id=session_id, active_cart=True).first()
        if not guest_cart:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "No open cart found for this session"
            }, status=status.HTTP_404_NOT_FOUND)

        user_cart = Cart.objects.filter(user_id=user.user_id, active_cart=True).first()
        if user_cart:
            user_cart.active_cart = False
            user_cart.save()
        
        guest_cart.user_id = user.user_id
        # guest_cart.session_id = None
        guest_cart.active_cart = True
        guest_cart.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"cart_id": guest_cart.cart_id},
            "error": None
        }, status=status.HTTP_200_OK)
