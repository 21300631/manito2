// Primero define la gráfica sin datos
let myDoughnutChart;

function inicializarGrafica(puntosActuales, puntosFaltantes) {
    const ctx = document.getElementById('dona-grafica').getContext('2d');
    
    // Actualiza el texto con los puntos
    document.getElementById('puntos-usuario').textContent = puntosActuales;
    
    // Si el usuario tiene todas las etapas completadas
    if (puntosFaltantes === 0) {
        const data = {
            labels: ['¡Todas las etapas completadas!'],
            datasets: [{
                data: [1],
                backgroundColor: ['rgb(75, 192, 192)'],
                hoverOffset: 4
            }]
        };

        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        };

        if (myDoughnutChart) {
            myDoughnutChart.destroy();
        }
        
        myDoughnutChart = new Chart(ctx, config);
        return;
    }
    
    // Configuración normal cuando faltan puntos
    const data = {
        labels: [
            `Puntos obtenidos: ${puntosActuales}`,
            `Faltan: ${puntosFaltantes}`
        ],
        datasets: [{
            data: [puntosActuales, puntosFaltantes],
            backgroundColor: [
                'rgb(239, 118, 122)',
                'rgb(255, 205, 86)'
            ],
            borderWidth: 1,
            hoverOffset: 4
        }]
    };

    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            cutout: '50%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12
                        },
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

    if (myDoughnutChart) {
        myDoughnutChart.destroy();
    }
    
    myDoughnutChart = new Chart(ctx, config);
}

// Función para calcular los puntos faltantes para la próxima etapa
function calcularPuntosFaltantes(puntosActuales) {
    if (puntosActuales < 6800) return 6800 - puntosActuales;
    if (puntosActuales < 10200) return 10200 - puntosActuales;
    if (puntosActuales < 16200) return 16200 - puntosActuales;
    return 0; // Si tiene todos los puntos
}


function bringToFront(element) {
    let cards = Array.from(document.querySelectorAll('.card')); // Convertimos NodeList en Array
    let selectedIndex = cards.indexOf(element); // Encontramos el índice de la tarjeta seleccionada

    // Reorganizar las tarjetas en el nuevo orden
    let newOrder = [
        ...cards.slice(selectedIndex + 1), // Tarjetas después de la seleccionada
        ...cards.slice(0, selectedIndex),  // Tarjetas antes de la seleccionada
        element // La tarjeta seleccionada va al final (al frente)
    ];

    // Aplicar nuevos valores de posición y z-index
    newOrder.forEach((card, index) => {
        card.style.left = `${index * 80}px`; // Reposiciona cada tarjeta
        card.style.zIndex = index + 1; // Asigna un nuevo z-index en orden
    });
}


function accesoEtapa(etapa, elemento){
    event.preventDefault();
    event.stopPropagation();

    fetch(APP_URLS.puntosUsuario)
        .then(response => {
            if(!response.ok) throw new Error('Error en la red');
            return response.json();
        })
        .then(data => {
            const puntosNecesarios = parseInt(elemento.getAttribute('data-required-points'));
            const puntosUsuario = data.puntos;
            if( puntosUsuario >= puntosNecesarios) {
                // Si el usuario tiene suficientes puntos, redirigir a la etapa
                window.location.href = `/lecciones/etapa${etapa}/`;
            } else {
                // Si no tiene suficientes puntos, mostrar un mensaje
                Swal.fire({
                    title: '¡Ups!',
                    text: `Te falta completar la etapa anterior`,
                    icon: 'warning',
                    confirmButtonText: 'Aceptar'
                });
            }
    })
    .catch(error => console.error(error));
}

document.addEventListener('DOMContentLoaded', function() {
    fetch(APP_URLS.puntosUsuario)
        .then(response => { 
            if (!response.ok) throw new Error('Error en la red');
            return response.json();
        })
        .then(data => {
            if(!data.unlocked_stages.etapa2){
                document.getElementById('etapa2-card').style.display = 'locked';
            }
            if(!data.unlocked_stages.etapa3){
                document.getElementById('etapa3-card').style.display = 'locked';
            }
            if(!data.unlocked_stages.etapa4){
                document.getElementById('etapa4-card').style.display = 'locked';
            }
        })
        .catch(error => console.error(error));
    });


// Actualiza el DOMContentLoaded para incluir la gráfica
document.addEventListener('DOMContentLoaded', function() {
    fetch(APP_URLS.puntosUsuario)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
       .then(data => {
            if (data.error) throw new Error(data.error);
            
            // Actualiza las etapas bloqueadas
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                const requiredPoints = card.getAttribute('data-required-points');
                if (requiredPoints) {
                    const stage = `etapa${requiredPoints === '6800' ? '2' : 
                                  requiredPoints === '10200' ? '3' : '4'}`;
                    if (!data.unlocked_stages[stage]) {
                        card.classList.add('locked');
                    }
                }
            });
            
            // Actualiza la gráfica
            const puntosFaltantes = calcularPuntosFaltantes(data.puntos);
            inicializarGrafica(data.puntos, puntosFaltantes);
            
            // Actualiza el texto "Siguiente etapa"
            const nextStageText = document.querySelector('.texto-puntos span');
            if (data.puntos < 6800) {
                nextStageText.textContent = '2 (6800 pts)';
            } else if (data.puntos < 10200) {
                nextStageText.textContent = '3 (10200 pts)';
            } else if (data.puntos < 16200) {
                nextStageText.textContent = '4 (16200 pts)';
            } else {
                nextStageText.textContent = '¡Todas completadas!';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudieron cargar los datos. Por favor intenta más tarde.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        });
});