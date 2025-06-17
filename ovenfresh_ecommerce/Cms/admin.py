from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import *

@admin.register(HeroBanner)
class HeroBannerAdmin(admin.ModelAdmin):
    list_display = ['title', 'image_preview', 'button_text', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title', 'description']
    list_editable = ['order', 'is_active']
    ordering = ['order', '-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'subtitle', 'description')
        }),
        ('Media', {
            'fields': ('image',)
        }),
        ('Call to Action', {
            'fields': ('button_text', 'button_link')
        }),
        ('Settings', {
            'fields': ('order', 'is_active')
        })
    )
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;" />',
                obj.image
            )
        return "No Image"
    image_preview.short_description = "Preview"

@admin.register(DeliveryPolicy)
class DeliveryPolicyAdmin(admin.ModelAdmin):
    list_display = ['title', 'policy_type', 'icon_preview', 'countdown_display', 'is_active', 'order']
    list_filter = ['policy_type', 'is_active']
    search_fields = ['title', 'description']
    list_editable = ['order', 'is_active']
    ordering = ['order', '-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('policy_type', 'title', 'icon', 'description')
        }),
        ('Countdown Settings', {
            'fields': ('countdown_hours', 'countdown_minutes', 'countdown_seconds'),
            'description': 'Set countdown timer (leave blank if not needed)'
        }),
        ('Delivery Information', {
            'fields': ('delivery_time',)
        }),
        ('Settings', {
            'fields': ('order', 'is_active')
        })
    )
    
    def icon_preview(self, obj):
        if obj.icon:
            return format_html('<i class="{}" style="font-size: 20px; color: #007bff;"></i>', obj.icon)
        return "No Icon"
    icon_preview.short_description = "Icon"
    
    def countdown_display(self, obj):
        if obj.countdown_hours is not None:
            return f"{obj.countdown_hours:02d}:{obj.countdown_minutes:02d}:{obj.countdown_seconds:02d}"
        return "No Countdown"
    countdown_display.short_description = "Countdown"

@admin.register(HomepageCategory)
class HomepageCategoryAdmin(admin.ModelAdmin):
    list_display = ['title', 'image_preview', 'category_link', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title', 'description']
    list_editable = ['order', 'is_active']
    ordering = ['order', '-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description')
        }),
        ('Media', {
            'fields': ('image',)
        }),
        ('Navigation', {
            'fields': ('category_link',)
        }),
        ('Settings', {
            'fields': ('order', 'is_active')
        })
    )
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;" />',
                obj.image
            )
        return "No Image"
    image_preview.short_description = "Preview"

@admin.register(VideoContent)
class VideoContentAdmin(admin.ModelAdmin):
    list_display = ['position', 'content_type', 'is_active', 'created_at']
    list_filter = ['position', 'is_active']
    list_editable = ['is_active']
    ordering = ['position']
    
    fieldsets = (
        ('Position', {
            'fields': ('position',)
        }),
        ('Video Content', {
            'fields': ('video_url',),
            'description': 'YouTube embed URL or video file URL'
        }),
        ('Text Content', {
            'fields': ('text_content',),
            'description': 'HTML content for text sections'
        }),
        ('Settings', {
            'fields': ('is_active',)
        })
    )
    
    def content_type(self, obj):
        if obj.video_url:
            return "Video"
        elif obj.text_content:
            return "Text"
        return "Empty"
    content_type.short_description = "Type"

@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ['title', 'icon_preview', 'description_short', 'order', 'is_active']
    list_filter = ['is_active']
    search_fields = ['title', 'description']
    list_editable = ['order', 'is_active']
    ordering = ['order', '-created_at']
    
    def icon_preview(self, obj):
        if obj.icon:
            return format_html('<i class="{}" style="font-size: 20px; color: #28a745;"></i>', obj.icon)
        return "No Icon"
    icon_preview.short_description = "Icon"
    
    def description_short(self, obj):
        return obj.description[:50] + "..." if len(obj.description) > 50 else obj.description
    description_short.short_description = "Description"

