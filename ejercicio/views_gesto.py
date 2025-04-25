# views.py
from django.http import HttpResponse
from utils.s3_helper import download_image_from_s3
from utils.hand_processor import process_hand_image
from .models import Palabra
import os

def analizar_gesto_referencia(request, palabra_id):
    try:
        palabra = Palabra.objects.get(id=palabra_id)
        if palabra.gesto.lower().endswith('.mp4'):
            return HttpResponse("El gesto es un video, no se puede procesar como imagen.")

        filename = os.path.basename(palabra.gesto)
        local_path = f'/tmp/{filename}'
        s3_key = palabra.gesto
        bucket_name = 'manito-bucket'  # Asegúrate de que este sea el nombre real
        download_image_from_s3(bucket_name, s3_key, local_path)
        process_hand_image(local_path)

        return HttpResponse(f"Se imprimieron en consola las coordenadas del gesto para: {palabra.palabra}")
    
    except Palabra.DoesNotExist:
        return HttpResponse("Palabra no encontrada.", status=404)
