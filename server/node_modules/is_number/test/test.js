var assert = require("assert"),
    isNumber = require("../src/index");


describe("isNumber", function() {
    it("should return true when the value is a Number", function() {
        assert.equal(isNumber(null), false);
        assert.equal(isNumber(undefined), false);
        assert.equal(isNumber({}), false);
        assert.equal(isNumber([]), false);
        assert.equal(isNumber(""), false);
        assert.equal(isNumber(/./), false);
        assert.equal(isNumber(function noop() {}), false);
        assert.equal(isNumber(Object(0)), false);

        assert.equal(isNumber(0), true);
    });
});
