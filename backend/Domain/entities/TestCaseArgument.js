class TestCaseArgument {
    constructor({ id = null, testCaseId = null, value, order = 0 }) {
        this.id = id;
        this.testCaseId = testCaseId;
        this.value = value;
    }
}
module.exports = TestCaseArgument;