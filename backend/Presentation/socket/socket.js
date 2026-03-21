const { Server } = require('socket.io');
const RoomStore = require('./roomStore');

const generateRoomCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

function getRoomsList(rooms, search = '') {
    return rooms
        .filter(r =>
            !r.isMatchmaking &&
            (!search || r.host.username.toLowerCase().includes(search.toLowerCase()))
        )
        .map(r => ({
            code: r.code,
            hostUsername: r.host.username,
            hasPassword: !!r.password,
        }));
}

const initSocket = (server) => {
    const io = new Server(server, {
        cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET', 'POST'] }
    });

    io.on('connection', (socket) => {
        console.log(`📡 Подключен: ${socket.id}`);

        socket.on('join_matchmaking', async (userData) => {
            try {
                const player = {
                    id: socket.id,
                    username: userData.username,
                    userId: userData.userId || socket.id
                };

                const matchmakingRooms = await RoomStore.getMatchmakingRooms();
                const availableRoom = matchmakingRooms.find(r =>
                    r.host.userId !== player.userId
                );

                if (availableRoom) {
                    const code = availableRoom.code;
                    const host = availableRoom.host;

                    await RoomStore.deleteRoom(code);

                    const battleRoomId = `battle_room_${code}`;
                    const battleData = {
                        id: battleRoomId,
                        players: [host, player],
                        challenges: [],
                        progress: { [host.id]: {}, [player.id]: {} }
                    };

                    await RoomStore.setBattle(battleRoomId, battleData);

                    socket.join(battleRoomId);
                    const hostSocket = io.sockets.sockets.get(host.id);
                    if (hostSocket) hostSocket.join(battleRoomId);

                    console.log(`⚡ Быстрый поиск: ${player.username} → ${code} (хост: ${host.username})`);

                    io.to(battleRoomId).emit('match_found', {
                        roomId: battleRoomId,
                        players: [host, player]
                    });
                } else {
                    const code = generateRoomCode();
                    const roomData = {
                        code,
                        password: null,
                        host: player,
                        isMatchmaking: true,
                        lobbyPlayers: [player]
                    };

                    await RoomStore.setRoom(code, roomData);
                    await RoomStore.addToIndex(code, true);

                    socket.join(`lobby_${code}`);
                    console.log(`⏳ Быстрый поиск: ${player.username} ждёт в ${code}`);
                    socket.emit('waiting_for_opponent');
                }
            } catch (err) {
                console.error('join_matchmaking error:', err);
            }
        });

        socket.on('leave_matchmaking', async () => {
            try {
                const matchmakingRooms = await RoomStore.getMatchmakingRooms();
                const myRoom = matchmakingRooms.find(r => r.host.id === socket.id);
                if (myRoom) {
                    await RoomStore.deleteRoom(myRoom.code);
                    console.log(`❌ ${socket.id} отменил быстрый поиск`);
                }
            } catch (err) {
                console.error('leave_matchmaking error:', err);
            }
        });

        socket.on('create_room', async (data) => {
            try {
                const { username, userId, password } = data;
                const code = generateRoomCode();

                const roomData = {
                    code,
                    password: password || null,
                    host: { id: socket.id, username, userId },
                    isMatchmaking: false,
                    lobbyPlayers: [{ id: socket.id, username }]
                };

                await RoomStore.setRoom(code, roomData);
                await RoomStore.addToIndex(code, false);

                socket.join(`lobby_${code}`);
                console.log(`🏠 Комната создана: ${code}`);

                socket.emit('room_created', { code, hasPassword: !!password });

                const allRooms = await RoomStore.getAllRooms();
                io.emit('rooms_updated', getRoomsList(allRooms));
            } catch (err) {
                console.error('create_room error:', err);
            }
        });

        socket.on('check_my_room', async (data) => {
            try {
                const { userId, username } = data;
                const allRooms = await RoomStore.getAllRooms();

                const myRoom = allRooms.find(r =>
                    r.host.userId === userId && !r.isMatchmaking
                );

                if (myRoom) {

                    const oldSocketId = myRoom.host.id;
                    myRoom.host.id = socket.id;

                    if (myRoom.lobbyPlayers) {
                        const player = myRoom.lobbyPlayers.find(p => p.id === oldSocketId);
                        if (player) player.id = socket.id;
                    }

                    await RoomStore.setRoom(myRoom.code, myRoom);
                    socket.join(`lobby_${myRoom.code}`);

                    socket.emit('my_room_found', {
                        code: myRoom.code,
                        hasPassword: !!myRoom.password
                    });

                    console.log(`🔄 ${username} восстановил комнату ${myRoom.code}`);
                } else {
                    socket.emit('my_room_not_found');
                }
            } catch (err) {
                console.error('check_my_room error:', err);
            }
        });

        socket.on('get_room_info', async (data) => {
            try {
                const { code, username } = data;
                const room = await RoomStore.getRoom(code);

                if (!room) {
                    socket.emit('room_info_error', { message: 'Комната не найдена' });
                    return;
                }

                socket.join(`lobby_${code}`);

                if (!room.lobbyPlayers) room.lobbyPlayers = [room.host];
                const alreadyIn = room.lobbyPlayers.some(p => p.id === socket.id);

                if (!alreadyIn && room.lobbyPlayers.length < 2 && room.host.id !== socket.id) {
                    const newPlayer = { id: socket.id, username };
                    room.lobbyPlayers.push(newPlayer);
                    await RoomStore.setRoom(code, room);

                    io.to(`lobby_${code}`).emit('player_joined_room', {
                        player: newPlayer,
                        players: room.lobbyPlayers
                    });
                }

                socket.emit('room_info', {
                    code: room.code,
                    hasPassword: !!room.password,
                    hostId: room.host.id,
                    players: room.lobbyPlayers
                });
            } catch (err) {
                console.error('get_room_info error:', err);
            }
        });

        socket.on('get_rooms', async (data) => {
            try {
                const { page = 1, pageSize = 6, search = '' } = data || {};
                const allRooms = await RoomStore.getAllRooms();
                const list = getRoomsList(allRooms, search);
                const total = list.length;
                const totalPages = Math.ceil(total / pageSize) || 1;
                const items = list.slice((page - 1) * pageSize, page * pageSize);

                socket.emit('rooms_list', { items, total, totalPages, page });
            } catch (err) {
                console.error('get_rooms error:', err);
            }
        });

        socket.on('join_room', async (data) => {
            try {
                const { username, userId, code, password } = data;
                const room = await RoomStore.getRoom(code?.toUpperCase());

                if (!room) {
                    socket.emit('room_error', { message: 'Комната не найдена' });
                    return;
                }

                if (room.host.userId === userId) {
                    socket.emit('room_error', { message: 'Это ваша собственная комната' });
                    return;
                }

                if (room.password && room.password !== password) {
                    socket.emit('room_error', { message: 'Неверный пароль' });
                    return;
                }

                const guest = { id: socket.id, username, userId };
                const host = room.host;

                await RoomStore.deleteRoom(code);

                const battleRoomId = `battle_room_${code}`;
                const battleData = {
                    id: battleRoomId,
                    players: [host, guest],
                    challenges: [],
                    progress: { [host.id]: {}, [guest.id]: {} }
                };

                await RoomStore.setBattle(battleRoomId, battleData);

                socket.join(battleRoomId);
                const hostSocket = io.sockets.sockets.get(host.id);
                if (hostSocket) hostSocket.join(battleRoomId);

                console.log(`⚔️ Битва: ${host.username} vs ${guest.username}`);

                const allRooms = await RoomStore.getAllRooms();
                io.emit('rooms_updated', getRoomsList(allRooms));

                io.to(battleRoomId).emit('match_found', {
                    roomId: battleRoomId,
                    players: [host, guest]
                });
            } catch (err) {
                console.error('join_room error:', err);
            }
        });

        socket.on('leave_room', async (data) => {
            try {
                const { code } = data;
                const room = await RoomStore.getRoom(code);
                if (!room) return;

                if (room.host.id === socket.id) {
                    io.to(`lobby_${code}`).emit('room_closed');
                    await RoomStore.deleteRoom(code);
                    const allRooms = await RoomStore.getAllRooms();
                    io.emit('rooms_updated', getRoomsList(allRooms));
                } else {
                    room.lobbyPlayers = (room.lobbyPlayers || []).filter(p => p.id !== socket.id);
                    await RoomStore.setRoom(code, room);
                    io.to(`lobby_${code}`).emit('player_left_room', { players: room.lobbyPlayers });
                }
                socket.leave(`lobby_${code}`);
            } catch (err) {
                console.error('leave_room error:', err);
            }
        });

        socket.on('cancel_room', async () => {
            try {
                const allRooms = await RoomStore.getAllRooms();
                const myRoom = allRooms.find(r => r.host.id === socket.id && !r.isMatchmaking);
                if (myRoom) {
                    await RoomStore.deleteRoom(myRoom.code);
                    const updatedRooms = await RoomStore.getAllRooms();
                    io.emit('rooms_updated', getRoomsList(updatedRooms));
                    console.log(`❌ Комната ${myRoom.code} отменена`);
                }
            } catch (err) {
                console.error('cancel_room error:', err);
            }
        });

        socket.on('select_battle_challenge', async (data) => {
            try {
                const { roomId, challenge } = data;
                const battle = await RoomStore.getBattle(roomId);
                if (!battle) return;

                const alreadySelected = battle.challenges.some(c => c.selectedBy === socket.id);
                if (alreadySelected) return;

                battle.challenges.push({ ...challenge, selectedBy: socket.id });
                await RoomStore.setBattle(roomId, battle);

                io.to(roomId).emit('challenge_selected_by_player', {
                    challengeId: challenge.id,
                    playerId: socket.id,
                    totalSelected: battle.challenges.length
                });

                if (battle.challenges.length === 2) {
                    io.to(roomId).emit('battle_start', { challenges: battle.challenges });
                }
            } catch (err) {
                console.error('select_battle_challenge error:', err);
            }
        });

        socket.on('challenge_result', async (data) => {
            try {
                const { roomId, challengeId, passed, total, solved, username } = data;
                const battle = await RoomStore.updateBattleProgress(
                    roomId, socket.id, challengeId, { passed, total, solved }
                );
                if (!battle) return;

                socket.to(roomId).emit('opponent_challenge_result', {
                    challengeId, passed, total, solved, username
                });

                const playerProgress = battle.progress[socket.id];
                const allSolved = battle.challenges.every(c => playerProgress[c.id]?.solved === true);

                if (allSolved) {
                    io.to(roomId).emit('battle_winner', {
                        winnerId: socket.id,
                        winnerUsername: username,
                    });
                    await RoomStore.deleteBattle(roomId);
                }
            } catch (err) {
                console.error('challenge_result error:', err);
            }
        });

        socket.on('surrender', async (data) => {
            try {
                const { roomId, username } = data;
                const battle = await RoomStore.getBattle(roomId);
                if (!battle) return;

                const winner = battle.players.find(p => p.id !== socket.id);
                if (!winner) return;

                console.log(`🏳️ ${username} сдался в ${roomId}`);

                io.to(roomId).emit('battle_winner', {
                    winnerId: winner.id,
                    winnerUsername: winner.username,
                    isSurrender: true,
                    surrenderedUsername: username,
                });

                await RoomStore.deleteBattle(roomId);
            } catch (err) {
                console.error('surrender error:', err);
            }
        });

        socket.on('rejoin_battle', async (data) => {
            try {
                const { roomId, username } = data;
                const battle = await RoomStore.getBattle(roomId);

                if (!battle) {
                    socket.emit('battle_not_found');
                    return;
                }

                const player = battle.players.find(p => p.username === username);
                if (!player) {
                    socket.emit('battle_not_found');
                    return;
                }

                const updatedBattle = await RoomStore.updateBattlePlayer(roomId, player.id, socket.id);
                socket.join(roomId);

                const opponent = updatedBattle.players.find(p => p.username !== username);

                socket.emit('battle_rejoined', {
                    roomId,
                    challenges: updatedBattle.challenges,
                    progress: updatedBattle.progress[socket.id] || {},
                    opponent: opponent || null
                });

                socket.to(roomId).emit('opponent_rejoined', { username });
                console.log(`🔄 ${username} переподключился к ${roomId}`);
            } catch (err) {
                console.error('rejoin_battle error:', err);
            }
        });

        socket.on('send_battle_chat', (data) => {
            io.to(data.roomId).emit('receive_battle_chat', {
                username: data.username,
                message: data.message,
                timestamp: new Date().toISOString()
            });
        });

        socket.on('disconnect', async () => {
            console.log(`❌ Отключен: ${socket.id}`);

            try {

                const matchmakingRooms = await RoomStore.getMatchmakingRooms();
                const myMatchmaking = matchmakingRooms.find(r => r.host.id === socket.id);
                if (myMatchmaking) {
                    await RoomStore.deleteRoom(myMatchmaking.code);
                    console.log(`❌ Matchmaking комната ${myMatchmaking.code} удалена`);
                }

                const allRooms = await RoomStore.getAllRooms();
                const myRoom = allRooms.find(r => r.host.id === socket.id && !r.isMatchmaking);
                if (myRoom) {
                    console.log(`⏳ Хост ${socket.id} отключился от комнаты ${myRoom.code}, ждём реконнект...`);

                    setTimeout(async () => {
                        try {
                            const currentRoom = await RoomStore.getRoom(myRoom.code);
                            if (!currentRoom) return;

                            if (currentRoom.host.id === socket.id) {
                                console.log(`💀 Хост не вернулся, закрываем комнату ${myRoom.code}`);
                                io.to(`lobby_${myRoom.code}`).emit('room_closed');
                                await RoomStore.deleteRoom(myRoom.code);
                                const updatedRooms = await RoomStore.getAllRooms();
                                io.emit('rooms_updated', getRoomsList(updatedRooms));
                            }
                        } catch (err) {
                            console.error('room close timeout error:', err);
                        }
                    }, 15000);
                }

                const battleKeys = await RoomStore.getAllBattleKeys();
                for (const key of battleKeys) {
                    const battleId = key.replace('battle:', '');
                    const battle = await RoomStore.getBattle(battleId);
                    if (!battle) continue;

                    if (battle.players.some(p => p.id === socket.id)) {
                        console.log(`⏳ ${socket.id} отключился от ${battleId}`);

                        setTimeout(async () => {
                            try {
                                const currentBattle = await RoomStore.getBattle(battleId);
                                if (!currentBattle) return;

                                const stillDisconnected = currentBattle.players.find(p => p.id === socket.id);
                                if (stillDisconnected) {
                                    console.log(`💀 ${socket.id} не переподключился, завершаем ${battleId}`);
                                    socket.to(battleId).emit('opponent_disconnected');
                                    await RoomStore.deleteBattle(battleId);
                                }
                            } catch (err) {
                                console.error('disconnect timeout error:', err);
                            }
                        }, 10000);
                    }
                }
            } catch (err) {
                console.error('disconnect error:', err);
            }
        });
    });

    return io;
};

module.exports = initSocket;
