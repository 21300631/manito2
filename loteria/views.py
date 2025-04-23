from django.shortcuts import render
from registro.models import Profile

# Create your views here.

def loteria(request):
    return render(request, 'loteria.html')