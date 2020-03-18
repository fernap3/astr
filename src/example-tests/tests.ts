const { registerTest } = require("../typescript-test.js") as typeof import("../typescript-test");

registerTest({
	name: "One equals one",
	func: async (assert) =>
	{
		assert.equals(1, 1);
	}
});
