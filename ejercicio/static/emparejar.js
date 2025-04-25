document.addEventListener('DOMContentLoaded', () => {
    const palabras = document.querySelectorAll('.palabra');
    const gestos = document.querySelectorAll('.gesto');
    const btnVerificar = document.getElementById('btn-verificar');
    const urlSiguiente = document.body.dataset.urlSiguiente; // Asegúrate de tener esta URL en tu HTML

    let seleccionActual = { palabra: null, gesto: null };
    let paresSeleccionados = [];
    let contadorPareado = 1;

    palabras.forEach(palabra => {
        palabra.addEventListener('click', () => {
            if (palabra.classList.contains('emparejada')) return;

            palabra.classList.add('seleccionada');

            palabras.forEach(p => {
                if (p !== palabra) p.classList.remove('seleccionada');
            });

            seleccionActual.palabra = palabra;
            verificarPar();
        });
    });

    gestos.forEach(gesto => {
        gesto.addEventListener('click', () => {
            if (gesto.classList.contains('emparejada')) return;

            gesto.classList.add('seleccionada');

            gestos.forEach(g => {
                if (g !== gesto) g.classList.remove('seleccionada');
            });

            seleccionActual.gesto = gesto;
            verificarPar();
        });
    });

    function verificarPar() {
        if (seleccionActual.palabra && seleccionActual.gesto) {
            const palabraID = seleccionActual.palabra.dataset.id;
            const gestoID = seleccionActual.gesto.dataset.id;

            paresSeleccionados.push({
                palabra_id: palabraID,
                gesto_id: gestoID
            });

            animarEmparejamiento(seleccionActual.palabra, seleccionActual.gesto, contadorPareado);

            seleccionActual.palabra.classList.add('emparejada');
            seleccionActual.gesto.classList.add('emparejada');

            seleccionActual = { palabra: null, gesto: null };
            contadorPareado++;

            if (paresSeleccionados.length === 3) {
                btnVerificar.disabled = false;
            }
        }
    }

    function animarEmparejamiento(palabraEl, gestoEl, numeroPar) {
        const clase = `pareado-${numeroPar}`;
        palabraEl.classList.add(clase);
        gestoEl.classList.add(clase);
        palabraEl.classList.remove('seleccionada');
        gestoEl.classList.remove('seleccionada');
    }

    btnVerificar.addEventListener('click', () => {
        const urlVerificacion = document.body.dataset.urlVerificacion;

        fetch(urlVerificacion, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({ pares: paresSeleccionados })
        })
        .then(res => res.json())
        .then(data => {
            if (data.resultado) {
                const todosCorrectos = data.resultado.every(par => par.correcto);
                const claseResultado = todosCorrectos ? 'correcto' : 'incorrecto';

                document.querySelectorAll('.palabra.emparejada, .gesto.emparejada').forEach(el => {
                    el.classList.add(claseResultado);
                });

                if (todosCorrectos) {
                    // Animar el correcto
                    animarCorrecto();

                    // Esperar unos segundos para ver la animación antes de redirigir
                    setTimeout(() => {
                        window.location.href = urlSiguiente; // Redirigir al siguiente ejercicio
                    }, 800); // Esperar 800ms para la animación
                } else {
                    // Mostrar todos los elementos en rojo si hay un error
                    animarIncorrecto();

                    setTimeout(() => {
                        reiniciarPares(); // Reiniciar los pares sin cambiar de ejercicio
                    }, 2000); // 2 segundos para la animación
                }

                btnVerificar.disabled = true;
                
            } else {
                alert('Ocurrió un error: ' + data.error);
            }
        });
    });

    function animarCorrecto() {
        document.querySelectorAll('.palabra.emparejada, .gesto.emparejada').forEach(el => {
            el.classList.add('correcto');
        });
    }

    function animarIncorrecto() {
        document.querySelectorAll('.palabra.emparejada, .gesto.emparejada').forEach(el => {
            el.classList.add('incorrecto'); // Marcar como incorrecto en rojo
        });
    }

    function reiniciarPares() {
        document.querySelectorAll('.palabra, .gesto').forEach(el => {
            el.classList.remove('emparejada', 'seleccionada', 'correcto', 'incorrecto', 'pareado-1', 'pareado-2', 'pareado-3');
            el.style.backgroundColor = ''; // Eliminar el fondo
        });

        paresSeleccionados = [];
        btnVerificar.disabled = true;
    }

    function getCSRFToken() {
        const name = 'csrftoken';
        const cookies = document.cookie.split(';');
        for (let c of cookies) {
            if (c.trim().startsWith(name + '=')) {
                return decodeURIComponent(c.trim().substring(name.length + 1));
            }
        }
        return '';
    }
});
