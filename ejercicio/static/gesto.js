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
                    text: 'Tienes 4 segundos para realizar el ejercicio. Cuando estés listo, presiona el botón "Grabar".',
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
                    
                    let secondsLeft = 4;
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

            function stopRecording() {
                if (!isRecording) return;
                
                isRecording = false;
                if (recordingTimerElement) recordingTimerElement.style.display = 'none';
                if (mediaRecorder) {
                    mediaRecorder.onstop = () => {
                        // Mostrar todos los landmarks recolectados
                        console.log("Todos los landmarks de mano recolectados:", JSON.stringify(allHandLandmarks, null, 2));
                        
                        // Aquí puedes procesar o enviar los datos como necesites
                        // Ejemplo de estructura simplificada si solo quieres los landmarks sin info de mano:
                        const simplifiedLandmarks = allHandLandmarks.map(frame => 
                            frame.flatMap(hand => hand.landmarks)
                        );
                        console.log("Landmarks simplificados:", JSON.stringify(simplifiedLandmarks, null, 2));
                    };
                    mediaRecorder.stop();
                }
                if (nextButton) nextButton.disabled = false;
                if (recordButton) recordButton.disabled = false;
                if (gestoVideo) gestoVideo.play();
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
        // [Aquí va todo tu código para el manejo de imágenes con landmarks]
        // Asegúrate de que este bloque esté completo y bien cerrado

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
        function calculateSimilarity(landmarks1, landmarks2) {
            if (!landmarks1 || !landmarks2 || landmarks1.length !== landmarks2.length) return 0;
            
            const fingerWeights = {
                thumb: 1.5, index: 1.2, middle: 1.0, ring: 0.9, pinky: 0.8
            };
            
            let totalWeightedDistance = 0;
            let totalWeight = 0;
            
            for (let i = 0; i < landmarks1.length; i++) {
                let weight = 1.0;
                if (i >= 1 && i <= 4) weight = fingerWeights.thumb;
                else if (i >= 5 && i <= 8) weight = fingerWeights.index;
                else if (i >= 9 && i <= 12) weight = fingerWeights.middle;
                else if (i >= 13 && i <= 16) weight = fingerWeights.ring;
                else if (i >= 17 && i <= 20) weight = fingerWeights.pinky;
                
                const dx = landmarks1[i].x - landmarks2[i].x;
                const dy = landmarks1[i].y - landmarks2[i].y;
                const dz = landmarks1[i].z - landmarks2[i].z;
                
                totalWeightedDistance += Math.sqrt(dx*dx + dy*dy + dz*dz) * weight;
                totalWeight += weight;
            }
            
            const averageDistance = totalWeightedDistance / totalWeight;
            let similarity = Math.max(0, 100 - (averageDistance * 200));
            
            // Penalizar si la mano está demasiado abierta
            if (isHandTooOpen(landmarks2)) {
                similarity *= 0.6; // Reducción más agresiva
            }
            
            return similarity;
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