from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class HeroBanner(models.Model):
    title = models.CharField(max_length=200)
    subtitle = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    image = models.URLField()
    button_text = models.CharField(max_length=50, default="Shop Now")
    button_link = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title

class DeliveryPolicy(models.Model):
    POLICY_TYPES = [
        ('same_day', 'Same Day Delivery'),
        ('midnight', 'Midnight Delivery'),
        ('info', 'Information Card'),
    ]
    
    policy_type = models.CharField(max_length=20, choices=POLICY_TYPES)
    title = models.CharField(max_length=200)
    icon = models.CharField(max_length=50, help_text="FontAwesome icon class")
    countdown_hours = models.PositiveIntegerField(default=0, blank=True, null=True)
    countdown_minutes = models.PositiveIntegerField(default=0, blank=True, null=True)
    countdown_seconds = models.PositiveIntegerField(default=0, blank=True, null=True)
    delivery_time = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title

class HomepageCategory(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    image = models.URLField()
    category_link = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']
        verbose_name_plural = "Homepage Categories"

    def __str__(self):
        return self.title

class VideoContent(models.Model):
    VIDEO_POSITIONS = [
        ('left', 'Left Video'),
        ('right', 'Right Video'),
        ('center_text', 'Center Text'),
    ]
    
    position = models.CharField(max_length=20, choices=VIDEO_POSITIONS)
    video_url = models.URLField(blank=True, null=True)
    text_content = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_position_display()}"

class Feature(models.Model):
    title = models.CharField(max_length=100)
    description = models.CharField(max_length=200)
    icon = models.CharField(max_length=50, help_text="FontAwesome icon class")
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title

class AboutSection(models.Model):
    subtitle = models.CharField(max_length=100, default="Our Story")
    title = models.CharField(max_length=200, default="Baking with Love Since 1993")
    description_1 = models.TextField()
    description_2 = models.TextField()
    main_image = models.URLField()
    years_experience = models.PositiveIntegerField(default=30)
    button_text = models.CharField(max_length=50, default="Explore Our Products")
    button_link = models.URLField(default="/shop/")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class AboutFeature(models.Model):
    about_section = models.ForeignKey(AboutSection, on_delete=models.CASCADE, related_name='features')
    title = models.CharField(max_length=100)
    description = models.CharField(max_length=200)
    icon = models.CharField(max_length=50, help_text="FontAwesome icon class")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title

class ProductSection(models.Model):
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    section_type = models.CharField(max_length=50, default="featured")  # featured, bestsellers, trending, etc.
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title

class ProductSectionItem(models.Model):
    section = models.ForeignKey(ProductSection, on_delete=models.CASCADE, related_name='items')
    product_id = models.CharField(max_length=50)  # Reference to your actual product
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

class ClientLogo(models.Model):
    company_name = models.CharField(max_length=100)
    logo_url = models.URLField()
    website_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.company_name

class FooterContent(models.Model):
    SECTION_TYPES = [
        ('company_info', 'Company Information'),
        ('useful_links', 'Useful Links'),
        ('quick_links', 'Quick Links'),
        ('contact', 'Contact Information'),
        ('newsletter', 'Newsletter'),
        ('location_links', 'Location Links'),
    ]
    
    section_type = models.CharField(max_length=20, choices=SECTION_TYPES)
    title = models.CharField(max_length=100)
    content = models.TextField()
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"{self.get_section_type_display()} - {self.title}"
