from django.shortcuts import render
from registro.models import Profile

# Create your views here.
def calentamientoPage(request):
    return render(request, 'calentamiento.html')

def vista_alguna(request):
    perfil = Profile.objects.get(user=request.user)
    return render(request, 'calentamiento.html', {'theme': perfil.theme})