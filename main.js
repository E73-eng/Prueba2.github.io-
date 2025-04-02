let Peer = require('simple-peer');
let socket = io();
const video = document.querySelector('video');
const filter = document.querySelector('#filter');
const checkboxTheme = document.querySelector('#theme');
const connectionStatus = document.getElementById("connection-status");
let client = {};
let currentFilter;
let videoTrack = null;
let audioTrack = null;

// Conexión del socket
socket.on('connect', () => {
    connectionStatus.textContent = "Conectado";
    connectionStatus.classList.remove("badge-danger");
    connectionStatus.classList.add("badge-success");
});

socket.on('disconnect', () => {
    connectionStatus.textContent = "Desconectado";
    connectionStatus.classList.remove("badge-success");
    connectionStatus.classList.add("badge-danger");
});

// Obtener stream de video y audio
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        videoTrack = stream.getVideoTracks()[0];
        audioTrack = stream.getAudioTracks()[0];

        socket.emit('NewClient');
        video.srcObject = stream;
        video.play();

        filter.addEventListener('change', (event) => {
            currentFilter = event.target.value;
            video.style.filter = currentFilter;
            SendFilter(currentFilter);
            event.preventDefault();
        });

        function InitPeer(type) {
            let peer = new Peer({ initiator: type === 'init', stream: stream, trickle: false });
            peer.on('stream', function (stream) {
                CreateVideo(stream);
            });
            peer.on('data', function (data) {
                let decodedData = new TextDecoder('utf-8').decode(data);
                let peerVideo = document.querySelector('#peerVideo');
                peerVideo.style.filter = decodedData;
            });
            return peer;
        }

        function MakePeer() {
            client.gotAnswer = false;
            let peer = InitPeer('init');
            peer.on('signal', function (data) {
                if (!client.gotAnswer) {
                    socket.emit('Offer', data);
                }
            });
            client.peer = peer;
        }

        function FrontAnswer(offer) {
            let peer = InitPeer('notInit');
            peer.on('signal', (data) => {
                socket.emit('Answer', data);
            });
            peer.signal(offer);
            client.peer = peer;
        }

        function SignalAnswer(answer) {
            client.gotAnswer = true;
            let peer = client.peer;
            peer.signal(answer);
        }

        function CreateVideo(stream) {
            CreateDiv();
            let peerVideo = document.createElement('video');
            peerVideo.id = 'peerVideo';
            peerVideo.srcObject = stream;
            peerVideo.setAttribute('class', 'embed-responsive-item');
            document.querySelector('#peerDiv').appendChild(peerVideo);
            peerVideo.play();
            setTimeout(() => SendFilter(currentFilter), 1000);
            peerVideo.addEventListener('click', () => {
                peerVideo.volume = peerVideo.volume === 0 ? 1 : 0;
            });
        }

        function SessionActive() {
            document.write('Session Active. Please come back later');
        }

        function SendFilter(filter) {
            if (client.peer) {
                client.peer.send(filter);
            }
        }

        function RemovePeer() {
            document.getElementById("peerVideo").remove();
            document.getElementById("muteText").remove();
            if (client.peer) {
                client.peer.destroy();
            }
        }

        socket.on('BackOffer', FrontAnswer);
        socket.on('BackAnswer', SignalAnswer);
        socket.on('SessionActive', SessionActive);
        socket.on('CreatePeer', MakePeer);
        socket.on('Disconnect', RemovePeer);
    })
    .catch(err => document.write(err));

// Alternar cámara
document.getElementById("toggleCamera").addEventListener("click", () => {
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const cameraButton = document.getElementById("toggleCamera");

        // Limpiar contenido actual del botón
        cameraButton.innerHTML = "";

        // Crear nuevo elemento SVG
        const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgIcon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        svgIcon.setAttribute("width", "24");
        svgIcon.setAttribute("height", "24");
        svgIcon.setAttribute("viewBox", "0 0 24 24");

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", "currentColor");

        if (videoTrack.enabled) {
            // Ícono de cámara apagada
            path.setAttribute("d", "m10.7 16l4.5-4.55l-1.4-1.4l-3.1 3.1L8.5 11H10V9H5v5h2v-1.7zM4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h12q.825 0 1.413.588T18 6v4.5l4-4v11l-4-4V18q0 .825-.587 1.413T16 20z");
        } else {
            // Ícono de cámara encendida (puedes ajustar el diseño según el ícono que prefieras)
            path.setAttribute("d", "M3 5.5h13a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1M18 10l3.375-2.7A1 1 0 0 1 23 8.08v7.84a1 1 0 0 1-1.625.78L18 14z");
        }

        svgIcon.appendChild(path);
        cameraButton.appendChild(svgIcon);
    }
});


// Alternar micrófono
document.getElementById("toggleMicrophone").addEventListener("click", () => {
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        document.getElementById("microphoneIcon").innerHTML = audioTrack.enabled
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
                    <path fill="currentColor" d="m14.293.293l1.414 1.414L11 6.414V7a3 3 0 0 1-3.538 2.952l-.814.814A4 4 0 0 0 12 7h2a6 6 0 0 1-5 5.917V14h2v2H5v-2h2v-1.083a6 6 0 0 1-1.861-.642l-3.432 3.432l-1.414-1.414zm-3.532 1.532A3 3 0 0 0 5 3v4q0 .276.048.538zM4.234 8.352A4 4 0 0 1 4 7H2c0 1.036.263 2.01.725 2.861l1.51-1.51Z"/>
                </svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 352 512">
                    <path fill="currentColor" d="M176 352c53.02 0 96-42.98 96-96V96c0-53.02-42.98-96-96-96S80 42.98 80 96v160c0 53.02 42.98 96 96 96m160-160h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256v-48c0-8.84-7.16-16-16-16"/>
                </svg>`;
    }
});



// Mostrar alerta en el botón de llamada
document.getElementById("toggleCall").addEventListener("click", () => {
    alert("Saliendo de la llamada");
});

// Cambiar el tema
checkboxTheme.addEventListener('click', () => {
    document.body.style.backgroundColor = checkboxTheme.checked ? '#212529' : '#fff';
    let muteText = document.querySelector('#muteText');
    if (muteText) {
        muteText.style.color = checkboxTheme.checked ? "#fff" : "#212529";
    }
});

// Función para alternar el tema oscuro
checkboxTheme.addEventListener('change', function () {
    if (this.checked) {
        document.body.style.color = 'white';
    } else {
        document.body.style.color = 'black';
    }
});


// Crear div de muteo
function CreateDiv() {
    let div = document.createElement('div');
    div.setAttribute('class', "centered");
    div.id = "muteText";
    div.innerHTML = "Click to Mute/Unmute";
    document.querySelector('#peerDiv').appendChild(div);
}