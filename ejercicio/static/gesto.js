document.addEventListener('DOMContentLoaded', () => {
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
        locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
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
});