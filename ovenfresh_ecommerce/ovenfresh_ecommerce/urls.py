from django.contrib import admin
from django.conf import settings
from django.urls import path, include
from django.conf.urls.static import static
from django.views.generic import RedirectView
from .views import *
from django.contrib.sitemaps.views import sitemap

from .sitemaps import *


sitemaps = {
    "products": ProductSitemap,
    "categories": CategorySitemap,
     "locations": LocationSitemap,  # ✅ new
}


urlpatterns = [
    path('django-admin/', admin.site.urls),
    # path('favicon.ico', RedirectView.as_view(url='/static/assets/img/logo.ico')),

    path('', include('FrontEnd.urls')),
    path('user-api/', include('UserDetail.urls')),
    path('cart-api/', include('Cart.urls')),
    path('order-api/', include('Order.urls')),
    path('delivery-api/', include('Delivery.urls')),
    path('product-api/', include('Product.urls')),
    path('analytics-api/', include('Analytics.urls')),
    path('cms-api/', include('Cms.urls')),

    path("sitemap.xml", sitemap, {"sitemaps": sitemaps}, name="sitemap"),
    path("robots.txt", robots_txt),
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
