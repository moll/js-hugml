exports.uniq = require("lodash.uniq")
exports.difference = require("lodash.difference")
exports.id = function(value) { return value }
exports.first = function(array) { return array[0] }
exports.last = function(array) { return array[array.length - 1] }
exports.sort = function(fn, array) { return array.slice().sort(fn) }
exports.isString = function(value) { return typeof value == "string" }
exports.isArray = Array.isArray
exports.concat = Array.prototype.concat.bind(Array.prototype)
exports.flatten = Function.apply.bind(Array.prototype.concat, Array.prototype)

exports.assign = function(target) {
  if (target != null) for (var i = 1; i < arguments.length; ++i) {
    var source = arguments[i]
    for (var key in source) target[key] = source[key]
  }

  return target
}

exports.create = function(obj) {
  obj = arguments[0] = Object.create(obj)
  return arguments.length == 1 ? obj : exports.assign.apply(this, arguments)
}

exports.each = function(obj, fn, context) {
  for (var key in obj) fn.call(context, obj[key], key, obj)
  return obj
}

exports.keys = function(obj) {
  var keys = []
  for (var key in obj) keys.push(key)
  return keys
}

exports.isEmpty = function isEmpty(obj) {
  for (obj in obj) return false
  return true
}

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
