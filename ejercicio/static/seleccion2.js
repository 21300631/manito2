
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
                tarjetas.forEach(t => t.classList.remove("correcto", "incorrecto")); // Limpieza

                if (data.correcto) {
                    card.classList.add("correcto");
                    aumentarBarraProgreso(10); // Si usas barra
                    setTimeout(() => {
                        window.location.href = urlSiguiente;
                    }, 800);
                } else {
                    card.classList.add("incorrecto");
                }
            });
        });
    });
});
