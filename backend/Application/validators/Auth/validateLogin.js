function validateLogin(dto) {
    const errors = [];

    if (!dto.login || typeof dto.login !== 'string' || dto.login.trim().length < 3) {
        errors.push('Логин (email или username) обязателен и должен быть строкой от 3 символов.');
    }

    if (!dto.password || typeof dto.password !== 'string' || dto.password.length < 6) {
        errors.push('Пароль обязателен и должен быть не короче 6 символов.');
    }

    if (errors.length > 0) {
        const err = new Error('Validation error');
        err.details = errors;
        throw err;
    }
}

module.exports = validateLogin;