class AboutFeatureInline(admin.TabularInline):
    model = AboutFeature
    extra = 1
    fields = ['title', 'description', 'icon', 'order']
    ordering = ['order']

@admin.register(AboutSection)
class AboutSectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'subtitle', 'years_experience', 'is_active', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['title', 'subtitle']
    inlines = [AboutFeatureInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('subtitle', 'title', 'years_experience')
        }),
        ('Content', {
            'fields': ('description_1', 'description_2')
        }),
        ('Media', {
            'fields': ('main_image',)
        }),
        ('Call to Action', {
            'fields': ('button_text', 'button_link')
        }),
        ('Settings', {
            'fields': ('is_active',)
        })
    )

class ProductSectionItemInline(admin.TabularInline):
    model = ProductSectionItem
    extra = 1
    fields = ['product_id', 'order', 'is_active']
    ordering = ['order']

@admin.register(ProductSection)
class ProductSectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'section_type', 'items_count', 'order', 'is_active', 'created_at']
    list_filter = ['section_type', 'is_active']
    search_fields = ['title', 'description']
    list_editable = ['order', 'is_active']
    ordering = ['order', '-created_at']
    inlines = [ProductSectionItemInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'subtitle', 'description', 'section_type')
        }),
        ('Settings', {
            'fields': ('order', 'is_active')
        })
    )
    
    def items_count(self, obj):
        return obj.items.filter(is_active=True).count()
    items_count.short_description = "Active Items"

@admin.register(ProductSectionItem)
class ProductSectionItemAdmin(admin.ModelAdmin):
    list_display = ['section', 'product_id', 'order', 'is_active']
    list_filter = ['section', 'is_active']
    search_fields = ['product_id']
    list_editable = ['order', 'is_active']
    ordering = ['section', 'order']

@admin.register(ClientLogo)
class ClientLogoAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'logo_preview', 'website_url', 'order', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['company_name']
    list_editable = ['order', 'is_active']
    ordering = ['order', '-created_at']
    
    fieldsets = (
        ('Company Information', {
            'fields': ('company_name', 'website_url')
        }),
        ('Logo', {
            'fields': ('logo_url',)
        }),
        ('Settings', {
            'fields': ('order', 'is_active')
        })
    )
    
    def logo_preview(self, obj):
        if obj.logo_url:
            return format_html(
                '<img src="{}" style="width: 60px; height: 30px; object-fit: contain;" />',
                obj.logo_url
            )
        return "No Logo"
    logo_preview.short_description = "Logo"

@admin.register(FooterContent)
class FooterContentAdmin(admin.ModelAdmin):
    list_display = ['title', 'section_type', 'content_preview', 'order', 'is_active']
    list_filter = ['section_type', 'is_active']
    search_fields = ['title', 'content']
    list_editable = ['order', 'is_active']
    ordering = ['order', '-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('section_type', 'title')
        }),
        ('Content', {
            'fields': ('content',),
            'description': 'HTML content for this footer section'
        }),
        ('Settings', {
            'fields': ('order', 'is_active')
        })
    )
    
    def content_preview(self, obj):
        # Strip HTML tags and truncate for preview
        import re
        clean_content = re.sub('<.*?>', '', obj.content)
        return clean_content[:50] + "..." if len(clean_content) > 50 else clean_content
    content_preview.short_description = "Content Preview"

# Custom admin site configuration
admin.site.site_header = "OvenFresh CMS Admin"
admin.site.site_title = "OvenFresh CMS"
admin.site.index_title = "Homepage Content Management"

# Add custom CSS for better admin interface
class CMSAdminConfig:
    def __init__(self):
        pass
    
    class Media:
        css = {
            'all': ('admin/css/cms_admin.css',)
        }
        js = ('admin/js/cms_admin.js',)
