from rest_framework import serializers
from .models import (
    Category,
    SubCategory,
    Product,
    ProductVariation,
    Reviews,
    Pincode,
    TimeSlot,
    AvailabilityCharges
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'category_id', 'title']

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        if 'category_id' in representation:
            sub_category_obj = SubCategory.objects.filter(category_id=representation['category_id'])
            sub_category_data = SubCategoryOnlyNameSerializer(sub_category_obj, many=True).data
            
            representation['subcategories'] = sub_category_data

        return representation


class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ['id', 'category_id', 'sub_category_id', 'title']

class SubCategoryOnlyNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ['sub_category_id', 'title']


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        if 'category_id' in representation:        
            category_data = Category.objects.filter(category_id=representation['category_id']).first()
            
            representation['category_name'] = category_data.title if category_data else None

        if 'sub_category_id' in representation:        
            sub_category_data = SubCategory.objects.filter(sub_category_id=representation['sub_category_id']).first()
            
            representation['sub_category_name'] = sub_category_data.title if sub_category_data else None

        return representation


class ProductVariationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariation
        fields = [
            'id', 'product_id', 'product_variation_id', 'actual_price',
            'discounted_price', 'is_vartied', 'weight_variation', 'created_at'
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        if 'product_variation_id' in representation:            
            availability_obj = AvailabilityCharges.objects.filter(product_variation_id=representation['product_variation_id'])
            availability_data = AvailabilityChargesSerializer(availability_obj, many=True).data
            representation['availability_data'] = availability_data

        return representation



class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reviews
        fields = [
            'id', 'product_id', 'ratings', 'review_text',
            'is_approved_admin', 'created_at'
        ]


class PincodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pincode
        fields = ['id', 'pincode', 'area_name', 'created_at']


class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = [
            'id', 'start_time', 'end_time', 'time_slot_title',
            'is_active', 'created_at'
        ]


class AvailabilityChargesSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilityCharges
        fields = [
            'id', 'product_id', 'product_variation_id',
            'pincode_id', 'timeslot_data',
            'delivery_charges', 'is_available', 'created_at'
        ]
