
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


// Función para mostrar mensajes al usuario
function mostrarMensaje(mensaje, esExito = true) {
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = `mensaje-flotante ${esExito ? 'exito' : 'error'}`;
    mensajeDiv.textContent = mensaje;
    document.body.appendChild(mensajeDiv);
    
    setTimeout(() => {
        mensajeDiv.remove();
    }, 3000);
}

// Función para actualizar la barra de progreso
function aumentarBarraProgreso(incremento) {
    const barra = document.querySelector('.barra-progreso');
    if (barra) {
        const progresoActual = parseInt(barra.style.width || '0');
        const nuevoProgreso = Math.min(progresoActual + incremento, 100);
        barra.style.width = `${nuevoProgreso}%`;
        barra.setAttribute('aria-valuenow', nuevoProgreso);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const gestos = document.querySelectorAll(".gesto");
    const csrftoken = getCookie("csrftoken");
    const urlVerificacion = "/verificar_completar/"; // Puedes dejarlo como dataset si prefieres

    gestos.forEach(gesto => {
        gesto.addEventListener("click", async () => {
            // Deshabilitar clicks adicionales mientras se procesa
            gestos.forEach(g => g.style.pointerEvents = 'none');
            
            const opcion_id = gesto.dataset.id;

            try {
                const response = await fetch(urlVerificacion, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "X-CSRFToken": csrftoken
                    },
                    body: `opcion_id=${opcion_id}`
                });

                const data = await response.json();

                if (data.error) {
                    mostrarMensaje(data.error, false);
                    gestos.forEach(g => g.style.pointerEvents = 'auto');
                    return;
                }

                if (data.completado) {
                    gesto.classList.add("correcto");
                    aumentarBarraProgreso(10);
                    mostrarMensaje(data.mensaje);
                    setTimeout(() => {
                        window.location.href = "/finalizado/";
                    }, 1500);
                    return;
                }

                if (data.correcto) {
                    gesto.classList.add("correcto");
                    aumentarBarraProgreso(10);
                    mostrarMensaje(data.mensaje);
                    
                    setTimeout(() => {
                        window.location.href = "/mostrar_ejercicio/";
                    }, 1500);
                } else {
                    gesto.classList.add("incorrecto");
                    mostrarMensaje(data.mensaje, false);
                    
                    // Resaltar la opción correcta
                    const opciones = document.querySelectorAll('.gesto');
                    opciones.forEach(op => {
                        if (op.dataset.id == data.respuesta_correcta) {
                            op.classList.add('respuesta-correcta');
                        }
                    });
                    
                    // Rehabilitar los botones después de mostrar el feedback
                    setTimeout(() => {
                        gestos.forEach(g => {
                            g.style.pointerEvents = 'auto';
                            g.classList.remove("incorrecto");
                        });
                    }, 2000);
                }

            } catch (error) {
                mostrarMensaje("Error de conexión", false);
                gestos.forEach(g => g.style.pointerEvents = 'auto');
            }
        });
    });

    // Efecto hover para los gestos
    gestos.forEach(gesto => {
        gesto.addEventListener('mouseenter', () => {
            if (gesto.style.pointerEvents !== 'none') {
                gesto.style.transform = 'scale(1.05)';
            }
        });
        
        gesto.addEventListener('mouseleave', () => {
            gesto.style.transform = 'scale(1)';
        });
    });
});