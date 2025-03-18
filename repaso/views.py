from django.shortcuts import render

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