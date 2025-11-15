const ApiError = require('../ErrorExtend/ApiError');
const userService = require('../../Application/services/userService');
const {validationResult } = require('express-validator');
const { Op } = require('sequelize');

class UserController {
    async registration(req, res, next) {
        try {
            const { email, password,username, role } = req.body;
            if (!email.trim() || !password.trim() || !username.trim()) {
                return res.status(400).json({ message: "Все поля должны быть заполнены, пустых не может быть" });
            }
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: "Ошибка валидации: пароль от 3 до 32 символов или неправильно введена почта" });
            }
            const userData = await userService.register(email, password, username, role);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            return res.json(userData);

        } catch (e) {
            console.error(e);

            if (e.message.includes('с такой почтой')) {
                return res.status(409).json({ message: e.message });
            }

            next(ApiError.Internal(e.message));
        }
    }

    async login(req, res, next) {
        try {
            const { email, password} = req.body;
            const userData = await userService.login(email, password);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            return res.json(userData);
        } catch (e) {
            console.error(e);
            next(ApiError.Internal(e.message));
        }
    }

    async logout(req, res, next) {
        try {
            const {refreshToken} = req.cookies;
            const token = await  userService.logout(refreshToken)
            res.clearCookie('refreshToken');
            return res.json(token)
        } catch (e) {
            console.error(e);
            next(ApiError.Internal(e.message));
        }
    }

    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.cookies;
            console.log('refreshToken из куки', refreshToken);
            if (!refreshToken) {
                next(ApiError.forbidden("Refresh token not found"));
            }
            const userData = await userService.refresh(refreshToken);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            return res.json(userData);
        } catch (e) {
            console.error(e);
            next(ApiError.Internal(e.message));
        }
    }
}

module.exports = new UserController();