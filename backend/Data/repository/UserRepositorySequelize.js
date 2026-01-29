const { Op } = require('sequelize');
const IUserRepository = require('../../Domain/repository/IUserRepository');
const UserEntity = require('../../Domain/entities/User');
const UserModel = require('../models/UserModel');

class UserRepositorySequelize extends IUserRepository {

    mapToEntity(row) {
        if (!row) return null;
        const data = row.toJSON ? row.toJSON() : row;

        return new UserEntity({
            id: data.id,
            username: data.username,
            password: data.password,
            email: data.email,
            role: data.role,
            refreshToken: data.refreshToken,
            googleId: data.googleId,
            githubId: data.githubId,
            experience: data.experience
        });
    }

    buildWhere(filter = {}) {
        const where = {};

        if (filter.id !== undefined) {
            where.id = filter.id;
        }

        if (filter.email) {
            where.email = filter.email;
        }

        if (filter.username) {
            where.username = filter.username;
        }

        if (filter.usernameLike) {
            where.username = { [Op.like]: `%${filter.usernameLike}%` };
        }

        if (filter.role !== undefined) {
            where.role = filter.role;
        }

        if (filter.googleId) {
            where.googleId = filter.googleId;
        }

        if (filter.githubId) {
            where.githubId = filter.githubId;
        }

        if (filter.refreshToken) {
            where.refreshToken = filter.refreshToken;
        }

        if (filter.minExperience !== undefined || filter.maxExperience !== undefined) {
            where.experience = {};
            if (filter.minExperience !== undefined) {
                where.experience[Op.gte] = filter.minExperience;
            }
            if (filter.maxExperience !== undefined) {
                where.experience[Op.lte] = filter.maxExperience;
            }
        }

        if (filter.search) {
            where[Op.or] = [
                { username: { [Op.like]: `%${filter.search}%` } },
                { email: { [Op.like]: `%${filter.search}%` } }
            ];
        }

        return where;
    }

    async findOne(filter = {}) {
        const where = this.buildWhere(filter);
        const row = await UserModel.findOne({ where });
        return this.mapToEntity(row);
    }

    async findById(id) {
        const row = await UserModel.findByPk(id);
        return this.mapToEntity(row);
    }

    async findMany(filter = {}, options = {}) {
        const {
            page = 1,
            pageSize = 10,
            orderBy = 'id',
            orderDirection = 'ASC'
        } = options;

        const where = this.buildWhere(filter);
        const offset = (page - 1) * pageSize;

        const { rows, count } = await UserModel.findAndCountAll({
            where,
            limit: pageSize,
            offset,
            order: [[orderBy, orderDirection]]
        });

        const items = rows.map(r => this.mapToEntity(r));
        const totalPages = Math.ceil(count / pageSize);

        return {
            items,
            total: count,
            page,
            pageSize,
            totalPages
        };
    }

    async create(userEntity) {
        const row = await UserModel.create({
            username: userEntity.username,
            password: userEntity.password,
            email: userEntity.email,
            role: userEntity.role,
            refreshToken: userEntity.refreshToken,
            googleId: userEntity.googleId,
            githubId: userEntity.githubId,
            experience: userEntity.experience
        });

        return this.mapToEntity(row);
    }

    async update(userEntity) {
        await UserModel.update(
            {
                username: userEntity.username,
                password: userEntity.password,
                email: userEntity.email,
                role: userEntity.role,
                refreshToken: userEntity.refreshToken,
                googleId: userEntity.googleId,
                githubId: userEntity.githubId,
                experience: userEntity.experience
            },
            {
                where: { id: userEntity.id }
            }
        );

        const updated = await UserModel.findByPk(userEntity.id);
        return this.mapToEntity(updated);
    }

    async setRefreshToken(userId, refreshToken) {
        await UserModel.update(
            { refreshToken },
            { where: { id: userId } }
        );
    }

    async clearRefreshToken(userId) {
        await UserModel.update(
            { refreshToken: null },
            { where: { id: userId } }
        );
    }
}

module.exports = UserRepositorySequelize;