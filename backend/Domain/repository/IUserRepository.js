// domain/repository/IUserRepository.js

class IUserRepository {

    async findOne(filter) {
        throw new Error("Not implemented");
    }

    async findMany(filter, options) {
        throw new Error("Not implemented");
    }

    async findById(id) {
        throw new Error("Not implemented");
    }

    async create(userEntity) {
        throw new Error("Not implemented");
    }

    async update(userEntity) {
        throw new Error("Not implemented");
    }

    async setRefreshToken(userId, refreshToken) {
        throw new Error("Not implemented");
    }

    async clearRefreshToken(userId) {
        throw new Error("Not implemented");
    }
}

module.exports = IUserRepository;
