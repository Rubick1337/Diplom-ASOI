const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');

const ACHIEVEMENT_DIR   = path.join(__dirname, '../../public/achievements');
const QUESTION_IMG_DIR  = path.join(__dirname, '../../public/question-images');

if (!fs.existsSync(QUESTION_IMG_DIR)) fs.mkdirSync(QUESTION_IMG_DIR, { recursive: true });

const imageFilter = (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
};

const achievementUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, ACHIEVEMENT_DIR),
        filename:    (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase() || '.png';
            cb(null, `${uuidv4()}${ext}`);
        },
    }),
    fileFilter: imageFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
});

const questionImageUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, QUESTION_IMG_DIR),
        filename:    (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
            cb(null, `${uuidv4()}${ext}`);
        },
    }),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { achievementUpload, questionImageUpload };
