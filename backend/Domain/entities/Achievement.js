class Achievement {
    constructor({ id = null, title, desc, rarity = 'common', imageFilename = null }) {
        this.id = id;
        this.title = title;
        this.desc = desc;
        this.rarity = rarity;
        this.imageFilename = imageFilename;
    }
}

module.exports = Achievement;
