const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const players = {};

io.on('connection', (socket) => {
    console.log('Siswa terhubung dengan ID:', socket.id);

    socket.on('joinGame', (playerName) => {
        players[socket.id] = {
            id: socket.id,
            name: playerName || `Siswa ${Math.floor(Math.random() * 899 + 100)}`,
            x: (Math.random() - 0.5) * 10,
            y: 0,
            z: (Math.random() - 0.5) * 10,
            ry: 0,
            isMoving: false
        };

        socket.emit('currentPlayers', players);
        socket.broadcast.emit('newPlayer', players[socket.id]);
    });

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].z = movementData.z;
            players[socket.id].ry = movementData.ry;
            players[socket.id].isMoving = movementData.isMoving;
            socket.broadcast.emit('playerMoved', { id: socket.id, pos: movementData });
        }
    });

    socket.on('disconnect', () => {
        console.log('Siswa terputus:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server game berjalan di port ${PORT}`);
});