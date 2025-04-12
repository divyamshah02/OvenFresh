from django.contrib import admin
from .models import *

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'role', 'name', 'email', 'is_staff', 'id')
    search_fields = ('user_id', 'name', 'email', 'contact_number')
    list_filter = ('role',)
