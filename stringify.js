var _ = require("./lib")
var CLOSABLE = true
var NL = "\n"
var TAB = "\t"
var TEXT = "$"

// The namespaces argument takes an object from alias to namespace URI.
exports = module.exports = function(namespaces, obj) {
	var version = escapeAttr(obj.version || "1.0")
	var encoding = escapeAttr(obj.encoding || "UTF-8")

	var tagName = _.findKey(isElement, obj)
	var tag = serializeTag(tagName, obj[tagName])
	var attrs = tag[1]

	if (!_.isEmpty(namespaces)) {
		var aliases = _.keys(namespaces)
		var seen = _.difference(aliases, searchForAliases(aliases, tag))

		attrs = _.uniq(_.concat(
			seen.map(function(name) { return [xmlnsify(name), namespaces[name]] }),
			attrs
		), _.first)
	}

	return (
		"<?xml " + kv("version", version) + " " + kv("encoding", encoding) + " ?>" +
		NL +
		stringifyTag("", CLOSABLE, [tag[0], attrs, tag[2]])
	)
}

// Performs Exclusive XML Canonicalization, or what XML Digital Signatures call
// "http://www.w3.org/2001/10/xml-exc-c14n#".
exports.canonicalize = function(namespaces, obj, path) {
	if (path == null || path.length == 0) path = [_.findKey(isElement, obj)]

	var tagNameAndTag = follow(path, obj)
	var tagName = tagNameAndTag[0]
	obj = tagNameAndTag[1]

	var tag = canonicalizeTag(namespaces, [], serializeTag(tagName, obj))
	var indent = _.repeat(_.count(_.isString, path) - 1, "\t").join("")
	return stringifyTag(indent, !CLOSABLE, tag).replace(/^\s+/, "")
}

function serializeTag(tagName, obj) {
	var attrs = []
	var children = []
	var text = obj[TEXT]

	_.each(obj, function(value, name) {
		if (name == TEXT);
		else if (_.isArray(value)) children.push([normalizeName(name), value])
		else if (isElement(value, name)) children.push([normalizeName(name), value])
		else attrs.push([normalizeName(name), value])
	})

	if (children.length > 0 && text != null)
		throw new Error("Both child elements and text in " + tagName)

	children = _.flatten(children.map(function(tagNameAndObj) {
		var tagName = tagNameAndObj[0]
		var obj = tagNameAndObj[1]
		if (_.isArray(obj)) return obj.map(serializeTag.bind(null, tagName))
		else return [serializeTag(tagName, obj)]
	}))

	return [normalizeName(tagName), attrs, text != null ? text : children]
}

function canonicalizeTag(namespaces, scope, tag) {
	var attrs = tag[1]
	var children = tag[2]
	var added = _.difference(getNamespaces(tag), scope)
	scope = _.concat(scope, added)

	attrs = _.concat(
		added.map(function(name) { return [xmlnsify(name), namespaces[name]] }),
		attrs
	)

	return [
		tag[0],
		_.sort(compareAttributeForC14n.bind(null, namespaces), attrs),

		// All element children are in an array. The rest are textual children.
		_.isArray(children)
			? children.map(canonicalizeTag.bind(null, namespaces, scope))
			: children
	]
}

function stringifyTag(indent, closable, tag) {
	var name = tag[0]
	var attrs = tag[1]
	var children = tag[2]
	var xml = indent + "<" + name + stringifyAttributes(attrs)
	var endTag = "</" + name + ">"

	switch (typeOf(children)) {
		case "undefined":
		case "null": return xml + (closable ? " />" : ">" + endTag)
		case "boolean":
		case "number": return xml + ">" + children + endTag
		case "string":
			if (children == "") return xml + (closable ? " />" : ">" + endTag)
			else return xml + ">" + escape(children) + endTag

		case "array":
			if (children.length == 0) return xml + (closable ? " />" : ">" + endTag)
			return xml += (
				">\n" +
				children.map(stringifyTag.bind(null, TAB + indent, closable)).join(NL) +
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

	unseen = _.difference(unseen, getNamespaces(tag))
	var children = tag[2]
	if (_.isArray(children)) unseen = children.reduce(searchForAliases, unseen)
	else if (isElement(children)) unseen = searchForAliases(unseen, children)
	return unseen
}

function getNamespaces(tag) {
	return _.uniq(_.concat(
		getNamespace(tag[0]) || "",
		tag[1].map(_.first).map(getNamespace).filter(Boolean)
	))
}

function getNamespace(name) {
	var index = name.indexOf(":")
	return index == -1 ? null : name.slice(0, index)
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

function compareAttributeForC14n(namespaces, a, b) {
	var aName = a[0]
	var bName = b[0]
	if (aName == "xmlns" || bName == "xmlns") return aName == "xmlns" ? -1 : 1

	var aNamespace = getNamespace(aName) || ""
	var bNamespace = getNamespace(bName) || ""
	var aNamespaceUri = namespaces[aNamespace] || ""
	var bNamespaceUri = namespaces[bNamespace] || ""

	return (
		aNamespace == "xmlns" && bNamespace == "xmlns" ? cmp(a[0], b[0]) :
		aNamespace == "xmlns" ? -1 :
		bNamespace == "xmlns" ? 1 :
		cmp(aNamespaceUri, bNamespaceUri) || cmp(a[0], b[0])
	)
}

function follow(path, obj) {
	obj = path.reduce(function(obj, step) { return obj[step] }, obj)
	return [_.findLast(_.isString, path), obj]
}

function typeOf(value) {
	return value === null ? "null" : _.isArray(value) ? "array" : typeof value
}

function isElement(obj, key) {
	return key != TEXT && obj !== null && typeof obj == "object"
}

function xmlnsify(name) { return name == "" ? "xmlns" : "xmlns:" + name }
function normalizeName(name) { return name.replace("$", ":") }
function kv(name, value) { return name + "=\"" + value + "\"" }
function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0 }
