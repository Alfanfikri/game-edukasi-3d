const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Agar server membaca file statis (HTML, CSS, JS) di folder yang sama
app.use(express.static(__dirname));

// PENTING: Tambahkan baris ini agar saat orang membuka link utama, server mengirim index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Menampung daftar semua pemain yang terhubung
const players = {};

io.on('connection', (socket) => {
    console.log('Siswa terhubung dengan ID:', socket.id);

    players[socket.id] = {
        x: (Math.random() - 0.5) * 4,
        y: 0.5,
        z: 0
    };

    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', { id: socket.id, pos: players[socket.id] });

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id] = movementData;
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