from django.contrib import admin
from django.utils.html import format_html
from .models import *
from Product.models import *

@admin.register(HeroBanner)
class HeroBannerAdmin(admin.ModelAdmin):
    list_display = ['title', 'image_preview', 'is_active', 'order', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title', 'description']
    list_editable = ['is_active', 'order']
    ordering = ['order', '-created_at']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;">', obj.image)
        return "No Image"
    image_preview.short_description = "Preview"

@admin.register(DeliveryPolicy)
class DeliveryPolicyAdmin(admin.ModelAdmin):
    list_display = ['title', 'policy_type', 'icon_preview', 'is_active', 'order']
    list_filter = ['policy_type', 'is_active']
    search_fields = ['title']
    list_editable = ['is_active', 'order']
    ordering = ['order', '-created_at']
    
    def icon_preview(self, obj):
        if obj.icon:
            return format_html('<i class="{}" style="font-size: 20px; color: #007bff;"></i>', obj.icon)
        return "No Icon"
    icon_preview.short_description = "Icon"

@admin.register(HomepageCategory)
class HomepageCategoryAdmin(admin.ModelAdmin):
    list_display = ['title', 'image_preview', 'is_active', 'order', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title', 'description']
    list_editable = ['is_active', 'order']
    ordering = ['order', '-created_at']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">', obj.image)
        return "No Image"
    image_preview.short_description = "Preview"

@admin.register(VideoContent)
class VideoContentAdmin(admin.ModelAdmin):
    list_display = ['position', 'content_type', 'is_active', 'created_at']
    list_filter = ['position', 'is_active']
    list_editable = ['is_active']
    ordering = ['position']
    
    def content_type(self, obj):
        return "Video" if obj.video_url else "Text"
    content_type.short_description = "Type"

@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ['title', 'icon_preview', 'is_active', 'order']
    list_filter = ['is_active']
    search_fields = ['title', 'description']
    list_editable = ['is_active', 'order']
    ordering = ['order', '-created_at']
    
    def icon_preview(self, obj):
        if obj.icon:
            return format_html('<i class="{}" style="font-size: 20px; color: #28a745;"></i>', obj.icon)
        return "No Icon"
    icon_preview.short_description = "Icon"

class AboutFeatureInline(admin.TabularInline):
    model = AboutFeature
    extra = 1
    fields = ['title', 'description', 'icon', 'order']

@admin.register(AboutSection)
class AboutSectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'years_experience', 'image_preview', 'is_active', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['title', 'subtitle']
    inlines = [AboutFeatureInline]
    
    def image_preview(self, obj):
        if obj.main_image:
            return format_html('<img src="{}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;">', obj.main_image)
        return "No Image"
    image_preview.short_description = "Preview"

class ProductSectionItemInline(admin.TabularInline):
    model = ProductSectionItem
    extra = 0
    fields = ['product_id', 'is_active', 'order']
    ordering = ['order']

@admin.register(ProductSection)
class ProductSectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'section_type', 'category_info', 'max_products', 'is_active', 'order']
    list_filter = ['section_type', 'is_active']
    search_fields = ['title', 'description']
    list_editable = ['is_active', 'order']
    ordering = ['order', '-created_at']
    inlines = [ProductSectionItemInline]
    
    def category_info(self, obj):
        if obj.category_id:
            try:
                category = Category.objects.get(id=obj.category_id)
                result = category.name
                if obj.subcategory_id:
                    try:
                        subcategory = SubCategory.objects.get(id=obj.subcategory_id)
                        result += f" > {subcategory.name}"
                    except SubCategory.DoesNotExist:
                        pass
                return result
            except Category.DoesNotExist:
                return "Category not found"
        return "No category"
    category_info.short_description = "Category"

@admin.register(ClientLogo)
class ClientLogoAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'logo_preview', 'website_url', 'is_active', 'order']
    list_filter = ['is_active']
    search_fields = ['company_name']
    list_editable = ['is_active', 'order']
    ordering = ['order', '-created_at']
    
    def logo_preview(self, obj):
        if obj.logo_url:
            return format_html('<img src="{}" style="width: 60px; height: 40px; object-fit: contain; border-radius: 4px;">', obj.logo_url)
        return "No Logo"
    logo_preview.short_description = "Preview"

@admin.register(FooterContent)
class FooterContentAdmin(admin.ModelAdmin):
    list_display = ['title', 'section_type', 'is_active', 'order']
    list_filter = ['section_type', 'is_active']
    search_fields = ['title', 'content']
    list_editable = ['is_active', 'order']
    ordering = ['order', '-created_at']

# Custom admin site configuration
# admin.site.site_header = "OvenFresh CMS Admin"
# admin.site.site_title = "OvenFresh CMS"
# admin.site.index_title = "Welcome to OvenFresh Content Management System"
