from django.shortcuts import render
from registro.models import Profile 

# Create your views here.
def eje1(request):
    return render(request, 'ejercicio1.html')

def eje2(request):
    return render(request, 'ejercicio2.html')

def eje3(request):
    return render(request, 'ejercicio3.html')

def eje4(request):
    return render(request, 'ejercicio4.html')

def eje5(request):
    return render(request, 'ejercicio5.html')

def vista_alguna(request):
    perfil = Profile.objects.get(user=request.user)
    return render(request, 'ejercicio1.html', {'theme': perfil.theme})