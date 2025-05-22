document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form-escribir');
    const input = document.querySelector('.input-escribir');
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = 'mensaje-escribir';
    form.appendChild(mensajeDiv);
    
    const urlVerificacion = '/verificar_escribir/'; // Ajusta según tu URL
    const csrftoken = getCookie('csrftoken');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Deshabilitar el formulario durante la verificación
        input.disabled = true;
        mensajeDiv.textContent = 'Verificando...';
        mensajeDiv.className = 'mensaje-escribir verificando';

        try {
            const response = await fetch(urlVerificacion, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrftoken
                },
                body: `respuesta_usuario=${encodeURIComponent(input.value.trim())}`
            });

            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            
            const data = await response.json();
            
            if (data.error) throw new Error(data.error);

            if (data.completado) {
                mostrarMensaje('¡Lección completada!', true);
                setTimeout(() => {
                    window.location.href = '/finalizado/';
                }, 1500);
                return;
            }

            if (data.correcto) {
                mostrarMensaje(data.mensaje || '¡Correcto!', true);
                aumentarBarraProgreso(10);
                
                setTimeout(() => {
                    window.location.href = '/mostrar_ejercicio/';
                }, 1500);
            } else {
                mostrarMensaje(data.mensaje || `Incorrecto. La respuesta era: ${data.respuesta_correcta}`, false);
                input.value = '';
                input.focus();
            }
        } catch (error) {
            mostrarMensaje('Error: ' + error.message, false);
            console.error('Error:', error);
        } finally {
            input.disabled = false;
        }
    });

    function mostrarMensaje(texto, esExito) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `mensaje-escribir ${esExito ? 'exito' : 'error'}`;
        
        if (esExito) {
            input.classList.add('correcto');
            setTimeout(() => input.classList.remove('correcto'), 1000);
        } else {
            input.classList.add('incorrecto');
            setTimeout(() => input.classList.remove('incorrecto'), 1000);
        }
    }

    // Función para obtener el token CSRF
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
});