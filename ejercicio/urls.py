from django.urls import path
from .views import  eje1, eje2, eje3, eje4, eje5

urlpatterns = [
    path('e01/', eje1),
    path('e02/', eje2),
    path('e03/', eje3),
    path('e04/', eje4),
    path('e05/', eje5)

]