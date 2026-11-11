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

    // Menerima event saat player menyetujui/mengisi nama
    socket.on('joinGame', (playerName) => {
        players[socket.id] = {
            id: socket.id,
            name: playerName || `Siswa ${Math.floor(Math.random() * 899 + 100)}`,
            x: (Math.random() - 0.5) * 4,
            y: 0.5,
            z: 0
        };

        // Kirim list player yang sudah ada ke player baru
        socket.emit('currentPlayers', players);
        // Informasikan ke player lain ada player baru
        socket.broadcast.emit('newPlayer', players[socket.id]);
    });

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].z = movementData.z;
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