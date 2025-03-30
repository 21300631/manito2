from django.shortcuts import render

# Create your views here.

def etapa1(request):
    return render(request, 'etapa1.html')

def etapa2(request):
    return render(request, 'etapa2.html')

def etapa3(request):
    return render(request, 'etapa3.html')