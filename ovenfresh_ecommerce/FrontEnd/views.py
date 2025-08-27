from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.core.files.base import ContentFile
from django.contrib.messages import get_messages
from django.utils.decorators import method_decorator

from rest_framework import viewsets, status
from rest_framework.response import Response

from utils.email_sender_util import prepare_and_send_contact_us_email
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
import os
import re
from django.http import JsonResponse
from utils.handle_s3_bucket import upload_file_to_s3, delete_file_from_s3


class HomeViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        # Use the CMS-controlled homepage
        # return render(request, 'home.html')
        return render(request, 'home_dynamic.html')

class AboutUsViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        return render(request, 'about_us.html')

class PolicyViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        return render(request, 'policy.html')

class ContactUsViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        storage = get_messages(request)
        for message in storage:
            pass
        return render(request, 'contact_us.html')

    @handle_exceptions
    @method_decorator(csrf_exempt)
    def create(self, request):
        # Process the form data
        contact_us_form_data = {
            'first_name': request.POST.get('first_name'),
            'last_name': request.POST.get('last_name'),
            'email': request.POST.get('email'),
            'phone': request.POST.get('phone'),
            'message': request.POST.get('message')
        }

        # print("Contact form submission:", contact_us_form_data)
        prepare_and_send_contact_us_email(contact_us_form_data)

        # Add a success message
        messages.success(request, 'Your message has been sent successfully! We will get back to you soon.')

        # Redirect to the contact us page
        return redirect('contact-us-list')

class ShopViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):        
        return render(request, 'shop.html')

    @handle_exceptions
    def retrieve(self, request, pk):
        data = {}
        if pk:
            print(pk)
            data = {
                'pk': str(pk).replace("-", " "),
            }
        return render(request, 'shop.html', data)


class ProductDetailViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):

        product_slug = request.query_params.get('product_slug')
        product_id = None
        not_topper = True
        if product_slug:
            product_obj = Product.objects.filter(slug=product_slug).first()
            product_id = product_obj.product_id if product_obj else None
            if product_obj.category_id == '6145109248':
                not_topper = False 

        get_toppers = Product.objects.filter(sub_category_id="8746472697")
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

        get_cards = Product.objects.filter(sub_category_id="4437657422")
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
            "product_id": product_id,
            "not_topper": not_topper,
            "product_obj": product_obj,
            "product_photo": product_obj.photos[0]
        }
        return render(request, 'product-detail.html', data)

    @handle_exceptions
    def retrieve(self, request, pk):

        product_slug = pk
        product_id = None
        not_topper = True
        if product_slug:
            product_obj = Product.objects.filter(slug=product_slug).first()
            product_id = product_obj.product_id if product_obj else None
            if product_obj.category_id == '6145109248':
                not_topper = False 

        get_toppers = Product.objects.filter(sub_category_id="8746472697")
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

        get_cards = Product.objects.filter(sub_category_id="4437657422")
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
            "product_id": product_id,
            "not_topper": not_topper,
            "product_obj": product_obj,
            "product_photo": product_obj.photos[0]
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


class AdminProductTaxRateViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        return render(request, 'admin/admin_product_tax_rates.html')


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

            category_map = {}
            subcategory_map = {}

            for indd,p in enumerate(products_data[0:1]):
                try:
                    print(f"Processing product: {indd+1} {p.get('Name', 'Unknown')}")
                    cat_dict = p.get("Categories", {})  # This is already a dict like {"Cakes": ["Bento Cakes", "Chocolate Cakes"]}
                    if not cat_dict:
                        continue
                    print(f"Categories found: {cat_dict}")
                    # Extract category & subcategory list
                    main_cat = list(cat_dict.keys())[0]
                    sub_cats = cat_dict[main_cat] if isinstance(cat_dict[main_cat], list) else []

                    # Create category if not exists
                    if main_cat not in category_map:
                        cat_obj, _ = Category.objects.get_or_create(
                            title=main_cat,
                            defaults={"category_id": self.generate_category_id()}
                        )
                        category_map[main_cat] = cat_obj.category_id

                    # Create all subcategories & collect IDs
                    sub_category_ids = []
                    for sub_cat in sub_cats:
                        if sub_cat not in subcategory_map:
                            sub_obj, _ = SubCategory.objects.get_or_create(
                                title=sub_cat,
                                category_id=category_map[main_cat],
                                defaults={"sub_category_id": self.generate_sub_category_id()}
                            )
                            subcategory_map[sub_cat] = sub_obj.sub_category_id
                        sub_category_ids.append(subcategory_map[sub_cat])

                    # Pick first subcategory ID for main product field
                    main_sub_cat_id = sub_category_ids[0] if sub_category_ids else None

                    # Download & upload images
                    image_urls = []
                    if p.get("Images"):
                        for img_url in p["Images"].split(","):
                            img_url = img_url.strip()
                            if not img_url:
                                continue
                            try:
                                resp = requests.get(img_url, timeout=10)
                                resp.raise_for_status()
                                content_file = ContentFile(resp.content)
                                content_file.name = img_url.split("/")[-1]
                                guessed_type, _ = mimetypes.guess_type(img_url)
                                content_type = guessed_type or resp.headers.get("Content-Type", "application/octet-stream")
                                content_file.content_type = content_type
                                try:                                    
                                    relative_path = img_url.split("/uploads/")[1]
                                    s3_folder = f"products/{os.path.dirname(relative_path)}"
                                except:
                                    # Fallback if URL doesn't contain 'uploads/'
                                    s3_folder = "products"

                                file_url = upload_file_to_s3(content_file, folder=s3_folder)
                                print(f"Image uploaded: {file_url}")
                                image_urls.append(file_url)
                            except Exception as e:
                                print(f"Image upload failed for {img_url}: {e}")

                    # Create product
                    product_id = self.generate_product_id()
                    product_obj = Product.objects.create(
                        product_id=product_id,
                        title=p.get("Name", ""),
                        description=self.clean_description(p.get("Short description")),
                        photos=image_urls,
                        category_id=category_map.get(main_cat),
                        sub_category_id=main_sub_cat_id,
                        sub_category_id_list=sub_category_ids,  # NEW LIST FIELD
                        hsn=self.get_hsn(p),
                        created_at=timezone.now(),
                        is_veg=True
                    )

                    # Create variations
                    for var in p.get("Products_varaitons", []):
                        ProductVariation.objects.create(
                            product_id=product_id,
                            product_variation_id=self.generate_product_variation_id(),
                            actual_price=var.get("Regular price", 0),
                            discounted_price=var.get("Regular price", 0),
                            is_vartied=True,
                            weight_variation=self.get_weight(var),
                            is_active=True,
                            created_at=timezone.now(),
                            stock_toggle_mode=True,
                            stock_quantity=None,
                            in_stock_bull=not bool(var.get("In stock?", 1))
                        )

                    print(f"Product {p.get('Name', 'Unknown')} imported successfully with ID {product_id}")
                except Exception as e:
                    print(f"XXXXXX Error processing product {p.get('Name', 'Unknown')}: {e}")
                    continue

            return JsonResponse({
                "success": True,
                "data": "Products imported successfully"
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return JsonResponse({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def clean_description(self, text):
        if not text:
            return ""
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Remove _x000D_ and escaped \n or \t
        text = text.replace('_x000D_', ' ')
        text = text.replace('\\n', ' ').replace('\\t', ' ')
        
        # Collapse multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    def generate_product_id(self):
        while True:
            product_id = random.choice('123456789') + ''.join(random.choices(string.digits, k=9))
            if not Product.objects.filter(is_active=True, product_id=product_id).exists():
                return product_id

    def generate_product_variation_id(self):
        while True:
            product_variation_id = random.choice('123456789') + ''.join(random.choices(string.digits, k=9))
            if not ProductVariation.objects.filter(is_active=True, product_variation_id=product_variation_id).exists():
                return product_variation_id

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
    
    def generate_sub_category_id(self):
        while True:
            sub_category_id = random.choice('123456789') + ''.join(random.choices(string.digits, k=9))
            if not SubCategory.objects.filter(is_active=True, sub_category_id=sub_category_id).exists():
                return sub_category_id

    def generate_category_id(self):
        while True:
            category_id = random.choice('123456789') + ''.join(random.choices(string.digits, k=9))
            if not Category.objects.filter(is_active=True, category_id=category_id).exists():
                return category_id



def update_pincode_charges(request):
    all_pincodes = Pincode.objects.all()
    for pincode in all_pincodes:
        new_charges = {"6": {"charges": 100, "available": True}, "7": {"charges": 0, "available": True}, "8": {"charges": 80, "available": True}, "9": {"charges": 80, "available": True}, "10": {"charges": 80, "available": True}, "11": {"charges": 100, "available": True}}
        print(pincode.delivery_charge)
        pincode.delivery_charge = new_charges
        pincode.save()
    
    return JsonResponse({"status": "success", "message": "Pincode charges updated successfully."})
        
