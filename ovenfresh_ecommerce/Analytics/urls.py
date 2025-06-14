from django.urls import path
from django.urls import path, include
from .views import *
from rest_framework.routers import DefaultRouter


router = DefaultRouter()
router.register(r'analytics', AnalyticsViewSet, basename='analytics')
router.register(r'pincode-analytics', PincodeAnalyticsViewSet, basename='pincode-analytics')

router.register(r'dashboard-stats', DashboardStatsViewSet, basename='dashboard-stats')
router.register(r'dashboard-charts', DashboardChartsViewSet, basename='dashboard-charts')
router.register(r'recent-orders', RecentOrdersViewSet, basename='recent-orders')
router.register(r'top-products', TopProductsViewSet, basename='top-products')
router.register(r'dashboard-notifications', DashboardNotificationsViewSet, basename='dashboard-notifications')


urlpatterns = [
    path('', include(router.urls)),
]
