document.addEventListener('DOMContentLoaded', () => {
    // Inicializar barra de progreso
    const progressBar = document.getElementById('progressBar');
    const progresoInicial = parseInt(progressBar.dataset.progresoInicial) || 0;
    progressBar.style.height = `${progresoInicial}%`;
    
    // Elementos del DOM
    const palabras = document.querySelectorAll('.palabra');
    const gestos = document.querySelectorAll('.gesto');
    const btnVerificar = document.getElementById('btn-verificar');
    const urlSiguiente = document.body.dataset.urlSiguiente;
    const urlVerificacion = document.body.dataset.urlVerificacion;
    const resultadoDiv = document.getElementById('resultadoEmparejar');

    // Estado de la aplicación
    let seleccionActual = { palabra: null, gesto: null };
    let paresSeleccionados = [];
    let contadorPareado = 1;

    // Manejo de selecciones
    function manejarSeleccion(elementos, tipo) {
        elementos.forEach(elemento => {
            elemento.addEventListener('click', () => {
                if (elemento.classList.contains('emparejada')) return;

                // Limpiar selecciones previas del mismo tipo
                elementos.forEach(el => el.classList.remove('seleccionada'));
                elemento.classList.add('seleccionada');

                seleccionActual[tipo] = elemento;
                verificarPar();
            });
        });
    }

    manejarSeleccion(palabras, 'palabra');
    manejarSeleccion(gestos, 'gesto');

    // Verificar par seleccionado
    function verificarPar() {
        if (seleccionActual.palabra && seleccionActual.gesto) {
            const palabraID = seleccionActual.palabra.dataset.id;
            const gestoID = seleccionActual.gesto.dataset.id;

            // Verificar si ya fue emparejado
            const yaEmparejado = paresSeleccionados.some(
                par => par.palabra_id === palabraID || par.gesto_id === gestoID
            );

            if (!yaEmparejado) {
                paresSeleccionados.push({
                    palabra_id: palabraID,
                    gesto_id: gestoID
                });

                animarEmparejamiento(seleccionActual.palabra, seleccionActual.gesto, contadorPareado);
                contadorPareado++;

                // Deshabilitar elementos emparejados
                seleccionActual.palabra.classList.add('emparejada');
                seleccionActual.gesto.classList.add('emparejada');
            }

            // Resetear selección
            seleccionActual = { palabra: null, gesto: null };

            // Habilitar botón cuando todos los pares están hechos
            btnVerificar.disabled = paresSeleccionados.length !== palabras.length;
        }
    }

    // Animación al emparejar
    function animarEmparejamiento(palabraEl, gestoEl, numeroPar) {
        const clase = `pareado-${numeroPar}`;
        palabraEl.classList.add(clase);
        gestoEl.classList.add(clase);
        palabraEl.classList.remove('seleccionada');
        gestoEl.classList.remove('seleccionada');
    }

    // Verificar emparejamientos con el servidor
    btnVerificar.addEventListener('click', () => {
        btnVerificar.disabled = true; // Deshabilitar botón durante la verificación
        
        fetch(urlVerificacion, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ pares: paresSeleccionados })
        })
        .then(res => res.json())
        .then(data => {
            if (data.todos_correctos) {
                
                // Actualizar barra de progreso
                actualizarBarraProgreso(10);
                
                setTimeout(() => {
                    if (data.completado) {
                        window.location.href = data.redirect || urlSiguiente;
                    } else {
                        window.location.href = urlSiguiente;
                    }
                }, 1000);
            } else {
                setTimeout(reiniciarPares, 1500);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            resultadoDiv.textContent = 'Error al verificar. Intenta nuevamente.';
            resultadoDiv.style.color = 'red';
            btnVerificar.disabled = false;
        });
    });

    // Reiniciar el ejercicio
    function reiniciarPares() {
        document.querySelectorAll('.palabra, .gesto').forEach(el => {
            el.className = el.className.split(' ')
                .filter(cls => !cls.startsWith('pareado-') && 
                              !['emparejada', 'seleccionada', 'correcto', 'incorrecto'].includes(cls))
                .join(' ');
        });

        paresSeleccionados = [];
        seleccionActual = { palabra: null, gesto: null };
        contadorPareado = 1;
        btnVerificar.disabled = true;
        resultadoDiv.textContent = '';
    }

    // Función para actualizar la barra de progreso (CORREGIDA)
    function actualizarBarraProgreso(porcentaje) {
        const progresoActual = parseInt(progressBar.style.height) || 0;
        const nuevoProgreso = Math.min(progresoActual + porcentaje, 100);
        
        progressBar.style.height = `${nuevoProgreso}%`;
        
    }

    // Función para obtener el token CSRF
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});