from rest_framework.exceptions import NotFound, ParseError
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework import status

from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponse, JsonResponse
from django.utils import timezone

from .serializers import *
from .models import *
from .utils import *

from datetime import datetime, timedelta
import string
import random

from utils.decorators import *

logger = None


class TempViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    @check_authentication
    def list(self, request):
        any_get_data = request.query_params.get('any_get_data')
        if not any_get_data:
            return Response(
                        {
                            "success": False,
                            "user_not_logged_in": False,
                            "user_unauthorized": False,
                            "data": None,
                            "error": "Missing any_get_data."
                        }, status=status.HTTP_400_BAD_REQUEST)

        data = {}
        return Response(
                    {
                        "success": True,
                        "user_not_logged_in": False,
                        "user_unauthorized": False,
                        "data": data,
                        "error": None
                    }, status=status.HTTP_200_OK)

    @handle_exceptions
    @check_authentication(required_role='admin')
    def create(self, request):
            any_post_data = request.data.get('any_post_data')
            if not any_post_data:
                return Response(
                            {
                                "success": False,
                                "user_not_logged_in": False,
                                "user_unauthorized": False,
                                "data": None,
                                "error": "Missing any_post_data."
                            }, status=status.HTTP_400_BAD_REQUEST)

            data = {}         

            return Response(
                        {
                            "success": True,  
                            "user_not_logged_in": False,
                            "user_unauthorized": False,                       
                            "data": data,
                            "error": None
                        }, status=status.HTTP_201_CREATED)


class OtpAuthViewSet(viewsets.ViewSet):

    @handle_exceptions
    def create(self, request):
        """
        API 1: Generate OTP
        """
        mobile = request.data.get("mobile")
        if not mobile:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Mobile number is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        otp = generate_send_otp(contact_number=mobile)
        otp_obj = OTPVerification.objects.create(
            mobile=mobile,
            otp=otp,
            expires_at=timezone.now() + timedelta(minutes=5),
            is_verified=False,
            attempt_count=0
        )

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"otp_id": otp_obj.id, "otp": otp},  # remove otp in production
            "error": None
        }, status=status.HTTP_201_CREATED)

    @handle_exceptions
    def update(self, request, pk):
        """
        API 2: Verify OTP & Login/Register
        """

        otp_id = pk
        otp = request.data.get("otp")
        
        if not otp_id or not otp:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "otp_id & otp are required."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            otp_obj = OTPVerification.objects.get(id=otp_id)
        except OTPVerification.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Invalid OTP ID."
            }, status=status.HTTP_404_NOT_FOUND)

        if otp_obj.is_verified:
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"otp_verified": False, "message": "OTP already used."},
                "error": None
            }, status=status.HTTP_200_OK)

        if otp_obj.expires_at < timezone.now():
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"otp_verified": False, "message": "OTP expired."},
                "error": None
            }, status=status.HTTP_200_OK)

        if otp_obj.attempt_count >= 3:
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"otp_verified": False, "message": "Maximum attempts reached."},
                "error": None
            }, status=status.HTTP_200_OK)

        if otp_obj.otp != otp:
            otp_obj.attempt_count += 1
            otp_obj.save()
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"otp_verified": False, "message": "Incorrect OTP."},
                "error": None
            }, status=status.HTTP_200_OK)

        # OTP is correct
        otp_obj.is_verified = True
        otp_obj.save()

        user = User.objects.filter(contact_number=otp_obj.mobile).first()

        if user:
            user_details_filled = bool(user.first_name and user.last_name and user.email)
        else:
            user = User.objects.create(
                contact_number=otp_obj.mobile,
                role='customer'
            )
            user_details_filled = False

        login(request, user)

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "otp_verified": True,
                "user_id": user.user_id,
                "user_details": user_details_filled
            },
            "error": None
        }, status=status.HTTP_200_OK)


class IsUserLoggedInViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    def list(self, request):
        """
        API: Check User Logged In Status (check_user_loggedin_url)
        GET /api/checkout/
        """
        if request.user.is_authenticated:
            user = request.user
            
            # Get user addresses
            addresses = []
            addresses_obj = Address.objects.filter(user_id=user.user_id)

            for address in addresses_obj:
                addresses.append({
                    "id": address.id,
                    "address_line": address.address_line,
                    "city": address.city,
                    "state": address.state,
                    "pincode": address.pincode,
                    "address_name": address.address_name,
                })
            
            user_data = {
                "first_name": user.first_name or "",
                "last_name": user.last_name or "",
                "email": user.email or "",
                "phone": user.contact_number or "",
            }
            
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {
                    "user": user_data,
                    "addresses": addresses
                },
                "error": None
            }, status=status.HTTP_200_OK)

        else:
            return Response({
                "success": True,
                "user_not_logged_in": True,
                "user_unauthorized": False,
                "data": None,
                "error": None
            }, status=status.HTTP_200_OK)


