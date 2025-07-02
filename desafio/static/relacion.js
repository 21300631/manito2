document.addEventListener('DOMContentLoaded', function() {
    // Elementos del juego
    const contador = document.getElementById('contador');
    const tiempoElement = document.getElementById('tiempo');
    const juegoConfig = document.getElementById('juego-config');
    const totalPares = juegoConfig ? parseInt(juegoConfig.dataset.totalPares) : 5;

    const elementos = {
        contador: document.getElementById('contador'),
        tiempoElement: document.getElementById('tiempo'),
        totalParesInput: document.getElementById('total-pares'),
        paresData: document.getElementById('pares-data')
    };
    
    console.log('Elementos encontrados al iniciar:', elementos);

    if (!elementos.paresData) {
        console.error('Error: Falta el elemento con los datos de pares');
        return;
    }

    const CONFIG_JUEGO = {
        paresPorGrupo: 5,
        totalGrupos: 4,
        tiempoPorRonda: 40,
        totalPares: elementos.totalParesInput ? 
                   parseInt(elementos.totalParesInput.value) : 
                   5 // Valor por defecto
    };
    
    // Variables de estado
    let seleccionado = null;
    let aciertos = 0;
    let tiempoRestante = CONFIG_JUEGO.tiempoPorRonda;
    let temporizador;
    let paresDisponibles = [];
    let paresActivos = [];
    let paresUsados = [];
    let grupoActual = 0;
    let gruposDePares = [];

    function inicializarJuego() {
        const paresIniciales = JSON.parse(document.getElementById('pares-data').textContent);
        paresDisponibles = [...paresIniciales.pares_correctos, ...paresIniciales.pares_reserva];
        
        if (paresDisponibles.length < 5) {
            console.error("¡No hay suficientes pares para jugar!");
            return;
        }
        
        crearGruposDePares();
        mostrarParesIniciales();
    }


    function crearGruposDePares() {
        mezclarArray(paresDisponibles);
        
        gruposDePares = [];
        for (let i = 0; i < paresDisponibles.length; i += 5) {
            const grupo = paresDisponibles.slice(i, i + 5);
            if (grupo.length > 0) {
                gruposDePares.push(grupo);
            }
        }
    }

    function mostrarParesIniciales() {
        const grupo = gruposDePares[grupoActual % gruposDePares.length];
        
        document.querySelector('.fila.palabras').innerHTML = '';
        document.querySelector('.fila.imagenes').innerHTML = '';

        const palabrasGrupo = grupo.map(par => par.palabra);
        const imagenesGrupo = grupo.map(par => par.imagen);
        
        mezclarArray(palabrasGrupo);
        mezclarArray(imagenesGrupo);
        
        palabrasGrupo.forEach(palabra => {
            document.querySelector('.fila.palabras').appendChild(crearElemento('palabra', palabra));
        });
        
        imagenesGrupo.forEach(imagen => {
            document.querySelector('.fila.imagenes').appendChild(crearElemento('imagen', imagen));
        });

        paresActivos = grupo.map(par => ({
            palabra: par.palabra,
            imagen: par.imagen,
            esCorrecto: par.palabra.id === par.imagen.id
        }));
        
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

    function manejarSeleccion(elemento) {
        if (elemento.classList.contains('acertado')) {
            return;
        }
    
        if (elemento === seleccionado) {
            elemento.classList.remove('seleccionado');
            seleccionado = null;
            return;
        }
    
        if (seleccionado) {
            const esPalabraPrimero = seleccionado.classList.contains('palabra');
            const esImagenPrimero = seleccionado.classList.contains('imagen');
            
            if ((esPalabraPrimero && elemento.classList.contains('imagen')) || 
                (esImagenPrimero && elemento.classList.contains('palabra'))) {
                
                const palabraId = esPalabraPrimero ? seleccionado.dataset.id : elemento.dataset.id;
                const imagenId = esPalabraPrimero ? elemento.dataset.id : seleccionado.dataset.id;
    
                if (esParCorrecto(palabraId, imagenId)) {
                    aciertos++;
                    contador.textContent = aciertos;
                    
                    seleccionado.classList.add('acertado');
                    elemento.classList.add('acertado');
                    
                    setTimeout(() => {
                        reemplazarParCorrecto(palabraId, imagenId);
                    }, 300);
                } else {
                    seleccionado.classList.add('error');
                    elemento.classList.add('error');
                    
                    setTimeout(() => {
                        seleccionado.classList.remove('seleccionado', 'error');
                        elemento.classList.remove('error');
                        seleccionado = null;
                    }, 500);
                }
            } else {
                seleccionado.classList.remove('seleccionado');
                seleccionado = elemento;
                elemento.classList.add('seleccionado');
            }
        } else {
            seleccionado = elemento;
            elemento.classList.add('seleccionado');
        }
    }

    function esParCorrecto(palabraId, imagenId) {
        return paresDisponibles.some(p => 
            p.palabra.id.toString() === palabraId && 
            p.imagen.id.toString() === imagenId
        );
    }

    function reemplazarParCorrecto(palabraId, imagenId) {
        paresActivos = paresActivos.filter(p => !(p.palabra.id == palabraId && p.imagen.id == imagenId));

        const paresCorrectosRestantes = paresActivos.filter(p => p.esCorrecto).length;

        if (paresCorrectosRestantes === 0) {
            grupoActual++;
            console.log(" Rotando al grupo:", grupoActual % gruposDePares.length);
            
            setTimeout(() => {
                mostrarParesIniciales();
            }, 500);
            return; 
        }

        setTimeout(() => {
            const totalParesVisibles = document.querySelectorAll('.fila.palabras .item').length;
            const paresNecesarios = 5 - totalParesVisibles;
            
            if (paresNecesarios > 0) {
                reponerPares(paresNecesarios);
            }
        }, 300);
    }

    
    function reponerPares(cantidad) {
        const grupo = gruposDePares[grupoActual % gruposDePares.length];
        
        const palabrasDisponibles = grupo.map(p => p.palabra).filter(p => 
            !document.querySelector(`.fila.palabras .item[data-id="${p.id}"]`)
        );
        
        const imagenesDisponibles = grupo.map(p => p.imagen).filter(i => 
            !document.querySelector(`.fila.imagenes .item[data-id="${i.id}"]`)
        );
        
        mezclarArray(palabrasDisponibles);
        mezclarArray(imagenesDisponibles);
        
        const maxReposicion = Math.min(cantidad, palabrasDisponibles.length, imagenesDisponibles.length);
        
        for (let i = 0; i < maxReposicion; i++) {
            const palabra = palabrasDisponibles[i];
            const imagen = imagenesDisponibles[i];
            
            document.querySelector('.fila.palabras').appendChild(crearElemento('palabra', palabra));
            document.querySelector('.fila.imagenes').appendChild(crearElemento('imagen', imagen));
            
            paresActivos.push({
                palabra: palabra,
                imagen: imagen,
                esCorrecto: palabra.id === imagen.id
            });
        }
        
        verificarBalance();
        if (document.querySelectorAll('.fila.palabras .item').length < 5) {
            grupoActual++;
            setTimeout(() => mostrarParesIniciales(), 500);
        }
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
            
                while (palabras.length > imagenes.length && palabras.length > 0) {
                palabras[palabras.length - 1].remove();
            }
            
            while (imagenes.length > palabras.length && imagenes.length > 0) {
                imagenes[imagenes.length - 1].remove();
            }
        }
    }

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
        
        const porcentajeExito = Math.round((aciertos / totalPares) * 100);
        const tiempoUsado = CONFIG_JUEGO.tiempoPorRonda - tiempoRestante;
        
        window.location.href = `${window.location.pathname}?completado=1&puntaje=${aciertos*10}&tiempo=${tiempoUsado}`;
    }

    function verificarEstadoGrupos() {
        console.log('--- Estado Actual ---');
        console.log('Grupo actual:', grupoActual % gruposDePares.length);
        console.log('Pares activos:', paresActivos.length);
        console.log('Pares correctos restantes:', 
            paresActivos.filter(p => p.esCorrecto).length);
        console.log('Elementos visibles:',
            'Palabras:', document.querySelectorAll('.fila.palabras .item').length,
            'Imágenes:', document.querySelectorAll('.fila.imagenes .item').length);
    }

    function verificarGrupos() {
        console.log('=== VERIFICACIÓN DE GRUPOS ===');
        console.log(`Total de grupos: ${gruposDePares.length}`);
        
        gruposDePares.forEach((grupo, index) => {
            console.log(`Grupo ${index + 1}:`);
            grupo.forEach(par => {
                console.log(`- ${par.palabra.palabra} (ID: ${par.palabra.id})`);
            });
        });
        
        console.log('Pares disponibles totales:', paresDisponibles.length);
    }
    
    inicializarJuego();
    iniciarTemporizador();
    verificarEstadoGrupos();
}); 