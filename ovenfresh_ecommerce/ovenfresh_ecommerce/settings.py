import os
from pathlib import Path
from utils.encrypt_decrypt import base64_to_text, text_to_base64


BASE_DIR = Path(__file__).resolve().parent.parent


SECRET_KEY = 'django-insecure-gleph66w7g-eh2i&_#uz+pv-*@n3py5fw%*oc$bwh+v+kb=3g#'


DEBUG = True

ALLOWED_HOSTS = ['*']


# Feature Flags
ENABLE_PINCODE_LOGIC = False  # Set to True to enable pincode-based availability


X_FRAME_OPTIONS = 'SAMEORIGIN'
# X_FRAME_OPTIONS = 'ALLOWALL'
# CORS_ALLOW_ALL_ORIGINS = True  # allow fetch/ajax from anywhere

AUTH_USER_MODEL = 'UserDetail.User'


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'UserDetail',
    'Cart',
    'Order',
    'Delivery',
    'Product',
    'Analytics',
    'FrontEnd',
    'Cms'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'ovenfresh_ecommerce.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR, 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ovenfresh_ecommerce.wsgi.application'


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Kolkata'

USE_I18N = True

USE_TZ = True


STATIC_URL = 'static/'
STATICFILES_DIRS = [
   os.path.join(BASE_DIR, 'static'),
]
# STATIC_ROOT = os.path.join(BASE_DIR, 'static')


MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR,'media')


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Spandan
# RAZORPAY_KEY_ID = base64_to_text("cnpwX3Rlc3RfaUpJM3RCR2puVDRIbG0=")
# RAZORPAY_KEY_SECRET = base64_to_text("MFBaRUlRNVZMVjJlb0ZqYmhCcU9CZHVv")

# Divyam
# RAZORPAY_KEY_ID = base64_to_text("cnpwX3Rlc3RfWER3WVdFNGxpY1BEcHU=")
# RAZORPAY_KEY_SECRET = base64_to_text("WnBBMmVqTGdZcU42emh0Z1pRU3k1TXBI")

RAZORPAY_KEY_ID = base64_to_text("cnpwX2xpdmVfUjVFMkdsQUtjeWVpZEQ=")
RAZORPAY_KEY_SECRET = base64_to_text("UkFYTXVZcGs2TEJkejcxTnBtTjRrVUdP")


# LOGGING = {
#     'version': 1,
#     'disable_existing_loggers': False,
#     'handlers': {
#         'file': {
#             'level': 'ERROR',
#             'class': 'logging.FileHandler',
#             'filename': 'django_errors.log',
#         },
#         'console': {
#             'level': 'DEBUG',
#             'class': 'logging.StreamHandler',
#         },
#     },
#     'loggers': {
#         'django': {
#             'handlers': ['file', 'console'],
#             'level': 'ERROR',
#             'propagate': True,
#         },
#         'ovenfresh': {
#             'handlers': ['file', 'console'],
#             'level': 'DEBUG',
#         },
#     },
# }