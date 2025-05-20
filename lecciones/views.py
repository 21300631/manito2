from django.shortcuts import render, redirect
from registro.models import Profile


# Create your views here.
    
def etapa1(request):
    usuario = request.user
    profile = Profile.objects.get(user=usuario)
    leccion_actual = profile.leccion  # Suponiendo que guardas la última lección alcanzada

    lecciones_etapa1 = list(range(1, 39)) + [101, 102, 103, 104]

    
    # Inicializa todas las lecciones como bloqueadas
    lecciones_estado = {i: 'bloqueada' for i in lecciones_etapa1 } # Ajusta el rango según tus lecciones
    
    # Marcar lecciones completadas (todas las anteriores a la actual)
    for i in range(1, leccion_actual):
        lecciones_estado[i] = 'completada'
    
    # Marcar lección actual
    if leccion_actual <= max(lecciones_estado.keys()):
        lecciones_estado[leccion_actual] = 'en-progreso'
    
    # Opcional: forzar desbloqueo de la primera si todas están bloqueadas
    if all(status == 'bloqueada' for status in lecciones_estado.values()):
        lecciones_estado[1] = 'en-progreso'
    
    return render(request, 'etapa1.html', {
        'lecciones_estado': lecciones_estado,
        'theme': profile.theme if hasattr(profile, 'theme') else 'light'
    })       

def etapa2(request):
    usuario = request.user
    profile = Profile.objects.get(user=usuario)
    leccion_actual = profile.leccion
    
    # Lecciones de la etapa 2 (IDs del 39 al 60 y repasos 201-202)
    lecciones_etapa2 = list(range(39, 61)) + [201, 202]
    
    # Inicializa todas como bloqueadas
    lecciones_estado = {i: 'bloqueada' for i in lecciones_etapa2}
    
    # Marcar completadas (las anteriores a la actual en esta etapa)
    for i in range(34, leccion_actual):
        if i in lecciones_estado:
            lecciones_estado[i] = 'completada'
    
    # Marcar lección actual
    if leccion_actual in lecciones_estado:
        lecciones_estado[leccion_actual] = 'en-progreso'
    
    # Forzar primera lección si todas están bloqueadas
    if all(status == 'bloqueada' for status in lecciones_estado.values()):
        lecciones_estado[34] = 'en-progreso'
    
    return render(request, 'etapa2.html', {
        'lecciones_estado': lecciones_estado,
        'theme': profile.theme if hasattr(profile, 'theme') else 'light'
    })

def etapa3(request):
    usuario = request.user
    profile = Profile.objects.get(user=usuario)
    leccion_actual = profile.leccion
    
    # Lecciones de la etapa 3 (IDs del 54 al 107 y repasos 301-304)
    lecciones_etapa3 = list(range(61, 116)) + [301, 302, 303, 304]
    
    # Inicializa todas como bloqueadas
    lecciones_estado = {i: 'bloqueada' for i in lecciones_etapa3}
    
    # Marcar completadas (las anteriores a la actual en esta etapa)
    for i in range(56, leccion_actual):
        if i in lecciones_estado:
            lecciones_estado[i] = 'completada'
    
    # Marcar lección actual
    if leccion_actual in lecciones_estado:
        lecciones_estado[leccion_actual] = 'en-progreso'
    
    # Forzar primera lección si todas están bloqueadas
    if all(status == 'bloqueada' for status in lecciones_estado.values()):
        lecciones_estado[54] = 'en-progreso'
    
    return render(request, 'etapa3.html', {
        'lecciones_estado': lecciones_estado,
        'theme': profile.theme if hasattr(profile, 'theme') else 'light'
    })



def etapa4(request):
    usuario = request.user
    profile = Profile.objects.get(user=usuario)
    leccion_actual = profile.leccion
    
    # Rango de lecciones (110-164) y repasos (401-405)
    rango_lecciones = list(range(116, 165))
    repasos = [401, 402, 403, 404, 405]
    
    # Inicializar todas como bloqueadas
    lecciones_estado = {leccion: 'bloqueada' for leccion in rango_lecciones + repasos}
    
    # Si viene de etapa anterior, comenzar en 110
    if leccion_actual < 110:
        leccion_actual = 110
        profile.leccion = 110
        profile.save()
    
    # Marcar completadas
    for leccion in rango_lecciones:
        if leccion < leccion_actual:
            lecciones_estado[leccion] = 'completada'
    
    # Marcar actual
    if leccion_actual in lecciones_estado:
        lecciones_estado[leccion_actual] = 'en-progreso'
    
    return render(request, 'etapa4.html', {
        'lecciones_estado': lecciones_estado,
        'theme': profile.theme if hasattr(profile, 'theme') else 'light'
    })
