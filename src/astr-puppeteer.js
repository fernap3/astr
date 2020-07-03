class Assert
{
	equals(expected, actual, message)
	{
		if (expected !== actual)
			throw new AssertionError("equals", expected, actual, message);
	}

	truthy(value, message)
	{
		if (value != true)
			throw new AssertionError("truthy", undefined, undefined, message);
	}

	throws(func, message)
	{
		let threw = false;
		try
		{
			func();
		}
		catch(e)
		{
			threw = true;
		}

		if (!threw)
			throw new AssertionError("throws", undefined, undefined, message);
	}

	isPrimitive(obj)
	{
		return (obj !== Object(obj));
	}

	deepEqual(expected, actual, message)
	{
		if (expected === actual) // it's just the same object. No need to compare.
        	return;

		if (this.isPrimitive(expected) && this.isPrimitive(actual)) // compare primitives
		{
			if(expected !== actual)
				throw new AssertionError("deepEqual", expected, actual, message);
		}

		if (Object.keys(expected).length !== Object.keys(actual).length)
			throw new AssertionError("deepEqual", expected, actual, message);

		// compare objects with same number of keys
		for (let key in expected)
		{
			if(!(key in actual)) //other object doesn't have this prop
				throw new AssertionError("deepEqual", expected, actual, message);
			
			this.deepEqual(expected[key], actual[key]);
		}
	}
}

class AssertionError
{
	constructor (type, expected, actual, message)
	{
		this.astrError = true;
		this.type = type;
		this.expected = expected;
		this.actual = actual;
		this.message = message;
	}

	toJSON()
	{
		return {
			astrError: true,
			type: this.type,
			expected: this.expected,
			actual: this.actual,
			message: this.message,
		};
	}
}

window.astr = { 
	Assert: Assert
};
