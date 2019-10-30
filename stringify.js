var O = require("oolong")
var beginXml = require("xmlbuilder").begin
var findKey = require("./lib").findKey
var get = require("./lib").get
var reduce = require("./lib").reduce
var isArray = Array.isArray
var TEXT = "$"
var NAMESPACE_SEP = "$"

module.exports = function(namespaces, obj) {
	var xml = beginXml()
	xml.declaration(obj.version, obj.encoding || "UTF-8")

	// This currently outputs the namespaces on the root element and doesn't
	// track namespace changes in nested tags. That is currently only necessary
	// if passed `{$unknown: {}}` with no configured alias for the default
	// namespace. It would return <unknown xmlns="" /> causing elements inside
	// <unknown> to be scoped wrong.
	var tagName = findKey(isElement, obj)
	var tag = obj[tagName]

	if (namespaces) {
		var seen = O.object(getNamespaces(tagName, tag), get.bind(null, namespaces))
		tag = O.create(tag, O.mapKeys(seen, xmlnsify))
	}

	var el = render(xml, tagName, tag)
	return el.end({pretty: true, indent: "\t", spacebeforeslash: " "})
}

function render(xml, tagName, tag) {
	tagName = tagName.replace(NAMESPACE_SEP, ":")

	if (tagName[0] == ":") {
		tagName = tagName.slice(1)
		tag = O.create(tag, {xmlns: ""})
	}

	var el = xml.element(tagName, O.filter(tag, isAttribute), tag.$)

	O.each(tag, function(obj, tagName) {
		if (isArray(obj)) obj.forEach(render.bind(null, el, tagName))
		else if (isElement(obj, tagName)) render(el, tagName, obj)
	})

	return el
}

function getNamespaces(tagName, tag) {
	return Object.keys(traverseTag(function(seen, tagName, _tag) {
		var namespace = tagName.substring(0, tagName.indexOf(NAMESPACE_SEP))
		seen[namespace] = true
		return seen
	}, {}, tagName, tag))
}

function traverseTag(fn, value, tagName, tag) {
	var recurse = traverseTag.bind(null, fn)

	return reduce(function(value, tag, tagName) {
		if (isArray(tag))
			return tag.reduce(function(v, t) { return recurse(v, tagName, t) }, value)
		else if (isElement(tag, tagName))
			return recurse(value, tagName, tag)
		else
			return value
	}, fn(value, tagName, tag), tag)
}

function xmlnsify(name) { return name == "" ? "xmlns" : "xmlns:" + name }
function isAttribute(obj, key) { return key != TEXT && !isElement(obj, key) }
function isElement(obj, key) { return key != TEXT && typeof obj == "object" }
