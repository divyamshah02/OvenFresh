from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action

from django.shortcuts import HttpResponse
from django.db.models import Q
from .models import *
from .serializers import *

from .migrate_data import *
from .clear_data import *
# Decorator functions (assuming these exist in your project)
def handle_exceptions(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=500)
    return wrapper

def check_authentication(required_role=None):
    def decorator(func):
        def wrapper(self, request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response({"success": False, "user_not_logged_in": True, "error": "Authentication required"}, status=401)
            if required_role and getattr(request.user, 'role', None) != required_role:
                return Response({"success": False, "user_unauthorized": True, "error": "Unauthorized"}, status=403)
            return func(self, request, *args, **kwargs)
        return wrapper
    return decorator

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

class ProductSectionViewSet(viewsets.ViewSet):
    # @handle_exceptions
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
        print(request.data)
        serializer = ProductSectionSerializer(data=request.data)
        if serializer.is_valid():
            section = serializer.save()
            
            # If custom selection, add selected products
            if section.section_type == 'custom' and 'selected_products' in request.data:
                for product_id in request.data['selected_products']:
                    ProductSectionItem.objects.create(
                        section=section,
                        product_id=product_id,
                        is_active=True
                    )
            
            return Response({
                "success": True,
                "data": ProductSectionSerializer(section).data,
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
        """Update product section"""
        try:
            print(request.data)
            section = ProductSection.objects.get(pk=pk)
            serializer = ProductSectionSerializer(section, data=request.data, partial=True)
            if serializer.is_valid():
                section = serializer.save()
                
                # Update selected products for custom sections
                if section.section_type == 'custom' and 'selected_products' in request.data:
                    # Clear existing items
                    section.items.all().delete()
                    # Add new items
                    for product_id in request.data['selected_products']:
                        ProductSectionItem.objects.create(
                            section=section,
                            product_id=product_id,
                            is_active=True
                        )
                
                return Response({
                    "success": True,
                    "data": ProductSectionSerializer(section).data,
                    "error": None
                })
            return Response({
                "success": False,
                "data": None,
                "error": serializer.errors
            }, status=400)
        except ProductSection.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Section not found"
            }, status=404)

    @handle_exceptions
    @check_authentication(required_role="admin")
    def destroy(self, request, pk=None):
        """Delete product section"""
        try:
            section = ProductSection.objects.get(pk=pk)
            section.delete()
            return Response({
                "success": True,
                "data": None,
                "error": None
            })
        except ProductSection.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Section not found"
            }, status=404)

class CategoryViewSet(viewsets.ViewSet):
    @handle_exceptions
    def list(self, request):
        """Get all active categories"""
        categories = Category.objects.filter(is_active=True)
        serializer = CategorySerializer(categories, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None
        })

class SubCategoryViewSet(viewsets.ViewSet):
    @handle_exceptions
    def list(self, request):
        """Get subcategories, optionally filtered by category"""
        category_id = request.query_params.get('category_id')
        subcategories = SubCategory.objects.filter(is_active=True)
        
        if category_id:
            subcategories = subcategories.filter(category_id=category_id)
        
        serializer = SubCategorySerializer(subcategories, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None
        })

class ProductViewSet(viewsets.ViewSet):
    @handle_exceptions
    def list(self, request):
        """Get products, optionally filtered by category/subcategory"""
        category_id = request.query_params.get('category_id')
        subcategory_id = request.query_params.get('subcategory_id')
        search = request.query_params.get('search')
        
        products = Product.objects.filter(is_active=True)
        
        if category_id:
            products = products.filter(category_id=category_id)
        
        if subcategory_id:
            products = products.filter(subcategory_id=subcategory_id)
        
        if search:
            products = products.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search)
            )
        
        # Limit results for performance
        products = products[:50]
        
        serializer = ProductSerializer(products, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None
        })

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

    @handle_exceptions
    @check_authentication(required_role="admin")
    def destroy(self, request, pk=None):
        """Delete delivery policy"""
        try:
            policy = DeliveryPolicy.objects.get(pk=pk)
            policy.delete()
            return Response({
                "success": True,
                "data": None,
                "error": None
            })
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

    @handle_exceptions
    @check_authentication(required_role="admin")
    def destroy(self, request, pk=None):
        """Delete homepage category"""
        try:
            category = HomepageCategory.objects.get(pk=pk)
            category.delete()
            return Response({
                "success": True,
                "data": None,
                "error": None
            })
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

    @handle_exceptions
    @check_authentication(required_role="admin")
    def update(self, request, pk=None):
        """Update video content"""
        try:
            video = VideoContent.objects.get(pk=pk)
            serializer = VideoContentSerializer(video, data=request.data, partial=True)
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
        except VideoContent.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Video not found"
            }, status=404)

    @handle_exceptions
    @check_authentication(required_role="admin")
    def destroy(self, request, pk=None):
        """Delete video content"""
        try:
            video = VideoContent.objects.get(pk=pk)
            video.delete()
            return Response({
                "success": True,
                "data": None,
                "error": None
            })
        except VideoContent.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Video not found"
            }, status=404)

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

    @handle_exceptions
    @check_authentication(required_role="admin")
    def update(self, request, pk=None):
        """Update feature"""
        try:
            feature = Feature.objects.get(pk=pk)
            serializer = FeatureSerializer(feature, data=request.data, partial=True)
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
        except Feature.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Feature not found"
            }, status=404)

    @handle_exceptions
    @check_authentication(required_role="admin")
    def destroy(self, request, pk=None):
        """Delete feature"""
        try:
            feature = Feature.objects.get(pk=pk)
            feature.delete()
            return Response({
                "success": True,
                "data": None,
                "error": None
            })
        except Feature.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Feature not found"
            }, status=404)

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

    @handle_exceptions
    @check_authentication(required_role="admin")
    def update(self, request, pk=None):
        """Update about section"""
        try:
            about = AboutSection.objects.get(pk=pk)
            serializer = AboutSectionSerializer(about, data=request.data, partial=True)
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
        except AboutSection.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "About section not found"
            }, status=404)

    @handle_exceptions
    @check_authentication(required_role="admin")
    def destroy(self, request, pk=None):
        """Delete about section"""
        try:
            about = AboutSection.objects.get(pk=pk)
            about.delete()
            return Response({
                "success": True,
                "data": None,
                "error": None
            })
        except AboutSection.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "About section not found"
            }, status=404)

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

    @handle_exceptions
    @check_authentication(required_role="admin")
    def update(self, request, pk=None):
        """Update client logo"""
        try:
            logo = ClientLogo.objects.get(pk=pk)
            serializer = ClientLogoSerializer(logo, data=request.data, partial=True)
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
        except ClientLogo.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Logo not found"
            }, status=404)

    @handle_exceptions
    @check_authentication(required_role="admin")
    def destroy(self, request, pk=None):
        """Delete client logo"""
        try:
            logo = ClientLogo.objects.get(pk=pk)
            logo.delete()
            return Response({
                "success": True,
                "data": None,
                "error": None
            })
        except ClientLogo.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Logo not found"
            }, status=404)

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
    # clear_data()
    return HttpResponse('hello workd')
