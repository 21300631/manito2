document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const input = document.querySelector('input[name="respuesta_usuario"]');
    const resultadoDiv = document.getElementById('resultadoEscribir');
    const urlSiguiente = document.body.dataset.urlSiguiente;

    // const siguienteBtn = document.getElementById('siguienteBtn');

    form.addEventListener('submit', function (e) {
        e.preventDefault(); // Prevenir recarga de página

        const formData = new FormData();
        formData.append('respuesta_usuario', input.value);
        
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
                aumentarBarraProgreso(10); // Si usas barra
                setTimeout(() => {
                    window.location.href = urlSiguiente;
                }, 800);
            }
        });
        
        
    });


    // Obtener CSRF token
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
