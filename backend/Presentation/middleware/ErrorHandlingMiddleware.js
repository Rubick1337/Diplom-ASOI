const ApiError = require('../ErrorExtend/ApiError');

module.exports = function (err, req, res, next) {
    if (err instanceof ApiError) {
        return res.status(err.status).json({ message: err.message });
    }
    if (err.status && err.status < 500) {
        return res.status(err.status).json({ message: err.message });
    }
    console.error('[Unhandled error]', err);
    return res.status(500).json({ message: "Непредвиденная ошибка!" });
}
