document.addEventListener('DOMContentLoaded', function() {
    const mediaContainer = document.getElementById('media-container');
    const textoInstruccion = document.getElementById('texto-instruccion');
    const btnSiguiente = document.querySelector('.btn-siguiente');
    const btnSalir = document.querySelector('.btn-salir');

    function showCurrentWord() {
        const palabra = palabrasRepaso[currentIndex];
        textoInstruccion.textContent = `Realiza el gesto correspondiente a la palabra: ${palabra.texto}`;
        mediaContainer.innerHTML = '';
        
        let mediaElement;
        if (palabra.is_video) {
            mediaElement = document.createElement('video');
            mediaElement.src = palabra.gesto_url;
            mediaElement.controls = true;
            mediaElement.autoplay = true;
            mediaElement.loop = true;
        } else {
            mediaElement = document.createElement('img');
            mediaElement.src = palabra.gesto_url;
            mediaElement.alt = palabra.texto;
        }
        
        mediaElement.id = 'current-media';
        mediaContainer.appendChild(mediaElement);
    }

    btnSiguiente.addEventListener('click', function() {
        currentIndex++;
        
        if (currentIndex >= totalEjercicios) {
            // Redirigir a estadísticas cuando se completan todos los ejercicios
            window.location.href = estadisticasUrl;
        } else {
            showCurrentWord();
        }
    });

    btnSalir.addEventListener('click', function() {
        window.location.href = '/inicio/';
    });

    showCurrentWord();
});