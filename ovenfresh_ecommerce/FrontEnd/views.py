from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

from rest_framework import viewsets, status
from rest_framework.response import Response

from utils.decorators import handle_exceptions, check_authentication

from UserDetail.models import User
from Order.models import Order, OrderItem
from Order.serializers import OrderItemSerializer


class HomeViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        # Use the CMS-controlled homepage
        return render(request, 'home.html')

class ShopViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        return render(request, 'shop.html')


class ProductDetailViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        return render(request, 'product-detail.html')


class CartViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        return render(request, 'cart.html')


class CheckoutViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        return render(request, 'checkout.html')



from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, HttpResponseBadRequest
import razorpay
from django.conf import settings

@csrf_exempt
def payment_success_callback(request):
    get_order_id = request.GET.get("razorpay_order_id")
    if request.method == "POST":
        payment_id = request.POST.get("razorpay_payment_id")
        order_id = request.POST.get("razorpay_order_id")
        signature = request.POST.get("razorpay_signature")

        print(payment_id)
        print(order_id)
        print(signature)

        # Optional: verify signature
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        params_dict = {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature
        }

        try:
            client.utility.verify_payment_signature(params_dict)
        except razorpay.errors.SignatureVerificationError:
            return HttpResponseBadRequest("Invalid signature")

        # ✅ Process your order update logic here
        return redirect(f'/order-success?order_id={get_order_id}')  # Redirect to order success page
    else:
        return redirect(f'/order-success?order_id={get_order_id}')


class OrderSuccessDetailViewSet(viewsets.ViewSet):

    @handle_exceptions
    @csrf_exempt
    def list(self, request):
        return render(request, 'order-success.html')
    
    @csrf_exempt
    def create(self, request):
        return render(request, 'order-success.html')


class OrderDetailViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        return render(request, 'order-detail.html')


class AccountViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        return render(request, 'account.html')


class AdminTemplateViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_template.html')


class AdminDashboardViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_dashboard.html')

class AdminCmsViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_homepage_manager.html')


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


class AdminCouponViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_coupon_manager.html')


class AdminAllOrdersViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_all_orders.html')


class AdminOrderDetailViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_order_detail.html')


class AdminPincodeOrderDetailViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_pincode_orders.html')


class AdminAddOrderViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_add_order.html')


class AdminDeliverPersonViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_delivery_manager.html')


class DeliveryLoginViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        return render(request, 'delivery/delivery_login.html')


class DeliveryDashboardViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="delivery")
    def list(self, request):
        return render(request, 'delivery/delivery_dashboard.html')


def admin_login(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if (user is not None and user.is_staff):
            login(request, user)
            return redirect('admin_dashboard')
        else:
            messages.error(request, 'Invalid credentials or not an admin.')
    return render(request, 'admin/admin_login.html')

