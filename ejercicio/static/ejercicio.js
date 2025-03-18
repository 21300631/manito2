function updateProgressBarVertical(progress) {
    const progressBar = document.getElementById('progressBar');
    
    progressBar.style.height = progress + '%';
}

// Ejemplo de uso:
updateProgressBarVertical(50); // Actualiza la barra de progreso al 50%