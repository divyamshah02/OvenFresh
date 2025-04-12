from django.contrib.auth.models import AbstractUser
from django.db import models
from storages.backends.s3boto3 import S3Boto3Storage


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('delivery', 'Delivery'),
        ('customer', 'Customer'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    user_id = models.CharField(max_length=12, unique=True)
    name = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=15)    
