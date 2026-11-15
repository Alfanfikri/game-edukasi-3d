const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

let questionBank = {
    "MTK": [
        { q: "Berapakah hasil dari 5 + 5 x 2 ?", options: ["A. 20", "B. 15", "C. 10"], correct: "B", reward: 50 },
        { q: "Berapakah hasil dari 12 x 4 ?", options: ["A. 48", "B. 42", "C. 56"], correct: "A", reward: 50 }
    ],
    "IPAS": [
        { q: "Hewan yang bernapas dengan paru-paru di dalam air adalah?", options: ["A. Ikan Hiu", "B. Paus", "C. Cumi-cumi"], correct: "B", reward: 50 },
        { q: "Perubahan wujud benda cair menjadi gas disebut?", options: ["A. Membeku", "B. Menguap", "C. Menyublim"], correct: "B", reward: 50 }
    ],
    "AGAMA": [
        { q: "Berapa jumlah rakaat sholat fardhu dalam sehari semalam?", options: ["A. 15", "B. 17", "C. 20"], correct: "B", reward: 50 }
    ]
};

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/teacher', (req, res) => res.sendFile(path.join(__dirname, 'teacher.html')));
app.get('/api/questions', (req, res) => res.json(questionBank));

app.post('/api/questions', (req, res) => {
    questionBank = req.body;
    io.emit('updateQuestions', questionBank);
    res.json({ success: true, message: "Daftar soal dan mata pelajaran berhasil diperbarui!" });
});

const players = {};
// Status Pintu Sekolah (false = tertutup, true = terbuka)
const doorStates = {
    "door_kelas": false,
    "door_guru": false
};

io.on('connection', (socket) => {
    console.log('Siswa terhubung:', socket.id);

    socket.on('joinGame', (playerData) => {
        players[socket.id] = {
            id: socket.id,
            name: playerData.name || `Siswa ${Math.floor(Math.random() * 899 + 100)}`,
            gender: playerData.gender || 'male',
            hairStyle: playerData.hairStyle || 'short',
            eyeColor: playerData.eyeColor || '#000000',
            noseStyle: playerData.noseStyle || 'small',
            clothesColor: playerData.clothesColor || '#0000ff',
            x: 0,
            y: 0,
            z: 8,
            ry: Math.PI,
            isMoving: false,
            coins: 100,
            health: 100,
            stamina: 100
        };

        socket.emit('currentPlayers', players);
        socket.emit('updateQuestions', questionBank);
        socket.emit('syncDoors', doorStates);
        socket.broadcast.emit('newPlayer', players[socket.id]);
    });

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            Object.assign(players[socket.id], movementData);
            socket.broadcast.emit('playerMoved', { id: socket.id, pos: movementData });
        }
    });

    // Event Buka / Tutup Pintu
    socket.on('toggleDoor', (doorId) => {
        if (doorStates[doorId] !== undefined) {
            doorStates[doorId] = !doorStates[doorId];
            io.emit('doorToggled', { doorId, isOpen: doorStates[doorId] });
        }
    });

    socket.on('updateAppearance', (appearanceData) => {
        if (players[socket.id]) {
            Object.assign(players[socket.id], appearanceData);
            io.emit('playerAppearanceUpdated', { id: socket.id, appearance: appearanceData });
        }
    });

    socket.on('updateStats', (data) => {
        if (players[socket.id]) {
            players[socket.id].coins = data.coins ?? players[socket.id].coins;
            players[socket.id].health = data.health ?? players[socket.id].health;
            players[socket.id].stamina = data.stamina ?? players[socket.id].stamina;
            io.emit('playerStatsUpdated', {
                id: socket.id,
                coins: players[socket.id].coins,
                health: players[socket.id].health,
                stamina: players[socket.id].stamina
            });
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));