var _ = require("./lib")
var isArray = Array.isArray
var concat = Array.prototype.concat.bind(Array.prototype)
var flatten = Function.apply.bind(Array.prototype.concat, Array.prototype)
var NL = "\n"
var TAB = "\t"
var TEXT = "$"

// The namespaces argument takes an object from alias to namespace URI.
exports = module.exports = function(namespaces, obj) {
	var version = escapeAttr(obj.version || "1.0")
	var encoding = escapeAttr(obj.encoding || "UTF-8")

	return (
		"<?xml " + kv("version", version) + " " + kv("encoding", encoding) + " ?>" +
		NL +
		stringifyTag("", serializeRoot(namespaces, obj))
	)
}

function serializeRoot(namespaces, obj) {
	var tagName = _.findKey(isElement, obj)
	var tag = serializeTag(tagName, obj[tagName])
	var attrs = tag[1]

	if (!_.isEmpty(namespaces)) {
		var aliases = _.keys(namespaces)
		var seen = _.difference(aliases, searchForAliases(aliases, tag))

		attrs = concat(
			seen.map(function(name) { return [xmlnsify(name), namespaces[name]] }),
			attrs
		)
	}

	return [tag[0], attrs, tag[2]]
}

function serializeTag(tagName, obj) {
	var attrs = []
	var children = []
	var text = obj[TEXT]

	_.each(obj, function(value, name) {
		if (name == TEXT);
		else if (isArray(value)) children.push([normalizeName(name), value])
		else if (isElement(value, name)) children.push([normalizeName(name), value])
		else attrs.push([normalizeName(name), value])
	})

	if (children.length > 0 && text != null)
		throw new Error("Both child elements and text in " + tagName)

	children = flatten(children.map(function(tagNameAndObj) {
		var tagName = tagNameAndObj[0]
		var obj = tagNameAndObj[1]
		if (isArray(obj)) return obj.map(serializeTag.bind(null, tagName))
		else return [serializeTag(tagName, obj)]
	}))

	return [normalizeName(tagName), attrs, text != null ? text : children]
}

function stringifyTag(indent, tag) {
	var name = tag[0]
	var attrs = tag[1]
	var children = tag[2]
	var xml = indent + "<" + name + stringifyAttributes(attrs)
	var endTag = "</" + name + ">"

	switch (typeOf(children)) {
		case "undefined":
		case "null": return xml + " />"
		case "boolean":
		case "number": return xml + ">" + children + endTag
		case "string":
			if (children == "") return xml + " />"
			else return xml + ">" + escape(children) + endTag

		case "array":
			if (children.length == 0) return xml + " />"
			return xml += (
				">\n" +
				children.map(stringifyTag.bind(null, TAB + indent)).join(NL) +
				"\n" + indent + endTag
			)

		default: throw new TypeError("Invalid child for: " + name)
	}
}

function stringifyAttributes(attrs) {
	return attrs.reduce(function(markup, nameAndValue) {
		var name = nameAndValue[0]
		var value = nameAndValue[1]

		switch (typeOf(value)) {
			case "undefined":
			case "null": return markup
			case "boolean": return value ? markup + " " + kv(name, value) : markup
			case "number": return markup + " " + kv(name, value)
			case "string": return markup + " " + kv(name, escapeAttr(value))
			default: throw new TypeError("Invalid attribute: " + name + "=" + value)
		}
	}, "")
}

function searchForAliases(unseen, tag) {
	if (unseen.length == 0) return unseen

	unseen = _.difference(unseen, concat(
		getNamespace(tag[0]) || "",
		tag[1].map(_.first).map(getNamespace).filter(Boolean)
	))

	var children = tag[2]
	if (isArray(children)) unseen = children.reduce(searchForAliases, unseen)
	else if (isElement(children)) unseen = searchForAliases(unseen, tag)
	return unseen
}

function escape(text) {
	// https://www.w3.org/TR/REC-xml/#NT-CharData
	// https://www.w3.org/TR/REC-xml/#sec-line-ends
	text = text.replace(/&/g, "&amp;")
	text = text.replace(/</g, "&lt;")
	text = text.replace(/>/g, "&gt;")
	text = text.replace(/\r/g, "&#xD;")
	return text
}

function escapeAttr(text) {
	// https://www.w3.org/TR/REC-xml/#NT-AttValue
	// https://www.w3.org/TR/REC-xml/#AVNormalize
	text = text.replace(/&/g, "&amp;")
	text = text.replace(/</g, "&lt;")
	text = text.replace(/"/g, "&quot;")
	text = text.replace(/\t/g, "&#x9;")
	text = text.replace(/\n/g, "&#xA;")
	text = text.replace(/\r/g, "&#xD;")
	return text
}

function typeOf(value) {
	return value === null ? "null" : isArray(value) ? "array" : typeof value
}

function isElement(obj, key) {
	return key != TEXT && obj !== null && typeof obj == "object"
}

function getNamespace(name) {
	var index = name.indexOf(":")
	return index == -1 ? null : name.slice(0, index)
}

function xmlnsify(name) { return name == "" ? "xmlns" : "xmlns:" + name }
function normalizeName(name) { return name.replace("$", ":") }
function kv(name, value) { return name + "=\"" + value + "\"" }
