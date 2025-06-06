from django.shortcuts import render, redirect
from registro.models import Profile
from django.contrib.auth.decorators import login_required
from ejercicio.models import PalabraUsuario, Palabra
import random
from django.conf import settings
import json
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.templatetags.static import static  # Importar para manejar URLs estáticas


@login_required
def iniciar_repaso(request):
    user = request.user
    perfil = Profile.objects.get(user=user)

    keys = ['repaso_palabras', 'repaso_index', 'repas_errores']
    for key in keys:
        if key in request.session:
            del request.session[key]

    # Obtener palabras para repaso (optimizado)
    palabras_repaso = PalabraUsuario.objects.filter(usuario=perfil)\
                          .select_related('palabra')\
                          .order_by('?')[:10]  # Orden aleatorio y límite 10
    
    if not palabras_repaso.exists():
        return redirect('no_hay_palabras')
    
    # Crear lista de IDs de palabras
    palabras_ids = [rel.palabra.id for rel in palabras_repaso]
    
    # Debug: imprimir palabras seleccionadas
    palabras_seleccionadas = Palabra.objects.filter(id__in=palabras_ids)
    print("Palabras seleccionadas para repaso:")
    for palabra in palabras_seleccionadas:
        print(f"- {palabra.palabra} (ID: {palabra.id})")
    
    # Guardar en sesión
    request.session.update({
        'repaso_palabras': palabras_ids,
        'repaso_index': 0,
        'repaso_errores': [],
        'repaso_iniciado': True
    })
    
    request.session.modified = True
    
    return redirect('mostrar_ejercicio_repaso')


@csrf_exempt
@login_required
def siguiente_ejercicio_repaso(request):
    print(f"Solicitud recibida - Método: {request.method}")
    
    if not request.session.get('repaso_iniciado', False):
        print("Error: No hay sesión de repaso activa")
        return JsonResponse({'status': 'error', 'message': 'Sesión no iniciada'}, status=400)
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print(f"Datos recibidos: {data}")
            
            if data.get('error', False):
                current_index = request.session.get('repaso_index', 0)
                print(f"Registrando error en índice: {current_index}")
                
                errores = request.session.get('repaso_errores', [])
                errores.append(current_index)
                request.session['repaso_errores'] = errores
                
            current_index = request.session.get('repaso_index', 0)
            request.session['repaso_index'] = current_index + 1
            request.session.modified = True
            
            palabras_ids = request.session.get('repaso_palabras', [])
            if request.session['repaso_index'] >= len(palabras_ids):
                return JsonResponse({
                    'status': 'completed',
                    'redirect_url': '/repaso/finalizar/'
                })
            
            return JsonResponse({
                'status': 'success',
                'redirect_url': '/repaso/ejercicio/'
            })
                
        except Exception as e:
            print(f"Error procesando POST: {str(e)}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)


@login_required
def mostrar_ejercicio_repaso(request):
    """Muestra el ejercicio actual del repaso"""
    if not request.session.get('repaso_iniciado', False):
        print("Redirigiendo a iniciar_repaso desde mostrar_ejercicio_repaso - Sesión no iniciada")
        return redirect('iniciar_repaso')
    
    palabras_ids = request.session.get('repaso_palabras', [])
    index = request.session.get('repaso_index', 0)
    
    print(f"Estado actual - Index: {index}, Palabras IDs: {palabras_ids}")

    if index >= len(palabras_ids):
        print("Redirigiendo a finalizar_repaso - Índice excedido")
        return redirect('finalizar_repaso')
    
    try:
        palabra_actual = Palabra.objects.get(id=palabras_ids[index])
        print(f"Mostrando ejercicio {index + 1}/{len(palabras_ids)}: {palabra_actual.palabra}")
    except Palabra.DoesNotExist:
        print(f"Palabra con ID {palabras_ids[index]} no existe, avanzando...")
        request.session['repaso_index'] += 1
        request.session.modified = True
        return redirect('mostrar_ejercicio_repaso')
    
    # Construir URL del JSON usando static
    json_filename = f"{palabra_actual.palabra}.json"
    json_url = static(f'landmarks/{json_filename}')
    
    # Preparar datos de la palabra
    palabra_data = {
        'id': palabra_actual.id,
        'texto': palabra_actual.palabra,
        'gesto_url': f"{settings.MANITO_BUCKET_DOMAIN}/{palabra_actual.gesto}" if palabra_actual.gesto else None,
        'is_video': bool(palabra_actual.gesto and palabra_actual.gesto.lower().endswith('.mp4')),
        'json_url': json_url  # Usamos la URL generada con static
    }
    
    contexto = {
        'palabra': palabra_data,
        'palabra_json': json.dumps(palabra_data, ensure_ascii=False),
        'progreso': {
            'actual': index + 1,
            'total': len(palabras_ids)
        },
        'tipo_ejercicio': 'repaso',
        'es_ultimo_ejercicio': (index + 1) >= len(palabras_ids)
    }
    
    return render(request, 'repaso.html', contexto)


@csrf_exempt
@login_required
def noRecuerdo(request):
    """Maneja el caso de 'no recuerdo' en el repaso"""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)
    
    if 'repaso_index' not in request.session or 'repaso_palabras' not in request.session:
        return JsonResponse({'status': 'error', 'message': 'Sesión no iniciada'}, status=400)
    
    try:
        data = json.loads(request.body)
        palabra_id = data.get('palabra_id')
        
        # Registrar error
        index = request.session['repaso_index']
        errores = request.session.get('repaso_errores', [])
        errores.append(index)
        request.session['repaso_errores'] = errores
        
        # Avanzar al siguiente ejercicio
        request.session['repaso_index'] += 1
        request.session.modified = True
        
        # Verificar si hemos terminado
        palabras_ids = request.session.get('repaso_palabras', [])
        if request.session['repaso_index'] >= len(palabras_ids):
            return JsonResponse({
                'status': 'completed',
                'redirect_url': '/repaso/finalizar/'
            })
        
        return JsonResponse({
            'status': 'success',
            'message': 'Error registrado',
            'next_url': '/repaso/mostrar/'
        })
        
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
def finalizar_repaso(request):
    """Muestra las estadísticas finales del repaso"""
    if 'repaso_palabras' not in request.session:
        return redirect('iniciar_repaso')
    
    total = len(request.session['repaso_palabras'])
    errores = len(request.session.get('repaso_errores', []))
    aciertos = total - errores
    
    contexto = {
        'total_ejercicios': total,
        'ejercicios_correctos': aciertos,
        'ejercicios_incorrectos': errores,
        'porcentaje_acierto': (aciertos / total * 100) if total > 0 else 0,
        'tipo_repaso': 'general'
    }
    
    # Limpiar la sesión
    request.session.pop('repaso_palabras', None)
    request.session.pop('repaso_index', None)
    request.session.pop('repaso_errores', None)
    request.session.modified = True
    
    return render(request, 'estadisticas.html', contexto)


@login_required
def no_hay_palabras(request):
    """Vista para cuando no hay palabras para repasar"""
    return render(request, 'estadisticas.html')