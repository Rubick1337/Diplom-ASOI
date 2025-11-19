function validateUserCreate(dto) {
    const errors = [];

    if (!dto.username || typeof dto.username !== 'string' || dto.username.trim().length < 3) {
        errors.push('Username должен быть строкой длиной от 3 символов.');
    }

    if (!dto.email || typeof dto.email !== 'string') {
        errors.push('Email обязателен.');

    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(dto.email)) {
            errors.push('Некорректный формат Email.');
        }
    }

    if (dto.password !== null && dto.password !== undefined) {
        if (typeof dto.password !== 'string' || dto.password.length < 6) {
            errors.push('Пароль (если указан) должен быть не короче 6 символов.');
        }
    }

    if (dto.role === undefined || dto.role === null || Number.isNaN(Number(dto.role))) {
        errors.push('Role должен быть числом.');
    }

    if (errors.length > 0) {
        const err = new Error('Validation error');
        err.details = errors;
        throw err;
    }
}

module.exports = validateUserCreate;
