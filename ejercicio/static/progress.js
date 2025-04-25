// progress.js
function aumentarBarraProgreso(valor) {
    const barra = document.getElementById("progressBar");
    if (!barra) return;

    let progresoActual = parseInt(barra.style.height || "0");
    if (isNaN(progresoActual)) progresoActual = 0;

    const nuevoProgreso = Math.min(progresoActual + valor, 100);
    barra.style.height = `${nuevoProgreso}%`;
}
