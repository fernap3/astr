const { registerTest } = require("../astr.js") as typeof import("../astr");

registerTest({
	name: "One equals one",
	func: async (assert) =>
	{
		assert.equals(1, 1);
	}
});
