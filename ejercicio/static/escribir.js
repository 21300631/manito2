document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const input = document.querySelector('input[name="respuesta_usuario"]');
    const resultadoDiv = document.getElementById('resultadoEscribir');
    const urlSiguiente = document.body.dataset.urlSiguiente;
    const progressBar = document.getElementById('progressBar');
    

    // Inicializar barra de progreso
    const progresoInicial = parseInt(progressBar.dataset.progresoInicial) || 0;
    progressBar.style.height = `${progresoInicial}%`;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Deshabilitar el formulario durante la verificación
        form.querySelector('button[type="submit"]').disabled = true;
        input.disabled = true;
        
        // Mostrar loader
        const loader = document.createElement('div');
        loader.className = 'loader';
        resultadoDiv.innerHTML = '';
        resultadoDiv.appendChild(loader);
        
        const formData = new FormData();
        formData.append('respuesta_usuario', input.value.trim());
        formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
        
        fetch(form.action, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        })
        .then(res => {
            if (!res.ok) throw new Error('Error en la respuesta');
            return res.json();
        })
        .then(data => {
            // Limpiar loader
            resultadoDiv.innerHTML = '';
            
            
            if (data.correcto) {
                actualizarBarraProgreso(10);
            }
            
            // Limpiar campo y preparar para siguiente ejercicio
            input.value = '';
            
            // Avanzar después de un breve retraso
            setTimeout(() => {
                window.location.href = data.redirect_url;
            }, 1000);
        })
        .catch(error => {
            console.error('Error:', error);
            resultadoDiv.innerHTML = '';
            mostrarMensaje('Ocurrió un error. Por favor intenta nuevamente.', 'error');
            form.querySelector('button[type="submit"]').disabled = false;
            input.disabled = false;
        });
    });

    // Función para actualizar la barra de progreso
    function actualizarBarraProgreso(porcentaje) {
        const progresoActual = parseInt(progressBar.style.height) || 0;
        const nuevoProgreso = Math.min(progresoActual + porcentaje, 100);
        progressBar.style.height = `${nuevoProgreso}%`;
    }
    

    // Función para obtener el token CSRF
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});