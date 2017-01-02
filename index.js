var O = require("oolong")
var parse = require("./parse")
var stringify = require("./stringify")
var invert = require("./lib").invert
module.exports = Hugml

function Hugml(namespaces) {
	if (namespaces) {
		this.namespaces = O.create(this.namespaces, namespaces)
		this.aliases = invert(this.namespaces)
	}
}

Hugml.prototype.namespaces = null
Hugml.prototype.aliases = null

Hugml.prototype.parse = function(xml) {
	return parse(this.namespaces, xml)
}

Hugml.prototype.stringify = function(obj) {
	return stringify(this.aliases, obj)
}

Hugml.parse = Hugml.prototype.parse.bind(Hugml.prototype)
Hugml.stringify = Hugml.prototype.stringify.bind(Hugml.prototype)
