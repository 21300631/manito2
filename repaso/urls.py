from django.urls import path
from .views import   iniciar_repaso, mostrar_ejercicio_repaso, mostrar_ejercicio_repaso, finalizar_repaso, no_hay_palabras, noRecuerdo

urlpatterns = [
    path('', iniciar_repaso, name='pagina'),
     path('ejercicio/', mostrar_ejercicio_repaso, name='mostrar_ejercicio_repaso'),
    
    # Avanzar al siguiente ejercicio (AJAX)
    path('siguiente/', mostrar_ejercicio_repaso, name='siguiente_ejercicio_repaso'),
    
    # Finalizar repaso y mostrar resultados
    path('finalizado/', finalizar_repaso, name='finalizar_repaso'),
    
    # Para cuando no hay palabras disponibles
    path('no-hay-palabras/', no_hay_palabras, name='no_hay_palabras'),

    path('no-recuerdo/', noRecuerdo, name='no_recuerdo'),
]