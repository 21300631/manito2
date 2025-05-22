document.addEventListener('DOMContentLoaded', () => {
    const palabras = document.querySelectorAll('.palabra');
    const gestos = document.querySelectorAll('.gesto');
    const btnVerificar = document.getElementById('btn-verificar');
    const contenedorMensajes = document.createElement('div');
    contenedorMensajes.className = 'contenedor-mensajes';
    document.body.appendChild(contenedorMensajes);

    // Variables de estado
    let seleccionActual = { palabra: null, gesto: null };
    let paresSeleccionados = [];
    let contadorPareado = 1;
    let bloqueado = false;

    // Configuración inicial
    palabras.forEach(p => p.style.pointerEvents = 'auto');
    gestos.forEach(g => g.style.pointerEvents = 'auto');
    btnVerificar.disabled = true;

    // Eventos para palabras
    palabras.forEach(palabra => {
        palabra.addEventListener('click', () => {
            if (bloqueado || palabra.classList.contains('emparejada')) return;
            
            // Deseleccionar otras palabras
            palabras.forEach(p => {
                if (p !== palabra) p.classList.remove('seleccionada');
            });

            // Seleccionar actual
            palabra.classList.toggle('seleccionada');
            seleccionActual.palabra = palabra.classList.contains('seleccionada') ? palabra : null;
            
            verificarPar();
        });
    });

    // Eventos para gestos
    gestos.forEach(gesto => {
        gesto.addEventListener('click', () => {
            if (bloqueado || gesto.classList.contains('emparejada')) return;
            
            // Deseleccionar otros gestos
            gestos.forEach(g => {
                if (g !== gesto) g.classList.remove('seleccionada');
            });

            // Seleccionar actual
            gesto.classList.toggle('seleccionada');
            seleccionActual.gesto = gesto.classList.contains('seleccionada') ? gesto : null;
            
            verificarPar();
        });
    });

    // Función para verificar y crear pares
    function verificarPar() {
        if (seleccionActual.palabra && seleccionActual.gesto) {
            bloqueado = true;
            
            const palabraID = seleccionActual.palabra.dataset.id;
            const gestoID = seleccionActual.gesto.dataset.id;

            paresSeleccionados.push({
                palabra_id: palabraID,
                gesto_id: gestoID
            });

            // Animación de emparejamiento
            animarEmparejamiento(seleccionActual.palabra, seleccionActual.gesto, contadorPareado);

            // Actualizar estado
            seleccionActual.palabra.classList.add('emparejada');
            seleccionActual.gesto.classList.add('emparejada');
            seleccionActual = { palabra: null, gesto: null };
            contadorPareado++;

            // Habilitar botón si tenemos todos los pares
            if (paresSeleccionados.length === Math.min(palabras.length, gestos.length)) {
                btnVerificar.disabled = false;
            }

            setTimeout(() => {
                bloqueado = false;
            }, 300);
        }
    }

    // Animación al emparejar
    function animarEmparejamiento(palabraEl, gestoEl, numeroPar) {
        const clase = `pareado-${numeroPar}`;
        
        palabraEl.classList.add(clase);
        gestoEl.classList.add(clase);
        palabraEl.classList.remove('seleccionada');
        gestoEl.classList.remove('seleccionada');

        // Efecto visual
        palabraEl.style.transform = 'scale(1.1)';
        gestoEl.style.transform = 'scale(1.1)';
        
        setTimeout(() => {
            palabraEl.style.transform = 'scale(1)';
            gestoEl.style.transform = 'scale(1)';
        }, 200);
    }

    // Evento del botón verificar
    btnVerificar.addEventListener('click', () => {
        if (bloqueado) return;
        
        bloqueado = true;
        btnVerificar.disabled = true;
        
        const urlVerificacion = '/verificar_emparejar/'; // Ajusta según tu URL

        fetch(urlVerificacion, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({ 
                pares: paresSeleccionados.map(p => ({
                    palabra_id: parseInt(p.palabra_id),
                    gesto_id: parseInt(p.gesto_id)
                }))
            })
        })
        .then(res => {
            if (!res.ok) throw new Error('Error en la respuesta del servidor');
            return res.json();
        })
        .then(data => {
            if (data.error) throw new Error(data.error);
            
            if (data.completado) {
                mostrarMensaje('¡Lección completada!', true);
                setTimeout(() => {
                    window.location.href = '/finalizado/';
                }, 1500);
                return;
            }

            if (data.todos_correctos) {
                // Todo correcto
                mostrarMensaje(data.mensaje || '¡Correcto!', true);
                animarResultado(true);
                
                setTimeout(() => {
                    window.location.href = '/mostrar_ejercicio/';
                }, 1500);
            } else {
                // Algunos incorrectos
                mostrarMensaje(data.mensaje || 'Algunos emparejamientos son incorrectos', false);
                resaltarIncorrectos(data.resultado);
                animarResultado(false);
                
                setTimeout(() => {
                    reiniciarEjercicio();
                    bloqueado = false;
                }, 3000);
            }
        })
        .catch(error => {
            mostrarMensaje(error.message || 'Error de conexión', false);
            console.error('Error:', error);
            bloqueado = false;
            btnVerificar.disabled = false;
        });
    });

    // Función para resaltar incorrectos
    function resaltarIncorrectos(resultados) {
        resultados.forEach((par, index) => {
            if (!par.correcto) {
                const pareadoClass = `pareado-${index + 1}`;
                document.querySelectorAll(`.${pareadoClass}`).forEach(el => {
                    el.classList.add('incorrecto');
                });
            }
        });
    }

    // Animación de resultado
    function animarResultado(esCorrecto) {
        const elementos = document.querySelectorAll('.palabra.emparejada, .gesto.emparejada');
        
        elementos.forEach(el => {
            el.classList.add(esCorrecto ? 'correcto' : 'incorrecto');
            el.style.transform = esCorrecto ? 'scale(1.1)' : 'rotate(2deg)';
        });
        
        setTimeout(() => {
            elementos.forEach(el => {
                el.style.transform = '';
            });
        }, 500);
    }

    // Reiniciar ejercicio
    function reiniciarEjercicio() {
        // Limpiar clases
        document.querySelectorAll('.palabra, .gesto').forEach(el => {
            el.classList.remove(
                'seleccionada', 'emparejada', 'correcto', 'incorrecto',
                'pareado-1', 'pareado-2', 'pareado-3'
            );
            el.style.transform = '';
        });
        
        // Resetear variables
        paresSeleccionados = [];
        seleccionActual = { palabra: null, gesto: null };
        contadorPareado = 1;
        btnVerificar.disabled = true;
    }

    // Mostrar mensajes flotantes
    function mostrarMensaje(texto, esExito) {
        const mensaje = document.createElement('div');
        mensaje.className = `mensaje ${esExito ? 'exito' : 'error'}`;
        mensaje.textContent = texto;
        
        contenedorMensajes.appendChild(mensaje);
        
        setTimeout(() => {
            mensaje.classList.add('mostrar');
        }, 10);
        
        setTimeout(() => {
            mensaje.classList.remove('mostrar');
            setTimeout(() => mensaje.remove(), 300);
        }, 3000);
    }

    // Obtener token CSRF
    function getCSRFToken() {
        const name = 'csrftoken=';
        const cookies = document.cookie.split(';');
        
        for (let cookie of cookies) {
            if (cookie.trim().startsWith(name)) {
                return cookie.trim().substring(name.length);
            }
        }
        return '';
    }
});