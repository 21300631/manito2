import json
from pathlib import Path
from django.http import JsonResponse
from django.conf import settings

def gesto_referencia(request, palabra_id):
    try:
        # Ruta al archivo JSON (ajusta según tu estructura)
        json_path = Path(settings.BASE_DIR) / 'static' / 'json' / f'letra_{palabra_id}.json'
        
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        return JsonResponse({
            'landmarks': data['landmarks'],
            'palabra': palabra_id,
            'modo_prueba': False
        })
        
    except FileNotFoundError:
        return JsonResponse({'error': 'Archivo de gesto no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)