const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_TTL = '15m';           // время жизни access токена
const REFRESH_TOKEN_TTL = '7d';           // время жизни refresh токена

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_dev';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_dev';

function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            role: user.role,
            username: user.username
        },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_TTL }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id
        },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_TTL }
    );
}

function verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

function verifyRefreshToken(token) {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};
