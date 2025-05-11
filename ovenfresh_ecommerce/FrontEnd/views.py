from django.shortcuts import render

from rest_framework import viewsets, status
from rest_framework.response import Response

from utils.decorators import handle_exceptions, check_authentication

from UserDetail.models import User
from Order.models import Order, OrderItem
from Order.serializers import OrderItemSerializer

class AdminAddProductViewSet(viewsets.ViewSet):

    # @handle_exceptions
    # @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_add_product.html')