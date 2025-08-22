from django.shortcuts import redirect

class FrontendRewriteMiddleware:
    """
    Custom rules for frontend routing:
    - /product-category/... -> /shop/...
    - Allowed frontend paths -> pass through
    - Anything else -> redirect /
    """

    FRONTEND_ALLOWED = [
        "shop",
        "refund-policy",
        "contact-us",
        "product",
        "cart",
        "checkout",
        "order-success",
        "order-detail",
        "account",
        "admin-template",
        "admin-dashboard",
        "admin-home-cms",
        "admin-cms",
        "admin-products",
        "admin-add-product",
        "admin-category",
        "admin-pincodes",
        "admin-timeslot",
        "admin-coupon",
        "admin-delivery-person",
        "admin-all-orders",
        "admin-add-order",
        "admin-order-detail",
        "admin-pincode-order",
        "admin-review",
        "delivery-login",
        "delivery-dashobard",


        "user-api",
        "cart-api",
        "order-api",
        "delivery-api",
        "product-api",
        "analytics-api",
        "cms-api",
        "django-admin",
        "sitemap.xml",
        "robots.txt",
        "media",
        "static",
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path_info.strip("/")  # e.g. "shop/abc"
        segments = path.split("/") if path else []

        # Empty path "/" -> home allowed
        if not segments or not segments[0]:
            return self.get_response(request)

        # 1. Rewrite product-category -> shop
        if segments[0] == "product-category":
            new_path = "/shop/" + "/".join(segments[1:])
            if not new_path.endswith("/"):
                new_path += "/"
            return redirect(new_path)

        # 2. Allowed frontend paths -> let it go
        if segments[0] in self.FRONTEND_ALLOWED:
            return self.get_response(request)

        # 3. Everything else -> redirect to home
        return redirect("/")
