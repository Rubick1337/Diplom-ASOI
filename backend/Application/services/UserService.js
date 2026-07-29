const bcrypt = require("bcryptjs");

const UserCreateDto = require("../dto/Users/UserCreateDto");
const UserResponseDto = require("../dto/Users/UserResponseDto");
const UserUpdateDto = require("../dto/Users/UserUpdateDto");

const LoginDto = require("../dto/Auth/LoginDto");
const RefreshTokenDto = require("../dto/Auth/RefreshTokenDto");

const validateUserCreate = require("../validators/Users/validateUserCreate");
const validateUserUpdate = require("../validators/Users/validateUserUpdate");
const validateLogin = require("../validators/Auth/validateLogin");

const UserEntity = require("../../Domain/entities/User");
const tokenService = require("./TokenService");

class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async createVerifiedUser({ username, email, passwordHash }) {
        if (await this.userRepository.findOne({ email })) {
            throw new Error('Пользователь с такой почтой уже существует');
        }
        if (await this.userRepository.findOne({ username })) {
            throw new Error('Username уже занят');
        }

        const userEntity = new UserEntity({
            username,
            password: passwordHash,
            email,
            role: 3,
            googleId: null,
            githubId: null,
            experience: 0,
        });

        const createdUser = await this.userRepository.create(userEntity);

        const tokens = tokenService.generateTokens({
            id: createdUser.id,
            email: createdUser.email,
            role: createdUser.role,
        });

        await this.userRepository.setRefreshToken(createdUser.id, tokens.refreshToken);

