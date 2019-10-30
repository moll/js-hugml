exports.findKey = function(fn, obj) {
	/* eslint consistent-return: 0 */
	for (var key in obj) if (fn(obj[key], key)) return key
	return undefined
}

exports.reduce = function(fn, value, obj) {
	for (var key in obj) value = fn(value, obj[key], key)
	return value
}

exports.contains = function(value, obj) {
	for (var key in obj) if (obj[key] === value) return true
	return false
}

exports.invert = function(obj) {
	var inverted = {}
	for (var key in obj) inverted[obj[key]] = key
	return inverted
}

exports.last = function(array) { return array[array.length - 1] }
