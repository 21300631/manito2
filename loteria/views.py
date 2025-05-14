from django.shortcuts import render
from registro.models import Profile
from ejercicio.models import PalabraUsuario, Palabra

# Create your views here.

def loteria(request):
    usuario = request.user
    perfil = Profile.objects.get(user=usuario)
    leccion_actual = perfil.leccion
    referencia = Palabra.objects.get(leccion=leccion_actual)
    categoria_actual = referencia.categoria_id

    # Ejemplo con dos filtros (lección anterior Y otro criterio)
    palabras_originales = list(Palabra.objects.filter(
        leccion_id__lt=leccion_actual,
        categotria_id=categoria_actual  # tu segundo filtro aquí
    ))

    for p in palabras_originales:
        print("palabras: ", p.palabra)

    return render(request, 'loteria.html')
