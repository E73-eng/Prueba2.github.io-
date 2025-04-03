const express = require('express');

//const path = require("path");

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

/*
app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});
 */

 app.use(express.static(__dirname + "/public"));

let clients = 0

io.on('connection', function (socket) {
    console.log(`Cliente conectado. Total de clientes: ${clients + 1}`);

    socket.on("NewClient", function () {
        if (clients < 2) {
            if (clients == 1) {
                io.emit('CreatePeer');  // Usamos io.emit en lugar de this.emit
            }
        } else {
            socket.emit('SessionActive');  // Solo se lo enviamos al cliente actual
        }
        clients++;
        console.log(`Nuevo cliente añadido. Total de clientes: ${clients}`);
    });

    socket.on('disconnect', function () {
        console.log("Cliente desconectado.");
        Disconnect.call(socket);
    });
});


function Disconnect() {
    if (clients > 0) {
        if (clients <= 2) {
            this.broadcast.emit("Disconnect");
        }
        clients--;
        console.log(`Cliente eliminado. Total de clientes: ${clients}`);
    }
}

function SendOffer(offer) {
    console.log("Oferta enviada.");
    this.broadcast.emit("BackOffer", offer);
}

function SendAnswer(data) {
    console.log("Respuesta enviada.");
    this.broadcast.emit("BackAnswer", data);
}

http.listen(port, '0.0.0.0', () => console.log(`Servidor activo en ${port}`));