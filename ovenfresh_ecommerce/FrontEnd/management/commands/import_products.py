from django.core.management.base import BaseCommand
from django.conf import settings
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
import os
import re
from django.http import JsonResponse
from utils.handle_s3_bucket import upload_file_to_s3, delete_file_from_s3

import unicodedata


class Command(BaseCommand):
    help = "Import products from JSON file into the database"

    def handle(self, *args, **options):
        json_path = settings.BASE_DIR / "new_toppers.json"
        with open(json_path, "r", encoding="utf-8") as f:
            products_data = json.load(f)

        category_map = {}
        subcategory_map = {}

        slugs = []
        slug_counts = {}


        for indd, p in enumerate(products_data[0:0], start=1):
            try:
                self.stdout.write(f"Processing {indd}/{len(products_data)}: {p.get('Name', 'Unknown')}")

                cat_dict = p.get("Categories", {})
                if not cat_dict:
                    continue
                main_cat = list(cat_dict.keys())[0]
                sub_cats = cat_dict[main_cat] if isinstance(cat_dict[main_cat], list) else []
                self.stdout.write(f"    Categories found: {cat_dict}")
                # Category
                if main_cat not in category_map:
                    cat_obj, _ = Category.objects.get_or_create(
                        title=main_cat,
                        defaults={"category_id": self.generate_category_id()}
                    )
                    category_map[main_cat] = cat_obj.category_id

                # Subcategories
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

                main_sub_cat_id = sub_category_ids[0] if sub_category_ids else None

                # Images
                image_urls = ["https://ovenfresh2025.s3.eu-north-1.amazonaws.com/products/placeholder(8).png"]
                # if p.get("Images"):
                #     for img_url in p["Images"].split(","):
                #         img_url = img_url.strip()
                #         if not img_url:
                #             continue
                #         try:
                #             resp = requests.get(img_url, timeout=10)
                #             resp.raise_for_status()
                #             content_file = ContentFile(resp.content)
                #             content_file.name = img_url.split("/")[-1]
                #             guessed_type, _ = mimetypes.guess_type(img_url)
                #             content_type = guessed_type or resp.headers.get("Content-Type", "application/octet-stream")
                #             content_file.content_type = content_type
                #             try:
                #                 relative_path = img_url.split("/uploads/")[1]
                #                 s3_folder = f"New_Website_products/{os.path.dirname(relative_path)}"
                #             except:
                #                 s3_folder = "New_Website_products"
                #             file_url = upload_file_to_s3(content_file, folder=s3_folder)
                #             self.stdout.write(f"    Image uploaded: {file_url}")
                #             image_urls.append(file_url)
                #         except Exception as e:
                #             self.stderr.write(f"    XX - Image upload failed for {img_url}: {e}")


                name = p.get("Name", "")
                base_slug = self.slugify(name)

                # Check for duplicates
                if base_slug in slug_counts:
                    slug_counts[base_slug] += 1
                    final_slug = f"{base_slug}-{slug_counts[base_slug]}"
                else:
                    slug_counts[base_slug] = 0
                    final_slug = base_slug

                slugs.append(final_slug)                

                # Product
                product_id = self.generate_product_id()
                Product.objects.create(
                    product_id=product_id,
                    title=p.get("Name", ""),
                    tags=p.get("Tags", ""),
                    slug = final_slug,
                    short_description=self.clean_description(p.get("Short description")),
                    description=self.clean_description(p.get("Description")),
                    photos=image_urls,
                    category_id=category_map.get(main_cat),
                    sub_category_id=main_sub_cat_id,
                    sub_category_id_list=sub_category_ids,
                    hsn=self.get_hsn(p),
                    created_at=timezone.now(),
                    is_veg=True,
                    is_extras=True,
                )

                # Variations
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
                        in_stock_bull=bool(var.get("In stock?", 1))
                    )
                    self.stdout.write(f"    Weight Variation: {self.get_weight(var)}")

                self.stdout.write(self.style.SUCCESS(f"✅ Imported: {p.get('Name', 'Unknown')}"))

            except Exception as e:
                self.stderr.write(f"❌ Error with {p.get('Name', 'Unknown')}: {e}")
                continue

    def clean_description(self, text):
        if not text:
            return ""
        text = re.sub(r'<[^>]+>', '', text)
        text = text.replace('_x000D_', ' ').replace('\\n', ' ').replace('\\t', ' ')
        return re.sub(r'\s+', ' ', text).strip()

    def slugify(self, value):
        """
        Convert string to URL slug:
        - Lowercase
        - Remove accents
        - Replace non-alphanumeric with hyphens
        - Collapse multiple hyphens
        """
        value = str(value)
        value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('utf-8')
        value = re.sub(r'[^a-zA-Z0-9]+', '-', value)
        value = value.strip('-').lower()
        return value

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

    def get_hsn(self, p):
        if str(p.get("Attribute 1 name", "")).lower() == "hsn code":
            return str(p.get("Attribute 1 value(s)"))
        elif str(p.get("Attribute 2 name", "")).lower() == "hsn code":
            return str(p.get("Attribute 2 value(s)"))
        return None

    def get_weight(self, var):
        weight_var = ""
        if str(var.get("Attribute 1 name", "")).lower() == "weight":
            weight_var = var.get("Attribute 1 value(s)")
        elif str(var.get("Attribute 2 name", "")).lower() == "weight":
            weight_var = var.get("Attribute 2 value(s)")
        if weight_var == "" or weight_var is None:
            return "1 piece"
        else:
            return weight_var

