const APP_URLS = {
    puntosUsuario: "puntosUsuario/"
};

let datosUsuario = null;

document.addEventListener("DOMContentLoaded", async function() {
    try {
        const response = await fetch(APP_URLS.puntosUsuario);
        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }
        datosUsuario = await response.json();
        console.log("DATOS DEL USUARIO:", datosUsuario);
        inicializarApp(datosUsuario);
    } catch (error) {
        console.error(error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar los datos. Por favor intenta más tarde.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
});

function inicializarApp(data) {
    actualizarEstados(data);
    actualizarGrafica(data);
    actualizarOtros(data);
}

function actualizarEstados(data) {
    if (!data.unlocked_stages.etapa2) {
        document.getElementById('etapa2-card').style.display = 'locked';
    }
    if (!data.unlocked_stages.etapa3) {
        document.getElementById('etapa3-card').style.display = 'locked';
    }
    if (!data.unlocked_stages.etapa4) {
        document.getElementById('etapa4-card').style.display = 'locked';
    }
}

function actualizarGrafica(data) {
    const puntosFaltantes = calcularPuntosFaltantes(data.puntos);
    inicializarGrafica(data.puntos, puntosFaltantes);

    const nextStageText = document.querySelector('.texto-puntos span');
    if (!data.unlocked_stages.etapa2) {
        nextStageText.textContent = '2 (6800 pts y completar etapa 1)';
    } else if (!data.unlocked_stages.etapa3) {
        nextStageText.textContent = '3 (10200 pts y completar etapa 2)';
    } else if (!data.unlocked_stages.etapa4) {
        nextStageText.textContent = '4 (16200 pts y completar etapa 3)';
    } else {
        nextStageText.textContent = '¡Todas completadas!';
    }
}

function actualizarOtros(data) {
    inicializarDesafio(data);
}

function inicializarDesafio(data) {
    const nombreDesafio = document.getElementById('nombre-desafio');
    const enalceDesafio = document.getElementById('enlace-desafio');
    const descripcionDesafio = document.getElementById('descripcion');

    const minutos = new Date().getMinutes();
    const segmento = Math.floor(minutos / 2) % 3;

    let desafio, url, descripcion;

    switch (segmento) {
        case 0:
            desafio = "Contrarreloj";
            descripcion = "Un juego de velocidad y precisión donde debes completar tareas en el menor tiempo posible.";
            url = "/desafio/contrarreloj/";
            break;
        case 1:
            desafio = "Memorama";
            descripcion = "Un juego de memoria donde debes encontrar pares de cartas iguales.";
            url = "/desafio/memorama/";
            break;
        case 2:
            desafio = "Relacion";
            descripcion = "Un juego de asociación donde debes relacionar conceptos con imágenes.";
            url = "/desafio/relacion/";
            break;
    }

    nombreDesafio.textContent = desafio;
    descripcionDesafio.textContent = descripcion;

    if (data.puntos > 900) {
        enalceDesafio.href = url;
    } else {
        enalceDesafio.href = "#";
        enalceDesafio.addEventListener('click', function(event) {
            event.preventDefault();
            Swal.fire({
                title: '¡Ups!',
                text: 'Necesitas al menos 900 puntos para acceder a los desafíos.',
                icon: 'warning',
                confirmButtonText: 'Aceptar'
            });
        });
    }
}



function inicializarGrafica(puntosActuales, puntosFaltantes) {
    const ctx = document.getElementById('dona-grafica').getContext('2d');
    document.getElementById('puntos-usuario').textContent = puntosActuales;

    if (puntosFaltantes === 0) {
        const data = {
            labels: ['¡Todas las etapas completadas!'],
            datasets: [{ data: [1], backgroundColor: ['rgb(75, 192, 192)'], hoverOffset: 4 }]
        };
        const config = {
            type: 'doughnut',
            data,
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        };
        if (window.myDoughnutChart) {
            window.myDoughnutChart.destroy();
        }
        window.myDoughnutChart = new Chart(ctx, config);
        return;
    }

    const data = {
        labels: [`Puntos obtenidos: ${puntosActuales}`, `Faltan: ${puntosFaltantes}`],
        datasets: [{
            data: [puntosActuales, puntosFaltantes],
            backgroundColor: ['rgb(239, 118, 122)', 'rgb(255, 205, 86)'],
            borderWidth: 1,
            hoverOffset: 4
        }]
    };
    const config = {
        type: 'doughnut',
        data,
        options: {
            responsive: true,
            cutout: '50%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 12 },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label;
                        }
                    }
                }
            }
        }
    };
    if (window.myDoughnutChart) {
        window.myDoughnutChart.destroy();
    }
    window.myDoughnutChart = new Chart(ctx, config);
}

function calcularPuntosFaltantes(puntosActuales) {
    if (puntosActuales < 6800) return 6800 - puntosActuales;
    if (puntosActuales < 10200) return 10200 - puntosActuales;
    if (puntosActuales < 16200) return 16200 - puntosActuales;
    return 0;
}
