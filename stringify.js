var O = require("oolong")
var beginXml = require("xmlbuilder").begin
var findKey = require("./lib").findKey
var isArray = Array.isArray
var TEXT = "$"

// The aliases argument takes an object from alias to namespace URI.
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

	var elAndUsedAliases = render(xml, tagName, tag)
	var el = elAndUsedAliases[0]

	if (namespaces) O.keys(elAndUsedAliases[1]).forEach(function(alias) {
		var uri = namespaces[alias]
		if (uri == null) throw new Error("Unknown namespace alias: " + alias)
		el.attribute(xmlnsify(alias), uri)
	})

	return el.end({pretty: true, indent: "\t", spacebeforeslash: " "})
}

function render(xml, tagName, tag) {
	var namespaceAndTagName = parseNamespace(tagName)
	var namespace = namespaceAndTagName[0]
	tagName = serializeNamespace(namespaceAndTagName)

	if (namespace == "") tag = O.create(tag, {xmlns: ""})
	var usedAliases = {}
	if (namespace != "") usedAliases[namespace || ""] = true

	var attrs = O.mapKeys(O.filter(tag, isAttribute), function(name) {
		var namespaceAndName = parseNamespace(name)
		if (namespaceAndName[0]) usedAliases[namespaceAndName[0]] = true
		return serializeNamespace(namespaceAndName)
	})

	var el = xml.element(tagName, attrs, tag.$)

	O.each(tag, function(obj, tagName) {
		if (isArray(obj)) obj.forEach(function(tag) {
			O.merge(usedAliases, render(el, tagName, tag)[1])
		})
		else if (isElement(obj, tagName))
			O.merge(usedAliases, render(el, tagName, obj)[1])
	})

	return [el, usedAliases]
}

function parseNamespace(name) {
	var pair = name.split(/[$:]/)
	return pair[1] == null ? [null, pair[0]] : pair
}

function serializeNamespace(namespaceAndName) {
	return namespaceAndName[0] ? namespaceAndName.join(":") : namespaceAndName[1]
}

function xmlnsify(name) { return name == "" ? "xmlns" : "xmlns:" + name }
function isAttribute(obj, key) { return key != TEXT && !isElement(obj, key) }
function isElement(obj, key) { return key != TEXT && typeof obj == "object" }
