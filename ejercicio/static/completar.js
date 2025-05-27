// Función para obtener el token CSRF
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
    progressBar.style.height = `${progresoInicial}%`;  // Usamos height para vertical
    
    const gestos = document.querySelectorAll(".gesto");
    const urlVerificacion = document.body.dataset.urlVerificacion;
    const urlSiguiente = document.body.dataset.urlSiguiente;
    // const resultadoDiv = document.getElementById('resultadoCompletar'); // Elemento para feedback

    gestos.forEach(gesto => {
        gesto.addEventListener("click", () => {
            // Limpiar selecciones previas
            gestos.forEach(g => g.classList.remove("correcto", "incorrecto"));
            
            const opcion_id = gesto.getAttribute("data-id");

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
                if (data.correcto) {
                    gesto.classList.add("correcto");
                    actualizarBarraProgreso(10); // Aumenta 10%
                    
                    if (data.completado) {
                        // resultadoDiv.textContent = "¡Lección completada!";
                        // resultadoDiv.style.color = "green";
                        setTimeout(() => {
                            window.location.href = data.redirect || "/finalizado/";
                        }, 1000);
                    } else {
                        // resultadoDiv.textContent = data.mensaje || "¡Correcto!";
                        // resultadoDiv.style.color = "green";
                        setTimeout(() => {
                            window.location.href = urlSiguiente;
                        }, 800);
                    }
                } else {
                    gesto.classList.add("incorrecto");
                    // resultadoDiv.style.color = "red";
                }
            })
            .catch(error => {
                console.error("Error:", error);
                // resultadoDiv.style.color = "red";
            });
        });
    });

    // Función para actualizar barra vertical
    function actualizarBarraProgreso(porcentaje) {
        const progresoActual = parseInt(progressBar.style.height) || 0;
        const nuevoProgreso = Math.min(progresoActual + porcentaje, 100);
        
        progressBar.style.height = `${nuevoProgreso}%`; // Usamos height
        
        
    }
});