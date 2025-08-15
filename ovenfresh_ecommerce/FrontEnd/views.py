from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.core.files.base import ContentFile

from rest_framework import viewsets, status
from rest_framework.response import Response

from utils.decorators import handle_exceptions, check_authentication

from UserDetail.models import User
from Order.models import Order, OrderItem
from Order.serializers import OrderItemSerializer
from Product.models import *

import mimetypes
import json
import requests
import random
import string
from django.http import JsonResponse
from utils.handle_s3_bucket import upload_file_to_s3, delete_file_from_s3


class HomeViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        # Use the CMS-controlled homepage
        # return render(request, 'home.html')
        return render(request, 'home_dynamic.html')

class ShopViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        return render(request, 'shop.html')


class ProductDetailViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        get_toppers = Product.objects.filter(sub_category_id="9234546814")
        toppers = []
        for topper in get_toppers:
            temp_topper = {
                "product_id": topper.product_id,
                "title": topper.title,
            }
            product_variations = ProductVariation.objects.filter(product_id=topper.product_id)
            if product_variations.exists():
                temp_topper["actual_price"] = product_variations.first().actual_price
                temp_topper["product_variation_id"] = product_variations.first().product_variation_id
            toppers.append(temp_topper)

        get_cards = Product.objects.filter(sub_category_id="3622759923")
        cards = []
        for card in get_cards:
            temp_card = {
                "product_id": card.product_id,
                "title": card.title,
            }
            product_variations = ProductVariation.objects.filter(product_id=card.product_id)
            if product_variations.exists():
                temp_card["actual_price"] = product_variations.first().actual_price
                temp_card["product_variation_id"] = product_variations.first().product_variation_id
            cards.append(temp_card)

        data = {
            "get_toppers": toppers,
            "get_cards": cards,
        }
        return render(request, 'product-detail.html', data)


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


class AdminHomeCmsViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_home_management.html')


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


class AdminReviewsViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin-reviews.html')


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




class ImportProductsViewSet(viewsets.ViewSet):

    @check_authentication(required_role='admin')
    def list(self, request):
        try:
            # Path to your JSON file
            json_path = settings.BASE_DIR / "filtered_products.json"
            with open(json_path, "r", encoding="utf-8") as f:
                products_data = json.load(f)

            # Pass 1: Create categories & subcategories
            category_map = {}
            subcategory_map = {}

            for p in products_data[0:1]:
                category_string = p.get("Categories", "")
                if not category_string:
                    continue

                parts = [c.strip() for c in category_string.split(">")]
                main_cat = parts[0]
                sub_cat = parts[1] if len(parts) > 1 else None

                # Create Category if not exists
                if main_cat and main_cat not in category_map:
                    cat_obj, _ = Category.objects.get_or_create(
                        title=main_cat,
                        defaults={"category_id": self.generate_id()}
                    )
                    category_map[main_cat] = cat_obj.category_id

                # Create SubCategory if not exists
                if sub_cat and sub_cat not in subcategory_map:
                    sub_obj, _ = SubCategory.objects.get_or_create(
                        title=sub_cat,
                        category_id=category_map[main_cat],
                        defaults={"sub_category_id": self.generate_id()}
                    )
                    subcategory_map[sub_cat] = sub_obj.sub_category_id

            # Pass 2: Create Products & Variations
            for p in products_data:
                category_string = p.get("Categories", "")
                parts = [c.strip() for c in category_string.split(">")]
                main_cat = parts[0] if parts else None
                sub_cat = parts[1] if len(parts) > 1 else None

                # Download & upload images to S3
                image_urls = []
                if p.get("Images"):
                    for img_url in p["Images"].split(","):
                        img_url = img_url.strip()
                        if not img_url:
                            continue
                        try:
                            resp = requests.get(img_url, timeout=10)
                            resp.raise_for_status()

                            # Wrap bytes in ContentFile
                            content_file = ContentFile(resp.content)
                            content_file.name = img_url.split("/")[-1]

                            # Guess content type from URL or headers
                            guessed_type, _ = mimetypes.guess_type(img_url)
                            content_type = guessed_type or resp.headers.get("Content-Type", "application/octet-stream")
                            content_file.content_type = content_type  # Add missing attr

                            file_url = upload_file_to_s3(content_file, folder="products")
                            print(f"Image uploaded: {file_url}")
                            image_urls.append(file_url)

                        except Exception as e:
                            print(f"Image upload failed for {img_url}: {e}")

                # Create product
                product_id = self.generate_id()
                product_obj = Product.objects.create(
                    product_id=product_id,
                    title=p.get("Name", ""),
                    description=p.get("Short description"),
                    photos=image_urls,
                    category_id=category_map.get(main_cat),
                    sub_category_id=subcategory_map.get(sub_cat),
                    hsn=self.get_hsn(p),
                    created_at=timezone.now(),
                    is_veg=True  # Default to True unless you add logic
                )

                # Create variations
                for var in p.get("Products_varaitons", []):
                    ProductVariation.objects.create(
                        product_id=product_id,
                        product_variation_id=self.generate_id(),
                        actual_price=var.get("Regular price", 0),
                        discounted_price=var.get("Regular price", 0),
                        is_vartied=True,
                        weight_variation=self.get_weight(var),
                        is_active=True,
                        created_at=timezone.now(),
                        stock_toggle_mode=True,
                        stock_quantity=None,
                        in_stock_bull=bool(var.get("In stock?", 1))
                    )

            return JsonResponse({
                "success": True,
                "data": "Products imported successfully"
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return JsonResponse({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def generate_id(self, length=10):
        return ''.join(random.choices(string.digits, k=length))

    def get_hsn(self, product_dict):
        if str(product_dict.get("Attribute 1 name", "")).lower() == "hsn code":
            return str(product_dict.get("Attribute 1 value(s)"))
        elif str(product_dict.get("Attribute 2 name", "")).lower() == "hsn code":
            return str(product_dict.get("Attribute 2 value(s)"))
        return None

    def get_weight(self, variation):
        if str(variation.get("Attribute 1 name", "")).lower() == "weight":
            return variation.get("Attribute 1 value(s)")
        elif str(variation.get("Attribute 2 name", "")).lower() == "weight":
            return variation.get("Attribute 2 value(s)")
        return None