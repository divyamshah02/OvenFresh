from django.http import HttpResponse, HttpResponsePermanentRedirect


def custom_404(request, exception=None):
    path = request.path

    # Handle old WordPress category URLs
    if path.startswith("/product-category/"):
        new_path = path.replace("/product-category/", "/shop/", 1)
        return HttpResponsePermanentRedirect(new_path)

    # Fallback → homepage
    return HttpResponsePermanentRedirect("/")


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

