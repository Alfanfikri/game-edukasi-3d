const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Menyajikan file statis (HTML/JS) dari folder tempat file ini berada
app.use(express.static(__dirname));

// Menampung daftar semua siswa yang terhubung
const players = {};

io.on('connection', (socket) => {
    console.log('Siswa terhubung dengan ID:', socket.id);

    // Beri posisi awal untuk siswa baru yang masuk
    players[socket.id] = {
        x: (Math.random() - 0.5) * 4, // Posisi X sedikit acak supaya tidak bertumpuk
        y: 0.5,
        z: 0
    };

    // Kirim daftar pemain yang sudah ada ke pemain baru ini
    socket.emit('currentPlayers', players);

    // Beri tahu siswa lain bahwa ada pemain baru yang bergabung
    socket.broadcast.emit('newPlayer', { id: socket.id, pos: players[socket.id] });

    // Terima pembaruan posisi saat siswa berjalan
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id] = movementData;
            // Teruskan posisi baru ini ke layar siswa-siswa lainnya
            socket.broadcast.emit('playerMoved', { id: socket.id, pos: movementData });
        }
    });

    // Saat siswa menutup web / disconnect
    socket.on('disconnect', () => {
        console.log('Siswa terputus:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// Jalankan server di port 3000
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server game berjalan! Buka http://localhost:${PORT} di browser.`);
});