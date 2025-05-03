from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from .models import Pincode, TimeSlot, Product, ProductVariation, AvailabilityCharges
from .other_serializers import PincodeSerializer, TimeSlotSerializer, ProductSerializer, ProductVariationSerializer, AvailabilityChargesSerializer
from utils.decorators import handle_exceptions, check_authentication


# Viewset for Pincode
class PincodeViewSet(viewsets.ViewSet):
    @handle_exceptions
    @check_authentication
    def list(self, request):
        pincodes = Pincode.objects.all()
        serializer = PincodeSerializer(pincodes, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None
        }, status=status.HTTP_200_OK)

    @handle_exceptions
    @check_authentication
    def create(self, request):
        serializer = PincodeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data,
                "error": None
            }, status=status.HTTP_201_CREATED)
        return Response({
            "success": False,
            "data": None,
            "error": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

# Viewset for TimeSlot
class TimeSlotViewSet(viewsets.ViewSet):
    @handle_exceptions
    @check_authentication
    def list(self, request):
        timeslots = TimeSlot.objects.all()
        serializer = TimeSlotSerializer(timeslots, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None
        }, status=status.HTTP_200_OK)

    @handle_exceptions
    @check_authentication
    def create(self, request):
        serializer = TimeSlotSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data,
                "error": None
            }, status=status.HTTP_201_CREATED)
        return Response({
            "success": False,
            "data": None,
            "error": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

# Viewset for Product
class ProductViewSet(viewsets.ViewSet):
    @handle_exceptions
    @check_authentication
    def create(self, request):
        product_data = request.data
        # Generate a unique product ID (you can customize this logic)
        product_data['product_id'] = self.generate_unique_product_id()

        product = Product(
            product_id=product_data['product_id'],
            title=product_data['title'],
            description=product_data['description'],
            photos=product_data['photos'],
            category_id=product_data['category_id'],
            sub_category_id=product_data['sub_category_id']
        )
        product.save()

        return Response({
            "success": True,
            "data": {"product_id": product.product_id},
            "error": None
        }, status=status.HTTP_201_CREATED)

    def generate_unique_product_id(self):
        # Generate and return a unique product ID (could be custom logic)
        return 1234567890  # Example ID generation logic, replace with your own logic

# Viewset for ProductVariation
class ProductVariationViewSet(viewsets.ViewSet):
    @handle_exceptions
    @check_authentication
    def create(self, request):
        data = request.data
        product_variation = ProductVariation(
            product_id=data['product_id'],
            product_variation_id=data['product_variation_id'],
            actual_price=data['actual_price'],
            discounted_price=data['discounted_price'],
            is_vartied=data['is_vartied'],
            weight_variation=data['weight_variation']
        )
        product_variation.save()

        return Response({
            "success": True,
            "data": {"product_variation_id": product_variation.product_variation_id},
            "error": None
        }, status=status.HTTP_201_CREATED)

# Viewset for Availability and Delivery Charges
class AvailabilityChargesViewSet(viewsets.ViewSet):
    @handle_exceptions
    @check_authentication
    def create(self, request):
        data = request.data
        availability_charge = AvailabilityCharges(
            product_id=data['product_id'],
            product_variation_id=data['product_variation_id'],
            pincode_id=data['pincode_id'],
            timeslot_data=data['timeslot_data'],
            delivery_charges=data['delivery_charges'],
            is_available=data['is_available']
        )
        availability_charge.save()

        return Response({
            "success": True,
            "data": {"id": availability_charge.id},
            "error": None
        }, status=status.HTTP_201_CREATED)
