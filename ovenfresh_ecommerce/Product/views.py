from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.conf import settings
from django.db import models

from django.utils import timezone

from .models import *
from .serializers import *

from utils.decorators import *
from utils.handle_s3_bucket import upload_file_to_s3, delete_file_from_s3

import random
import string
from datetime import datetime
import os


class CategoryViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    def list(self, request):
        categories = Category.objects.filter(is_extras=False, is_active=True)
        category_serializer = CategorySerializer(categories, many=True)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": category_serializer.data,
            "error": None
        }, status=status.HTTP_200_OK)

    @handle_exceptions
    @check_authentication(required_role='admin')
    def create(self, request):
        title = request.data.get("title")
        category_id = self.generate_category_id()

        if not title:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Title is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        new_category = Category(
            category_id=category_id,
            title=title
        )
        new_category.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"category_id": category_id},
            "error": None
            }, status=status.HTTP_201_CREATED)

    @handle_exceptions
    @check_authentication(required_role='admin')
    def update(self, request, pk):
        title = request.data.get("title")
        category_id = pk

        if not title:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Title is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        update_category = Category.objects.filter(category_id=category_id).first()
        if not update_category:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Category not found."
            }, status=status.HTTP_404_NOT_FOUND)
        
        update_category.title = title        
        update_category.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"category_id": category_id},
            "error": None
            }, status=status.HTTP_201_CREATED)


    @handle_exceptions
    @check_authentication(required_role='admin')
    def delete(self, request, pk):
        category_id = pk

        delete_category = Category.objects.filter(category_id=category_id).first()
        if not delete_category:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Category not found."
            }, status=status.HTTP_404_NOT_FOUND)
      
        delete_category.delete()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"category_id": category_id},
            "error": None
            }, status=status.HTTP_201_CREATED)


    def generate_category_id(self):
        while True:
            category_id = random.choice('123456789') + ''.join(random.choices(string.digits, k=9))
            if not Category.objects.filter(is_active=True, category_id=category_id).exists():
                return category_id


class SubCategoryViewSet(viewsets.ViewSet):
    @handle_exceptions
    def list(self, request):
        sub_categories = SubCategory.objects.filter(is_extras=False, is_active=True)
        sub_category_serializer = SubCategorySerializer(sub_categories, many=True)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": sub_category_serializer.data,
            "error": None
        }, status=status.HTTP_200_OK)

    @handle_exceptions
    @check_authentication(required_role='admin')
    def create(self, request):
        title = request.data.get("title")
        category_id = request.data.get("category_id")
        sub_category_id = self.generate_sub_category_id()

        if not title or not category_id:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Title & category_id are required."
            }, status=status.HTTP_400_BAD_REQUEST)

        new_sub_category = SubCategory(
            category_id=category_id,
            sub_category_id=sub_category_id,
            title=title
        )
        new_sub_category.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"sub_category_id": sub_category_id},
            "error": None
            }, status=status.HTTP_201_CREATED)

    @handle_exceptions
    @check_authentication(required_role='admin')
    def update(self, request, pk):
        title = request.data.get("title")        
        sub_category_id = pk

        if not title:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Title is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        update_sub_category = SubCategory.objects.filter(sub_category_id=sub_category_id).first()
        if not update_sub_category:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "SubCategory not found."
            }, status=status.HTTP_404_NOT_FOUND)
        
        update_sub_category.title = title
        update_sub_category.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"sub_category_id": sub_category_id},
            "error": None
        }, status=status.HTTP_201_CREATED)

    @handle_exceptions
    @check_authentication(required_role='admin')
    def delete(self, request, pk):
        sub_category_id = pk

        delete_sub_category = SubCategory.objects.filter(sub_category_id=sub_category_id).first()
        if not delete_sub_category:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "SubCategory not found."
            }, status=status.HTTP_404_NOT_FOUND)
      
        delete_sub_category.delete()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"sub_category_id": sub_category_id},
            "error": None
            }, status=status.HTTP_201_CREATED)

    def generate_sub_category_id(self):
        while True:
            sub_category_id = random.choice('123456789') + ''.join(random.choices(string.digits, k=9))
            if not SubCategory.objects.filter(is_active=True, sub_category_id=sub_category_id).exists():
                return sub_category_id


class ProductViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role='admin')
    def create(self, request):
        try:
            data = request.data

            title = data.get("title")
            description = data.get("description")
            category_id = data.get("category_id")
            sub_category_id = data.get("sub_category_id")
            features = data.get("features")
            special_note = data.get("special_note")
            is_veg_str = data.get("is_veg", "true")
            is_veg = is_veg_str.lower() == "true"
            ingredients = data.get("ingredients")
            allergen_information = data.get("allergen_information")
            storage_instructions = data.get("storage_instructions")
            sku = data.get("sku")
            hsn = data.get("hsn")
            tags = data.get("tags")


            if not title or not category_id:
                return Response({
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": None,
                    "error": "Missing required fields."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Handle image uploads
            image_urls = []
            ind = 0
            while True:
                if f'images[{ind}]' in request.FILES:
                    uploaded_file = request.FILES[f'images[{ind}]']
                    
                    # Validate file type
                    allowed_extensions = ['jpg', 'jpeg', 'png', 'webp']
                    file_extension = uploaded_file.name.split('.')[-1].lower()
                    
                    if file_extension not in allowed_extensions:
                        return Response({
                            "success": False,
                            "user_not_logged_in": False,
                            "user_unauthorized": False,
                            "data": None,
                            "error": f"Invalid file type: {uploaded_file.name}. Only JPG, PNG, and WebP are allowed."
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Upload to S3
                    try:
                        file_url = upload_file_to_s3(uploaded_file, folder="products")
                        image_urls.append(file_url)
                    except Exception as e:
                        return Response({
                            "success": False,
                            "user_not_logged_in": False,
                            "user_unauthorized": False,
                            "data": None,
                            "error": f"Failed to upload image: {str(e)}"
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
                    ind += 1
                else:
                    break

            if not image_urls:
                return Response({
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": None,
                    "error": "At least one product image is required."
                }, status=status.HTTP_400_BAD_REQUEST)

            product_id = self.generate_product_id()

            new_product = Product(
                product_id=product_id,
                title=title,
                description=description,
                photos=image_urls,
                category_id=category_id,
                sub_category_id=sub_category_id,
                features=features,
                special_note=special_note,
                is_veg=is_veg,
                ingredients=ingredients,
                allergen_information=allergen_information,
                storage_instructions=storage_instructions,
                hsn=hsn,
                sku=sku,
                tags=tags,
                created_at=timezone.now()
            )
            new_product.save()

            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {
                    "product_id": product_id,
                    "image_urls": image_urls
                },
                "error": None
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def generate_product_id(self):
        while True:
            product_id = random.choice('123456789') + ''.join(random.choices(string.digits, k=9))
            if not Product.objects.filter(is_active=True, product_id=product_id).exists():
                return product_id

    @handle_exceptions
    def list(self, request):
        product_id = request.query_params.get('product_id')

        if not product_id:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Missing product_id."
            }, status=status.HTTP_400_BAD_REQUEST)

        product_obj = Product.objects.filter(product_id=product_id).first()
        if not product_obj:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "No data found for this product."
            }, status=status.HTTP_200_OK)
        
        product_data = ProductSerializer(product_obj)

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": product_data.data,
            "error": None
        }, status=status.HTTP_200_OK)

    @handle_exceptions
    @check_authentication(required_role='admin')
    def update(self, request, pk=None):
        product_id = pk
        
        data = request.data

        title = data.get("title")
        description = data.get("description")
        category_id = data.get("category_id")
        sub_category_id = data.get("sub_category_id")
        features = data.get("features")
        special_note = data.get("special_note")
        is_veg_str = data.get("is_veg", "true")
        is_veg = is_veg_str.lower() == "true"
        ingredients = data.get("ingredients")
        allergen_information = data.get("allergen_information")
        storage_instructions = data.get("storage_instructions")
        sku = data.get("sku")
        hsn = data.get("hsn")
        tags = data.get("tags")

        if not product_id or not title or not category_id:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Missing required fields."
            }, status=status.HTTP_400_BAD_REQUEST)

        product_obj = Product.objects.filter(product_id=product_id).first()

        if not product_obj:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Product not found."
            }, status=status.HTTP_404_NOT_FOUND)

        # Handle new image uploads
        new_image_urls = []
        ind = 0
        while True:
            if f'images[{ind}]' in request.FILES:
                uploaded_file = request.FILES[f'images[{ind}]']
                
                # Validate file type
                allowed_extensions = ['jpg', 'jpeg', 'png', 'webp']
                file_extension = uploaded_file.name.split('.')[-1].lower()
                
                if file_extension not in allowed_extensions:
                    return Response({
                        "success": False,
                        "user_not_logged_in": False,
                        "user_unauthorized": False,
                        "data": None,
                        "error": f"Invalid file type: {uploaded_file.name}. Only JPG, PNG, and WebP are allowed."
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Upload to S3
                try:
                    file_url = upload_file_to_s3(uploaded_file, folder="products")
                    new_image_urls.append(file_url)
                except Exception as e:
                    return Response({
                        "success": False,
                        "user_not_logged_in": False,
                        "user_unauthorized": False,
                        "data": None,
                        "error": f"Failed to upload image: {str(e)}"
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                ind += 1
            else:
                break

        # Update product fields
        product_obj.title = title
        product_obj.description = description
        product_obj.category_id = category_id
        product_obj.sub_category_id = sub_category_id
        product_obj.features = features
        product_obj.special_note = special_note
        product_obj.is_veg = is_veg
        product_obj.ingredients = ingredients
        product_obj.allergen_information = allergen_information
        product_obj.storage_instructions = storage_instructions
        product_obj.sku = sku
        product_obj.hsn = hsn
        product_obj.tags = tags

        # If new images are uploaded, add them to existing photos
        if new_image_urls:
            existing_photos = product_obj.photos if product_obj.photos else []
            product_obj.photos = existing_photos + new_image_urls

        product_obj.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "message": "Product updated successfully",
                "new_images": new_image_urls
            },
            "error": None
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], url_path='delete-image')
    @handle_exceptions
    @check_authentication(required_role='admin')
    def delete_image(self, request, pk=None):
        """Delete a specific image from product"""
        product_id = pk
        image_url = request.data.get('image_url')
        
        if not image_url:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Image URL is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        product_obj = Product.objects.filter(product_id=product_id).first()
        if not product_obj:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Product not found."
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if image exists in product photos
        if not product_obj.photos or image_url not in product_obj.photos:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Image not found in product."
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if this is the last image
        if len(product_obj.photos) <= 1:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Cannot delete the last image. Product must have at least one image."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Delete from S3
            delete_file_from_s3(image_url)
            
            # Remove from product photos list
            updated_photos = [photo for photo in product_obj.photos if photo != image_url]
            product_obj.photos = updated_photos
            product_obj.save()

            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {
                    "message": "Image deleted successfully",
                    "remaining_images": updated_photos
                },
                "error": None
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": f"Failed to delete image: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AllProductsViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        category = request.query_params.get('category')
        subcategory = request.query_params.get('sub_category')

        if subcategory:
            subcategory_data = SubCategory.objects.filter(title__icontains=subcategory).first()
            sub_category_id = subcategory_data.sub_category_id
            if sub_category_id:                
                product_obj = Product.objects.filter(sub_category_id=sub_category_id, is_extras=False, is_active=True)
            else:
                product_obj = Product.objects.filter(is_extras=False, is_active=True)

        elif category:
            category_data = Category.objects.filter(title__icontains=category).first()
            category_id = category_data.category_id
            if category_id:                
                product_obj = Product.objects.filter(category_id=category_id, is_extras=False, is_active=True)
            else:
                product_obj = Product.objects.filter(is_extras=False, is_active=True)

        else:
            product_obj = Product.objects.filter(is_extras=False, is_active=True)

        product_data = AllProductSerializer(product_obj, many=True)

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": product_data.data,
            "error": None
        }, status=status.HTTP_200_OK)


class AllProductsAdminViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        # Get filter parameters
        search = request.query_params.get('search', '')
        category = request.query_params.get('category', '')
        status_param = request.query_params.get('status', '')
        sort_by = request.query_params.get('sortBy', 'created_desc')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 10))

        # Start with all products
        product_obj = Product.objects.filter(is_extras=False, is_active=True)

        # Apply search filter
        if search:
            product_obj = product_obj.filter(
                Q(title__icontains=search) |
                Q(product_id__icontains=search) |
                Q(description__icontains=search)
            )

        # Apply category filter
        if category:
            product_obj = product_obj.filter(category_id=category)

        # Apply subcategory filter
        sub_category = request.query_params.get('sub_category', '')
        if sub_category:
            product_obj = product_obj.filter(sub_category_id=sub_category)

        # Apply status filter
        if status_param:
            if status_param == 'active':
                product_obj = product_obj.filter(is_active=True)
            elif status_param == 'inactive':
                product_obj = product_obj.filter(is_active=False)

        # Apply sorting
        if sort_by == 'created_desc':
            product_obj = product_obj.order_by('-created_at')
        elif sort_by == 'created_asc':
            product_obj = product_obj.order_by('created_at')
        elif sort_by == 'name_asc':
            product_obj = product_obj.order_by('title')
        elif sort_by == 'name_desc':
            product_obj = product_obj.order_by('-title')

        # Get total count
        total_count = product_obj.count()

        # Apply pagination
        start = (page - 1) * limit
        end = start + limit
        paginated_products = product_obj[start:end]

        # Serialize products
        product_data = AllProductSerializer(paginated_products, many=True)

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "products": product_data.data,
                "total": total_count,
                "page": page,
                "limit": limit,
                "total_pages": (total_count + limit - 1) // limit
            },
            "error": None
        }, status=status.HTTP_200_OK)

    @handle_exceptions
    @check_authentication(required_role='admin')
    def destroy(self, request, pk=None):
        """
        Soft delete product by marking it as inactive
        """
        try:
            product = Product.objects.get(product_id=pk)
            product.is_active = False
            product.save()
            
            # Also deactivate all variations
            ProductVariation.objects.filter(product_id=pk).update(is_active=False)
            
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"message": "Product deleted successfully"},
                "error": None
            }, status=status.HTTP_200_OK)
            
        except Product.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Product not found"
            }, status=status.HTTP_404_NOT_FOUND)


class ProductVariationViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role='admin')
    def create(self, request):
        product_id = request.data.get("product_id")
        actual_price = request.data.get("actual_price")
        discounted_price = request.data.get("discounted_price")
        is_vartied = request.data.get("is_vartied", True)
        weight_variation = request.data.get("weight_variation")

        # Stock management fields
        stock_toggle_mode = request.data.get("stock_toggle_mode", True)
        stock_quantity = request.data.get("stock_quantity", None)
        if isinstance(stock_toggle_mode, str):
            stock_toggle_mode = stock_toggle_mode.lower() == "true"
        elif stock_toggle_mode is None and stock_quantity is not None:
            stock_toggle_mode = False
        else:
            stock_toggle_mode = bool(stock_toggle_mode)
        
        in_stock_bull = request.data.get("in_stock_bull", False)
        if isinstance(in_stock_bull, str):
            in_stock_bull = in_stock_bull.lower() == "true"

        # Handle empty stock quantity
        if not stock_toggle_mode:
            try:
                stock_quantity = int(stock_quantity)
                # Auto-set in_stock_bull based on quantity
                in_stock_bull = stock_quantity > 0
            except (ValueError, TypeError):
                return Response({
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": None,
                    "error": "Invalid stock quantity"
                }, status=status.HTTP_400_BAD_REQUEST)

        if not product_id or not actual_price or not discounted_price:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Missing required fields."
            }, status=status.HTTP_400_BAD_REQUEST)

        product_variation_id = self.generate_product_variation_id()

        new_variation = ProductVariation(
            product_id=product_id,
            product_variation_id=product_variation_id,
            actual_price=actual_price,
            discounted_price=discounted_price,
            is_vartied=is_vartied,
            weight_variation=weight_variation,
            stock_toggle_mode=stock_toggle_mode,
            stock_quantity=stock_quantity,
            in_stock_bull=in_stock_bull,
            created_at=timezone.now()
        )
        new_variation.save()

        # Only handle availability data if pincode logic is enabled
        if getattr(settings, 'ENABLE_PINCODE_LOGIC', False):
            availability_data = request.data.get("availability_data", [])
            for item in availability_data:
                AvailabilityCharges.objects.create(
                    product_id=product_id,
                    product_variation_id=product_variation_id,
                    pincode_id=item["pincode_id"],
                    timeslot_data=item["timeslot_data"],
                    delivery_charges=item.get("delivery_charges", 0),
                    is_available=item.get("is_available", True),
                    created_at=timezone.now()
                )

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "product_variation_id": product_variation_id,
                "in_stock_bull": new_variation.in_stock_bull
            },
            "error": None
        }, status=status.HTTP_201_CREATED)

    def generate_product_variation_id(self):
        while True:
            product_variation_id = random.choice('123456789') + ''.join(random.choices(string.digits, k=9))
            if not ProductVariation.objects.filter(is_active=True, product_variation_id=product_variation_id).exists():
                return product_variation_id

    @handle_exceptions
    @check_authentication(required_role='admin')
    def list(self, request):
        product_id = request.query_params.get('product_id')

        if not product_id:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Missing product_id."
            }, status=status.HTTP_400_BAD_REQUEST)

        variations = ProductVariation.objects.filter(product_id=product_id)
        if not variations.exists():
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": [],
                "error": "No variations found for this product."
            }, status=status.HTTP_200_OK)
        
        serialized_variations = ProductVariationSerializer(variations, many=True)
        if not serialized_variations.data:
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": [],
                "error": "No variations found for this product."
            }, status=status.HTTP_200_OK)

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serialized_variations.data,
            "error": None
        }, status=status.HTTP_200_OK)

    @handle_exceptions
    @check_authentication(required_role='admin')
    def update(self, request, pk=None):
        product_id = request.data.get("product_id")
        product_variation_id = pk
        actual_price = request.data.get("actual_price")
        discounted_price = request.data.get("discounted_price")
        is_vartied = request.data.get("is_vartied", True)
        weight_variation = request.data.get("weight_variation")

        # Stock management fields
        stock_toggle_mode = request.data.get("stock_toggle_mode", True)
        print(stock_toggle_mode)
        if isinstance(stock_toggle_mode, str):
            stock_toggle_mode = stock_toggle_mode.lower() == "true"
        
        stock_quantity = request.data.get("stock_quantity", None)
        
        in_stock_bull = request.data.get("in_stock_bull", True)
        if isinstance(in_stock_bull, str):
            in_stock_bull = in_stock_bull.lower() == "true"

        if not product_variation_id or not product_id or not actual_price or not discounted_price:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Missing required fields."
            }, status=status.HTTP_400_BAD_REQUEST)

        product_variation_obj = ProductVariation.objects.filter(product_variation_id=product_variation_id).first()
        if not product_variation_obj:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Product Variation not found."
            }, status=status.HTTP_404_NOT_FOUND)

        # Update stock fields if provided
        if not stock_toggle_mode:
            product_variation_obj.stock_toggle_mode = False
            if stock_quantity == "":                
                product_variation_obj.stock_quantity = None
                product_variation_obj.in_stock_bull = False
            else:
                try:
                    product_variation_obj.stock_quantity = int(stock_quantity)
                    # Auto-update in_stock_bull based on quantity
                    product_variation_obj.in_stock_bull = product_variation_obj.stock_quantity > 0
                except (ValueError, TypeError):
                    return Response({
                        "success": False,
                        "error": "Invalid stock quantity"
                    }, status=status.HTTP_400_BAD_REQUEST)
        else:
            product_variation_obj.stock_toggle_mode = True
        if in_stock_bull is not None:
            if isinstance(in_stock_bull, str):
                in_stock_bull = in_stock_bull.lower() == "true"
            product_variation_obj.in_stock_bull = in_stock_bull

        product_variation_obj.actual_price = actual_price
        product_variation_obj.discounted_price = discounted_price
        product_variation_obj.is_vartied = is_vartied
        product_variation_obj.weight_variation = weight_variation

        product_variation_obj.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "message": "Product variation updated successfully",
                "in_stock_bull": product_variation_obj.in_stock_bull
            },
            "error": None
        }, status=status.HTTP_200_OK)


