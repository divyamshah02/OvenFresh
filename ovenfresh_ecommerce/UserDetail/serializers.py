from rest_framework import serializers
from .models import *


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # fields = ["id", "is_superuser", "username", "first_name", "last_name", "email", "is_staff", "is_active", "date_joined", "role", "user_id", "name", "contact_number", "city", "state"]
        fields = '__all__'


    def to_representation(self, instance):
        representation = super().to_representation(instance)

        if 'contact_number' in representation:
            representation['contact_number'] = str(representation['contact_number']).replace("+91", "")

        return representation

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'

class OTPSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTP
        fields = '__all__'
