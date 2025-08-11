from rest_framework import serializers
from .models import (
    Category,
    SubCategory,
    Product,
    ProductVariation,
    Reviews,
    Pincode,
    TimeSlot,
    AvailabilityCharges,
    Coupon
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

            related_products = Product.objects.filter(sub_category_id=representation['sub_category_id'])
            related_products_data = AllProductSerializer(related_products, many=True).data
            representation['related_products'] = related_products_data

        if 'product_id' in representation:
            product_variation_obj = ProductVariation.objects.filter(product_id=representation['product_id'])
            product_variation = ProductVariationDetailSerializer(product_variation_obj, many=True).data
            representation['product_variation'] = product_variation

            reviews_obj = Reviews.objects.filter(product_id=representation['product_id'], is_approved_admin=True)
            review_data = ReviewSerializer(reviews_obj, many=True).data
            representation['reviews'] = review_data

        return representation

class AllProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Add category information
        if 'category_id' in representation:        
            category_data = Category.objects.filter(category_id=representation['category_id']).first()
            representation['category_name'] = category_data.title if category_data else "Unknown"

        # Add subcategory information
        if 'sub_category_id' in representation and representation['sub_category_id']:        
            sub_category_data = SubCategory.objects.filter(sub_category_id=representation['sub_category_id']).first()
            representation['sub_category_name'] = sub_category_data.title if sub_category_data else "Unknown"
        else:
            representation['sub_category_name'] = None
        
        # Add variations information
        if 'product_id' in representation:
            variations = ProductVariation.objects.filter(product_id=representation['product_id'])
            representation['variations'] = ProductVariationDetailSerializer(variations, many=True).data
            representation['variations_count'] = variations.count()
            
            # Get first variation for price display
            first_variation = variations.first()
            if first_variation:
                representation['product_variation_id'] = first_variation.product_variation_id
                representation['actual_price'] = first_variation.actual_price
                representation['discounted_price'] = first_variation.discounted_price
                representation['weight'] = first_variation.weight_variation
            else:
                representation['product_variation_id'] = None
                representation['actual_price'] = "0"
                representation['discounted_price'] = "0"
                representation['weight'] = "N/A"

        return representation


class ProductVariationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariation
        fields = [
            'id', 'product_id', 'product_variation_id', 'actual_price',
            'discounted_price', 'is_vartied', 'weight_variation', 'created_at',
            'stock_toggle_mode', 'in_stock_bull', 'stock_quantity'
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        if 'product_variation_id' in representation:            
            availability_obj = AvailabilityCharges.objects.filter(product_variation_id=representation['product_variation_id'])
            availability_data = AvailabilityChargesSerializer(availability_obj, many=True).data
            representation['availability_data'] = availability_data

        return representation


# class ProductVariationDetailSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = ProductVariation
#         fields = [
#             'id', 'product_id', 'product_variation_id', 'actual_price',
#             'discounted_price', 'is_vartied', 'weight_variation', 'created_at'
#         ]

class ProductVariationDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariation
        fields = [
            'id', 'product_id', 'product_variation_id', 'actual_price',
            'discounted_price', 'is_vartied', 'weight_variation', 'created_at',
            'stock_toggle_mode', 'in_stock_bull', 'stock_quantity'
        ]
    # def to_representation(self, instance):
    #     representation = super().to_representation(instance)

    #     if 'product_variation_id' in representation:            
    #         availability_obj = AvailabilityCharges.objects.filter(product_variation_id=representation['product_variation_id'])
    #         availability_data = AvailabilityChargesSerializer(availability_obj, many=True).data
    #         representation['availability_data'] = availability_data

    #     return representation


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
        fields = '__all__'


class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = [
            'id', 'start_time', 'end_time', 'time_slot_title',
            'is_active', 'created_at', 'delivery_charges'
        ]


class AvailabilityChargesSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilityCharges
        fields = [
            'id', 'product_id', 'product_variation_id',
            'pincode_id', 'timeslot_data',
            'delivery_charges', 'is_available', 'created_at'
        ]


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            'id', 'coupon_code', 'discount_type', 'discount_value',
            'minimum_order_amount', 'maximum_discount_amount',
            'usage_limit', 'usage_count', 'valid_from', 'valid_until',
            'is_active', 'created_at'
        ]
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['is_valid'] = instance.is_valid()
        return representation


class CouponApplicationSerializer(serializers.Serializer):
    coupon_code = serializers.CharField(max_length=50)
    order_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
