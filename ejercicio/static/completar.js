
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
    const gestos = document.querySelectorAll(".gesto");

    const urlVerificacion = document.body.dataset.urlVerificacion;
    const urlSiguiente = document.body.dataset.urlSiguiente;

    gestos.forEach(gesto => {
        gesto.addEventListener("click", () => {
            const opcion_id = gesto.getAttribute("data-id");

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
                if (data.correcto) {
                    gesto.classList.add("correcto");
                    aumentarBarraProgreso(10);
                    setTimeout(() => {
                        window.location.href = urlSiguiente;
                    }, 800);
                } else {
                    gesto.classList.add("incorrecto");
                }
            });
        });
    });
});
