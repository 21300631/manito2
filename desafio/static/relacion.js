document.addEventListener('DOMContentLoaded', function() {
    // Elementos del juego
    const contador = document.getElementById('contador');
    const tiempoElement = document.getElementById('tiempo');

    const CONFIG_JUEGO = {
        paresPorGrupo: 5,    // Cantidad de pares por grupo
        totalGrupos: 4,      // Cantidad de grupos distintos
        tiempoPorRonda: 60   // Segundos por ronda
    };
    
    // Variables de estado
    let seleccionado = null;
    let aciertos = 0;
    let tiempoRestante = 60;
    let temporizador;
    let paresDisponibles = [];
    let paresActivos = [];
    let paresUsados = [];
    let indiceReposicion = 0;
    let gruposDePares = [];
    let grupoActual = 0;

    

    function inicializarJuego() {
        try {
            const paresIniciales = JSON.parse(document.getElementById('pares-data').textContent);
            paresDisponibles = [...paresIniciales.pares_correctos, ...paresIniciales.pares_reserva];
            
            // Crear grupos de 5 pares cada uno
            crearGruposDePares();
            verificarGrupos();
            
            mostrarParesIniciales();
        } catch (error) {
            console.error('Error al inicializar el juego:', error);
            alert('Error al cargar el juego: ' + error.message);
        }
    }

    function crearGruposDePares() {
        mezclarArray(paresDisponibles);
        gruposDePares = [];
        
        for (let i = 0; i < CONFIG_JUEGO.totalGrupos; i++) {
            const grupo = paresDisponibles.slice(
                i * CONFIG_JUEGO.paresPorGrupo,
                (i + 1) * CONFIG_JUEGO.paresPorGrupo
            );
            
            if (grupo.length === CONFIG_JUEGO.paresPorGrupo) {
                gruposDePares.push(grupo);
            }
        }
    }

    function mostrarParesIniciales() {
        const filaPalabras = document.querySelector('.fila.palabras');
        const filaImagenes = document.querySelector('.fila.imagenes');
        
        // Limpiar filas
        filaPalabras.innerHTML = '';
        filaImagenes.innerHTML = '';
        paresActivos = [];
        
        // Obtener el grupo actual (con ciclo infinito usando módulo)
        const grupo = gruposDePares[grupoActual % gruposDePares.length];
        
        // Separar y mezclar
        const palabras = grupo.map(p => p.palabra);
        const imagenes = grupo.map(p => p.imagen);
        mezclarArray(palabras);
        mezclarArray(imagenes);
        
        // Mostrar los 5 pares
        for (let i = 0; i < 5; i++) {
            filaPalabras.appendChild(crearElemento('palabra', palabras[i]));
            filaImagenes.appendChild(crearElemento('imagen', imagenes[i]));
            
            paresActivos.push({
                palabra: palabras[i],
                imagen: imagenes[i],
                esCorrecto: palabras[i].id === imagenes[i].id
            });
        }
        
        console.log('Mostrando grupo:', grupoActual % gruposDePares.length);
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
        // Evitar seleccionar elementos ya acertados
        if (elemento.classList.contains('acertado')) {
            return;
        }
    
        // Si se hace clic en el mismo elemento
        if (elemento === seleccionado) {
            elemento.classList.remove('seleccionado');
            seleccionado = null;
            return;
        }
    
        // Si hay un elemento seleccionado diferente
        if (seleccionado) {
            // Determinar tipos
            const esPalabraPrimero = seleccionado.classList.contains('palabra');
            const esImagenPrimero = seleccionado.classList.contains('imagen');
            
            // Validar combinación permitida (palabra-imagen o imagen-palabra)
            if ((esPalabraPrimero && elemento.classList.contains('imagen')) || 
                (esImagenPrimero && elemento.classList.contains('palabra'))) {
                
                const palabraId = esPalabraPrimero ? seleccionado.dataset.id : elemento.dataset.id;
                const imagenId = esPalabraPrimero ? elemento.dataset.id : seleccionado.dataset.id;
    
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
            } else {
                // Selección inválida (dos palabras o dos imágenes)
                seleccionado.classList.remove('seleccionado');
                seleccionado = elemento;
                elemento.classList.add('seleccionado');
            }
        } else {
            // Nueva selección
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
        try {
            // 1. Registrar el par usado
            if (!paresUsados.includes(palabraId)) paresUsados.push(palabraId);
            if (!paresUsados.includes(imagenId)) paresUsados.push(imagenId);
            
            // 2. Eliminar elementos visualmente
            const palabraElement = document.querySelector(`.fila.palabras .item[data-id="${palabraId}"]`);
            const imagenElement = document.querySelector(`.fila.imagenes .item[data-id="${imagenId}"]`);
            
            if (palabraElement) {
                palabraElement.style.transition = 'all 0.3s';
                palabraElement.style.opacity = '0';
                palabraElement.style.transform = 'scale(0)';
            }
            
            if (imagenElement) {
                imagenElement.style.transition = 'all 0.3s';
                imagenElement.style.opacity = '0';
                imagenElement.style.transform = 'scale(0)';
            }
    
            // 3. Eliminar de pares activos
            paresActivos = paresActivos.filter(p => 
                !(p.palabra.id.toString() === palabraId && 
                  p.imagen.id.toString() === imagenId)
            );
    
            // 4. Verificar si debemos rotar al siguiente grupo
            const paresCorrectosRestantes = paresActivos.filter(p => p.esCorrecto).length;
            if (paresCorrectosRestantes === 0) {
                grupoActual++;
                console.log('Rotando al siguiente grupo:', grupoActual % gruposDePares.length);
            }
    
            // 5. Reponer pares después de la animación
            setTimeout(() => {
                // Eliminar físicamente los elementos
                if (palabraElement && palabraElement.parentNode) palabraElement.remove();
                if (imagenElement && imagenElement.parentNode) imagenElement.remove();
                
                // Calcular cuántos pares necesitamos reponer
                const totalPares = document.querySelectorAll('.fila.palabras .item').length;
                const paresNecesarios = 5 - totalPares;
                
                if (paresNecesarios > 0) {
                    reponerPares(paresNecesarios);
                }
                
                verificarBalance();
            }, 300);
            
        } catch (error) {
            console.error('Error en reemplazarParCorrecto:', error);
            setTimeout(() => mostrarParesIniciales(), 500);
        }
    }
    
   

    
    function reponerPares(cantidad) {
        // Obtener el grupo actual
        const grupo = gruposDePares[grupoActual % gruposDePares.length];
        
        // Obtener elementos no mostrados del grupo actual
        const palabrasDisponibles = grupo.map(p => p.palabra).filter(p => 
            !document.querySelector(`.fila.palabras .item[data-id="${p.id}"]`)
        );
        
        const imagenesDisponibles = grupo.map(p => p.imagen).filter(i => 
            !document.querySelector(`.fila.imagenes .item[data-id="${i.id}"]`)
        );
        
        // Mezclar los disponibles
        mezclarArray(palabrasDisponibles);
        mezclarArray(imagenesDisponibles);
        
        // Agregar nuevos pares
        for (let i = 0; i < cantidad && i < palabrasDisponibles.length && i < imagenesDisponibles.length; i++) {
            const palabra = palabrasDisponibles[i];
            const imagen = imagenesDisponibles[i];
            
            document.querySelector('.fila.palabras').appendChild(crearElemento('palabra', palabra));
            document.querySelector('.fila.imagenes').appendChild(crearElemento('imagen', imagen));
            
            // Registrar como par activo
            paresActivos.push({
                palabra: palabra,
                imagen: imagen,
                esCorrecto: palabra.id === imagen.id
            });
        }
        
        // Si no hay suficientes en el grupo actual, forzar rotación
        if (document.querySelectorAll('.fila.palabras .item').length < 5) {
            grupoActual++;
            mostrarParesIniciales();
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
    
    // Llámala después de crearGruposDePares()

    // Inicializar el juego
    inicializarJuego();
    iniciarTemporizador();
    verificarEstadoGrupos();
    console.log('Pares disponibles:', paresDisponibles.length);
    console.log('Pares activos:', paresActivos.length);

    
}); 