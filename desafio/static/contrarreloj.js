 
document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.createElement('video');
    const canvasElement = document.createElement('canvas');
    const canvasCtx = canvasElement.getContext('2d');

    videoElement.autoplay = true;
    videoElement.style.transform = "scaleX(-1)"; // 👈 Inversión horizontal (espejo)
    canvasElement.style.width = '100%';
    canvasElement.style.maxWidth = '400px';
    canvasElement.style.transform = "scaleX(-1)"; // 👈 Opcional: si quieres que el canvas también se vea en espejo

    const userGestoDiv = document.querySelector('.gesto.g-usuario');
    userGestoDiv.appendChild(videoElement);
    userGestoDiv.appendChild(canvasElement);

    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        videoElement.srcObject = stream;

        const camera = new Camera(videoElement, {
            onFrame: async () => {
                // Opción 1: Enviar el video original (MediaPipe manejará la inversión)
                // await hands.send({ image: videoElement });
                
                // Opción 2: Si necesitas invertir el frame antes de enviarlo:
                
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
    });

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
        
        // 👇 Invertir el contexto del canvas para que coincida con el video espejado
        canvasCtx.scale(-1, 1);
        canvasCtx.translate(-canvasElement.width, 0);
    
        if (results.multiHandLandmarks) {
            results.multiHandLandmarks.forEach(landmarks => {
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#61A8EC', lineWidth: 2 });
                drawLandmarks(canvasCtx, landmarks, { color: '#3C91E6', lineWidth: 1 });
            });
        }
    
        canvasCtx.restore();
    });
});

// En tu archivo JS principal (donde procesas la cámara)
let referenciaLandmarks = null;

// Función para cargar los landmarks de referencia
// async function cargarReferencia(palabra_id) {
//     try {
//         const response = await fetch(`/analizar_gesto_referencia/${palabra_id}/`);
//         const data = await response.json();
//         referenciaLandmarks = data.landmarks;
//         console.log("Referencia cargada:", data.palabra);
//     } catch (error) {
//         console.error("Error cargando referencia:", error);
//     }
// }

// Comparación de landmarks (en hands.onResults)
hands.onResults(results => {
    if (!results.multiHandLandmarks || !referenciaLandmarks) return;

    const userLandmarks = results.multiHandLandmarks[0].landmark.map(l => [l.x, l.y, l.z]);
    const similarity = calcularSimilitud(userLandmarks, referenciaLandmarks);

    if (similarity > 0.9) {  // Umbral ajustable
        console.log("¡Coincide con la seña de referencia!");
    }
});

// Función de comparación (Distancia Euclidiana normalizada)
// function calcularSimilitud(landmarks1, landmarks2) {
//     let errorTotal = 0;
//     for (let i = 0; i < Math.min(landmarks1.length, landmarks2.length); i++) {
//         const dx = landmarks1[i][0] - landmarks2[i][0];
//         const dy = landmarks1[i][1] - landmarks2[i][1];
//         errorTotal += Math.sqrt(dx * dx + dy * dy);  // Ignoramos 'z' para simplificar
//     }
//     const errorPromedio = errorTotal / landmarks1.length;
//     return 1 - Math.min(errorPromedio, 0.3) / 0.3;  // Normalizar a 0-1
// }