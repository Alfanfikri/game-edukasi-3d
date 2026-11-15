const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Data Soal Default (Bisa diedit oleh guru)
let questionBank = {
    mtk: [
        { q: "Berapakah hasil dari 5 + 5 x 2 ?", options: ["A. 20", "B. 15", "C. 10"], correct: "B", reward: 50 },
        { q: "Berapakah 12 x 4 ?", options: ["A. 48", "B. 42", "C. 56"], correct: "A", reward: 50 }
    ],
    ipas: [
        { q: "Hewan yang bernapas dengan paru-paru di dalam air adalah?", options: ["A. Ikan Hiu", "B. Paus", "C. Cumi-cumi"], correct: "B", reward: 50 }
    ],
    agama: [
        { q: "Berapa jumlah rakaat sholat fardhu dalam sehari semalam?", options: ["A. 15", "B. 17", "C. 20"], correct: "B", reward: 50 }
    ]
};

// Halaman Game Utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Halaman Panel Guru untuk Edit Soal
app.get('/teacher', (req, res) => {
    res.sendFile(path.join(__dirname, 'teacher.html'));
});

// API untuk Guru mengambil & memperbarui soal
app.get('/api/questions', (req, res) => {
    res.json(questionBank);
});

app.post('/api/questions', (req, res) => {
    questionBank = req.body;
    io.emit('updateQuestions', questionBank); // Kirim update soal ke semua client
    res.json({ success: true, message: "Soal berhasil diperbarui!" });
});

const players = {};

io.on('connection', (socket) => {
    console.log('Siswa terhubung dengan ID:', socket.id);

    socket.on('joinGame', (playerData) => {
        players[socket.id] = {
            id: socket.id,
            name: playerData.name || `Siswa ${Math.floor(Math.random() * 899 + 100)}`,
            gender: playerData.gender || 'male',
            hairStyle: playerData.hairStyle || 'short',
            eyeColor: playerData.eyeColor || '#000000',
            clothesColor: playerData.clothesColor || '#0000ff',
            x: (Math.random() - 0.5) * 10,
            y: 0,
            z: (Math.random() - 0.5) * 10,
            ry: 0,
            isMoving: false,
            coins: 100,      // Modal awal uang siswa
            health: 100,     // Kesehatan max 100
            stamina: 100     // Stamina max 100
        };

        socket.emit('currentPlayers', players);
        socket.emit('updateQuestions', questionBank);
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

    // Event Update Status (Makan, Beli, Kurang Stamina)
    socket.on('updateStats', (data) => {
        if (players[socket.id]) {
            players[socket.id].coins = data.coins !== undefined ? data.coins : players[socket.id].coins;
            players[socket.id].health = data.health !== undefined ? data.health : players[socket.id].health;
            players[socket.id].stamina = data.stamina !== undefined ? data.stamina : players[socket.id].stamina;
            io.emit('playerStatsUpdated', { id: socket.id, coins: players[socket.id].coins, health: players[socket.id].health, stamina: players[socket.id].stamina });
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