from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    user_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=15)
    role = models.CharField(max_length=20, choices=[('admin', 'Admin'), ('customer', 'Customer'), ('delivery', 'Delivery')])

    REQUIRED_FIELDS = ['email', 'name', 'contact_number', 'role']
    USERNAME_FIELD = 'username'

class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    address_line = models.TextField()
    city = models.CharField(max_length=50)
    pincode = models.CharField(max_length=10)

class OTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.IntegerField()
    tries_left = models.IntegerField(default=3)
    status = models.CharField(max_length=20, choices=[('matched', 'Matched'), ('not_matched', 'Not Matched')], default='not_matched')
    created_at = models.DateTimeField(auto_now_add=True)
