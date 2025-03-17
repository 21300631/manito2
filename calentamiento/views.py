from django.shortcuts import render

# Create your views here.
def calentamientoPage(request):
    return render(request, 'calentamiento.html')