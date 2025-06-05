from rest_framework import viewsets, status
from rest_framework.response import Response

from django.utils import timezone

from .models import *
from .serializers import *

from utils.decorators import *

import random
import string


class CategoryViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    def list(self, request):
        categories = Category.objects.all()
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


    def generate_category_id(self):
        while True:
            category_id = ''.join(random.choices(string.digits, k=10))
            if not Category.objects.filter(is_active=True, category_id=category_id).exists():
                return category_id


class SubCategoryViewSet(viewsets.ViewSet):
    @handle_exceptions
    def list(self, request):
        sub_categories = SubCategory.objects.all()
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

    def generate_sub_category_id(self):
        while True:
            sub_category_id = ''.join(random.choices(string.digits, k=10))
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
            photos = data.get("photos", [])
            category_id = data.get("category_id")
            sub_category_id = data.get("sub_category_id")

            if not title or not photos or not category_id:
                return Response({
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": None,
                    "error": "Missing required fields."
                }, status=status.HTTP_400_BAD_REQUEST)

            product_id = self.generate_product_id()

            new_product = Product(
                product_id=product_id,
                title=title,
                description=description,
                photos=photos,
                category_id=category_id,
                sub_category_id=sub_category_id,
                created_at=timezone.now()
            )
            new_product.save()

            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {
                    "product_id": product_id
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
            product_id = ''.join(random.choices(string.digits, k=10))
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
        photos = data.get("photos", [])
        category_id = data.get("category_id")
        sub_category_id = data.get("sub_category_id")

        if not product_id or not title or not photos or not category_id:
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

        product_obj.title = title
        product_obj.description = description
        product_obj.photos = photos
        product_obj.category_id = category_id
        product_obj.sub_category_id = sub_category_id

        product_obj.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": "Product updated",
            "error": None
        }, status=status.HTTP_200_OK)


class AllProductsViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        category_id = request.query_params.get('category_id')
        if category_id:
            product_obj = Product.objects.filter(category_id=category_id)

        else:
            product_obj = Product.objects.all()

        product_data = AllProductSerializer(product_obj, many=True)

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": product_data.data,
            "error": None
        }, status=status.HTTP_200_OK)


class ProductVariationViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role='admin')
    def create(self, request):
        product_id = request.data.get("product_id")
        actual_price = request.data.get("actual_price")
        discounted_price = request.data.get("discounted_price")
        is_vartied = request.data.get("is_vartied", True)
        weight_variation = request.data.get("weight_variation")
        availability_data = request.data.get("availability_data", [])

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
            created_at=timezone.now()
        )
        new_variation.save()

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
                "product_variation_id": product_variation_id
            },
            "error": None
        }, status=status.HTTP_201_CREATED)

    def generate_product_variation_id(self):
        while True:
            product_variation_id = ''.join(random.choices(string.digits, k=10))
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
        availability_data = request.data.get("availability_data", [])

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

        product_variation_obj.actual_price = actual_price
        product_variation_obj.discounted_price = discounted_price
        product_variation_obj.is_vartied = is_vartied
        product_variation_obj.weight_variation = weight_variation
        product_variation_obj.availability_data = availability_data

        product_variation_obj.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": "Product updated",
            "error": None
        }, status=status.HTTP_200_OK)


class AvailabilityChargesViewSet(viewsets.ViewSet):
    @handle_exceptions
    @check_authentication(required_role='admin')
    def create(self, request):
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

    # @handle_exceptions
    @check_authentication(required_role='admin')
    def update(self, request, pk=None):
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
            "data": f"All {len(availability_data)} rows added",
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

            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {
                    "timeslots": timeslot_serializer.data,
                    "pincodes": pincode_serializer.data
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
        pincodes = Pincode.objects.all()
        serializer = PincodeSerializer(pincodes, many=True)
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": serializer.data,
            "error": None
        }, status=status.HTTP_200_OK)

    @handle_exceptions
    # @check_authentication(required_role='admin')
    def create(self, request):
        is_multiple = request.data.get("is_multiple", False)
        
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
                    if Pincode.objects.filter(pincode=pincode_code).exists():
                        continue
                    else:
                        Pincode.objects.create(
                            pincode=pincode_code,
                            area=area
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
            area = request.data.get("area")
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
                    state=state
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
        pincode_data.active = request.data.get('status')

        pincode_data.save()

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
        product_id = request.query_params.get('product_id')
        product_variation_id = request.query_params.get('product_variation_id')

        pincode_data = Pincode.objects.filter(pincode=pincode).first()
        if not pincode_data:
            # TODO: To be handeled if the pincode is not in our database 
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": f"Pincode with {pincode} doesnot exists."
            }, status=status.HTTP_400_BAD_REQUEST)

        availability_details = AvailabilityCharges.objects.filter(pincode_id=pincode_data.id, product_id=product_id, product_variation_id=product_variation_id).first()
        availability_data = []
        if availability_details:
            timeslots_data = availability_details.timeslot_data
            for timeslot in timeslots_data.keys():
                timeslot_detail = TimeSlot.objects.filter(id=timeslot, is_active=True).first()
                temp_timeslot_dict = {
                    "timeslot_id": timeslot,
                    "timeslot_name": timeslot_detail.time_slot_title,                    
                    "delivery_charge": timeslots_data[timeslot]['charge'],
                    "available": timeslots_data[timeslot]['available'],
                }
                availability_data.append(temp_timeslot_dict)
        
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"is_deliverable": True, "availability_data": availability_data},
                "error": None
            }, status=status.HTTP_200_OK)

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"is_deliverable": False, "availability_data": availability_data},
            "error": None
        }, status=status.HTTP_200_OK)
