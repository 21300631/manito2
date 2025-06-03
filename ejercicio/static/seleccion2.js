// Obtener CSRF
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
document.addEventListener("DOMContentLoaded", () => {
    // Inicializar barra de progreso vertical
    const progressBar = document.getElementById("progressBar");
    const progresoInicial = parseInt(progressBar.dataset.progresoInicial) || 0;
    progressBar.style.height = `${progresoInicial}%`;
    
    const tarjetas = document.querySelectorAll(".card");
    const urlVerificacion = document.body.dataset.urlVerificacion;
    
    // Crear elemento para feedback mejorado
    const feedbackDiv = document.createElement('div');
    feedbackDiv.id = 'feedback-message';
    feedbackDiv.style.margin = '15px 0';
    feedbackDiv.style.padding = '12px';
    feedbackDiv.style.borderRadius = '5px';
    feedbackDiv.style.display = 'none';
    feedbackDiv.style.fontWeight = 'bold';
    document.querySelector('.instruccion').appendChild(feedbackDiv);

    tarjetas.forEach(card => {
        card.addEventListener("click", () => {
            const opcion_id = card.getAttribute("data-id");

            // Deshabilitar todas las tarjetas durante la verificación
            tarjetas.forEach(t => t.style.pointerEvents = 'none');
            
            fetch(urlVerificacion, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: `opcion_id=${opcion_id}`
            })
            .then(response => {
                if (!response.ok) throw new Error('Error en la respuesta');
                return response.json();
            })
            .then(data => {
                // Mostrar feedback visual
                tarjetas.forEach(t => t.classList.remove("correcto", "incorrecto"));
                card.classList.add(data.correcto ? "correcto" : "incorrecto");
                
                // Mostrar mensaje de feedback
                mostrarFeedback(data.mensaje, data.correcto ? 'success' : 'error');
                
                // Actualizar barra de progreso si es correcto
                if (data.correcto) {
                    actualizarBarraProgreso(10);
                }
                
                // Avanzar después de un breve retraso
                setTimeout(() => {
                    window.location.href = data.redirect_url;
                }, 1000);
            })
            .catch(error => {
                console.error("Error:", error);
                mostrarFeedback('Ocurrió un error. Por favor intenta nuevamente.', 'error');
                tarjetas.forEach(t => t.style.pointerEvents = 'auto'); // Rehabilitar tarjetas
            });
        });
    });

    // Función para actualizar barra de progreso vertical
    function actualizarBarraProgreso(porcentaje) {
        const progresoActual = parseInt(progressBar.style.height) || 0;
        const nuevoProgreso = Math.min(progresoActual + porcentaje, 100);
        progressBar.style.height = `${nuevoProgreso}%`;
    }
    
    // Función para mostrar feedback mejorado
    function mostrarFeedback(texto, tipo) {
        feedbackDiv.textContent = texto;
        feedbackDiv.style.display = 'block';
        feedbackDiv.style.backgroundColor = tipo === 'success' ? '#d4edda' : '#f8d7da';
        feedbackDiv.style.color = tipo === 'success' ? '#155724' : '#721c24';
        feedbackDiv.style.border = tipo === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb';
    }
});

// Función getCookie se mantiene igual