document.addEventListener("DOMContentLoaded", function () {
    const notificaciones = document.querySelector(".banners");
    const items = document.querySelectorAll(".ejercicio");

    let index = 0;
    let intervalo = setInterval(moverCarrusel, 10000);

    function moverCarrusel() {
        if (index >= items.length - 1) {
            clearInterval(intervalo);
            mostrarFelicitaciones();
            return;
        }

        let desplazamiento = -index * 41;
        notificaciones.style.transform = `translateY(${desplazamiento}px)`;

        items.forEach(item => item.style.fontWeight = "normal");
        items[index].style.fontWeight = "bold";

        index++;
    }

    function mostrarFelicitaciones() {
        Swal.fire({
            title: "¡Felicidades!",
            text: "Has completado los ejercicios 🎉",
            icon: "success",
            confirmButtonText: "Ir a inicio",
            showCancelButton: false,
            confirmButtonText: "Aceptar"
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = "/inicio/"; 
            }
        });
    }

    
});
