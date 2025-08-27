from django.shortcuts import redirect

import re
from django.shortcuts import redirect

class FrontendRewriteMiddleware:
    """
    Optimized frontend routing rules:
    - /product-category/... -> /shop/...
    - Allowed frontend/frontend-admin paths -> let it pass
    - API/static/media/django-admin -> bypass fast
    - Anything else -> redirect /
    """

    # Compile regex once at class load (fast lookup)
    API_STATIC_MEDIA_REGEX = re.compile(
        r"^(user-api|cart-api|order-api|delivery-api|product-api|analytics-api|cms-api"
        r"|django-admin|static|media|sitemap\.xml|robots\.txt)"
    )

    FRONTEND_ALLOWED_REGEX = re.compile(
        r"^(shop|payment-success-callback|refund-policy|contact-us|product|cart|checkout|order-success|order-detail|account"
        r"|admin-login|admin-dashboard|admin-home-cms|admin-cms|admin-products"
        r"|admin-add-product|admin-category|admin-pincodes|admin-timeslot|admin-coupon"
        r"|admin-delivery-person|admin-all-orders|admin-add-order|admin-order-detail"
        r"|admin-pincode-order|admin-review|delivery-login|delivery-dashboard|admin-product-tax-rates)"
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path_info.strip("/")  # e.g. "shop/abc"
        if not path:
            return self.get_response(request)

        # Fast bypass for APIs / static / media / admin
        if self.API_STATIC_MEDIA_REGEX.match(path):
            return self.get_response(request)

        # Rewrite product-category -> shop
        if path.startswith("product-category"):
            new_path = "/shop/" + "/".join(path.split("/")[1:])
            if not new_path.endswith("/"):
                new_path += "/"
            return redirect(new_path)

        # Allowed frontend/admin routes
        if self.FRONTEND_ALLOWED_REGEX.match(path):
            return self.get_response(request)

        # Everything else redirect -> home
        return redirect("/")
