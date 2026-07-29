const path = require('path');
const fs   = require('fs');
const AchievementService    = require('../../Application/services/AchievementService');
const { achievementUpload } = require('../../Data/config/uploadConfig');

const UPLOAD_DIR = path.join(__dirname, '../../public/achievements');

function _del(filename) {
    if (!filename) return;
    try { fs.unlinkSync(path.join(UPLOAD_DIR, filename)); } catch {}
}

const achievementController = {
    getAll: async (req, res) => {
        try { res.json(await AchievementService.getAllAchievements()); }
        catch (e) { res.status(500).json({ message: e.message }); }
    },

    create: [
        achievementUpload.single('image'),
        async (req, res) => {
            try {
                const { title, desc, rarity } = req.body;
                if (!title || !desc) {
                    if (req.file) _del(req.file.filename);
                    return res.status(400).json({ message: 'title and desc are required' });
                }
                const row = await AchievementService.createAchievement({
                    title, desc, rarity: rarity || 'common',
                    imageFilename: req.file ? req.file.filename : null,
                });
                res.status(201).json(row);
            } catch (e) {
                if (req.file) _del(req.file.filename);
                res.status(500).json({ message: e.message });
            }
        },
    ],

    update: [
        achievementUpload.single('image'),
        async (req, res) => {
            try {
                const { id } = req.params;
                const { title, desc, rarity } = req.body;
                const updates = {};
                if (title !== undefined) updates.title  = title;
                if (desc  !== undefined) updates.desc   = desc;
                if (rarity !== undefined) updates.rarity = rarity;
                if (req.file) {
                    const all = await AchievementService.getAllAchievements();
                    const old = all.find(a => a.id === Number(id));
                    if (old?.imageFilename) _del(old.imageFilename);
                    updates.imageFilename = req.file.filename;
                }
                res.json(await AchievementService.updateAchievement(id, updates));
            } catch (e) {
                if (req.file) _del(req.file.filename);
                res.status(500).json({ message: e.message });
            }
        },
    ],

    remove: async (req, res) => {
        try {
            const { id } = req.params;
            const all = await AchievementService.getAllAchievements();
            const row = all.find(a => a.id === Number(id));
            if (row?.imageFilename) _del(row.imageFilename);
            await AchievementService.deleteAchievement(id);
            res.json({ ok: true });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },
};

module.exports = achievementController;
