from django.shortcuts import render
from registro.models import Profile
from django.contrib.auth.decorators import login_required
from ejercicio.models import PalabraUsuario, Palabra
import random
from django.conf import settings
import json

@login_required
def pagina(request):
    user = request.user
    perfil = Profile.objects.get(user=user)

    # Obtener las últimas 10 palabras practicadas por el usuario
    relaciones_repaso = PalabraUsuario.objects.filter(usuario=perfil).select_related('palabra').order_by('-fecha_completada')[:10]
    
    # Mezclar el orden
    relaciones_repaso = list(relaciones_repaso)
    random.shuffle(relaciones_repaso)

    # Preparar los datos para el template
    palabras_data = []
    for relacion in relaciones_repaso:
        palabra = relacion.palabra
        gesto_url = f"{settings.MANITO_BUCKET_DOMAIN}/{palabra.gesto}" if palabra.gesto else None
        
        palabras_data.append({
            'id': palabra.id,
            'texto': palabra.palabra,
            'gesto_url': gesto_url,
            'is_video': bool(palabra.gesto and palabra.gesto.lower().endswith('.mp4')),
            'json_url': f'landmarks/{palabra.palabra}.json'
        })

    contexto = {
        'palabras': palabras_data,
        'palabras_json': json.dumps(palabras_data),  # Convertimos a JSON seguro
        'theme': request.session.get('theme', 'light')
    }
    
    return render(request, 'repaso.html', contexto)

@login_required
def estadisticas(request):
    # Aquí puedes agregar la lógica para mostrar estadísticas
    contexto = {
        'theme': request.session.get('theme', 'light')
    }
    return render(request, 'estadisticas.html', contexto)