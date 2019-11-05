var O = require("oolong")

exports.keys = O.keys
exports.create = O.create
exports.each = O.each
exports.isEmpty = O.isEmpty
exports.uniq = require("lodash.uniq")
exports.difference = require("lodash.difference")
exports.id = function(value) { return value }
exports.first = function(array) { return array[0] }
exports.last = function(array) { return array[array.length - 1] }
exports.sort = function(fn, array) { return array.slice().sort(fn) }
exports.isString = function(value) { return typeof value == "string" }

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

exports.findLast = function(fn, array) {
	for (var i = array.length - 1; i >= 0; --i) {
		if (fn(array[i])) return array[i]
	}

	return undefined
}

exports.count = function(fn, array) {
	var n = 0
	for (var i = 0; i < array.length; ++i) if (fn(array[i])) ++n
	return n
}

exports.repeat = function(n, value) {
	var array = new Array(n)
	for (var i = 0; i < array.length; ++i) array[i] = value
	return array
}
