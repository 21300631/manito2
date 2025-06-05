// Variables globales
let currentSimilarity = 0;
let isGestureCorrect = false;
let correctPoseStartTime = null;
const REQUIRED_CORRECT_TIME = 2000; // 2 segundos para confirmar el gesto
let hands = null;
let camera = null;

// Umbrales de calibración
const calibrationValues = {
    openHandThreshold: 0.4,
    similarityThreshold: 80
};

// Elementos del DOM
const videoElement = document.getElementById('inputVideo');
const canvasElement = document.getElementById('outputCanvas');
const canvasCtx = canvasElement.getContext('2d');
const feedbackElement = document.getElementById('feedback');
const noRecuerdoBtn = document.getElementById('noRecuerdoBtn');

// Conexiones de la mano
const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],         // Pulgar
    [0, 5], [5, 6], [6, 7], [7, 8],         // Índice
    [0, 9], [9, 10], [10, 11], [11, 12],    // Medio
    [0, 13], [13, 14], [14, 15], [15, 16],  // Anular
    [0, 17], [17, 18], [18, 19], [19, 20],  // Meñique
    [5, 9], [9, 13], [13, 17],              // Base de los dedos
    [0, 5], [0, 9], [0, 13], [0, 17]       // Conexiones adicionales
];

// Inicialización
function init() {
    // Configurar estilos del canvas
    
    // Configurar feedback
    feedbackElement.style.display = "block";
    
    // Cargar landmarks de referencia si es un ejercicio de imagen
    if (!IS_VIDEO_EXERCISE && LANDMARKS_JSON_URL) {
        loadReferenceLandmarks();
    }
    
    // Inicializar MediaPipe Hands
    setupMediaPipe();
    
    // Configurar eventos
    setupEventListeners();
}

// Cargar landmarks de referencia
function loadReferenceLandmarks() {
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
}

// Configurar MediaPipe Hands
function setupMediaPipe() {
    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.3
    });

    hands.onResults(onResults);
}   


// Manejar resultados de MediaPipe
function onResults(results) {
    // Dibujar el frame de la cámara en modo espejo
    canvasCtx.save();
    canvasCtx.scale(-1, 1);
    canvasCtx.translate(-canvasElement.width, 0);
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.restore();

    // Procesar landmarks
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Ajustar landmarks para que coincidan con la imagen en modo espejo
        const mirroredLandmarks = landmarks.map(point => ({
            x: 1 - point.x, // Invertir coordenada X
            y: point.y,
            z: point.z
        }));
        
        const currentLandmarks = mirroredLandmarks.map(point => ({
            x: point.x,
            y: point.y,
            z: point.z
        }));
        
        if (referenceLandmarks) {
            currentSimilarity = calculateSimilarity(referenceLandmarks, currentLandmarks);
            isGestureCorrect = currentSimilarity > calibrationValues.similarityThreshold;
            
            // Dibujar landmarks (ya ajustados para modo espejo)
            const landmarkColor = isGestureCorrect ? '#00FF00' : '#FF0000';
            const connectionColor = isGestureCorrect ? '#00AA00' : '#AA0000';
            
            drawConnectors(canvasCtx, mirroredLandmarks, HAND_CONNECTIONS, {
                color: connectionColor,
                lineWidth: 3
            });
            
            drawLandmarks(canvasCtx, mirroredLandmarks, {
                color: landmarkColor,
                lineWidth: 2,
                radius: (idx) => [4, 8, 12, 16, 20, 0].includes(idx) ? 6 : 4
            });
            
            handleGestureFeedback();
        }
    } else {
        correctPoseStartTime = null;
        showFeedback("Muestra tu mano en el área", false);
    }
}

function goToNextExercise() {
    if (camera) {
        camera.stop();
    }
    if (videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
    }
    window.location.href = "/repaso/siguiente/";
}

function handleGestureFeedback() {
    if (isGestureCorrect) {
        if (correctPoseStartTime === null) {
            correctPoseStartTime = Date.now();
        } else {
            const elapsedTime = Date.now() - correctPoseStartTime;
            const remainingTime = REQUIRED_CORRECT_TIME - elapsedTime;
            
            if (remainingTime > 0) {
                showFeedback(`✓ Mantén la pose (${Math.ceil(remainingTime/1000)}s)`, true);
            } else {
                showFeedback("✓ ¡Correcto!", true);
                
                // Usar CURRENT_WORD_ID en lugar de currentWordId
                fetch('/repaso/siguiente/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: `palabra_id=${CURRENT_WORD_ID}`
                }).then(() => {
                    window.location.href = "/repaso/";
                }).catch(error => {
                    console.error('Error:', error);
                    window.location.href = "/repaso/";
                });
            }
        }
    } else {
        correctPoseStartTime = null;
        showFeedback(`✗ Ajusta tu gesto (${currentSimilarity.toFixed(0)}%)`, false);
    }
}
// Función auxiliar para obtener cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Modificar la función calculateSimilarity para usar landmarks normalizados
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

// Detectar mano demasiado abierta
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


// Mostrar feedback visual
function showFeedback(message, isCorrect) {
    feedbackElement.textContent = message;
    feedbackElement.style.color = isCorrect ? '#00FF00' : '#FF0000';
    feedbackElement.style.backgroundColor = isCorrect ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)';
    
    if (isCorrect) {
        feedbackElement.style.animation = 'blink 1s 2';
    } else {
        feedbackElement.style.animation = 'none';
    }
}

// Configurar eventos
function setupEventListeners() {
    // Iniciar cámara cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', startCamera);

    //Configuracion elementos del video
    videoElement.autoplay = true;
    // videoElement.style.transform = "scaleX(-1)";
    canvasElement.style.width = '100%';
    canvasElement.style.maxWidth = '400px';
    // canvasElement.style.transform = "scaleX(-1)";
    canvasElement.style.borderRadius = '10px';

    
    
    // Botón "No lo recuerdo"
    if (noRecuerdoBtn) {
        noRecuerdoBtn.addEventListener('click', () => {
            // Aquí puedes agregar lógica para manejar cuando el usuario no recuerda
            window.location.href = "/repaso/siguiente/";
        });
    }
    
    
}

// Iniciar cámara
function startCamera() {
    
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            videoElement.srcObject = stream;
            videoElement.onloadedmetadata = () => {
                videoElement.play();
                
                // Configurar canvas con las dimensiones del video
                canvasElement.width = videoElement.videoWidth;
                canvasElement.height = videoElement.videoHeight;
                
                
                // Iniciar el procesamiento de frames
                camera = new Camera(videoElement, {
                    onFrame: async () => {
                        await hands.send({ image: videoElement });
                    },
                    width: videoElement.videoWidth,
                    height: videoElement.videoHeight
                });
                camera.start();
            };
        })
        .catch(err => {
            console.error("Error de cámara:", err);
            showFeedback("Error al acceder a la cámara", false);
            Swal.fire({
                title: 'Error de cámara',
                text: 'No se pudo acceder a la cámara. Por favor, asegúrate de haber dado los permisos necesarios.',
                icon: 'error',
                confirmButtonText: 'Entendido'
            });
        });
}


// Animación CSS para feedback
const style = document.createElement('style');
style.textContent = `
    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
`;
document.head.appendChild(style);

// Inicializar la aplicación
init();