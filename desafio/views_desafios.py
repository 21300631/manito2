from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
import random
from registro.models import Profile
from ejercicio.models import PalabraUsuario, Palabra

@login_required
def obtener_pares(request):
    try:
        # Verifica si el usuario tiene perfil
        if not hasattr(request.user, 'profile'):
            return JsonResponse({'error': 'Perfil no existe'}, status=400)
            
        perfil = request.user.profile
        
        # Obtener palabras del usuario
        palabras_usuario = PalabraUsuario.objects.filter(usuario=perfil)
        if not palabras_usuario.exists():
            return JsonResponse({'error': 'No hay palabras asignadas'}, status=404)
            
        palabras_ids = palabras_usuario.values_list('palabra_id', flat=True)
        palabras = list(Palabra.objects.filter(id__in=palabras_ids))
        
        if not palabras:
            return JsonResponse({'error': 'No se encontraron palabras'}, status=404)

        random.shuffle(palabras)
        
        # Filtrar solo imágenes válidas
        pares = []
        for p in palabras[:6]:  # Limitar a 6
            if p.gesto and hasattr(p.gesto, 'url'):
                pares.append({
                    'palabra': p.palabra,
                    'imagen': request.build_absolute_uri(p.gesto.url)
                })

        return JsonResponse({'pares': pares})

    except Exception as e:
        # Log del error para diagnóstico
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error en obtener_pares: {str(e)}", exc_info=True)
        return JsonResponse({'error': 'Error interno'}, status=500)