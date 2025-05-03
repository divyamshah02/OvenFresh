from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import (
    Products, ProductVariation, AvailabilityCharges, TimeSlot, Pincode
)
from .serializers import (
    ProductSerializer, ProductVariationSerializer,
    TimeSlotSerializer, PincodeSerializer
)
from utils.decorators import handle_exceptions, check_authentication
import random
from django.utils import timezone


class ProductViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role='admin')
    def create(self, request):
        try:
            data = request.data

            title = data.get("title")
            description = data.get("description")
            photos = data.get("photos")  # Assuming single image for now
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

            product_id = random.randint(1000000000, 9999999999)

            new_product = Products(
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


class ProductVariationViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role='admin')
    def create(self, request):
        try:
            data = request.data

            product_id = data.get("product_id")
            actual_price = data.get("actual_price")
            discounted_price = data.get("discounted_price")
            is_vartied = data.get("is_vartied", True)
            weight_variation = data.get("weight_variation")
            availability_data = data.get("availability_data", [])

            if not product_id or not actual_price or not discounted_price:
                return Response({
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": None,
                    "error": "Missing required fields."
                }, status=status.HTTP_400_BAD_REQUEST)

            product_variation_id = random.randint(1000000000, 9999999999)

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

        except Exception as e:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
