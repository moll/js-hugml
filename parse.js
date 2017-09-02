var SaxParser = require("sax").SAXParser
var last = require("./lib").last
var reduce = require("./lib").reduce
var isArray = Array.isArray
var hasDefaultNamespace = require("./lib").contains.bind(null, "")
var STRICT = true
var EMPTY = Object.create(null)
var VERSION = /\bversion=["']([^"']+)["']/
var ENCODING = /\bencoding=["']([^"']+)["']/
var TEXT_ATTR = "$"
var NAMESPACE_SEP = "$"
module.exports = parse

function parse(namespaces, xml) {
	return new Parser(namespaces).parse(xml)
}

function Parser(namespaces) {
	SaxParser.call(this, STRICT, {trim: true, xmlns: true, position: false})

	this.namespaces = namespaces || EMPTY
	this.unscoped = hasDefaultNamespace(this.namespaces)
	this.stack = [{}]
}

Parser.prototype = Object.create(SaxParser.prototype, {
	constructor: {value: Parser, configurable: true, writeable: true}
})

Parser.prototype.parse = function(xml) {
	this.write(xml)
	this.close()
	return this.stack[0]
}

Parser.prototype.name = function(tag) {
	var alias = this.namespaces[tag.uri]
	if (alias === "") return tag.local
	if (alias != null) return alias + NAMESPACE_SEP + tag.local

	// Alternative default namespace would be the "xml" namespace.
	if (tag.prefix === "" && this.unscoped) return NAMESPACE_SEP + tag.name
	return tag.name
}

Parser.prototype.onprocessinginstruction = function(xml) {
	var version = VERSION.exec(xml.body)
	var encoding = ENCODING.exec(xml.body)
	if (version) this.stack[0].version = version[1]
	if (encoding) this.stack[0].encoding = encoding[1]
}

Parser.prototype.onopentag = function(tag) {
	var name = this.name(tag)
	var attrs = reduce(function(attrs, attr, name) {
		attrs[name] = attr.value
		return attrs
	}, {}, tag.attributes)

	var parent = last(this.stack)
	if (name in parent && isArray(parent[name])) parent[name].push(attrs)
	else if (name in parent) parent[name] = [parent[name], attrs]
	else parent[name] = attrs

	this.stack.push(attrs)
}

Parser.prototype.ontext = function(text) {
	last(this.stack)[TEXT_ATTR] = text
}

Parser.prototype.onclosetag = function(_tag) {
	this.stack.pop()
}

Parser.prototype.onerror = function(err) {
	throw err
}
