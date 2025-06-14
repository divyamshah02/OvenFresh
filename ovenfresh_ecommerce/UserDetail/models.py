from django.db import models
from django.contrib.auth.models import AbstractUser
from storages.backends.s3boto3 import S3Boto3Storage

import random
import string


# Utility to generate custom user_id
def generate_user_id(role):
    from .models import User  # To avoid circular import inside models.py

    prefix_map = {
        'admin': 'AD',
        'delivery': 'DE',
        'customer': 'CU'
    }

    prefix = prefix_map.get(role, 'XX')

    while True:
        suffix = ''.join(random.choices(string.digits, k=10))
        user_id = f"{prefix}{suffix}"
        if not User.objects.filter(user_id=user_id).exists():
            return user_id

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('delivery', 'Delivery'),
        ('customer', 'Customer'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    user_id = models.CharField(max_length=12, unique=True)
    contact_number = models.CharField(max_length=15)
    alternate_phone = models.CharField(max_length=15, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


    # Override save to assign user_id automatically
    def save(self, *args, **kwargs):
        if not self.user_id:
            new_user_id = generate_user_id(self.role)
            self.user_id = new_user_id
            self.username = new_user_id

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} ({self.user_id})"  


class Address(models.Model):
    # user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    user_id = models.CharField(max_length=12)
    address_line = models.TextField()
    city = models.CharField(max_length=50)
    state = models.CharField(max_length=50)
    pincode = models.CharField(max_length=10)
    address_name = models.CharField(max_length=100, blank=True, null=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class OTPVerification(models.Model):
    mobile = models.CharField(max_length=15)
    otp = models.CharField(max_length=6)    
    
    is_verified = models.BooleanField(default=False)
    attempt_count = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"{self.mobile} - {self.otp}"

