from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from registro.models import Profile
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Logro, Insignia
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from inicio.models import Notificacion
# Create your views here.


@login_required
def perfil(request):
    usuario = request.user
    perfil = Profile.objects.get(user=usuario)  
    logros = Logro.objects.filter(usuario=perfil)
    insignias = [logro.insignia for logro in logros]  
    notificaciones = Notificacion.objects.filter(receptor=request.user).order_by('-fecha')[:10]

    try:
        medalla = perfil.medalla  
    except Profile.DoesNotExist:
        medalla = None  
    contexto = {
            'usuario': usuario,
            'imagen': perfil.imagen,
            'medalla': perfil.medalla,
            'insignias': insignias,
            'racha': perfil.racha,
            'puntos': perfil.puntos,
            'notificaciones': notificaciones,
    }
    print(perfil.imagen.url)

    return render(request, 'perfil.html', contexto)

import logging
import boto3
from botocore.exceptions import NoCredentialsError, ClientError

logger = logging.getLogger(__name__)

@login_required
def cambiar_foto_perfil(request):
    if request.method == 'POST':
        try:
            # Verificar si se envió una imagen
            if 'nueva_imagen' not in request.FILES:
                messages.error(request, 'No se ha seleccionado ninguna imagen')
                return redirect('perfil')
            
            nueva_imagen = request.FILES['nueva_imagen']
            perfil = Profile.objects.get(user=request.user)
            
            # Validaciones de la imagen
            max_size = 5 * 1024 * 1024  # 5MB
            if nueva_imagen.size > max_size:
                messages.error(request, 'La imagen es demasiado grande. El tamaño máximo permitido es 5MB.')
                return redirect('perfil')
            
            allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif']
            file_name = nueva_imagen.name.lower()
            if not any(file_name.endswith(ext) for ext in allowed_extensions):
                messages.error(request, 'Formato de imagen no soportado. Use JPG, JPEG, PNG o GIF.')
                return redirect('perfil')
            
            # Procesar el cambio de imagen
            primer_cambio = perfil.imagen.name.endswith('default.jpg')
            
            try:
                # Eliminar la imagen anterior si no es la default
                if not primer_cambio:
                    perfil.imagen.delete(save=False)
                
                # Guardar la nueva imagen
                perfil.imagen = nueva_imagen
                perfil.save()
                
                logger.info(f"Imagen de perfil actualizada para usuario {request.user.username}")
                
            except NoCredentialsError:
                logger.error("Error de credenciales AWS - Verificar variables de entorno en Render")
                messages.error(request, 'Error de configuración del servidor. Contacta al administrador.')
                return redirect('perfil')
                
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code')
                logger.error(f"Error de AWS S3: {str(e)} - Código: {error_code}")
                
                if error_code == '403':
                    messages.error(request, 'Problema de permisos con el almacenamiento')
                elif error_code == '404':
                    messages.error(request, 'Recurso no encontrado en el almacenamiento')
                else:
                    messages.error(request, 'Error al comunicarse con el servicio de almacenamiento')
                
                return redirect('perfil')
            
            # Otorgar insignia si es primer cambio
            if primer_cambio:
                try:
                    insignia_fotogenico = Insignia.objects.get(imagen="insignias/fotogenico.png")
                    if not Logro.objects.filter(usuario=perfil, insignia=insignia_fotogenico).exists():
                        Logro.objects.create(usuario=perfil, insignia=insignia_fotogenico)
                        messages.success(request, '¡Has ganado la insignia Fotogénico! 🏅')
                        Notificacion.objects.create(
                            receptor=request.user,
                            mensaje='¡Has desbloqueado la insignia Fotogénico!',
                            tipo='logro'
                        )
                except Insignia.DoesNotExist:
                    logger.warning("Insignia Fotogénico no existe en la base de datos")
            
            messages.success(request, 'Foto de perfil actualizada correctamente')
            return redirect('perfil')
            
        except Profile.DoesNotExist:
            logger.error(f"Perfil no encontrado para usuario {request.user.id}")
            messages.error(request, 'No se encontró tu perfil de usuario')
            return redirect('perfil')
            
        except Exception as e:
            logger.exception("Error inesperado al cambiar foto de perfil")
            messages.error(request, 'Error interno del servidor. Por favor, inténtalo más tarde.')
            return redirect('perfil')
    
    return redirect('perfil')

def cambiar_nombre(request):
    if not request.user.is_authenticated:
        return redirect('login')  

    usuario = request.user
    try:
        perfil = Profile.objects.get(user=usuario)
    except Profile.DoesNotExist:
        return redirect('login')

    if request.method == 'POST' and 'nuevo_username' in request.POST:
        nuevo_username = request.POST.get('nuevo_username').strip()
        
        if nuevo_username and nuevo_username != usuario.username:
            if not User.objects.filter(username=nuevo_username).exclude(pk=usuario.pk).exists():
                usuario.username = nuevo_username
                usuario.save()
                
                from django.contrib.auth import update_session_auth_hash
                update_session_auth_hash(request, usuario)
                
                messages.success(request, 'Nombre de usuario actualizado correctamente')
            else:
                messages.error(request, 'Este nombre de usuario ya está en uso')
        else:
            messages.error(request, 'El nombre de usuario no puede estar vacío o ser igual al actual')
        
        return redirect('perfil')

    contexto = {
        'usuario': usuario,
        'imagen': perfil.imagen,
        'medalla': perfil.medalla, 
        'racha': perfil.racha,
        'puntos': perfil.puntos,
    }
    return render(request, 'perfil.html', contexto)


@csrf_exempt
def cambiar_tema(request):
    if request.method == 'POST' and request.user.is_authenticated:
        data = json.loads(request.body)
        tema = data.get('theme')

        profile = Profile.objects.get(user=request.user)
        profile.theme = tema
        profile.save()

        return JsonResponse({'status': 'ok', 'theme': tema})
    return JsonResponse({'status': 'error'}, status=400)



def obtener_tema(request):
    if request.user.is_authenticated:
        theme = request.user.profile.theme 
        return JsonResponse({'theme': theme})
    return JsonResponse({'theme': 'light'})  

def logout_view(request):
    if request.method == 'POST':
        logout(request)
        return redirect('login_usuario')
    return render(request, 'login.html')  