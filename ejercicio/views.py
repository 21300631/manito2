from django.shortcuts import render, redirect
from registro.models import Profile 
from .models import Leccion,  Instruccion, PalabraUsuario
import random
from django.http import HttpResponseForbidden, HttpResponse


def generarLeccion(request):
    import random
    from django.http import HttpResponseForbidden
    from django.shortcuts import redirect

    # datos del usuario
    usuario = request.user
    perfil = Profile.objects.get(user=usuario)
    leccion = int(request.GET.get('leccion_id', 0))

   

    # Validación
    if leccion > perfil.leccion:
        return HttpResponseForbidden("No tienes acceso a esta lección todavía.")
    
    # Obtener objetos relevantes
    leccion_obj = Leccion.objects.get(id=leccion)
    palabras_nuevas = list(leccion_obj.palabras.all()[:3])  # Aseguramos que sea lista

    

    # Obtener palabras de repaso
    relaciones_repaso = list(PalabraUsuario.objects.filter(usuario=perfil))
    palabras_repaso = []

    if len(relaciones_repaso) < 7:
        # No hay suficientes palabras para repaso: se rellenan con palabras nuevas
        palabras_repaso = palabras_nuevas.copy()

        # Añadir más palabras hasta tener 7
        while len(palabras_repaso) < 7:
            palabra_aleatoria = random.choice(palabras_nuevas)
            palabras_repaso.append(palabra_aleatoria)
    else:
        # Hay suficientes: seleccionamos 7 aleatorias de las ya practicadas
        todas_palabras_repaso = [rel.palabra for rel in relaciones_repaso]
        palabras_repaso = random.sample(todas_palabras_repaso, 7)

    # Instrucciones
    instrucciones_repaso = list(Instruccion.objects.exclude(tipo='gesto'))
    instruccion_gesto = Instruccion.objects.get(tipo='gesto')
    
    ejercicios = []

    # Primero: 3 ejercicios de gesto con palabras nuevas (en orden fijo)
    for palabra in palabras_nuevas:
        ejercicios.append({
            'palabra': palabra,
            'instruccion': instruccion_gesto,
            'texto_instruccion': instruccion_gesto.generar_texto(palabra.palabra)
        })

    # Luego: 7 ejercicios de repaso con instrucciones aleatorias
    for palabra in palabras_repaso:
        instruccion_aleatoria = random.choice(instrucciones_repaso)
        ejercicios.append({
            'palabra': palabra,
            'instruccion': instruccion_aleatoria,
            'texto_instruccion': instruccion_aleatoria.generar_texto(palabra.palabra)
        })

    # Guardar en sesión, sin mezclar (orden fijo: gesto -> repaso)
    request.session['ejercicios'] = [
        {
            'palabra': ejercicio['palabra'].id,
            'instruccion': ejercicio['instruccion'].tipo,
            'texto': ejercicio['texto_instruccion']
        } for ejercicio in ejercicios
    ]
    request.session['ejercicio_actual'] = 0

    print("Ejercicios guardados en la sesión:", request.session['ejercicios'])

    return redirect('mostrar_ejercicio')

def mostrar_ejercicio(request):
    # Verificar que exista la sesión de ejercicios
    if 'ejercicios' not in request.session:
        return redirect('alguna_vista_de_error')  # o handle this case appropriately
    
    ejercicios = request.session['ejercicios']
    index = request.session.get('ejercicio_actual', 0)
    
    print(f"Mostrando ejercicio {index + 1} de {len(ejercicios)}")  # Debug
    
    if index >= len(ejercicios):
        print("Todos los ejercicios completados")  # Debug
        return render(request, "finalizado.html")

    try:
        actual = ejercicios[index]
        instruccion_tipo = actual['instruccion']
        
        print(f"Redirigiendo a ejercicio de tipo: {instruccion_tipo}")  # Debug
        
        # Diccionario de redirecciones
        redirecciones = {
            'emparejar': 'ejercicio_emparejar',
            'seleccion': 'ejercicio_seleccion',
            'escribir': 'ejercicio_escribir',
            'gesto': 'ejercicio_gesto',
            'seleccion2': 'ejercicio_seleccion2',
            'completar': 'ejercicio_completar'
        }
        
        if instruccion_tipo not in redirecciones:
            return HttpResponse("Tipo de instrucción no reconocido", status=400)
            
        return redirect(redirecciones[instruccion_tipo])
        
    except Exception as e:
        print(f"Error al mostrar ejercicio: {str(e)}")  # Debug
        return HttpResponse(f"Error: {str(e)}", status=500)


def siguiente_ejercicio(request):
    request.session['ejercicio_actual'] += 1
    return redirect('mostrar_ejercicio')

