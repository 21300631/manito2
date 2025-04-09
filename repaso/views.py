from django.shortcuts import render
from registro.models import Profile

# Create your views here.
def pagina(request):
    return render(request, 'repaso.html')

def eje1(request):
    return render(request, 'rejercicio1.html')

def eje2(request):
    return render(request, 'rejercicio2.html')

def eje3(request):
    return render(request, 'rejercicio3.html')

def eje4(request):
    return render(request, 'rejercicio4.html')

def eje5(request):
    return render(request, 'rejercicio5.html')

def vista_alguna(request):
    perfil = Profile.objects.get(user=request.user)
    return render(request, 'repaso.html', {'theme': perfil.theme})