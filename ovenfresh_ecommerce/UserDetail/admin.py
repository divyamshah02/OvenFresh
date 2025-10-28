from django.contrib import admin
from .models import *
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

# @admin.register(User)
# class UserAdmin(admin.ModelAdmin):
#     list_display = ('user_id', 'role', 'first_name', 'last_name', 'email', 'is_staff', 'id')
#     search_fields = ('user_id', 'first_name', 'last_name', 'email', 'contact_number')
#     list_filter = ('role',)

# admin.site.register(Address)

# Admin for OTPVerification
@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = (
        'mobile', 'otp', 'is_verified', 'attempt_count', 'created_at', 'expires_at'
    )
    list_filter = ('is_verified', )
    search_fields = ('mobile', 'otp')


from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    model = User

    # Fields to display in the list view
    list_display = (
        "user_id",
        "username",
        "first_name",
        "last_name",
        "role",
        "contact_number",
        "is_active",
        "is_staff",
        "is_superuser",
    )
    list_filter = ("role", "is_active", "is_staff", "is_superuser", "is_available")
    search_fields = ("user_id", "username", "first_name", "last_name", "contact_number")

    # Make user_id read-only since it's auto-generated
    readonly_fields = ("user_id", "created_at")

    # Organize fields in fieldsets
    fieldsets = (
        (None, {"fields": ("username", "password")}),   # <-- password field is here
        (_("Personal info"), {"fields": ("first_name", "last_name", "email", "contact_number", "alternate_phone")}),
        (_("Roles & Status"), {"fields": ("role", "is_active", "is_available")}),
        (_("Important dates"), {"fields": ("last_login", "date_joined", "created_at")}),
        (_("Permissions"), {"fields": ("is_staff", "is_superuser", "groups", "user_permissions")}),
    )

    # Fields to show when adding a new user
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "role",
                    "first_name",
                    "last_name",
                    "email",
                    "contact_number",
                    "alternate_phone",
                    "password1",   # <-- Secure password creation
                    "password2",
                ),
            },
        ),
    )

    ordering = ("created_at",)
