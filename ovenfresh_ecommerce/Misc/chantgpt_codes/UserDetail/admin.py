from django.contrib import admin
from .models import User, Address, OTP
from django.contrib.auth.admin import UserAdmin

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('user_id', 'name', 'email', 'contact_number', 'role')
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('user_id', 'name', 'contact_number', 'role')}),
    )

admin.site.register(User, CustomUserAdmin)
admin.site.register(Address)
admin.site.register(OTP)
