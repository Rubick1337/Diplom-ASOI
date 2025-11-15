function validateUserUpdate(dto) {
    const errors = [];

    if (dto.username !== undefined) {
        if (typeof dto.username !== 'string' || dto.username.trim().length < 3) {
            errors.push('Username (если указан) должен быть строкой длиной от 3 символов.');
        }
    }

    if (dto.email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(dto.email)) {
            errors.push('Некорректный формат Email.');
        }
    }

    if (dto.role !== undefined && Number.isNaN(Number(dto.role))) {
        errors.push('Role (если указан) должен быть числом.');
    }

    if (errors.length > 0) {
        const err = new Error('Validation error');
        err.details = errors;
        throw err;
    }
}

module.exports = validateUserUpdate;