class AvailabilityChargesViewSet(viewsets.ViewSet):
    @handle_exceptions
    @check_authentication(required_role='admin')
    def create(self, request):
        # Skip if pincode logic is disabled
        if not getattr(settings, 'ENABLE_PINCODE_LOGIC', False):
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": "Pincode logic is currently disabled",
                "error": None
            }, status=status.HTTP_200_OK)

        availability_data = request.data.get("availability_data")
        product_id = request.data.get('product_id')
        product_variation_id = request.data.get('product_variation_id')

        if not availability_data or not product_id or not product_variation_id:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Missing required fields."
            }, status=status.HTTP_400_BAD_REQUEST)

        for item in availability_data:
            AvailabilityCharges.objects.create(
                product_id=product_id,
                product_variation_id=product_variation_id,
                pincode_id=item["pincode_id"],
                timeslot_data=item["timeslot_data"],
                delivery_charges=item.get("delivery_charges", 0),
                is_available=item.get("is_available", True),
                created_at=timezone.now()
            )

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": f"All {len(availability_data)} rows added",
            "error": None
        }, status=status.HTTP_201_CREATED)

    @check_authentication(required_role='admin')
    def update(self, request, pk=None):
        # Skip if pincode logic is disabled
        if not getattr(settings, 'ENABLE_PINCODE_LOGIC', False):
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": "Pincode logic is currently disabled",
                "error": None
            }, status=status.HTTP_200_OK)

        availability_data = request.data.get("availability_data")
        product_id = request.data.get('product_id')
        product_variation_id = request.data.get('product_variation_id')

        if not availability_data or not product_id or not product_variation_id:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Missing required fields."
            }, status=status.HTTP_400_BAD_REQUEST)

        for item in availability_data:
            availability_obj = AvailabilityCharges.objects.filter(id=item['id']).first()
            if availability_obj:
                availability_obj.product_id = product_id
                availability_obj.product_variation_id = product_variation_id
                availability_obj.pincode_id = item["pincode_id"]
                availability_obj.timeslot_data = item["timeslot_data"]
                availability_obj.delivery_charges = item.get("delivery_charges", 0)
                availability_obj.is_available = item.get("is_available", True)
                availability_obj.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": f"All {len(availability_data)} rows updated",
            "error": None
        }, status=status.HTTP_201_CREATED)


class TimeSlotAndPincodeViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role='admin')
    def list(self, request):
        try:
            timeslots = TimeSlot.objects.filter(is_active=True)
            pincodes = Pincode.objects.all()

            timeslot_serializer = TimeSlotSerializer(timeslots, many=True)
            pincode_serializer = PincodeSerializer(pincodes, many=True)

            pincode_enabled = getattr(settings, 'ENABLE_PINCODE_LOGIC', False)
            
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {
                    "timeslots": timeslot_serializer.data,
                    "pincodes": pincode_serializer.data,
                    "pincode_logic_enabled": pincode_enabled
                    
                },
                "error": None
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PincodeViewSet(viewsets.ViewSet):
    # @check_authentication
    @handle_exceptions
    def list(self, request):
        # Get filter parameters
        search = request.query_params.get('search', '')
        status_param = request.query_params.get('status', '')
        state = request.query_params.get('state', '')
        area_name = request.query_params.get('area_name', '')
        sort_by = request.query_params.get('sortBy', 'created_desc')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 10))

        # Start with all pincodes
        pincodes = Pincode.objects.all()

        # Apply search filter
        if search:
            pincodes = pincodes.filter(
                Q(pincode__icontains=search) |
                Q(area_name__icontains=search) |
                Q(city__icontains=search) |
                Q(state__icontains=search)
            )

        # Apply status filter
        if status_param:
            if status_param.lower() == 'true':
                pincodes = pincodes.filter(is_active=True)
            elif status_param.lower() == 'false':
                pincodes = pincodes.filter(is_active=False)

        # Apply state filter
        if state:
            pincodes = pincodes.filter(state__icontains=state)

        if area_name:
            pincodes = pincodes.filter(area_name__icontains=area_name)

        # Apply sorting
        if sort_by == 'created_desc':
            pincodes = pincodes.order_by('-created_at')
        elif sort_by == 'created_asc':
            pincodes = pincodes.order_by('created_at')
        elif sort_by == 'pincode_asc':
            pincodes = pincodes.order_by('pincode')
        elif sort_by == 'pincode_desc':
            pincodes = pincodes.order_by('-pincode')
        elif sort_by == 'area_asc':
            pincodes = pincodes.order_by('area_name')
        elif sort_by == 'area_desc':
            pincodes = pincodes.order_by('-area_name')

        # Get total count before pagination
        total_count = pincodes.count()
        total_active_pincodes = pincodes.filter(is_active=True).count()

        # Apply pagination
        start = (page - 1) * limit
        end = start + limit
        paginated_pincodes = pincodes[start:end]

        # Serialize pincodes
        serializer = PincodeSerializer(paginated_pincodes, many=True)

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "pincodes": serializer.data,
                "total": total_count,
                "total_active_pincodes": total_active_pincodes,
                "page": page,
                "limit": limit,
                "total_pages": (total_count + limit - 1) // limit
            },
            "error": None
        }, status=status.HTTP_200_OK)

    @handle_exceptions
    # @check_authentication(required_role='admin')
    def create(self, request):
        is_multiple = request.data.get("is_multiple", False)
        timeslot_charge_dict = request.data.get('timeslot_charge_dict')

        if is_multiple == True:
            pincodes = request.data.get("pincodes")
            if not pincodes or len(pincodes) == 0:
                return Response({
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": None,
                    "error": "Pincodes are required."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            for ind,pincode in enumerate(pincodes):
                try:
                    pincode_code = pincode['pincode']
                    area = pincode['area']
                    city = pincode['city']
                    state = pincode['state']
                    if Pincode.objects.filter(pincode=pincode_code).exists():
                        continue
                    else:
                        Pincode.objects.create(
                            pincode=pincode_code,
                            area=area,
                            city=city,
                            state=state,
                            delivery_charge=timeslot_charge_dict
                        )

                except Exception as e:
                    return Response({
                        "success": False,
                        "user_not_logged_in": False,
                        "user_unauthorized": False,
                        "data": None,
                        "error": f"Invalid pincode data, at index {ind+1} - error: {e}."
                    }, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": "Created successfully.",
                "error": None
            }, status=status.HTTP_201_CREATED)

        else:
            pincode_code = request.data.get("pincode")
            area = request.data.get("area_name")
            city = request.data.get("city")
            state = request.data.get("state")

            if not pincode_code or not area:
                return Response({
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": None,
                    "error": "Pincode and area are required."
                }, status=status.HTTP_400_BAD_REQUEST)

            if Pincode.objects.filter(pincode=pincode_code).exists():
                return Response({
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": None,
                    "error": "Pincode already exists."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            Pincode.objects.create(
                    pincode=pincode_code,
                    area_name=area,
                    city=city,
                    state=state,
                    delivery_charge=timeslot_charge_dict
                )

            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": f"Pincode : {pincode_code} Created successfully.",
                "error": None
            }, status=status.HTTP_201_CREATED)

    
    @handle_exceptions
    @check_authentication(required_role='admin')
    def update(self, request, pk):
        pincode_id = pk

        pincode_data = Pincode.objects.filter(id=pincode_id).first()
        
        if not pincode_data:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": f"Pincode with id {pincode_id} doesnot exists."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        pincode_data.pincode = request.data.get('pincode')
        pincode_data.area_name = request.data.get('area_name')
        pincode_data.city = request.data.get('city')
        pincode_data.state = request.data.get('state')
        pincode_data.delivery_charge = request.data.get('delivery_charge')
        is_active = request.data.get('is_active', 'active')
        if is_active=='active':
            is_active = True
        else:
            is_active = False
        pincode_data.is_active = is_active

        pincode_data.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": None,
            "error": None
        }, status=status.HTTP_200_OK)


    @handle_exceptions
    @check_authentication(required_role='admin')
    def delete(self, request, pk):
        pincode_id = pk

        pincode_data = Pincode.objects.filter(id=pincode_id).first()
        if not pincode_data:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": f"Pincode with id {pincode_id} doesnot exists."
            }, status=status.HTTP_400_BAD_REQUEST)

        pincode_data.delete()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": None,
            "error": None
        }, status=status.HTTP_200_OK)


