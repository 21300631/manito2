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
        .then(res => res.json())
        .then(data => {
            resultadoDiv.textContent = data.mensaje;
            resultadoDiv.style.color = data.correcto ? 'green' : 'red';
        
            if (data.correcto) {
                actualizarBarraProgreso(10);
                setTimeout(() => {
                    window.location.href = data.redirect || urlSiguiente;
                }, 800);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            resultadoDiv.textContent = 'Ocurrió un error. Intenta nuevamente.';
            resultadoDiv.style.color = 'red';
        });
    });

    // Función para actualizar la barra de progreso (CORREGIDA: usa width en lugar de height)
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