from rest_framework import serializers
from .models import *

from Product.models import *
from Product.serializers import *

class HeroBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroBanner
        fields = '__all__'

class DeliveryPolicySerializer(serializers.ModelSerializer):
    policy_type_display = serializers.CharField(source='get_policy_type_display', read_only=True)
    
    class Meta:
        model = DeliveryPolicy
        fields = '__all__'

class HomepageCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = HomepageCategory
        fields = '__all__'

class VideoContentSerializer(serializers.ModelSerializer):
    position_display = serializers.CharField(source='get_position_display', read_only=True)
    
    class Meta:
        model = VideoContent
        fields = '__all__'

class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = '__all__'

class AboutFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutFeature
        fields = '__all__'

class AboutSectionSerializer(serializers.ModelSerializer):
    features = AboutFeatureSerializer(many=True, read_only=True)
    
    class Meta:
        model = AboutSection
        fields = '__all__'


class ProductSectionItemSerializer(serializers.ModelSerializer):
    product_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductSectionItem
        fields = '__all__'
    
    def get_product_details(self, obj):
        try:
            # Try to get actual product details
            product = Product.objects.get(id=obj.product_id)
            return ProductSerializer(product).data
        except Product.DoesNotExist:
            # Fallback for missing products
            return {
                'id': obj.product_id,
                'name': f'Product {obj.product_id}',
                'price': '0.00',
                'image': 'https://via.placeholder.com/300x300',
                'rating': 0.0,
                # 'reviews_count': 0,
                'is_active': False
            }

class ProductSectionSerializer(serializers.ModelSerializer):
    items = ProductSectionItemSerializer(many=True, read_only=True)
    section_type_display = serializers.CharField(source='get_section_type_display', read_only=True)
    category_details = serializers.SerializerMethodField()
    subcategory_details = serializers.SerializerMethodField()
    dynamic_products = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductSection
        fields = '__all__'
    
    def get_category_details(self, obj):
        if obj.category_id:
            try:
                category = Category.objects.get(id=obj.category_id)
                return CategorySerializer(category).data
            except Category.DoesNotExist:
                return None
        return None
    
    def get_subcategory_details(self, obj):
        if obj.subcategory_id:
            try:
                subcategory = SubCategory.objects.get(id=obj.subcategory_id)
                return SubCategorySerializer(subcategory).data
            except SubCategory.DoesNotExist:
                return None
        return None
    
    def get_dynamic_products(self, obj):
        """Get products based on section type and category/subcategory selection"""
        products = Product.objects.filter(is_active=True)
        
        if obj.section_type == 'category_based':
            if obj.subcategory_id:
                products = products.filter(subcategory_id=obj.subcategory_id)
            elif obj.category_id:
                products = products.filter(category_id=obj.category_id)
        elif obj.section_type == 'featured':
            products = products.filter(is_featured=True)
        # elif obj.section_type == 'bestsellers':
        #     products = products.order_by('-reviews_count')
        elif obj.section_type == 'new_arrivals':
            products = products.order_by('-created_at')
        # elif obj.section_type == 'trending':
        #     products = products.order_by('-rating', '-reviews_count')
        
        # Limit products based on max_products setting
        products = products[:obj.max_products]
        
        return ProductSerializer(products, many=True).data

class ClientLogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientLogo
        fields = '__all__'

class FooterContentSerializer(serializers.ModelSerializer):
    section_type_display = serializers.CharField(source='get_section_type_display', read_only=True)
    
    class Meta:
        model = FooterContent
        fields = '__all__'
