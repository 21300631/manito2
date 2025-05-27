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
    // const resultadoDiv = document.createElement('div'); // Para mostrar mensajes
    // resultadoDiv.style.marginTop = '10px';
    // resultadoDiv.style.fontWeight = 'bold';
    // document.querySelector('.instruccion').appendChild(resultadoDiv);

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
            .then(response => {
                if (!response.ok) throw new Error('Error en la respuesta');
                return response.json();
            })
            .then(data => {
                // Limpiar selecciones previas
                tarjetas.forEach(t => t.classList.remove("correcto", "incorrecto"));
                
                // Mostrar resultado

                if (data.correcto) {
                    card.classList.add("correcto");
                    actualizarBarraProgreso(10);
                    
                    setTimeout(() => {
                        // Usar redirect_url si existe, o ir a /ejercicio/mostrar/ por defecto
                        const redirectUrl = data.redirect_url || '/ejercicio/mostrar/';
                        window.location.href = redirectUrl;
                    }, 800);
                } else {
                    card.classList.add("incorrecto");
                }
            })
            .catch(error => {
                console.error("Error:", error);
            });
        });
    });

    // Función para actualizar barra de progreso vertical
    function actualizarBarraProgreso(porcentaje) {
        const progresoActual = parseInt(progressBar.style.height) || 0;
        const nuevoProgreso = Math.min(progresoActual + porcentaje, 100);
        
        progressBar.style.height = `${nuevoProgreso}%`;
        console.log(`Barra de progreso actualizada: ${nuevoProgreso}%`);
        
        
    }
});