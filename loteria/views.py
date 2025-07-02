from django.shortcuts import render
from registro.models import Profile
from ejercicio.models import Palabra, Categoria, PalabraUsuario
import json
import random

from django.conf import settings
from django.shortcuts import redirect

def loteria(request):
    print("\n=== Vista de Lotería (Repaso) ===")
    usuario = request.user
    perfil = Profile.objects.get(user_id=usuario.id)
    
    if request.GET.get('completado') == '1':
        puntuacion = request.GET.get('puntuacion', 0)
        puntines = int(request.GET.get('puntuacion', 0))

        perfil.puntos += puntines
        perfil.save()
        return render(request, 'final_loteria.html', {
            'puntuacion': puntuacion,
            'categoria': Palabra.objects.filter(
                leccion_id=perfil.leccion
            ).first().categoria
        })
    
    categoria_actual = Palabra.objects.filter(
        leccion_id=perfil.leccion-1
    ).first().categoria
    
    palabras_repaso = Palabra.objects.filter(
        categoria=categoria_actual,
        palabras_usuario__usuario=perfil,
        leccion_id__lt=perfil.leccion
    ).distinct().order_by('?')[:12]
    
    gestos = []
    for palabra in palabras_repaso:
        gesto_url = palabra.gesto
        if not palabra.gesto.startswith(('http://', 'https://')):
            gesto_url = f"{settings.MANITO_BUCKET_DOMAIN}/{palabra.gesto}"
        
        gestos.append({
            'id': palabra.id,
            'palabra': palabra.palabra,
            'gesto': gesto_url,
            'es_video': palabra.gesto.lower().endswith('.mp4')
        })
    
    random.shuffle(gestos)

    context = {
        'palabras_repaso': palabras_repaso,
        'gestos_json': json.dumps(gestos),
        'categoria_repaso': categoria_actual,
        'bucket_domain': settings.MANITO_BUCKET_DOMAIN
    }

    return render(request, 'loteria.html', context)