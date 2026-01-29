class ChallengeParameter {
    constructor({ id = null, challengeId = null, name, dataType, order = 0 }) {
        this.id = id;
        this.challengeId = challengeId;
        this.name = name;
        this.dataType = dataType;
    }
}
module.exports = ChallengeParameter;