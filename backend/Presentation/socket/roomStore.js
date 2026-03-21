const { client } = require('../../Data/config/redisConfig');

const ROOM_TTL = 60 * 60;
const BATTLE_TTL = 60 * 60 * 3;

class RoomStore {

    static async setRoom(code, roomData) {
        await client.setEx(`room:${code}`, ROOM_TTL, JSON.stringify(roomData));
    }

    static async getRoom(code) {
        const data = await client.get(`room:${code}`);
        return data ? JSON.parse(data) : null;
    }

    static async deleteRoom(code) {
        await client.del(`room:${code}`);
        await client.sRem('rooms:all', code);
        await client.sRem('rooms:matchmaking', code);
    }

    static async getAllRooms() {
        const codes = await client.sMembers('rooms:all');
        if (!codes.length) return [];

        const results = await Promise.all(
            codes.map(code => client.get(`room:${code}`))
        );

        return results
            .filter(Boolean)
            .map(data => JSON.parse(data));
    }

    static async addToIndex(code, isMatchmaking = false) {
        await client.sAdd('rooms:all', code);
        if (isMatchmaking) await client.sAdd('rooms:matchmaking', code);
    }

    static async getMatchmakingRooms() {
        const codes = await client.sMembers('rooms:matchmaking');
        if (!codes.length) return [];

        const results = await Promise.all(
            codes.map(code => client.get(`room:${code}`))
        );

        return results
            .filter(Boolean)
            .map(data => JSON.parse(data));
    }

    static async removeFromMatchmaking(code) {
        await client.sRem('rooms:matchmaking', code);
    }

    static async setBattle(battleRoomId, battleData) {
        await client.setEx(`battle:${battleRoomId}`, BATTLE_TTL, JSON.stringify(battleData));
    }

    static async getBattle(battleRoomId) {
        const data = await client.get(`battle:${battleRoomId}`);
        return data ? JSON.parse(data) : null;
    }

    static async deleteBattle(battleRoomId) {
        await client.del(`battle:${battleRoomId}`);
    }

    static async updateBattleProgress(battleRoomId, socketId, challengeId, progress) {
        const battle = await this.getBattle(battleRoomId);
        if (!battle) return null;

        if (!battle.progress[socketId]) battle.progress[socketId] = {};
        battle.progress[socketId][challengeId] = progress;

        await this.setBattle(battleRoomId, battle);
        return battle;
    }

    static async updateBattlePlayer(battleRoomId, oldSocketId, newSocketId) {
        const battle = await this.getBattle(battleRoomId);
        if (!battle) return null;

        const player = battle.players.find(p => p.id === oldSocketId);
        if (player) player.id = newSocketId;

        if (battle.progress[oldSocketId]) {
            battle.progress[newSocketId] = battle.progress[oldSocketId];
            delete battle.progress[oldSocketId];
        }

        await this.setBattle(battleRoomId, battle);
        return battle;
    }

    static async getAllBattleKeys() {
        return await client.keys('battle:*');
    }
}

module.exports = RoomStore;
