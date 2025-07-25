"""
Django settings for manito project.

Generated by 'django-admin startproject' using Django 5.1.6.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""
import os
from dotenv import load_dotenv  # Si usas python-dotenv
from pathlib import Path
import os
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv()


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

SESSION_COOKIE_AGE = 1209600  # 2 semanas en segundos
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_SAVE_EVERY_REQUEST = True


LOGIN_URL = '/login/'  # URL donde está el login
LOGIN_REDIRECT_URL = 'inicio_global'  # Nombre de la URL a donde redirigir tras login
LOGOUT_REDIRECT_URL = '/login/'  # Para redirigir después de logout

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', default="$jr*_hqwl3k(3r+(a7y")
#'django-insecure-g3mr!rkd9s-9$(bstwm^5@r-^yq1g)=$jr*_hqwl3k(3r+(a7y'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = 'RENDER' not in os.environ

ALLOWED_HOSTS = ['*']

RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)


STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]
# Application definition

INSTALLED_APPS = [
    'registro',  # Aplicación de registro
    'login',  # Aplicación de inicio de sesión
    'inicio',  # Aplicación de inicio
    'calentamiento',  # Aplicación de calentamiento
    'perfil',  # Aplicación de perfil
    'publicacion',  # Aplicación de publicación
    'foro',  # Aplicación de foro
    'desafio', # Aplicación de desafíos
    'ejercicio', # Aplicación de ejercicios
    'lecciones', # Aplicación de lecciones
    'loteria', # Aplicación de lotería de repaso
    'repaso', # Aplicación de repaso
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'storages',
    'django_extensions',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'manito.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',

                'perfil.context_processors.theme_context'
            ],
        },
    },
]

WSGI_APPLICATION = 'manito.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

import dj_database_url
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),  # Usa la variable de Render
        conn_max_age=600  # Conexiones persistentes
    )
}


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

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


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'America/Mexico_City'


USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/
STATIC_URL = '/static/'

if not DEBUG:
    STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Configurar archivos estáticos y plantillas

# settings.py
MEDIA_URL = '/media/'  # URL pública para medios
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')  # Ruta absoluta al directorio media/





# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Credenciales comunes AWS
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_S3_REGION_NAME = 'us-east-1'

# Configuración para el bucket de posts de usuarios (post-manito)
AWS_STORAGE_BUCKET_POST = 'post-manito'
AWS_S3_CUSTOM_DOMAIN_POST = f'{AWS_STORAGE_BUCKET_POST}.s3.amazonaws.com'

# Configuración para el bucket de imágenes del sistema (manito-bucket1)
MANITO_BUCKET = 'manito-bucket1'
MANITO_BUCKET_DOMAIN = f'https://{MANITO_BUCKET}.s3.amazonaws.com'

# Configuración común
AWS_DEFAULT_ACL = None
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',
}
AWS_S3_FILE_OVERWRITE = False  # Importante para evitar sobrescritura