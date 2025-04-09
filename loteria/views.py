from django.shortcuts import render
from registro.models import Profile

# Create your views here.

def vista_alguna(request):
    perfil = Profile.objects.get(user=request.user)
    return render(request, 'loteria.html', {'theme': perfil.theme})