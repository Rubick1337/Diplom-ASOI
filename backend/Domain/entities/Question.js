class Question {
    constructor({
        id = null,
        testId,
        typeId,
        text,
        points = 1,
        order = 0,
        allowMultiple = false,
        caseSensitive = false,
        tolerance = null,
        codeLanguage = null,
        starterCode = null,
        funcName = null,
        imageUrl = null,
        options = [],
        testCases = [],
    }) {
        this.id = id;
        this.testId = testId;
        this.typeId = typeId;
        this.text = text;
        this.points = points;
        this.order = order;
        this.allowMultiple = allowMultiple;
        this.caseSensitive = caseSensitive;
        this.tolerance = tolerance;
        this.codeLanguage = codeLanguage;
        this.starterCode = starterCode;
        this.funcName = funcName;
        this.imageUrl = imageUrl;
        this.options = options;
        this.testCases = testCases;
    }
}

module.exports = Question;
