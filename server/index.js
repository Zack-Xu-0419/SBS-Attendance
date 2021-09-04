const express = require("express");
const socketio = require("socket.io");

const app = express();
const server = app.listen(8000);
app.use(express.static("../client/dist"));

const io = socketio(server);
io.on("connection", (socket) => {
    socket.on("student-update", (data) => {
        socket.broadcast.emit("student-update", data);
    });
});
