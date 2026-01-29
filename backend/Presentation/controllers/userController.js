const UserRepositorySequelize = require('../../Data/repository/UserRepositorySequelize');
const UserService = require('../../Application/services/UserService');

const ApiError = require('../ErrorExtend/ApiError');

const userRepository = new UserRepositorySequelize();
const userService = new UserService(userRepository);

class UserController {
    async registration(req, res, next) {
        try {
            const rawData = {
                username: req.body.username,
                password: req.body.password,
                email: req.body.email,
                role: req.body.role ?? 0,
            };

            const result = await userService.register(rawData);

            res.cookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 30 * 60 * 1000
            });

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 10 * 24 * 60 * 60 * 1000
            });

            return res.status(201).json({
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken
            });
        } catch (e) {
            console.error('registration error:', e);

            if (e.details) {
                return res.status(400).json({ message: 'Validation error', errors: e.details });
            }

            if (e.message && e.message.includes('почтой')) {
                return res.status(409).json({ message: e.message });
            }

            if (ApiError && ApiError.Internal) {
                return next(ApiError.Internal(e.message));
            }

            return res.status(500).json({ message: 'Server error' });
        }
    }

    async login(req, res, next) {
        try {
            const loginValue = req.body.login || req.body.email || req.body.username;

            const rawData = {
                login: loginValue,
                password: req.body.password
            };

            const result = await userService.login(rawData);

            res.cookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 30 * 60 * 1000
            });

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 10 * 24 * 60 * 60 * 1000
            });

            return res.json({
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken
            });
        } catch (e) {
            console.error('login error:', e);

            if (e.details) {
                return res.status(400).json({ message: 'Validation error', errors: e.details });
            }

            if (e.message && e.message.includes('Неверный логин или пароль')) {
                return res.status(401).json({ message: e.message });
            }

            if (ApiError && ApiError.Internal) {
                return next(ApiError.Internal(e.message));
            }

            return res.status(500).json({ message: 'Server error' });
        }
    }

    async refresh(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken;

            const result = await userService.refresh({ refreshToken });

            res.cookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 30 * 60 * 1000
            });

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 10 * 24 * 60 * 60 * 1000
            });

            return res.json({
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken
            });
        } catch (e) {
            console.error('refresh error:', e);

            if (e.message && e.message.toLowerCase().includes('refresh token')) {
                return res.status(401).json({ message: e.message });
            }

            if (ApiError && ApiError.Internal) {
                return next(ApiError.Internal(e.message));
            }

            return res.status(500).json({ message: 'Server error' });
        }
    }

    async logout(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken;

            await userService.logout(refreshToken);

            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            return res.json({ message: 'Logged out' });
        } catch (e) {
            console.error('logout error:', e);

            if (ApiError && ApiError.Internal) {
                return next(ApiError.Internal(e.message));
            }

            return res.status(500).json({ message: 'Server error' });
        }
    }

    async getAll(req, res, next) {
        try {
            const result = await userService.getAll(req.query);

            return res.json(result);
        } catch (e) {
            console.error('getAll error:', e);

            if (ApiError && ApiError.Internal) {
                return next(ApiError.Internal(e.message));
            }

            return res.status(500).json({ message: 'Server error' });
        }
    }

    async updateUser(req, res, next) {
        try {
            const id = Number(req.params.id);
            if (!id) {
                return res.status(400).json({ message: "Некорректный [id] пользователя" });
            }

            const updatedUser = await userService.updateUser(id, req.body);

            return res.json(updatedUser);
        } catch (e) {
            console.error('updateUser error:', e);

            if (e.details) {
                return res.status(400).json({ message: 'Validation error', errors: e.details });
            }

            if (e.message === 'Пользователь не найден') {
                return res.status(404).json({ message: e.message });
            }

            if (ApiError && ApiError.Internal) {
                return next(ApiError.Internal(e.message));
            }

            return res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new UserController();
