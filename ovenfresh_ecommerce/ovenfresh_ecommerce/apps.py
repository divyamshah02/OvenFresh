# ovenfresh_ecommerce/apps.py
from django.apps import AppConfig


class OvenfreshEcommerceConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ovenfresh_ecommerce"

    def ready(self):
        from auditlog.registry import auditlog
        from django.apps import apps

        # Exclude auditlog's own model(s) or any others you don't want
        exclude_models = {"LogEntry"}

        # Loop through all installed apps & models
        for model in apps.get_models():
            model_name = model.__name__
            app_label = model._meta.app_label

            # Skip auditlog’s own models
            if app_label == "auditlog" or model_name in exclude_models:
                continue

            try:
                auditlog.register(model)
            except Exception:
                # If already registered or incompatible, just skip
                pass
