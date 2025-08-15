from rest_framework import viewsets, status
from rest_framework.response import Response
from django.contrib.auth import authenticate, login
import random, string

from .models import User, Address, OTP
from .serializers import UserSerializer, AddressSerializer, OTPSerializer
from utils.decorators import *

class UserViewSet(viewsets.ViewSet):
    @handle_exceptions
    @check_authentication(required_role='admin')
    def create(self, request):
        name = request.data.get('name')
        password = request.data.get('password')
        contact_number = request.data.get('contact_number')
        email = request.data.get('email')
        role = request.data.get('role')

        role_codes = {'admin': 'AD', 'delivery': 'DE', 'customer': 'CU'}

        if not name or not contact_number or not email or role not in role_codes:
            return Response({"success": False, "data": None, "error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(is_active=True, email=email).exists() or User.objects.filter(is_active=True, contact_number=contact_number).exists():
            return Response({"success": False, "data": None, "error": "User already registered."}, status=status.HTTP_400_BAD_REQUEST)

        user_id = self.generate_user_id(role_codes[role])

        if role == 'admin':
            user = User.objects.create_superuser(user_id=user_id, username=user_id, password=password, email=email, name=name, contact_number=contact_number, role=role)
        else:
            user = User.objects.create_user(user_id=user_id, username=user_id, password=password, email=email, name=name, contact_number=contact_number, role=role)

        return Response({"success": True, "data": UserSerializer(user).data, "error": None}, status=status.HTTP_201_CREATED)

    def generate_user_id(self, role_code):
        while True:
            uid = role_code + random.choice('123456789') + ''.join(random.choices(string.digits, k=9))
            if not User.objects.filter(user_id=uid).exists():
                return uid

class AddressViewSet(viewsets.ViewSet):
    @handle_exceptions
    @check_authentication
    def list(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"success": False, "data": None, "error": "Missing user_id."}, status=status.HTTP_400_BAD_REQUEST)
        addresses = Address.objects.filter(user__user_id=user_id)
        return Response({"success": True, "data": AddressSerializer(addresses, many=True).data, "error": None}, status=status.HTTP_200_OK)

    @handle_exceptions
    @check_authentication
    def create(self, request):
        serializer = AddressSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "data": serializer.data, "error": None}, status=status.HTTP_201_CREATED)
        return Response({"success": False, "data": None, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class AdminLoginApiViewSet(viewsets.ViewSet):
    @handle_exceptions
    def create(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"success": False, "user_does_not_exist": True, "error": None}, status=status.HTTP_404_NOT_FOUND)

        authenticated_user = authenticate(username=user.user_id, password=password)
        if not authenticated_user:
            return Response({"success": False, "wrong_password": True, "error": None}, status=status.HTTP_401_UNAUTHORIZED)

        login(request, authenticated_user)
        request.session.set_expiry(30 * 24 * 60 * 60)

        return Response({"success": True, "data": {"user_id": user.user_id}, "error": None}, status=status.HTTP_200_OK)

class OTPApiViewSet(viewsets.ViewSet):
    @handle_exceptions
    def create(self, request):
        user_id = request.data.get('user_id')
        user = User.objects.filter(user_id=user_id).first()
        if not user:
            return Response({"success": False, "data": None, "error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        otp = random.randint(100000, 999999)
        OTP.objects.create(user=user, otp=otp, tries_left=3, status='not_matched')

        print(f"OTP for {user.name}: {otp}")

        return Response({"success": True, "data": {"otp": otp}, "error": None}, status=status.HTTP_200_OK)

class OTPValidateApiViewSet(viewsets.ViewSet):
    @handle_exceptions
    def create(self, request):
        user_id = request.data.get('user_id')
        otp = request.data.get('otp')
        user = User.objects.filter(user_id=user_id).first()

        if not user:
            return Response({"success": False, "error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        otp_record = OTP.objects.filter(user=user, otp=otp, status="not_matched").first()

        if not otp_record or otp_record.tries_left == 0:
            return Response({"success": False, "error": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

        otp_record.status = "matched"
        otp_record.save()
        return Response({"success": True, "data": {"message": "OTP validated."}, "error": None}, status=status.HTTP_200_OK)
