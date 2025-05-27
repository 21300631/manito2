document.addEventListener("DOMContentLoaded", () => {
    // Inicializar barra (lee el atributo data-progreso-inicial)
    const progressBar = document.getElementById("progressBar");
    const progresoInicial = parseInt(progressBar.dataset.progresoInicial) || 0;
    progressBar.style.height = `${progresoInicial}%`;

    // Configurar listeners para las tarjetas
    const tarjetas = document.querySelectorAll(".card");
    const urlVerificacion = document.body.dataset.urlVerificacion;
    const urlSiguiente = document.body.dataset.urlSiguiente;

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
                tarjetas.forEach(t => t.classList.remove("correcto", "incorrecto"));

                if (data.correcto) {
                    card.classList.add("correcto");
                    actualizarBarraProgreso(10); // Incrementa 10%
                    setTimeout(() => {
                        window.location.href = data.redirect || urlSiguiente;
                    }, 800);
                } else {
                    card.classList.add("incorrecto");
                }
            });
        });
    });

    // Función para actualizar la barra (¡ahora con width!)
    function actualizarBarraProgreso(porcentaje) {
        const progresoActual = parseInt(progressBar.style.height) || 0;
        const nuevoProgreso = Math.min(progresoActual + porcentaje, 100);
        
        progressBar.style.height = `${nuevoProgreso}%`;
        console.log(`Barra de progreso actualizada: ${nuevoProgreso}%`);
        
       
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