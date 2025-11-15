const jwt = require("jsonwebtoken");
const User = require("../models/User");

class TokenService {
    generateToken(payload) {
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '30m' });
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '10d' });
        return {
            accessToken,
            refreshToken
        }
    }

    validateAccessToken(accessToken) {
        try {
            const userData = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
            return userData;
        } catch (err) {
            return null;
        }
    }

    validateRefreshToken(refreshToken) {
        try {
            const userData = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            return userData;
        } catch (err) {
            return null;
        }
    }

    async saveToken(user_id, refreshToken) {
        try {
            console.log("Saving token for user_id:", user_id);
            console.log("Refresh Token:", refreshToken);

            const user = await User.findOne({ where: { id: user_id } });
            console.log("Found user:", user);

            if (user) {
                console.log("Updating user's refresh token");
                user.refreshToken = refreshToken;
                await user.save();
                return user;
            } else {
                console.log("User not found");
                return null;
            }
        } catch (error) {
            console.error("Error saving token:", error);
            throw error;
        }
    }

    async removeToken(refreshToken) {
        try {
            const user = await User.findOne({ where: { refreshToken: refreshToken } });

            if (user) {
                user.refreshToken = null;
                await user.save();
                return user;
            }
            return null;
        } catch (error) {
            console.error("Error removing token:", error);
            throw error;
        }
    }

    async findToken(refreshToken) {
        try {
            const user = await User.findOne({ where: { refreshToken: refreshToken } });
            console.log('Searching for token');
            console.log('Refresh Token:', refreshToken);
            console.log('Found user:', user);
            return user;
        } catch (error) {
            console.error("Error finding token:", error);
            throw error;
        }
    }
}

module.exports = new TokenService();