from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from django.contrib.auth.models import User  

def inicioSesion(request):
    return render(request, 'login.html')

@csrf_exempt
def login_usuario(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        
        print(f"Usuario: {username}, Contraseña: {password}")  

        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)  
            messages.success(request, f"¡Bienvenido, {user.username}!")
            return redirect("/inicio/")  
        else:
            return render(request, "login.html", {"error": "Usuario o contraseña incorrectos"})

    return render(request, "login.html")
