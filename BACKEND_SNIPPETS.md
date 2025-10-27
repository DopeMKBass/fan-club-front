Django backend snippets for the frontend (messages + auth)

1. Simple messages view (function-based, no auth)

```python
# views.py
from django.http import JsonResponse
from django.views.decorators.http import require_GET

@require_GET
def messages_list(request):
    # Replace with real DB lookups. Return a list of message dicts.
    sample = [
        {"id": 1, "text": "Hey, how are you?", "sender": "Alice", "timestamp": "2025-10-26T12:34:00Z"},
        {"id": 2, "text": "All good — heading out soon.", "sender": "Bob", "timestamp": "2025-10-26T12:40:00Z"},
    ]
    return JsonResponse(sample, safe=False)
```

2. URL (urls.py)

```python
# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api/messages', views.messages_list, name='messages_list'),
]
```

3. CORS (settings.py) — development

Install the middleware:

```bash
pip install django-cors-headers
```

Then in `settings.py`:

```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
    # ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... other middleware ...
]

# Allow your dev frontend origin (Vite default is http://localhost:5173)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
]
# For quick testing you can allow all origins (not recommended for production)
# CORS_ALLOW_ALL_ORIGINS = True
```

4. CSRF and auth notes

- GET requests (like `/api/messages`) do not require CSRF tokens.
- For POST/PUT/DELETE with session auth you must include the CSRF token from the cookie and send it in the `X-CSRFToken` header.
- For APIs it's common to use token-based auth (JWT) instead of session+CSRF for ease with single-page frontends.

5. Example: messages with Django REST Framework (DRF) and protected endpoint

```python
# serializers.py
from rest_framework import serializers

class MessageSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    text = serializers.CharField()
    sender = serializers.CharField(required=False)
    timestamp = serializers.DateTimeField(required=False)

# views.py (DRF)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])  # protect the endpoint
def messages_list(request):
    # SELECT ... from your DB
    sample = [
        {"id": 1, "text": "Hey", "sender": "Alice", "timestamp": "2025-10-26T12:34:00Z"},
    ]
    return Response(sample)
```

6. Authentication example using djangorestframework-simplejwt (recommended for JWT)

Install:

```bash
pip install djangorestframework djangorestframework-simplejwt
```

Add to `settings.py`:

```python
INSTALLED_APPS += [
    'rest_framework',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}
```

Add token views to your URL config:

```python
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns += [
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
```

If you want a sign-up endpoint that creates a user and returns tokens (example):

```python
# views.py
from django.contrib.auth.models import User
from django.views.decorators.http import require_POST
from django.http import JsonResponse, HttpResponseBadRequest
from rest_framework_simplejwt.tokens import RefreshToken
import json

@require_POST
def signup(request):
    try:
        body = json.loads(request.body)
        username = body.get('username')
        password = body.get('password')
        if not username or not password:
            return HttpResponseBadRequest('username and password required')
        if User.objects.filter(username=username).exists():
            return HttpResponseBadRequest('username taken')
        user = User.objects.create_user(username=username, password=password)
        refresh = RefreshToken.for_user(user)
        return JsonResponse({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {'username': user.username},
        })
    except Exception as e:
        return HttpResponseBadRequest(str(e))
```

Route it:

```python
path('api/auth/signup/', views.signup, name='signup')
```

7. Frontend expectations & tips

- Frontend (the React app) should POST JSON to `/api/auth/login/` or `/api/auth/token/` (simplejwt TokenObtainPairView expects `{'username':..., 'password':...}` and returns `{'access':..., 'refresh':...}`).
- Store the `access` token on the client (e.g., localStorage) and send `Authorization: Bearer <token>` with API requests.
- For long sessions implement token refresh using the refresh token and `/api/auth/token/refresh/`.
- For session auth (Django default) use CSRF tokens for non-GET requests.

8. Example minimal `urls.py` for a simple app

```python
from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('api/messages', views.messages_list, name='messages_list'),
    path('api/auth/signup/', views.signup, name='signup'),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
```

9. Quick testing with curl (obtain token then call messages):

```bash
# obtain token
curl -X POST http://localhost:8000/api/auth/token/ -H 'Content-Type: application/json' -d '{"username":"alice","password":"secret"}'

# call protected messages endpoint
curl -H "Authorization: Bearer <ACCESS_TOKEN>" http://localhost:8000/api/messages
```

10. Security notes

- Never store long-lived refresh tokens in localStorage for production without thinking about XSS risk. Use httpOnly cookies where possible.
- Use HTTPS in production and set secure cookie flags.
- Validate and rate-limit authentication endpoints.

If you'd like, I can:

- create these view files directly in a Django repo (if you point me at it),
- add a simple DRF-based messages ViewSet and router,
- or provide a Docker-compose example that starts Django and the frontend together.

---

Django backend snippets for the frontend

1. Simple messages view (views.py)

```python
from django.http import JsonResponse
from django.views.decorators.http import require_GET

@require_GET
def messages_list(request):
    # Replace with real DB lookups. Return a list of message dicts.
    sample = [
        {"id": 1, "text": "Hey, how are you?", "sender": "Alice", "timestamp": "2025-10-26T12:34:00Z"},
        {"id": 2, "text": "All good — heading out soon.", "sender": "Bob", "timestamp": "2025-10-26T12:40:00Z"},
    ]
    return JsonResponse(sample, safe=False)
```

2. URL (urls.py)

```python
from django.urls import path
from . import views

urlpatterns = [
    path('api/messages', views.messages_list, name='messages_list'),
]
```

3. CORS (settings.py) — development

Install: `pip install django-cors-headers`

```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
    # ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... other middleware ...
]

# Allow your dev frontend origin (Vite default is http://localhost:5173)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
]
# For quick testing you can allow all origins (not recommended for production)
# CORS_ALLOW_ALL_ORIGINS = True
```

4. Notes on CSRF and auth

- GET requests (like `/api/messages`) do not require CSRF tokens.
- For POST/PUT/DELETE with session auth you must include the CSRF token from the cookie and send it in the `X-CSRFToken` header.
- Consider token-based auth (JWT) if you prefer stateless APIs for the frontend.

5. Example: DRF view
   If you're using Django REST Framework, use a simple APIView or ViewSet and register `/api/messages/` with a router, returning serialized message objects.

---

Paste these snippets into your Django app. If you'd like, I can open a PR (or create files) in your Django repo if you provide its path or repo access details.
