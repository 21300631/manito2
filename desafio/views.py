from django.shortcuts import render

# Create your views here.

def contrarreloj(request):
    return render(request, 'contrarreloj.html')

def memorama(request):
    return render(request, 'memorama.html')

def relacion(request):
    return render(request, 'relacion.html')