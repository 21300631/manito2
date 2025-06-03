document.addEventListener("DOMContentLoaded", () => {
    const progressBar = document.getElementById("progressBar");
    const progresoInicial = parseInt(progressBar.dataset.progresoInicial) || 0;
    progressBar.style.height = `${progresoInicial}%`;

    const tarjetas = document.querySelectorAll(".card");
    const urlVerificacion = document.body.dataset.urlVerificacion;
    const feedbackDiv = document.createElement('div');
    
    // Configurar div de feedback
    feedbackDiv.id = 'feedback-message';
    feedbackDiv.style.margin = '10px 0';
    feedbackDiv.style.padding = '10px';
    feedbackDiv.style.borderRadius = '5px';
    feedbackDiv.style.display = 'none';
    document.querySelector('.instruccion').appendChild(feedbackDiv);

    tarjetas.forEach(card => {
        card.addEventListener("click", () => {
            const opcion_id = card.getAttribute("data-id");

            fetch(urlVerificacion, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: `opcion_id=${opcion_id}`
            })
            .then(response => response.json())
            .then(data => {
                // Mostrar feedback visual
                tarjetas.forEach(t => t.classList.remove("correcto", "incorrecto"));
                card.classList.add(data.correcto ? "correcto" : "incorrecto");
                
                // Mostrar mensaje
                mostrarFeedback(data.mensaje, data.correcto ? 'success' : 'error');
                
                // Avanzar después de un breve retraso
                setTimeout(() => {
                    window.location.href = data.redirect_url;
                }, 1000);
            });
        });
    });

    function actualizarBarraProgreso(porcentaje) {
        const progresoActual = parseInt(progressBar.style.height) || 0;
        const nuevoProgreso = Math.min(progresoActual + porcentaje, 100);
        progressBar.style.height = `${nuevoProgreso}%`;
    }
    
    function mostrarFeedback(mensaje, tipo) {
        feedbackDiv.textContent = mensaje;
        feedbackDiv.style.display = 'block';
        feedbackDiv.style.backgroundColor = tipo === 'success' ? '#d4edda' : '#f8d7da';
        feedbackDiv.style.color = tipo === 'success' ? '#155724' : '#721c24';
        feedbackDiv.style.border = tipo === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb';
    }
});

// Función getCookie (se mantiene igual)
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