from django.shortcuts import render, redirect
from registro.models import Profile
from django.contrib.auth.decorators import login_required
from ejercicio.models import PalabraUsuario, Palabra
import random
from django.conf import settings
import json
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt

@login_required
def pagina(request):
    user = request.user
    perfil = Profile.objects.get(user=user)
    
    ejercicio_actual = request.session.get('ejercicio_actual', 0)
    palabras_ids_vistas = request.session.get('palabras_ids_vistas', [])
    
    # Obtener relaciones para repaso (excluyendo vistas)
    relaciones_repaso = PalabraUsuario.objects.filter(usuario=perfil)\
                             .exclude(palabra__id__in=palabras_ids_vistas)\
                             .select_related('palabra')\
                             .order_by('-fecha_completada')[:10]
    
    # Convertir a lista solo si hay resultados
    if not relaciones_repaso:
        # Limpiar sesión y redirigir si no hay más palabras
        request.session.pop('ejercicio_actual', None)
        request.session.pop('palabras_ids_vistas', None)
        return redirect('estadisticas')
    
    # Solo mezclar si es el primer ejercicio (ejercicio_actual == 0)
    if ejercicio_actual == 0:
        relaciones_repaso = list(relaciones_repaso)
        random.shuffle(relaciones_repaso)
        request.session['palabras_ids_vistas'] = [r.palabra.id for r in relaciones_repaso]
    
    # Verificar que el índice sea válido
    if ejercicio_actual >= len(relaciones_repaso):
        request.session.pop('ejercicio_actual', None)
        return redirect('estadisticas')
    
    # Preparar datos de la palabra actual
    palabra_actual = relaciones_repaso[ejercicio_actual].palabra
    palabras_data = [{
        'id': palabra_actual.id,
        'texto': palabra_actual.palabra,
        'gesto_url': f"{settings.MANITO_BUCKET_DOMAIN}/{palabra_actual.gesto}" if palabra_actual.gesto else None,
        'is_video': bool(palabra_actual.gesto and palabra_actual.gesto.lower().endswith('.mp4')),
        'json_url': f'landmarks/{palabra_actual.palabra}.json'
    }]
    
    # Incrementar contador para la próxima solicitud
    request.session['ejercicio_actual'] = ejercicio_actual + 1
    request.session.modified = True
    
    contexto = {
        'palabras': palabras_data,
        'palabras_json': json.dumps(palabras_data, ensure_ascii=False),
        'current_word_id': palabra_actual.id,
        'theme': request.session.get('theme', 'light'),
        'progreso': {
            'actual': ejercicio_actual + 1,
            'total': min(10, len(relaciones_repaso))
        },
        'estadisticas_url': '/estadisticas/'
    }
    
    return render(request, 'repaso.html', contexto)

@csrf_exempt
@login_required
def siguiente(request):
    if request.method == 'POST':
        palabra_id = request.POST.get('palabra_id')
        # Aquí puedes registrar el éxito en la base de datos si lo necesitas
        print(f"Ejercicio completado para palabra ID: {palabra_id}")
    return redirect('pagina')

@login_required
def noRecuerda(request):
    # Inicializar contador si no existe
    if 'no_recuerda' not in request.session:
        request.session['no_recuerda'] = 0
    
    request.session['no_recuerda'] += 1
    request.session.modified = True
    return redirect('pagina')

@login_required
@require_GET
def estadisticas(request):
    contexto = {
        'theme': request.session.get('theme', 'light')
    }
    return render(request, 'estadisticas.html', contexto)