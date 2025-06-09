from django.contrib import admin
from .models import *

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'role', 'first_name', 'last_name', 'email', 'is_staff', 'id')
    search_fields = ('user_id', 'first_name', 'last_name', 'email', 'contact_number')
    list_filter = ('role',)

admin.site.register(Address)

# Admin for OTPVerification
@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = (
        'mobile', 'otp', 'is_verified', 'attempt_count', 'created_at', 'expires_at'
    )
    list_filter = ('is_verified', )
    search_fields = ('mobile', 'otp')

