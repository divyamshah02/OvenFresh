from django.http import HttpResponse, HttpResponsePermanentRedirect
from django.shortcuts import redirect

def custom_404(request, exception=None):
    return redirect('/')

def robots_txt(request):
    content = """
User-agent: *
Disallow: /django-admin/
Disallow: /cart/
Disallow: /checkout/
Disallow: /admin-login/
Disallow: /admin-dashboard/
Disallow: /admin-home-cms/
Disallow: /admin-cms/
Disallow: /admin-products/
Disallow: /admin-add-product/
Disallow: /admin-category/
Disallow: /admin-pincodes/
Disallow: /admin-timeslot/
Disallow: /admin-coupon/
Disallow: /admin-delivery-person/
Disallow: /admin-all-orders/
Disallow: /admin-add-order/
Disallow: /admin-order-detail/
Disallow: /admin-pincode-order/
Disallow: /admin-review/

Sitemap: https://ovenfresh.in/sitemap.xml
"""
    return HttpResponse(content, content_type="text/plain")

