const express = require("express");
const path = require("path");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http, {
    cors: {
        origin: "https://prueba2-github-io-5.onrender.com",
        methods: ["GET", "POST"]
    }
});
const port = process.env.PORT || 3000;

app.use(express.static(path.resolve(__dirname, "../")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

let clients = 0;

io.on("connection", function (socket) {
    console.log("Nuevo cliente conectado");

    socket.on("NewClient", function () {
        if (clients < 2) {
            if (clients === 1) {
                socket.emit("CreatePeer");
            }
        } else {
            socket.emit("SessionActive");
        }
        clients++;
    });

    socket.on("Offer", (offer) => {
        socket.broadcast.emit("BackOffer", offer);
    });

    socket.on("Answer", (data) => {
        socket.broadcast.emit("BackAnswer", data);
    });

    socket.on("disconnect", () => {
        if (clients > 0) {
            if (clients <= 2) {
                socket.broadcast.emit("Disconnect");
            }
            clients--;
        }
    });
});

http.listen(port, () => console.log(`Servidor activo en http://localhost:${port}`));