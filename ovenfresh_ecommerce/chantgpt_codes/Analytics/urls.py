from django.urls import path
from .views import AnalyticsViewSet

analytics_list = AnalyticsViewSet.as_view({
    'get': 'list'
})

urlpatterns = [
    path('', analytics_list, name='analytics'),
]
