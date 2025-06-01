from django.shortcuts import render, redirect
from registro.models import Profile 
from .models import Leccion,  Instruccion, PalabraUsuario
import random
from django.http import HttpResponseForbidden, HttpResponse


def generarLeccion(request):
    usuario = request.user
    perfil = Profile.objects.get(user=usuario)
    leccion = int(request.GET.get('leccion_id', 0))

    if leccion > perfil.leccion:
        return HttpResponseForbidden("No tienes acceso a esta lección todavía.")
    
    leccion_obj = Leccion.objects.get(id=leccion)
    palabras_nuevas = list(leccion_obj.palabras.all()[:3])  # 3 palabras nuevas

    # Obtener palabras de repaso 
    relaciones_repaso = list(PalabraUsuario.objects.filter(usuario=perfil))
    palabras_repaso = []
    
    if len(relaciones_repaso) >= 7:
        palabras_repaso = random.sample([rel.palabra for rel in relaciones_repaso], 7)
    else:
        # Si no hay suficientes, completar con palabras nuevas
        palabras_repaso = [rel.palabra for rel in relaciones_repaso]
        faltantes = 7 - len(palabras_repaso)
        palabras_repaso.extend(random.choices(palabras_nuevas, k=faltantes))

    # Instrucciones
    instrucciones_repaso = list(Instruccion.objects.exclude(tipo='gesto'))
    instruccion_gesto = Instruccion.objects.get(tipo='gesto')
    
    ejercicios = []

    # 3 ejercicios de gesto con palabras nuevas
    for palabra in palabras_nuevas:
        ejercicios.append({
            'palabra': palabra.id,  # Guardar solo el ID
            'instruccion': 'gesto',
            'texto': instruccion_gesto.generar_texto(palabra.palabra)
        })

    # 7 ejercicios de repaso con instrucciones aleatorias
    for palabra in palabras_repaso:
        instruccion = random.choice(instrucciones_repaso)
        ejercicios.append({
            'palabra': palabra.id,  # Guardar solo el ID
            'instruccion': instruccion.tipo,
            'texto': instruccion.generar_texto(palabra.palabra)
        })

    # Mezclar los ejercicios (excepto los primeros 3 de gesto si quieres mantener ese orden)
    ejercicios_repaso = ejercicios[3:]
    random.shuffle(ejercicios_repaso)
    ejercicios = ejercicios[:3] + ejercicios_repaso

    # Guardar en sesión
    request.session['ejercicios'] = ejercicios
    request.session['ejercicio_actual'] = 0
    request.session.modified = True

    print(f"Generados {len(ejercicios)} ejercicios:")  # Debug
    for i, ej in enumerate(ejercicios, 1):
        print(f"{i}. Palabra ID: {ej['palabra']}, Tipo: {ej['instruccion']}")

    return redirect('mostrar_ejercicio')

def mostrar_ejercicio(request):
    if 'ejercicios' not in request.session:
        return redirect('generarLeccion')  # o la vista apropiada
    
    ejercicios = request.session['ejercicios']
    index = request.session.get('ejercicio_actual', 0)
    
    # print(f"Ejercicio {index + 1} de {len(ejercicios)}")  Debug
    
    if index >= len(ejercicios):
        print("Todos los ejercicios completados")  # si el index es mayor que la long de los ejericicos se va a finalizado
        return render(request, "finalizado.html")

    try:
        actual = ejercicios[index]  # Obtener el ejercicio actual
        instruccion_tipo = actual['instruccion']
        
        
        redirecciones = { # redirecciones a las vistas de los ejercicios
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
    request.session['ejercicio_actual'] += 1 # Aumentar el índice del ejercicio actual
    
    # Aumentar el progreso en cada ejercicio
    if 'progreso' not in request.session:
        request.session['progreso'] = 0
    
    request.session['progreso'] = min(request.session['progreso'] + 10, 100)
    request.session.modified = True

    return redirect('mostrar_ejercicio')


def reiniciar_progreso(request):
    if request.method == "POST":
        usuario = request.session.get('usuario')
        foto_perfil = request.session.get('foto_perfil')


        # Reiniciar progreso y ejercicios
        request.session['progreso'] = 0
        request.session['ejercicio_actual'] = 0
        request.session.pop('ejercicios', None)  # Elimina la lista de ejercicios si existe

        request.session.modified = True

        request.session['usuario'] = usuario
        request.session['foto_perfil'] = foto_perfil


    return redirect('/inicio/')  # o la vista que desees mostrar después de reiniciar
     # Reemplaza con tu URL de inicio o menú principal

def mostrar_finalizado(request):
    # Reiniciar progreso y ejercicios
    request.session['progreso'] = 0
    request.session['ejercicio_actual'] = 0
    request.session.pop('ejercicios', None)  # Elimina la lista de ejercicios si existe

    request.session.modified = True

    return render(request, 'finalizado.html')  # o la vista que desees mostrar después de reiniciar