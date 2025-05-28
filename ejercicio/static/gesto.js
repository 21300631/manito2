document.addEventListener('DOMContentLoaded', () => {
    // Verificar si es un ejercicio de video (usando la variable global definida en el HTML)
    if (IS_VIDEO_EXERCISE) {
        console.log("Ejercicio de video detectado");
        
        // Elementos del DOM
        const videoElement = document.getElementById('inputVideo');
        const canvasElement = document.getElementById('outputCanvas');
        const recordButton = document.getElementById('recordBtn');
        const nextButton = document.getElementById('nextBtn');
        const countdownElement = document.getElementById('countdown');
        const recordingTimerElement = document.getElementById('recordingTimer');
        const gestoVideo = document.getElementById('gestoVideo');
        const palabraActual= gestoVideo.dataset.palabra;
        const palabraJsonUrl = gestoVideo.dataset.palabraJson;

        let referenceLandmarks = null;

        console.log(`Palabra actual: ${palabraActual}`);
        console.log(`URL de landmarks: ${palabraJsonUrl}`);
        
        if (typeof LANDMARKS_JSON_URL !== 'undefined') {
            console.log("JSON de la palabra:", LANDMARKS_JSON_URL);
        }
        // Opción 2: Obtener el JSON mediante fetch
        else if (palabraJsonUrl) {
            fetch(palabraJsonUrl)
                .then(response => response.json())
                .then(jsonData => {
                    console.log("JSON de la palabra obtenido:", jsonData);
                    // Aquí puedes usar jsonData como necesites
                })
                .catch(error => {
                    console.error("Error obteniendo JSON de la palabra:", error);
                });
        }

        if (palabraJsonUrl) {
            fetch(palabraJsonUrl)
                .then(response => response.json())
                .then(jsonData => {
                    referenceLandmarks = jsonData;
                    console.log("Landmarks de referencia cargados:", referenceLandmarks);
                })
                .catch(error => {
                    console.error("Error cargando JSON de referencia:", error);
                });
        }
        

        // Mostrar el botón de grabar
        if (recordButton) {
            recordButton.style.display = 'inline-block';
            recordButton.disabled = false;
        } else {
            console.error("Botón de grabación no encontrado");
        }
        
        // Configuración inicial
        if (canvasElement) {
            canvasElement.width = 640;
            canvasElement.height = 480;
            const ctx = canvasElement.getContext('2d');
            
            let mediaRecorder;
            let recordedChunks = [];
            let isRecording = false;
            let countdownInterval;
            let recordingTimerInterval;
            let allHandLandmarks = []; // Almacenará landmarks de mano por frame
            let hands;
            
            ctx.imageSmoothingEnabled = true;
            videoElement.playsInline = true;
            videoElement.muted = true;

            // Configurar MediaPipe Hands
            async function setupHandTracking() {
                const hands = new Hands({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                    }
                });
                
                hands.setOptions({
                    maxNumHands: 2,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });
                
                hands.onResults(onHandsResults);
                
                return hands;
            }

            // Función para normalizar landmarks
            function normalizeLandmarks(landmarks) {
                if (!landmarks || landmarks.length === 0) return null;
                
                // 1. Calcular centroide (punto central)
                const centroid = landmarks.reduce((acc, point) => {
                    acc.x += point.x;
                    acc.y += point.y;
                    acc.z += point.z;
                    return acc;
                }, {x: 0, y: 0, z: 0});
                
                centroid.x /= landmarks.length;
                centroid.y /= landmarks.length;
                centroid.z /= landmarks.length;
                
                // 2. Calcular escala basada en la distancia máxima al centroide
                let maxDistance = 0;
                landmarks.forEach(point => {
                    const dx = point.x - centroid.x;
                    const dy = point.y - centroid.y;
                    const dz = point.z - centroid.z;
                    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    if (distance > maxDistance) maxDistance = distance;
                });
                
                if (maxDistance === 0) return null;
                
                // 3. Normalizar y centrar
                return landmarks.map(point => ({
                    id: point.id,
                    x: (point.x - centroid.x) / maxDistance,
                    y: (point.y - centroid.y) / maxDistance,
                    z: (point.z - centroid.z) / maxDistance
                }));
            }

            // Función para calcular la similitud entre dos conjuntos de landmarks
            function calculateSimilarity(userLandmarks, referenceLandmarks) {
                if (!userLandmarks || !referenceLandmarks) return 0;
                
                const normalizedUser = normalizeLandmarks(userLandmarks);
                const normalizedRef = normalizeLandmarks(referenceLandmarks);
                
                if (!normalizedUser || !normalizedRef) return 0;
                
                // Pesos diferentes para puntos clave (puntas de dedos más importantes)
                const fingerTips = [4, 8, 12, 16, 20]; // Puntas de los dedos
                const weights = {};
                for (let i = 0; i < 21; i++) {
                    weights[i] = fingerTips.includes(i) ? 1.5 : 1.0;
                }
                
                let totalError = 0;
                let totalWeight = 0;
                
                for (let i = 0; i < Math.min(normalizedUser.length, normalizedRef.length); i++) {
                    const userPoint = normalizedUser[i];
                    const refPoint = normalizedRef[i];
                    
                    const dx = userPoint.x - refPoint.x;
                    const dy = userPoint.y - refPoint.y;
                    const dz = userPoint.z - refPoint.z;
                    
                    const error = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    totalError += error * weights[i];
                    totalWeight += weights[i];
                }
                
                if (totalWeight === 0) return 0;
                
                const avgError = totalError / totalWeight;
                
                // Mapear error a similitud (0-1)
                const similarity = Math.exp(-avgError * 3); // Ajustar este factor según necesidad
                
                return Math.max(0, Math.min(1, similarity));
            }

            // Función para procesar todos los frames y calcular la similitud promedio
            function processAllFrames(userFrames, referenceFrames) {
                if (!userFrames || userFrames.length === 0 || !referenceFrames || referenceFrames.length === 0) return 0;
                
                // 1. Muestrear frames para igualar longitud
                const sampledUserFrames = sampleFrames(userFrames, referenceFrames.length);
                
                // 2. Comparar frame a frame
                let totalSimilarity = 0;
                let comparisons = 0;
                
                for (let i = 0; i < referenceFrames.length; i++) {
                    const refFrame = referenceFrames[i];
                    const userFrame = sampledUserFrames[i];
                    
                    if (!refFrame || !userFrame) continue;
                    
                    // Comparar cada mano en el frame
                    refFrame.forEach(refHand => {
                        const userHand = userFrame.find(h => h.handedness === refHand.handedness);
                        if (userHand) {
                            const similarity = calculateSimilarity(userHand.landmarks, refHand.landmarks);
                            totalSimilarity += similarity;
                            comparisons++;
                        }
                    });
                }
                
                if (comparisons === 0) return 0;
                
                return (totalSimilarity / comparisons) * 100; // Convertir a porcentaje
            }

            function sampleFrames(frames, targetCount) {
                if (frames.length <= targetCount) return [...frames];
                
                const sampled = [];
                const step = frames.length / targetCount;
                
                for (let i = 0; i < targetCount; i++) {
                    const index = Math.floor(i * step);
                    sampled.push(frames[index]);
                }
                
                return sampled;
            }

            // Modificar la función stopRecording para mostrar los resultados
            function stopRecording() {
                if (!isRecording) return;
                
                isRecording = false;
                if (recordingTimerElement) recordingTimerElement.style.display = 'none';
                if (mediaRecorder) {
                    mediaRecorder.onstop = () => {
                        console.log("Total frames usuario:", allHandLandmarks.length);
                        console.log("Total frames referencia:", referenceLandmarks.length);

                        // Calcular similitud con los landmarks de referencia
                        if (referenceLandmarks && allHandLandmarks.length > 0) {
                            const similarityPercentage = processAllFrames(allHandLandmarks, referenceLandmarks);
                            console.log("Primer frame usuario:", allHandLandmarks[0]);
                            console.log("Primer frame referencia:", referenceLandmarks[0]);
                            console.log(`Similitud promedio: ${similarityPercentage.toFixed(1)}%`);
                            // Determinar si aprobó o no
                            const isApproved = similarityPercentage >= 70;
                            const resultMessage = isApproved 
                                ? `¡Felicidades! Tu ejecución tuvo una similitud del <b>${similarityPercentage.toFixed(1)}%</b> con el gesto de referencia. <span style="color:green;">✅ APROBADO</span>`
                                : `Tu ejecución tuvo una similitud del <b>${similarityPercentage.toFixed(1)}%</b> con el gesto de referencia. <span style="color:red;">❌ NO APROBADO</span> (Se requiere 70% o más)`;
                            
                            // Mostrar resultados al usuario con SweetAlert2
                            Swal.fire({
                                title: isApproved ? '¡Aprobado!' : 'Intenta de nuevo',
                                html: resultMessage,
                                icon: isApproved ? 'success' : 'error',
                                confirmButtonText: 'Entendido',
                                customClass: {
                                    popup: 'result-popup',
                                    title: isApproved ? 'approved-title' : 'not-approved-title'
                                }
                            });

                            // También puedes mostrar resultados más detallados en la consola
                            console.log(`Similitud promedio: ${similarityPercentage.toFixed(1)}% - ${isApproved ? 'APROBADO' : 'NO APROBADO'}`);
                        } else {
                            Swal.fire({
                                title: 'Error',
                                text: 'No se pudieron comparar los landmarks. Asegúrate de que se detectaron tus manos correctamente.',
                                icon: 'error'
                            });
                        }
                        
                        console.log("Todos los landmarks de mano recolectados:", JSON.stringify(allHandLandmarks, null, 2));
                    };
                    mediaRecorder.stop();
                }
                if (nextButton) nextButton.disabled = false;
                if (recordButton) recordButton.disabled = false;
                if (gestoVideo) gestoVideo.play();
            }

            // Procesar resultados de detección de manos
            function onHandsResults(results) {
                // Dibujar video en canvas
                ctx.save();
                ctx.scale(-1, 1);
                ctx.translate(-canvasElement.width, 0);
                ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
                ctx.restore();
                
                // Solo procesar landmarks si estamos grabando
                if (isRecording && results.multiHandLandmarks) {
                    const frameHandLandmarks = [];
                    
                    // Procesar cada mano detectada
                    results.multiHandLandmarks.forEach((handLandmarks, handIndex) => {
                        const landmarks = handLandmarks.map((landmark, id) => ({
                            id: id,
                            x: landmark.x,
                            y: landmark.y,
                            z: landmark.z
                        }));
                        
                        frameHandLandmarks.push({
                            handIndex: handIndex,
                            handedness: results.multiHandedness[handIndex].label, // 'Left' o 'Right'
                            landmarks: landmarks
                        });
                    });
                    
                    allHandLandmarks.push(frameHandLandmarks);
                    
                    // Opcional: mostrar en consola (puede ser mucho output)
                    console.log(`Landmarks de manos frame ${allHandLandmarks.length}:`, frameHandLandmarks);
                }
            }

            // Procesar cada frame del video
            async function processVideoFrame() {
                if (videoElement.readyState >= 2) {
                    await hands.send({image: videoElement});
                }
                requestAnimationFrame(processVideoFrame);
            }

            function showAlert() {
                Swal.fire({
                    title: 'Instrucciones',
                    text: 'Tienes 2 segundos para realizar el ejercicio. Cuando estés listo, presiona el botón "Grabar".',
                    icon: 'info',
                    confirmButtonText: 'Entendido'
                });
            }

            function startRecording() {
                if (isRecording) return;
                
                if (gestoVideo) gestoVideo.pause();
                
                // Reiniciar almacenamiento de landmarks
                allHandLandmarks = [];
                
                let count = 3;
                if (countdownElement) {
                    countdownElement.style.display = 'block';
                    countdownElement.textContent = count;
                }
                if (recordButton) recordButton.disabled = true;
                
                countdownInterval = setInterval(() => {
                    count--;
                    if (countdownElement) countdownElement.textContent = count;
                    
                    if (count <= 0) {
                        clearInterval(countdownInterval);
                        if (countdownElement) countdownElement.style.display = 'none';
                        actuallyStartRecording();
                    }
                }, 1000);
            }

            function actuallyStartRecording() {
                isRecording = true;
                recordedChunks = [];
                if (recordingTimerElement) {
                    recordingTimerElement.style.display = 'block';
                }
                
                try {
                    const stream = canvasElement.captureStream(25);
                    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
                    
                    mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) {
                            recordedChunks.push(e.data);
                        }
                    };
                    
                    mediaRecorder.start(100);
                    
                    let secondsLeft = 2;
                    if (recordingTimerElement) recordingTimerElement.textContent = secondsLeft;
                    
                    recordingTimerInterval = setInterval(() => {
                        secondsLeft--;
                        if (recordingTimerElement) recordingTimerElement.textContent = secondsLeft;
                        
                        if (secondsLeft <= 0) {
                            clearInterval(recordingTimerInterval);
                            stopRecording();
                        }
                    }, 1000);
                } catch (error) {
                    console.error("Error al iniciar grabación:", error);
                    Swal.fire({
                        title: 'Error',
                        text: 'No se pudo iniciar la grabación',
                        icon: 'error'
                    });
                    isRecording = false;
                    if (recordingTimerElement) recordingTimerElement.style.display = 'none';
                    if (recordButton) recordButton.disabled = false;
                    if (gestoVideo) gestoVideo.play();
                }
            }

            

            if (recordButton) {
                recordButton.addEventListener('click', startRecording);
            }
            
            // Inicializar el tracker de manos y luego la cámara
            setupHandTracking().then((h) => {
                hands = h;
                
                setTimeout(showAlert, 500);
                
                navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: 640, 
                        height: 480,
                        facingMode: 'user' 
                    } 
                })
                .then(stream => {
                    if (videoElement) {
                        videoElement.srcObject = stream;
                        videoElement.play()
                            .then(() => {
                                processVideoFrame();
                            })
                            .catch(error => {
                                console.error("Error al reproducir video:", error);
                            });
                    }
                })
                .catch(err => {
                    console.error("Error de cámara:", err);
                    Swal.fire({
                        title: 'Error',
                        text: 'No se pudo acceder a la cámara. Asegúrate de haber dado los permisos necesarios.',
                        icon: 'error'
                    });
                });
            });
        } else {
            console.error("Elemento canvas no encontrado");
        }
    } else {
        console.log("Ejercicio de imagen detectado");

        // Verifica que la URL esté definida
        if (!LANDMARKS_JSON_URL) {
            console.error("URL de landmarks no definida");
            return;
        }
        // [Mantén aquí tu código original para imágenes]

        // Elementos del DOM
        const videoElement = document.createElement('video');
        const canvasElement = document.createElement('canvas');
        const canvasCtx = canvasElement.getContext('2d');
        const nextButton = document.querySelector('#nextBtn');
        const feedbackElement = document.createElement('div');
        
        // Configuración del feedback
        feedbackElement.style.position = 'absolute';
        feedbackElement.style.bottom = '20px';
        feedbackElement.style.width = '100%';
        feedbackElement.style.textAlign = 'center';
        feedbackElement.style.fontSize = '24px';
        feedbackElement.style.fontWeight = 'bold';
        feedbackElement.style.color = 'white';
        feedbackElement.style.textShadow = '1px 1px 2px black';
        feedbackElement.style.padding = '10px';
        feedbackElement.style.borderRadius = '5px';
        feedbackElement.style.transition = 'all 0.3s ease';

        // Variables de estado
        let referenceLandmarks = null;
        let currentSimilarity = 0;
        let isGestureCorrect = false;
        let calibrationValues = {
            openHandThreshold: 0.4, // Ajustar según pruebas
            similarityThreshold: 80
        };

        // Cargar landmarks de referencia
        fetch(LANDMARKS_JSON_URL)
            .then(response => {
                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                return response.json();
            })
            .then(data => {
                referenceLandmarks = data.map(point => ({
                    x: point.x,
                    y: point.y,
                    z: point.z
                }));
                console.log("Referencia cargada:", referenceLandmarks);
            })
            .catch(error => {
                
                console.error("Error cargando landmarks:", error);
                showFeedback("Error cargando gesto de referencia", false);
            });

        // Configuración de elementos de video
        videoElement.autoplay = true;
        videoElement.style.transform = "scaleX(-1)";
        canvasElement.style.width = '100%';
        canvasElement.style.maxWidth = '400px';
        canvasElement.style.transform = "scaleX(-1)";
        canvasElement.style.borderRadius = '10px';

        // Añadir elementos al DOM
        const userGestoDiv = document.querySelector('.gesto.g-usuario');
        userGestoDiv.appendChild(videoElement);
        userGestoDiv.appendChild(canvasElement);
        userGestoDiv.appendChild(feedbackElement);
        userGestoDiv.style.position = 'relative';

        // Función para mostrar feedback
        function showFeedback(message, isCorrect) {
            feedbackElement.textContent = message;
            feedbackElement.style.color = isCorrect ? '#00FF00' : '#FF0000';
            feedbackElement.style.backgroundColor = isCorrect ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)';
            
            // Efecto de parpadeo para feedback positivo
            if (isCorrect) {
                feedbackElement.style.animation = 'blink 1s 2';
            } else {
                feedbackElement.style.animation = 'none';
            }
        }

        // Función mejorada para calcular similitud
        function calculateSimilarity(userLandmarks, referenceLandmarks) {
            if (!userLandmarks || !referenceLandmarks) return 0;
            
            // 1. Alinear los landmarks usando Procrustes analysis (versión simplificada)
            const alignedUser = alignLandmarks(userLandmarks, referenceLandmarks);
            
            // 2. Calcular distancia ponderada por importancia de puntos
            let totalDistance = 0;
            let validPoints = 0;
            const fingerTips = [4, 8, 12, 16, 20]; // Puntas de los dedos son más importantes
            
            for (let i = 0; i < alignedUser.length && i < referenceLandmarks.length; i++) {
                const userPoint = alignedUser[i];
                const refPoint = referenceLandmarks[i];
                
                const dx = userPoint.x - refPoint.x;
                const dy = userPoint.y - refPoint.y;
                const dz = userPoint.z - refPoint.z;
                
                // Ponderar más las puntas de los dedos
                const weight = fingerTips.includes(i) ? 1.5 : 1.0;
                totalDistance += weight * Math.sqrt(dx*dx + dy*dy + dz*dz);
                validPoints += weight;
            }
            
            if (validPoints === 0) return 0;
            
            const avgDistance = totalDistance / validPoints;
            return Math.exp(-avgDistance * 3); // Ajustar factor de escala
        }

        function alignLandmarks(source, target) {
            // Implementación simplificada de alineación Procrustes
            // 1. Centrar ambos conjuntos en la muñeca (punto 0)
            const wrist = target[0];
            const centeredTarget = target.map(p => ({
                x: p.x - wrist.x,
                y: p.y - wrist.y,
                z: p.z - wrist.z
            }));
            
            const sourceWrist = source[0];
            const centeredSource = source.map(p => ({
                x: p.x - sourceWrist.x,
                y: p.y - sourceWrist.y,
                z: p.z - sourceWrist.z
            }));
            
            // 2. Escalar basado en la longitud de la palma
            const targetPalmLength = Math.sqrt(
                Math.pow(centeredTarget[5].x, 2) + 
                Math.pow(centeredTarget[5].y, 2) + 
                Math.pow(centeredTarget[5].z, 2)
            );
            
            const sourcePalmLength = Math.sqrt(
                Math.pow(centeredSource[5].x, 2) + 
                Math.pow(centeredSource[5].y, 2) + 
                Math.pow(centeredSource[5].z, 2)
            );
            
            if (targetPalmLength === 0 || sourcePalmLength === 0) return source;
            
            const scale = targetPalmLength / sourcePalmLength;
            
            return centeredSource.map(p => ({
                x: p.x * scale,
                y: p.y * scale,
                z: p.z * scale
            }));
        }

        // Detectar mano abierta
        function isHandTooOpen(landmarks) {
            if (!landmarks || landmarks.length < 21) return false;
            
            const wrist = landmarks[0];
            const fingerTips = [4, 8, 12, 16, 20];
            let totalDistance = 0;
            
            for (const tipIndex of fingerTips) {
                const tip = landmarks[tipIndex];
                const dx = tip.x - wrist.x;
                const dy = tip.y - wrist.y;
                totalDistance += Math.sqrt(dx*dx + dy*dy);
            }
            
            const averageDistance = totalDistance / fingerTips.length;
            return averageDistance > calibrationValues.openHandThreshold;
        }

        // Configuración de MediaPipe Hands
        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        // Configuración más tolerante para detección
        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,  // Reducir para mayor sensibilidad
            minTrackingConfidence: 0.3    // Reducir para mantener el tracking
        });

        
        hands.onResults(results => {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            
            // Efecto espejo
            canvasCtx.scale(-1, 1);
            canvasCtx.translate(-canvasElement.width, 0);
            
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                const landmarks = results.multiHandLandmarks[0];
                const currentLandmarks = landmarks.map(point => ({
                    x: point.x,
                    y: point.y,
                    z: point.z
                }));
                
                if (referenceLandmarks) {
                    currentSimilarity = calculateSimilarity(referenceLandmarks, currentLandmarks);
                    console.log(`Similitud: ${currentSimilarity.toFixed(2)}%`);
                    
                    const isOpen = isHandTooOpen(currentLandmarks);
                    isGestureCorrect = currentSimilarity > calibrationValues.similarityThreshold && !isOpen;
                    
                    // Dibujar con colores según el estado
                    const landmarkColor = isGestureCorrect ? '#00FF00' : '#FF0000';
                    const connectionColor = isGestureCorrect ? '#00AA00' : '#AA0000';
                    
                    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                        color: connectionColor,
                        lineWidth: 3
                    });
                    
                    drawLandmarks(canvasCtx, landmarks, {
                        color: landmarkColor,
                        lineWidth: 2,
                        radius: (idx) => {
                            // Resaltar puntos clave
                            if ([4, 8, 12, 16, 20].includes(idx)) return 6; // Puntas de dedos
                            if (idx === 0) return 8; // Muñeca
                            return 4;
                        }
                    });
                    
                    // Feedback detallado
                    if (isGestureCorrect) {
                        showFeedback("✓ Gesto Correcto", true);
                        nextButton.disabled = false;
                    } else if (isOpen) {
                        showFeedback("✗ Mano demasiado abierta", false);
                        nextButton.disabled = true;
                    } else {
                        showFeedback(`✗ Ajusta tu gesto (${currentSimilarity.toFixed(0)}%)`, false);
                        nextButton.disabled = true;
                    }
                }
            } else {
                showFeedback("Muestra tu mano en el área", false);
                nextButton.disabled = true;
            }
            
            
            canvasCtx.restore();
        });

        // Iniciar cámara
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                videoElement.srcObject = stream;
                const camera = new Camera(videoElement, {
                    onFrame: async () => {
                        canvasCtx.save();
                        canvasCtx.scale(-1, 1);
                        canvasCtx.translate(-videoElement.videoWidth, 0);
                        canvasCtx.drawImage(videoElement, 0, 0);
                        canvasCtx.restore();
                        await hands.send({ image: canvasElement });
                    },
                    width: 500,
                    height: 400
                });
                camera.start();
            })
            .catch(err => {
                console.error("Error de cámara:", err);
                showFeedback("Error al acceder a la cámara", false);
            });

        // Conexiones de la mano con más detalles
        const HAND_CONNECTIONS = [
            [0, 1], [1, 2], [2, 3], [3, 4],         // Pulgar
            [0, 5], [5, 6], [6, 7], [7, 8],         // Índice
            [0, 9], [9, 10], [10, 11], [11, 12],    // Medio
            [0, 13], [13, 14], [14, 15], [15, 16],  // Anular
            [0, 17], [17, 18], [18, 19], [19, 20],  // Meñique
            [5, 9], [9, 13], [13, 17],              // Base de los dedos
            [0, 5], [0, 9], [0, 13], [0, 17]       // Conexiones adicionales
        ];

        // Animación CSS para feedback
        const style = document.createElement('style');
        style.textContent = `
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                actualizarBarraProgreso(10);
            });
        }
    }

    function actualizarBarraProgreso(porcentaje) {
        const progressBar = document.getElementById("progressBar");
        const progresoActual = parseInt(progressBar.style.width) || 0;
        const nuevoProgreso = progresoActual + porcentaje;
        
        // Asegúrate de no superar el 100%
        progressBar.style.height = Math.min(nuevoProgreso, 100) + "%";
        
        // Cambia el color si está cerca de completarse (opcional)
        console.log(`Barra de progreso actualizada: ${nuevoProgreso}%`);
       
    }

});