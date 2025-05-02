document.addEventListener('DOMContentLoaded', function() {
    // Elementos del juego
    const contador = document.getElementById('contador');
    const tiempoElement = document.getElementById('tiempo');
    
    // Variables de estado
    let seleccionado = null;
    let aciertos = 0;
    let tiempoRestante = 60;
    let temporizador;
    let paresDisponibles = [];
    let paresActivos = [];

    // 1. Funciones de Inicialización
    function inicializarJuego() {
        try {
            // Obtener datos iniciales del HTML
            const paresIniciales = JSON.parse(document.getElementById('pares-data').textContent);
            paresDisponibles = [...paresIniciales.pares_correctos, ...paresIniciales.pares_reserva];
            
            // Mostrar primeros pares
            mostrarParesIniciales();
        } catch (error) {
            console.error('Error al inicializar el juego:', error);
            alert('Ocurrió un error al cargar el juego. Por favor recarga la página.');
        }
    }

    function mostrarParesIniciales() {
        const filaPalabras = document.querySelector('.fila.palabras');
        const filaImagenes = document.querySelector('.fila.imagenes');
        
        // Limpiar filas
        filaPalabras.innerHTML = '';
        filaImagenes.innerHTML = '';
        paresActivos = [];
        
        // Seleccionar 3 pares correctos y 2 incorrectos
        const paresMostrar = [];
        
        // 1. Agregar pares correctos (hasta 3)
        const paresCorrectos = paresDisponibles.slice(0, 3);
        paresMostrar.push(...paresCorrectos);
        
        // 2. Crear pares incorrectos (2)
        const palabrasRestantes = paresDisponibles.slice(3).map(p => p.palabra);
        const imagenesRestantes = paresDisponibles.slice(3).map(p => p.imagen);
        
        // Mezclar para aleatoriedad
        mezclarArray(palabrasRestantes);
        mezclarArray(imagenesRestantes);
        
        // Crear pares incorrectos que no coincidan
        for (let i = 0; i < 2 && i < palabrasRestantes.length && i < imagenesRestantes.length; i++) {
            // Asegurarse de no crear accidentalmente un par correcto
            let palabra = palabrasRestantes[i];
            let imagen = imagenesRestantes[i];
            
            // Si coinciden los IDs, buscar otra imagen
            if (palabra.id === imagen.id) {
                for (let j = i + 1; j < imagenesRestantes.length; j++) {
                    if (imagenesRestantes[j].id !== palabra.id) {
                        imagen = imagenesRestantes[j];
                        break;
                    }
                }
            }
            
            paresMostrar.push({
                palabra: palabra,
                imagen: imagen,
                esCorrecto: false
            });
        }
        
        // Mezclar todo el conjunto
        mezclarArray(paresMostrar);
        
        // Mostrar solo 5 pares
        paresMostrar.slice(0, 5).forEach(par => {
            filaPalabras.appendChild(crearElemento('palabra', par.palabra));
            filaImagenes.appendChild(crearElemento('imagen', par.imagen));
            paresActivos.push(par);
        });
        
        // Verificar balance inicial
        verificarBalance();
    }

    function crearElemento(tipo, datos) {
        const div = document.createElement('div');
        div.className = `item ${tipo}`;
        div.dataset.id = datos.id;
        div.dataset.palabra = datos.palabra;
        div.tabIndex = 0;
        
        if (tipo === 'palabra') {
            const span = document.createElement('span');
            span.textContent = datos.palabra;
            div.appendChild(span);
        } else {
            const img = document.createElement('img');
            img.src = datos.url;
            img.alt = `Gesto ${datos.palabra}`;
            img.style.maxWidth = '120px';
            img.style.borderRadius = '8px';
            div.appendChild(img);
        }
        
        div.addEventListener('click', () => manejarSeleccion(div));
        return div;
    }

    // 2. Funciones de Lógica del Juego
    function manejarSeleccion(elemento) {
        // Si no hay nada seleccionado, seleccionar este elemento
        if (!seleccionado) {
            seleccionado = elemento;
            elemento.classList.add('seleccionado');
            return;
        }
        
        // Si se hace clic en el mismo elemento, deseleccionar
        if (seleccionado === elemento) {
            seleccionado.classList.remove('seleccionado');
            seleccionado = null;
            return;
        }
        
        // Determinar qué es palabra y qué es imagen
        const esPalabraPrimero = seleccionado.classList.contains('palabra');
        const palabraId = esPalabraPrimero ? seleccionado.dataset.id : elemento.dataset.id;
        const imagenId = esPalabraPrimero ? elemento.dataset.id : seleccionado.dataset.id;
        
        // Verificar si es par correcto
        if (esParCorrecto(palabraId, imagenId)) {
            // Par correcto
            aciertos++;
            contador.textContent = aciertos;
            
            seleccionado.classList.add('acertado');
            elemento.classList.add('acertado');
            
            setTimeout(() => {
                reemplazarParCorrecto(palabraId, imagenId);
            }, 300);
        } else {
            // Par incorrecto
            seleccionado.classList.add('error');
            elemento.classList.add('error');
            
            setTimeout(() => {
                seleccionado.classList.remove('seleccionado', 'error');
                elemento.classList.remove('error');
                seleccionado = null;
            }, 500);
        }
    }

    function esParCorrecto(palabraId, imagenId) {
        return paresDisponibles.some(p => 
            p.palabra.id.toString() === palabraId && 
            p.imagen.id.toString() === imagenId
        );
    }

    function reemplazarParCorrecto(palabraId, imagenId) {
        // Eliminar de pares activos
        paresActivos = paresActivos.filter(p => 
            !(p.palabra.id.toString() === palabraId && 
              p.imagen.id.toString() === imagenId)
        );
        
        // Eliminar elementos de la interfaz
        const palabraElement = document.querySelector(`.fila.palabras .item[data-id="${palabraId}"]`);
        const imagenElement = document.querySelector(`.fila.imagenes .item[data-id="${imagenId}"]`);
        
        if (palabraElement) palabraElement.remove();
        if (imagenElement) imagenElement.remove();
        
        seleccionado = null;
        
        // Verificar si necesitamos agregar nuevos pares
        const totalPares = document.querySelectorAll('.fila.palabras .item').length;
        if (totalPares < 5 && paresDisponibles.length > 0) {
            agregarNuevosPares(5 - totalPares);
        }
        
        // Verificar balance después de los cambios
        verificarBalance();
    }

    function agregarNuevosPares(cantidad) {
        const filaPalabras = document.querySelector('.fila.palabras');
        const filaImagenes = document.querySelector('.fila.imagenes');
        
        // Primero: Intentar agregar pares correctos no mostrados
        const paresCorrectosDisponibles = paresDisponibles.filter(p => 
            !paresActivos.some(a => a.palabra && a.palabra.id === p.palabra.id)
        );
        
        // Agregar tantos pares correctos como sea posible
        const paresCorrectosAAgregar = Math.min(cantidad, paresCorrectosDisponibles.length);
        for (let i = 0; i < paresCorrectosAAgregar; i++) {
            const par = paresCorrectosDisponibles[i];
            filaPalabras.appendChild(crearElemento('palabra', par.palabra));
            filaImagenes.appendChild(crearElemento('imagen', par.imagen));
            paresActivos.push(par);
            cantidad--;
        }
        
        // Si todavía necesitamos más pares
        if (cantidad > 0) {
            // Obtener palabras e imágenes no usadas
            const palabrasNoUsadas = paresDisponibles
                .filter(p => !paresActivos.some(a => a.palabra && a.palabra.id === p.palabra.id))
                .map(p => p.palabra);
            
            const imagenesNoUsadas = paresDisponibles
                .filter(p => !paresActivos.some(a => a.imagen && a.imagen.id === p.imagen.id))
                .map(p => p.imagen);
            
            // Mezclar para aleatoriedad
            mezclarArray(palabrasNoUsadas);
            mezclarArray(imagenesNoUsadas);
            
            // Crear pares mixtos manteniendo el balance
            const paresAAgregar = Math.min(cantidad, palabrasNoUsadas.length, imagenesNoUsadas.length);
            for (let i = 0; i < paresAAgregar; i++) {
                // Asegurarse de no crear accidentalmente un par correcto
                let palabra = palabrasNoUsadas[i];
                let imagen = imagenesNoUsadas[i];
                
                // Si por casualidad coinciden los IDs, buscar otra imagen
                if (palabra.id === imagen.id) {
                    for (let j = i + 1; j < imagenesNoUsadas.length; j++) {
                        if (imagenesNoUsadas[j].id !== palabra.id) {
                            imagen = imagenesNoUsadas[j];
                            break;
                        }
                    }
                }
                
                filaPalabras.appendChild(crearElemento('palabra', palabra));
                filaImagenes.appendChild(crearElemento('imagen', imagen));
                paresActivos.push({
                    palabra: palabra,
                    imagen: imagen,
                    esCorrecto: false
                });
            }
        }
        
        // Verificar balance final
        verificarBalance();
    }

    function verificarBalance() {
        const palabras = document.querySelectorAll('.fila.palabras .item');
        const imagenes = document.querySelectorAll('.fila.imagenes .item');
        
        console.log(`Balance actual: ${palabras.length} palabras vs ${imagenes.length} imágenes`);
        
        if (palabras.length !== imagenes.length) {
            console.error('¡Desbalance detectado!', {
                palabras: palabras.length,
                imagenes: imagenes.length
            });
            
            // Corregir desbalance eliminando elementos extras
            while (palabras.length > imagenes.length && palabras.length > 0) {
                palabras[palabras.length - 1].remove();
            }
            
            while (imagenes.length > palabras.length && imagenes.length > 0) {
                imagenes[imagenes.length - 1].remove();
            }
        }
    }

    // 3. Funciones de Utilidad
    function mezclarArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function iniciarTemporizador() {
        temporizador = setInterval(() => {
            tiempoRestante--;
            const minutos = Math.floor(tiempoRestante / 60);
            const segundos = tiempoRestante % 60;
            tiempoElement.textContent = `${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;
            
            if (tiempoRestante <= 0) {
                clearInterval(temporizador);
                finDelJuego();
            }
        }, 1000);
    }

    function finDelJuego() {
        clearInterval(temporizador);
        // Puedes personalizar este mensaje o redirigir
        alert(`¡Juego terminado!\nAciertos: ${aciertos}\nTiempo restante: 0 segundos`);
    }

    // Inicializar el juego
    inicializarJuego();
    iniciarTemporizador();
    console.log('Pares disponibles:', paresDisponibles.length);
    console.log('Pares activos:', paresActivos.length);
}); 