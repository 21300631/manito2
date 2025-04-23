document.addEventListener('DOMContentLoaded', function () {
    const likeForms = document.querySelectorAll('.form-like');
    const reportForms = document.querySelectorAll('.form-report');

    // Función para obtener el token CSRF de la cookie
    function getCSRFToken() {
        let csrfToken = null;
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const trimmed = cookie.trim();
            if (trimmed.startsWith('csrftoken=')) {
                csrfToken = trimmed.substring('csrftoken='.length);
                break;
            }
        }
        return csrfToken;
    }

    const csrftoken = getCSRFToken();

    likeForms.forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const publicacionId = form.dataset.publicacionId;

            fetch(`/foro/dar_like/${publicacionId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                const label = form.querySelector('.like-count');
                label.textContent = data.total_likes;
            })
            .catch(error => {
                console.error('Error al dar like:', error);
            });
        });
    });

    reportForms.forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const publicacionId = form.dataset.publicacionId;

            fetch(`/foro/reportar/${publicacionId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.eliminada) {
                    // Ocultar publicación si fue eliminada por muchos reportes
                    const publicacionDiv = form.closest('.publicacion');
                    publicacionDiv.remove();
                } else {
                    const label = form.querySelector('.report-count');
                    label.textContent = data.total_reportes;
                }
            })
            .catch(error => {
                console.error('Error al reportar:', error);
            });
        });
    });
});