        return {
            user: new UserResponseDto(createdUser),
            ...tokens,
        };
    }

    async register(rawData) {
        const dto = new UserCreateDto(rawData);
        validateUserCreate(dto);

        if (await this.userRepository.findOne({ email: dto.email })) {
            throw new Error("Пользователь с такой почтой уже существует");
        }

        if (await this.userRepository.findOne({ username: dto.username })) {
            throw new Error("Username уже занят");
        }

        const hashPassword = dto.password
            ? await bcrypt.hash(dto.password, 5)
            : null;

        const userEntity = new UserEntity({
            username: dto.username,
            password: hashPassword,
            email: dto.email,
            role: dto.role,
            googleId: null,
            githubId: null,
            experience: 0
        });

        const createdUser = await this.userRepository.create(userEntity);

        const tokens = tokenService.generateTokens({
            id: createdUser.id,
            email: createdUser.email,
            role: createdUser.role
        });

        await this.userRepository.setRefreshToken(createdUser.id, tokens.refreshToken);

        return {
            user: new UserResponseDto(createdUser),
            ...tokens
        };
    }

    async login(rawData) {
        const dto = new LoginDto(rawData);
        validateLogin(dto);

        let user = await this.userRepository.findOne({ email: dto.login });
        if (!user) {
            user = await this.userRepository.findOne({ username: dto.login });
        }

        if (!user) throw new Error("Неверный логин или пароль");

        if (!user.password)
            throw new Error("Пользователь зарегистрирован через OAuth2");

        const isEqual = await bcrypt.compare(dto.password, user.password);
        if (!isEqual) throw new Error("Неверный логин или пароль");

        const tokens = tokenService.generateTokens({
            id: user.id,
            email: user.email,
            role: user.role
        });

        await this.userRepository.setRefreshToken(user.id, tokens.refreshToken);

        return {
            user: new UserResponseDto(user),
            ...tokens
        };
    }

    async logout(refreshToken) {
        if (!refreshToken) return true;

        const user = await this.userRepository.findOne({ refreshToken });
        if (!user) return true;

        await this.userRepository.clearRefreshToken(user.id);
        return true;
    }

    async refresh(rawData) {
        const dto = new RefreshTokenDto(rawData);

        if (!dto.refreshToken)
            throw new Error("Refresh token отсутствует");

        const payload = tokenService.validateRefreshToken(dto.refreshToken);
        if (!payload) throw new Error("Refresh token неверный");

        const user = await this.userRepository.findById(payload.sub || payload.id);

        if (!user || user.refreshToken !== dto.refreshToken)
            throw new Error("Refresh token устарел");

        const newTokens = tokenService.generateTokens({
            id: user.id,
            email: user.email,
            role: user.role
        });

        await this.userRepository.setRefreshToken(user.id, newTokens.refreshToken);

        return {
            user: new UserResponseDto(user),
            ...newTokens
        };
    }

    async getAll(query) {
        const filter = {};
        const page = Number(query.page) || 1;
        const pageSize = Number(query.pageSize || query.limit) || 10;

        if (query.role !== undefined) filter.role = Number(query.role);
        if (query.usernameLike) filter.usernameLike = query.usernameLike;
        if (query.search) filter.search = query.search;

        if (query.minExperience) filter.minExperience = Number(query.minExperience);
        if (query.maxExperience) filter.maxExperience = Number(query.maxExperience);

        const result = await this.userRepository.findMany(filter, {
            page,
            pageSize,
            orderBy: "id",
            orderDirection: "ASC"
        });

        return {
            items: result.items.map(u => new UserResponseDto(u)),
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
            totalPages: result.totalPages
        };
    }

    async updateUser(id, rawData) {
        const dto = new UserUpdateDto({
            id,
            username: rawData.username,
            email: rawData.email,
            role: rawData.role,
            googleId: rawData.googleId,
            githubId: rawData.githubId,
            experience: rawData.experience
        });

        validateUserUpdate(dto);

        const existing = await this.userRepository.findById(id);
        if (!existing) throw new Error("Пользователь не найден");

        existing.username = dto.username ?? existing.username;
        existing.email = dto.email ?? existing.email;
        existing.role = dto.role ?? existing.role;
        existing.googleId = dto.googleId ?? existing.googleId;
        existing.githubId = dto.githubId ?? existing.githubId;

        if (dto.experience !== undefined && dto.experience !== null) {
            existing.experience = dto.experience;
        }

        const updated = await this.userRepository.update(existing);
        return new UserResponseDto(updated);
    }

    async loginWithGoogle(profile) {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value ?? null;
        const baseUsername = profile.displayName || email || `google_${googleId}`;

        if (!email) {
            throw new Error('Google не вернул email. Разреши доступ к email в аккаунте или используй обычную регистрацию.');
        }

        let user = await this.userRepository.findOne({ googleId });

        if (!user) {
            user = await this.userRepository.findOne({ email });
        }

        if (!user) {
            let finalUsername = baseUsername;
            const existingByUsername = await this.userRepository.findOne({ username: baseUsername });

            if (existingByUsername) {
                const suffix = googleId.toString().slice(-4);
                finalUsername = `${baseUsername}_${suffix}`;
            }

            const entity = new UserEntity({
                id: null,
                username: finalUsername,
                password: null,
                email,
                role: 3,
                refreshToken: null,
                googleId,
                githubId: null,
                experience: 0,
            });

            user = await this.userRepository.create(entity);
        } else if (!user.googleId) {
            user.googleId = googleId;
            user = await this.userRepository.update(user);
        }

        const tokens = tokenService.generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        await this.userRepository.setRefreshToken(user.id, tokens.refreshToken);

        return {
            user: new UserResponseDto(user),
            ...tokens,
        };
    }

    async loginWithGithub(profile) {
        const githubId = profile.id;
        const email = profile.emails?.[0]?.value ?? null;
        const baseUsername = profile.username || email || `github_${githubId}`;

        if (!email) {
            throw new Error('GitHub не вернул email. Сделай email публичным в GitHub или используй обычную регистрацию.');
        }

        let user = await this.userRepository.findOne({ githubId });

        if (!user) {
            user = await this.userRepository.findOne({ email });
        }

        if (!user) {
            let finalUsername = baseUsername;
            const existingByUsername = await this.userRepository.findOne({ username: baseUsername });

            if (existingByUsername) {
                const suffix = githubId.toString().slice(-4);
                finalUsername = `${baseUsername}_${suffix}`;
            }

            const entity = new UserEntity({
                id: null,
                username: finalUsername,
                password: null,
                email,
                role: 3,
                refreshToken: null,
                googleId: null,
                githubId,
                experience: 0,
            });

            user = await this.userRepository.create(entity);
        } else if (!user.githubId) {
            user.githubId = githubId;
            user = await this.userRepository.update(user);
        }

        const tokens = tokenService.generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        await this.userRepository.setRefreshToken(user.id, tokens.refreshToken);

        return {
            user: new UserResponseDto(user),
            ...tokens,
        };
    }
}

module.exports = UserService;
