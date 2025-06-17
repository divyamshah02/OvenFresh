from rest_framework import viewsets, status
from django.shortcuts import HttpResponse
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import *
from .serializers import *
from .migrate_data import start_migrations_personl

from utils.decorators import *

class HeroBannerViewSet(viewsets.ViewSet):
    @handle_exceptions
    def list(self, request):
        """Get all active hero banners"""
        banners = HeroBanner.objects.filter(is_active=True)
        serializer = HeroBannerSerializer(banners, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None
        })

    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        """Create new hero banner"""
        serializer = HeroBannerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data,
                "error": None
            }, status=201)
        return Response({
            "success": False,
            "data": None,
            "error": serializer.errors
        }, status=400)

    @handle_exceptions
    @check_authentication(required_role="admin")
    def update(self, request, pk=None):
        """Update hero banner"""
        try:
            banner = HeroBanner.objects.get(pk=pk)
            serializer = HeroBannerSerializer(banner, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "success": True,
                    "data": serializer.data,
                    "error": None
                })
            return Response({
                "success": False,
                "data": None,
                "error": serializer.errors
            }, status=400)
        except HeroBanner.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Banner not found"
            }, status=404)

    @handle_exceptions
    @check_authentication(required_role="admin")
    def destroy(self, request, pk=None):
        """Delete hero banner"""
        try:
            banner = HeroBanner.objects.get(pk=pk)
            banner.delete()
            return Response({
                "success": True,
                "data": None,
                "error": None
            })
        except HeroBanner.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Banner not found"
            }, status=404)

class DeliveryPolicyViewSet(viewsets.ViewSet):
    @handle_exceptions
    def list(self, request):
        """Get all active delivery policies"""
        policies = DeliveryPolicy.objects.filter(is_active=True)
        serializer = DeliveryPolicySerializer(policies, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None
        })

    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        """Create new delivery policy"""
        serializer = DeliveryPolicySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data,
                "error": None
            }, status=201)
        return Response({
            "success": False,
            "data": None,
            "error": serializer.errors
        }, status=400)

    @handle_exceptions
    @check_authentication(required_role="admin")
    def update(self, request, pk=None):
        """Update delivery policy"""
        try:
            policy = DeliveryPolicy.objects.get(pk=pk)
            serializer = DeliveryPolicySerializer(policy, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "success": True,
                    "data": serializer.data,
                    "error": None
                })
            return Response({
                "success": False,
                "data": None,
                "error": serializer.errors
            }, status=400)
        except DeliveryPolicy.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Policy not found"
            }, status=404)

class HomepageCategoryViewSet(viewsets.ViewSet):
    @handle_exceptions
    def list(self, request):
        """Get all active homepage categories"""
        categories = HomepageCategory.objects.filter(is_active=True)
        serializer = HomepageCategorySerializer(categories, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None
        })

    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        """Create new homepage category"""
        serializer = HomepageCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data,
                "error": None
            }, status=201)
        return Response({
            "success": False,
            "data": None,
            "error": serializer.errors
        }, status=400)

    @handle_exceptions
    @check_authentication(required_role="admin")
    def update(self, request, pk=None):
        """Update homepage category"""
        try:
            category = HomepageCategory.objects.get(pk=pk)
            serializer = HomepageCategorySerializer(category, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "success": True,
                    "data": serializer.data,
                    "error": None
                })
            return Response({
                "success": False,
                "data": None,
                "error": serializer.errors
            }, status=400)
        except HomepageCategory.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Category not found"
            }, status=404)

class VideoContentViewSet(viewsets.ViewSet):
    @handle_exceptions
    def list(self, request):
        """Get all active video content"""
        videos = VideoContent.objects.filter(is_active=True)
        serializer = VideoContentSerializer(videos, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None
        })

    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        """Create new video content"""
        serializer = VideoContentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data,
                "error": None
            }, status=201)
        return Response({
            "success": False,
            "data": None,
            "error": serializer.errors
        }, status=400)

class FeatureViewSet(viewsets.ViewSet):
    @handle_exceptions
    def list(self, request):
        """Get all active features"""
        features = Feature.objects.filter(is_active=True)
        serializer = FeatureSerializer(features, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None
        })

    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        """Create new feature"""
        serializer = FeatureSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data,
                "error": None
            }, status=201)
        return Response({
            "success": False,
            "data": None,
            "error": serializer.errors
        }, status=400)

class AboutSectionViewSet(viewsets.ViewSet):
    @handle_exceptions
    def list(self, request):
        """Get active about section"""
        about = AboutSection.objects.filter(is_active=True).first()
        if about:
            serializer = AboutSectionSerializer(about)
            return Response({
                "success": True,
                "data": serializer.data,
                "error": None
            })
        return Response({
            "success": True,
            "data": None,
            "error": None
        })

    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        """Create new about section"""
        serializer = AboutSectionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data,
                "error": None
            }, status=201)
        return Response({
            "success": False,
            "data": None,
            "error": serializer.errors
        }, status=400)

class ProductSectionViewSet(viewsets.ViewSet):
    @handle_exceptions
    def list(self, request):
        """Get all active product sections"""
        sections = ProductSection.objects.filter(is_active=True)
        serializer = ProductSectionSerializer(sections, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None
        })

    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        """Create new product section"""
        serializer = ProductSectionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data,
                "error": None
            }, status=201)
        return Response({
            "success": False,
            "data": None,
            "error": serializer.errors
        }, status=400)

class ClientLogoViewSet(viewsets.ViewSet):
    @handle_exceptions
    def list(self, request):
        """Get all active client logos"""
        logos = ClientLogo.objects.filter(is_active=True)
        serializer = ClientLogoSerializer(logos, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None
        })

    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        """Create new client logo"""
        serializer = ClientLogoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data,
                "error": None
            }, status=201)
        return Response({
            "success": False,
            "data": None,
            "error": serializer.errors
        }, status=400)

class FooterContentViewSet(viewsets.ViewSet):
    @handle_exceptions
    def list(self, request):
        """Get all active footer content"""
        content = FooterContent.objects.filter(is_active=True)
        serializer = FooterContentSerializer(content, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None
        })

    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        """Create new footer content"""
        serializer = FooterContentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data,
                "error": None
            }, status=201)
        return Response({
            "success": False,
            "data": None,
            "error": serializer.errors
        }, status=400)

def test(request):
    start_migrations_personl()
    return HttpResponse('hello workd')
