from functools import wraps
from rest_framework.response import Response
from rest_framework import status

def check_authentication(required_role=None):
    '''Checks if user is logged in or not
    If required_role is passed than will check for that as well'''
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(self, request, *args, **kwargs):
            user = request.user

            if not user.is_authenticated:
                return Response(
                    {
                        "success": False,
                        "user_not_logged_in": True,
                        "user_unauthorized": False,
                        "data": None,
                        "error": "User not authenticated"
                    }, status=status.HTTP_400_BAD_REQUEST
                )

            if required_role and getattr(user, "role", None) != required_role:
                return Response(
                    {
                        "success": False,
                        "user_not_logged_in": False,
                        "user_unauthorized": True,
                        "data": None,
                        "error": f"User role must be {required_role}"
                    }, status=status.HTTP_403_FORBIDDEN
                )

            return view_func(self, request, *args, **kwargs)

        return _wrapped_view
    return decorator

def handle_exceptions(view_func):
    """Decorator to handle exceptions in API views"""
    @wraps(view_func)
    def _wrapped_view(self, request, *args, **kwargs):
        try:
            return view_func(self, request, *args, **kwargs)
        except Exception as ex:
            # logger.error(ex, exc_info=True)
            print(ex)
            return Response(
                {
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": None,
                    "error": str(ex)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    return _wrapped_view
