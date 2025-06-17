from rest_framework import serializers
from .models import *

class HeroBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroBanner
        fields = '__all__'

class DeliveryPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryPolicy
        fields = '__all__'

class HomepageCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = HomepageCategory
        fields = '__all__'

class VideoContentSerializer(serializers.ModelSerializer):
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
    # You can add product details here by joining with your Product model
    product_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductSectionItem
        fields = '__all__'
    
    def get_product_details(self, obj):
        # Placeholder - replace with actual product lookup
        return {
            'product_id': obj.product_id,
            'title': f'Product {obj.product_id}',
            'price': '₹999',
            'image': 'https://via.placeholder.com/300x300',
            'rating': 4.5,
            'reviews': 42
        }

class ProductSectionSerializer(serializers.ModelSerializer):
    items = ProductSectionItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = ProductSection
        fields = '__all__'

class ClientLogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientLogo
        fields = '__all__'

class FooterContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterContent
        fields = '__all__'