class UserDetailViewSet(viewsets.ViewSet):

    @handle_exceptions
    def create(self, request):
        """
        API 3: Fill User Details after OTP verification
        """
        user = request.user

        firstName = request.data.get('firstName')
        lastName = request.data.get('lastName')
        email = request.data.get('email')
        address = request.data.get('address')
        city = request.data.get('city')
        alternate_phone = request.data.get('alternate_phone', "")
        pincode = request.data.get('pincode')

        user_obj = User.objects.get(user_id=user.user_id)
        user_obj.first_name = firstName
        user_obj.last_name = lastName
        user_obj.email = email
        user_obj.alternate_phone = alternate_phone
        user_obj.save()

        new_address = Address(
            user_id=user.user_id,
            address_line=address,
            city=city,
            state='Maharashtra',
            pincode=pincode,
            address_name=request.data.get('address_name', 'Home'),
            is_default=True
        )
        new_address.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": "User details updated successfully.",
            "error": None
        }, status=status.HTTP_200_OK)


class AddAddressViewSet(viewsets.ViewSet):

    @handle_exceptions
    def create(self, request):
        """
        API 3: Fill User Details after OTP verification
        """
        user = request.user

        address = request.data.get('address')
        city = request.data.get('city')
        pincode = request.data.get('pincode')
        addressName = request.data.get('addressName')

        new_address = Address(
            user_id=user.user_id,
            address_line=address,
            city=city,
            state='Maharashtra',
            pincode=pincode,
            address_name=addressName
        )
        new_address.save()


        addresses = []
        addresses_obj = Address.objects.filter(user_id=user.user_id)

        for address in addresses_obj:
            addresses.append({
                "id": address.id,
                "address_line": address.address_line,
                "city": address.city,
                "state": address.state,
                "pincode": address.pincode,
                "address_name": address.address_name,
            })

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"addresses": addresses},
            "error": None
        }, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    @check_authentication
    def list(self, request):
        user_id = request.query_params.get('user_id')  # Use query_params for GET requests
        if not user_id:
            return Response(
                        {
                            "success": False,
                            "user_not_logged_in": False,
                            "user_unauthorized": False,
                            "data": None,
                            "error": "Missing user_id."
                        }, status=status.HTTP_400_BAD_REQUEST)

        user_data_obj = get_object_or_404(User, user_id=user_id)
        user_data = UserSerializer(user_data_obj).data
        return Response(
                    {
                        "success": True,
                        "user_not_logged_in": False,
                        "user_unauthorized": False,
                        "data": user_data,
                        "error": None
                    }, status=status.HTTP_200_OK)

    @handle_exceptions
    # @check_authentication()
    def create(self, request):
            name = request.data.get('name')
            password = request.data.get('password')
            contact_number = request.data.get('contact_number')
            email = request.data.get('email')
            role = request.data.get('role')            

            role_codes = {
                'admin': 'AD',
                'delivery': 'DE',
                'customer': 'CU'
            }

            email_already_user = User.objects.filter(is_active=True, email=email).exists()
            contact_number_already_user = User.objects.filter(is_active=True, contact_number=contact_number).exists()

            if email_already_user or contact_number_already_user:
                return Response(
                        {
                            "success": False,                            
                            "user_not_logged_in": False,
                            "user_unauthorized": False,
                            "data":None,
                            "error": "User already registered."
                        }, status=status.HTTP_400_BAD_REQUEST)

            if not name or not contact_number or not email or role not in role_codes.keys():
                return Response(
                        {
                            "success": False,                            
                            "user_not_logged_in": False,
                            "user_unauthorized": False,
                            "data":None,
                            "error": "Missing required fields."
                        }, status=status.HTTP_400_BAD_REQUEST)


            user_id = self.generate_user_id(role_code=role_codes[role])

            if str(role_codes[role]) == 'AD':
                user = User.objects.create_superuser(
                    user_id=user_id,
                    username = user_id,
                    password = password,
                    email=email,
                    name=name,
                    contact_number=contact_number,
                    role=role,
                )
            
            else:
                user = User.objects.create_user(
                    user_id=user_id,
                    username = user_id,
                    password = password,
                    email=email,
                    name=name,
                    contact_number=contact_number,
                    role=role,
                )
            
            user_detail_serializer = UserSerializer(user)
            user_data = user_detail_serializer.data

            return Response(
                        {
                            "success": True,  
                            "user_not_logged_in": False,
                            "user_unauthorized": False,                       
                            "data": user_data,
                            "error": None
                        }, status=status.HTTP_201_CREATED)

    @handle_exceptions
    @check_authentication(required_role='admin')
    def update(self, request):        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": None,
                    "error": "User ID not provided."
                }, status=status.HTTP_400_BAD_REQUEST)

        user_obj = User.objects.get(user_id=user_id)
        if not user_obj:
            return Response(
                {
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": True,
                    "data": None,
                    "error": "User not found.."
                }, status=status.HTTP_403_FORBIDDEN)

        user_obj.first_name = request.data.get('name', user_obj.first_name)
        user_obj.last_name = request.data.get('name', user_obj.last_name)
        user_obj.contact_number = request.data.get('contact_number', user_obj.contact_number)
        user_obj.email = request.data.get('email', user_obj.email)
        user_obj.save()

        return Response(
            {
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"user_id": user_id},
                "error": None
            }, status=status.HTTP_200_OK
        )

    @handle_exceptions
    @check_authentication(required_role='admin')
    def delete(self, request):        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": None,
                    "error": "user_id not provided."
                }, status=status.HTTP_400_BAD_REQUEST)

        user_obj = User.objects.get(user_id=user_id)
        if not user_obj:
            return Response(
                {
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": True,
                    "data": None,
                    "error": "User not found."
                }, status=status.HTTP_403_FORBIDDEN)

        user_obj.is_active = False
        user_obj.save()

        return Response(
            {
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {"user_id": user_id},
                "error": None
            }, status=status.HTTP_200_OK
        )

    def generate_user_id(self, role_code):
        while True:
            user_id = ''.join(random.choices(string.digits, k=10))
            user_id = role_code + user_id
            if not User.objects.filter(is_active=True, user_id=user_id).exists():
                return user_id


class LoginApiViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    def create(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {
                    "success": False,
                    "user_does_not_exist": False,
                    "wrong_password": False,
                    "error": "Email and password are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(is_active=True, email=email).first()
        if not user:
            return Response(
                {
                    "success": False,
                    "user_does_not_exist": True,
                    "wrong_password": False,
                    "error": None
                }, status=status.HTTP_404_NOT_FOUND)

        authenticated_user = authenticate(request, username=user.user_id, password=password)
        if not authenticated_user:
            return Response(
                {
                    "success": False,
                    "user_does_not_exist": False,
                    "wrong_password": True,
                    "error": None
                }, status=status.HTTP_401_UNAUTHORIZED)

        login(request, authenticated_user)
        request.session.set_expiry(30 * 24 * 60 * 60)

        return Response(
            {
                "success": True,
                "user_does_not_exist": False,
                "wrong_password": False,
                "error": None,
                "data": {"user_id": user.username}
            }, status=status.HTTP_200_OK)


class LogoutApiViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    def list(self, request):        
        logout(request)
        return HttpResponse('DONE') # keep this in development mode to check the logout functionality
        return redirect('dashboard-list')


class UserListViewSet(viewsets.ViewSet):
    
    # @check_authentication()
    @handle_exceptions
    def list(self, request):
        users_obj = User.objects.all()
        user_data = UserSerializer(users_obj, many=True).data
        
        data = {
            'user_data': user_data,
            'len_user_data': len(user_data)
        }

        return Response(
            {
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": data,
                "error": None
            }, status=status.HTTP_200_OK)


# class UserDetailViewSet(viewsets.ViewSet):
    
#     @handle_exceptions
#     @check_authentication
#     def create(self, request):
#         custom_user = request.data.get('custom_user')
#         if not custom_user:
#             user_data = UserSerializer(request.user).data
        
#         else:
#             user_obj = User.objects.filter(user_id=custom_user).first()
#             user_data = UserSerializer(user_obj).data

#         return Response(
#             {
#                 "success": True,
#                 "user_not_logged_in": False,
#                 "user_unauthorized": False,
#                 "data": user_data,
#                 "error": None
#             }, status=status.HTTP_200_OK
#         )


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


# class OTPApiViewSet(viewsets.ViewSet):
#     @handle_exceptions
#     def create(self, request):
#         user_id = request.data.get('user_id')
#         user = User.objects.filter(user_id=user_id).first()
#         if not user:
#             return Response({"success": False, "data": None, "error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

#         otp = random.randint(100000, 999999)
#         OTP.objects.create(user=user, otp=otp, tries_left=3, status='not_matched')

#         print(f"OTP for {user.name}: {otp}")

#         return Response({"success": True, "data": {"otp": otp}, "error": None}, status=status.HTTP_200_OK)


# class OTPValidateApiViewSet(viewsets.ViewSet):
#     @handle_exceptions
#     def create(self, request):
#         user_id = request.data.get('user_id')
#         otp = request.data.get('otp')
#         user = User.objects.filter(user_id=user_id).first()

#         if not user:
#             return Response({"success": False, "error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

#         otp_record = OTP.objects.filter(user=user, otp=otp, status="not_matched").first()

#         if not otp_record or otp_record.tries_left == 0:
#             return Response({"success": False, "error": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

#         otp_record.status = "matched"
#         otp_record.save()
#         return Response({"success": True, "data": {"message": "OTP validated."}, "error": None}, status=status.HTTP_200_OK)


def login_to_account(request):
    try:
        request_user = request.user
        username = request.GET.get('username')
        print(username)

        user = User.objects.get(username=username)

        if request_user.is_staff:
            print('Staff')
            login(request, user)

        return HttpResponse('DONE')
        return redirect('dashboard-list')

    except Exception as e:
        print(e)
        return HttpResponse('DONE')
        return redirect('dashboard-list')

