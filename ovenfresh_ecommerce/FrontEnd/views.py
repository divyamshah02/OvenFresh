from django.shortcuts import render

from rest_framework import viewsets, status
from rest_framework.response import Response

from utils.decorators import handle_exceptions, check_authentication

from UserDetail.models import User
from Order.models import Order, OrderItem
from Order.serializers import OrderItemSerializer


class HomeViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        return render(request, 'home.html')

class ShopViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        return render(request, 'shop.html')


class ProductDetailViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        return render(request, 'product-detail.html')


class AdminTemplateViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_template.html')


class AdminAllProductViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_products.html')


class AdminAddProductViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_add_product.html')


class AdminManageCategoryViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_category.html')


class AdminPincodeViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_pincode_manager.html')


class AdminTimeslotViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_timeslots_manager.html')