class TimeSlotViewSet(viewsets.ViewSet):
    # @check_authentication
    @handle_exceptions
    def list(self, request):
        timeslots = TimeSlot.objects.all()
        serializer = TimeSlotSerializer(timeslots, many=True)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        }, status=status.HTTP_200_OK)

    @handle_exceptions
    @check_authentication(required_role='admin')
    def create(self, request):
        start_time = request.data.get("start_time")
        end_time = request.data.get("end_time")
        time_slot_title = request.data.get("time_slot_title")
        delivery_charges = request.data.get("delivery_charges", 0)

        if not start_time or not end_time or not time_slot_title:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "start_time, end_time & time_slot_title are required."
            }, status=status.HTTP_400_BAD_REQUEST)

        if TimeSlot.objects.filter(start_time=start_time, end_time=end_time).exists():
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Time Slot already exists."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        TimeSlot.objects.create(
                start_time=start_time,
                end_time=end_time,
                time_slot_title=time_slot_title,
                delivery_charges=delivery_charges,
            )

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": f"Timeslot : {start_time} - {end_time} Created successfully.",
            "error": None
        }, status=status.HTTP_201_CREATED)

    @handle_exceptions
    @check_authentication(required_role='admin')
    def update(self, request, pk):
        timeslot_id = pk
        start_time = request.data.get("start_time")
        end_time = request.data.get("end_time")
        time_slot_title = request.data.get("time_slot_title")
        delivery_charges = request.data.get("delivery_charges", 0)

        if not start_time or not end_time or not time_slot_title:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "start_time, end_time & time_slot_title are required."
            }, status=status.HTTP_400_BAD_REQUEST)

        timeslot_data = TimeSlot.objects.get(id=timeslot_id)
            
        timeslot_data.start_time=start_time
        timeslot_data.end_time=end_time
        timeslot_data.time_slot_title=time_slot_title
        timeslot_data.delivery_charges=delivery_charges

        timeslot_data.save()
    

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": f"Timeslot : {start_time} - {end_time} Created successfully.",
            "error": None
        }, status=status.HTTP_201_CREATED)


    @handle_exceptions
    @check_authentication(required_role='admin')
    def partial_update(self, request, pk):
        timeslot_id = pk                
        status_param = request.data.get("status")

        if not status_param:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "start_time, end_time & time_slot_title are required."
            }, status=status.HTTP_400_BAD_REQUEST)

        timeslot_data = TimeSlot.objects.get(id=timeslot_id)
            
        if status_param == 'inactive':
            timeslot_data.is_active = False
        else:
            timeslot_data.is_active = True

        timeslot_data.save()
    

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": f"Timeslot Updated successfully.",
            "error": None
        }, status=status.HTTP_201_CREATED)


class CheckPincodeViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    def list(self, request):
        pincode = request.query_params.get('pincode')

        pincode_data = Pincode.objects.filter(pincode=pincode, is_active=True).first()
        if not pincode_data:
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"is_deliverable": False},
                "error": f"Pincode with {pincode} does not exist."
            }, status=status.HTTP_200_OK)

        availability_data = []
        today_availability_data = []
        timeslots_data = pincode_data.delivery_charge

        now = timezone.localtime().time()
        # now = datetime.strptime("11:55", "%H:%M").time()

        for timeslot in timeslots_data.keys():
            timeslot_detail = TimeSlot.objects.filter(id=timeslot, is_active=True).first()
            if not timeslot_detail:
                continue

            if isinstance(timeslot_detail.start_time, str):
                try:
                    start_time_obj = datetime.strptime(timeslot_detail.start_time, "%H:%M").time()
                except ValueError:
                    continue
            else:
                start_time_obj = timeslot_detail.start_time

            # Only include timeslots that start after current time
            temp_timeslot_dict = {
                "timeslot_id": timeslot,
                "timeslot_name": timeslot_detail.time_slot_title,     
                "start_time": timeslot_detail.start_time,
                "end_time": timeslot_detail.end_time,
                "delivery_charge": timeslots_data[timeslot]['charges'],
                "available": timeslots_data[timeslot]['available'],
            }
            availability_data.append(temp_timeslot_dict)
            
            if start_time_obj > now:                
                today_availability_data.append(temp_timeslot_dict)

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"is_deliverable": bool(availability_data), "availability_data": availability_data, "today_availability_data": today_availability_data},
            "error": None
        }, status=status.HTTP_200_OK)


class NewCheckPincodeViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    def list(self, request):
        pincode = request.query_params.get('pincode')

        pincode_data = Pincode.objects.filter(pincode=pincode, is_active=True).first()
        if not pincode_data:
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"is_deliverable": False},
                "error": f"Pincode with {pincode} does not exist."
            }, status=status.HTTP_200_OK)

        availability_data = []
        today_availability_data = []
        timeslots_data = pincode_data.delivery_charge

        # Use timezone-aware current time
        now = timezone.localtime().time()
        
        for timeslot in timeslots_data.keys():
            timeslot_detail = TimeSlot.objects.filter(id=timeslot, is_active=True).first()
            if not timeslot_detail:
                continue

            if isinstance(timeslot_detail.start_time, str):
                try:
                    start_time_obj = datetime.strptime(timeslot_detail.start_time, "%H:%M").time()
                except ValueError:
                    continue
            else:
                start_time_obj = timeslot_detail.start_time

        # Only include timeslots that start after current time
        temp_timeslot_dict = {
            "timeslot_id": timeslot,
            "timeslot_name": timeslot_detail.time_slot_title,     
            "start_time": timeslot_detail.start_time,
            "end_time": timeslot_detail.end_time,
            "delivery_charge": timeslots_data[timeslot]['charges'],
            "available": timeslots_data[timeslot]['available'],
        }
        availability_data.append(temp_timeslot_dict)
        
        # For today's availability, add buffer time (e.g., 2 hours)
        current_time_with_buffer = (timezone.localtime() + timezone.timedelta(hours=2)).time()
        if start_time_obj > current_time_with_buffer:                
            today_availability_data.append(temp_timeslot_dict)

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"is_deliverable": bool(availability_data), "availability_data": availability_data, "today_availability_data": today_availability_data},
            "error": None
        }, status=status.HTTP_200_OK)


class CouponViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    @check_authentication(required_role='admin')
    def list(self, request):
        """Get all coupons for admin"""
        coupons = Coupon.objects.all().order_by('-created_at')
        serializer = CouponSerializer(coupons, many=True)
        
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        }, status=status.HTTP_200_OK)
    
    @handle_exceptions
    @check_authentication(required_role='admin')
    def create(self, request):
        """Create new coupon"""
        serializer = CouponSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": serializer.data,
                "error": None
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            "success": False,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": None,
            "error": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @handle_exceptions
    @check_authentication(required_role='admin')
    def update(self, request, pk):
        """Update coupon"""
        try:
            coupon = Coupon.objects.get(id=pk)
        except Coupon.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Coupon not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = CouponSerializer(coupon, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": serializer.data,
                "error": None
            }, status=status.HTTP_200_OK)
        
        return Response({
            "success": False,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": None,
            "error": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @handle_exceptions
    @check_authentication(required_role='admin')
    def destroy(self, request, pk):
        """Delete coupon"""
        try:
            coupon = Coupon.objects.get(id=pk)
            coupon.delete()
            
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"message": "Coupon deleted successfully"},
                "error": None
            }, status=status.HTTP_200_OK)
        except Coupon.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Coupon not found"
            }, status=status.HTTP_404_NOT_FOUND)


class ApplyCouponViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    def create(self, request):
        """Apply coupon to order"""
        serializer = CouponApplicationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        coupon_code = serializer.validated_data['coupon_code']
        order_amount = serializer.validated_data['order_amount']
        
        try:
            coupon = Coupon.objects.get(coupon_code__iexact=coupon_code)
        except Coupon.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Invalid coupon code"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not coupon.is_valid():
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Coupon is not valid or has expired"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        discount_amount = coupon.calculate_discount(order_amount)
        
        if discount_amount == 0:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": f"Order amount must be at least ₹{coupon.minimum_order_amount}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "coupon_code": coupon.coupon_code,
                "discount_amount": float(discount_amount),
                "discount_type": coupon.discount_type,
                "discount_value": float(coupon.discount_value),
                "final_amount": float(order_amount - discount_amount)
            },
            "error": None
        }, status=status.HTTP_200_OK)


class ReviewsViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    def list(self, request):
        """Get approved reviews for a product"""
        product_id = request.query_params.get('product_id')
        summary_only = request.query_params.get('summary') == 'true'
        
        if not product_id:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "product_id is required."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get only approved and active reviews
        reviews = Reviews.objects.filter(
            product_id=product_id, 
            is_approved_admin=True, 
            is_active=True
        ).order_by('-created_at')
        
        serializer = ReviewSerializer(reviews, many=True)
        
        # Calculate average rating
        avg_rating = reviews.aggregate(avg_rating=models.Avg('ratings'))['avg_rating']
        avg_rating = round(avg_rating, 1) if avg_rating else 0
        total_reviews = reviews.count()

        if summary_only:
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {
                    "total_reviews": total_reviews,
                    "average_rating": avg_rating
                },
                "error": None
            }, status=status.HTTP_200_OK)
        
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "reviews": serializer.data,
                "total_reviews": total_reviews,
                "average_rating": avg_rating
            },
            "error": None
        }, status=status.HTTP_200_OK)
    
    @handle_exceptions
    def create(self, request):
        """Create a new review (no authentication required)"""
        product_id = request.data.get("product_id")
        ratings = request.data.get("ratings")
        review_text = request.data.get("review_text")
        
        if not product_id or not ratings or not review_text:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "product_id, ratings, and review_text are required."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate ratings range
        try:
            ratings = float(ratings)
            if ratings < 1 or ratings > 5:
                return Response({
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": None,
                    "error": "Ratings must be between 1 and 5."
                }, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Invalid ratings value."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if product exists
        if not Product.objects.filter(product_id=product_id, is_active=True).exists():
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Product not found."
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Create review (will be pending admin approval)
        new_review = Reviews(
            product_id=product_id,
            ratings=ratings,
            review_text=review_text.strip(),
            is_approved_admin=False,  # Requires admin approval
            is_active=True,
            created_at=timezone.now()
        )
        new_review.save()
        
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "message": "Review submitted successfully! It will be visible after admin approval.",
                "review_id": new_review.id
            },
            "error": None
        }, status=status.HTTP_201_CREATED)


class AdminReviewsViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    @check_authentication(required_role='admin')
    def list(self, request):
        """Get all reviews for admin management"""
        # Get filter parameters
        status_filter = request.query_params.get('status', 'all')  # all, pending, approved, rejected
        product_id = request.query_params.get('product_id', '')
        search = request.query_params.get('search', '')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 10))
        
        # Start with all reviews
        reviews = Reviews.objects.all()
        
        # Apply status filter
        if status_filter == 'pending':
            reviews = reviews.filter(is_approved_admin=False, is_active=True)
        elif status_filter == 'approved':
            reviews = reviews.filter(is_approved_admin=True, is_active=True)
        elif status_filter == 'rejected':
            reviews = reviews.filter(is_active=False)
        
        # Apply product filter
        if product_id:
            reviews = reviews.filter(product_id=product_id)
        
        # Apply search filter
        if search:
            reviews = reviews.filter(
                Q(review_text__icontains=search) |
                Q(product_id__icontains=search)
            )
        
        # Order by creation date (newest first)
        reviews = reviews.order_by('-created_at')
        
        # Get total count
        total_count = reviews.count()
        
        # Apply pagination
        start = (page - 1) * limit
        end = start + limit
        paginated_reviews = reviews[start:end]
        
        # Serialize reviews with product information
        serialized_reviews = []
        for review in paginated_reviews:
            review_data = ReviewSerializer(review).data
            
            # Add product information
            product = Product.objects.filter(product_id=review.product_id).first()
            if product:
                review_data['product_title'] = product.title
                review_data['product_photos'] = product.photos
            else:
                review_data['product_title'] = 'Product Not Found'
                review_data['product_photos'] = []
            
            serialized_reviews.append(review_data)
        
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "reviews": serialized_reviews,
                "total": total_count,
                "page": page,
                "limit": limit,
                "total_pages": (total_count + limit - 1) // limit,
                "pending_count": Reviews.objects.filter(is_approved_admin=False, is_active=True).count()
            },
            "error": None
        }, status=status.HTTP_200_OK)
    
    @handle_exceptions
    @check_authentication(required_role='admin')
    def update(self, request, pk):
        """Approve or reject a review"""
        action = request.data.get("action")  # 'approve' or 'reject'
        
        if action not in ['approve', 'reject']:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Action must be 'approve' or 'reject'."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            review = Reviews.objects.get(id=pk)
        except Reviews.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Review not found."
            }, status=status.HTTP_404_NOT_FOUND)
        
        if action == 'approve':
            review.is_approved_admin = True
            review.is_active = True
            message = "Review approved successfully."
        else:  # reject
            review.is_approved_admin = False
            review.is_active = False
            message = "Review rejected successfully."
        
        review.save()
        
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "message": message,
                "review_id": review.id,
                "status": action
            },
            "error": None
        }, status=status.HTTP_200_OK)
    
    @handle_exceptions
    @check_authentication(required_role='admin')
    def destroy(self, request, pk):
        """Delete a review permanently"""
        try:
            review = Reviews.objects.get(id=pk)
            review.delete()
            
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"message": "Review deleted successfully."},
                "error": None
            }, status=status.HTTP_200_OK)
        except Reviews.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Review not found."
            }, status=status.HTTP_404_NOT_FOUND)
