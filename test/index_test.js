var Hugml = require("..")
var outdent = require("./outdent")
var MANIFEST_URN = "urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"

describe("Hugml", function() {
	describe(".prototype.parse", function() {
		it("must parse XML", function() {
			var obj = new Hugml().parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<person sex="male">
					<name>John</name>
					<age>13</age>
				</person>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",

				person: {
					sex: "male",
					name: {$: "John"},
					age: {$: "13"},
				}
			})
		})

		it("must parse XML with repeating tags", function() {
			var obj = new Hugml().parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>

				<people>
					<person sex="male">
						<name>John</name>
						<age>13</age>
					</person>

					<person sex="female">
						<name>Mary</name>
						<age>42</age>
					</person>
				</people>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",

				people: {
					person: [{
						sex: "male",
						name: {$: "John"},
						age: {$: "13"},
					}, {
						sex: "female",
						name: {$: "Mary"},
						age: {$: "42"},
					}]
				}
			})
		})

		it("must parse XML when attribute and tag collides", function() {
			var obj = new Hugml().parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<html>
					<head title="Collides with title tag">
						<title>Page</title>
					</head>
				</html>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",

				html: {
					head: {
						title: {$: "Page"}
					}
				}
			})
		})

		it("must parse self-closed tags with no attributes", function() {
			var obj = new Hugml().parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<person />
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",
				person: {}
			})
		})

		it("must parse XML with namespace", function() {
			var obj = new Hugml().parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<dav:propfind xmlns:dav="DAV:">
					<dav:prop>
						<dav:current-user-principal />
					</dav:prop>
				</dav:propfind>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",

				"dav:propfind": {
					"xmlns:dav": "DAV:",
					"dav:prop": {"dav:current-user-principal": {}}
				}
			})
		})

		it("must parse XML with namespaced attribute", function() {
			var obj = new Hugml().parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<manifest:manifest xmlns:manifest="${MANIFEST_URN}">
					<manifest:file-entry manifest:full-path="/" />
				</manifest:manifest>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",

				"manifest:manifest": {
					"xmlns:manifest": MANIFEST_URN,
					"manifest:file-entry": {"manifest:full-path": "/"}
				}
			})
		})

		it("must parse XML given renamed namespace", function() {
			var hugml = new Hugml({"DAV:": "dav"})

			var obj = hugml.parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<propfind xmlns="DAV:">
					<prop>
						<current-user-principal />
					</prop>
				</propfind>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",

				dav$propfind: {
					xmlns: "DAV:",
					dav$prop: {"dav$current-user-principal": {}}
				}
			})
		})

		it("must parse XML given renamed namespaced attribute", function() {
			var hugml = new Hugml({[MANIFEST_URN]: "m"})

			var obj = hugml.parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<manifest:manifest xmlns:manifest="${MANIFEST_URN}">
					<manifest:file-entry manifest:full-path="/" />
				</manifest:manifest>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",
				m$manifest: {
					"xmlns:manifest": MANIFEST_URN,
					"m$file-entry": {"m$full-path": "/"}
				}
			})
		})

		it("must parse XML given renamed namespace and collision", function() {
			var hugml = new Hugml({"urn:ietf:params:xml:ns:caldav": "c"})

			var obj = hugml.parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>

				<multistatus
					xmlns="DAV:"
					xmlns:c="http://calendarserver.org/ns/"
					xmlns:caldav="urn:ietf:params:xml:ns:caldav">

					<response>
						<c:getctag>42</c:getctag>

						<caldav:supported-calendar-component-set>
							<caldav:comp name="VEVENT" />
						</caldav:supported-calendar-component-set>
					</response>
				</multistatus>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",

				multistatus: {
					xmlns: "DAV:",
					"xmlns:c": "http://calendarserver.org/ns/",
					"xmlns:caldav": "urn:ietf:params:xml:ns:caldav",

					response: {
						"c:getctag": {"$": "42"},

						"c$supported-calendar-component-set": {
							c$comp: {name: "VEVENT"}
						}
					}
				}
			})
		})

		it("must parse XML given default namespace", function() {
			var hugml = new Hugml({"DAV:": ""})

			var obj = hugml.parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<dav:propfind xmlns:dav="DAV:">
					<dav:prop>
						<dav:current-user-principal />
						<unknown />
					</dav:prop>
				</dav:propfind>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",

				propfind: {
					"xmlns:dav": "DAV:",
					prop: {"current-user-principal": {}, ":unknown": {}}
				}
			})
		})

		it("must parse XML given renamed default namespace", function() {
			var hugml = new Hugml({"DAV:": "", "": "xml"})

			var obj = hugml.parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<dav:propfind xmlns:dav="DAV:">
					<dav:prop>
						<unknown />
					</dav:prop>
				</dav:propfind>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",

				propfind: {
					"xmlns:dav": "DAV:",
					prop: {"xml$unknown": {}}
				}
			})
		})

		it("must parse XML given renamed default namespaced attribute", function() {
			var hugml = new Hugml({[MANIFEST_URN]: "", "": "xml"})

			var obj = hugml.parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<manifest:manifest xmlns:manifest="${MANIFEST_URN}">
					<manifest:file-entry manifest:full-path="/" />
					<unknown full-path="foo" />
				</manifest:manifest>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",

				manifest: {
					"xmlns:manifest": MANIFEST_URN,
					"file-entry": {"full-path": "/"},
					xml$unknown: {"full-path": "foo"}
				}
			})
		})

		it("must parse XML given renamed default namespace and explicit xmlns",
			function() {
			var hugml = new Hugml({"DAV:": "", "": "xml"})

			var obj = hugml.parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<dav:propfind xmlns:dav="DAV:">
					<dav:prop>
						<unknown xmlns="" />
					</dav:prop>
				</dav:propfind>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",

				propfind: {
					"xmlns:dav": "DAV:",
					prop: {"xml$unknown": {xmlns: ""}}
				}
			})
		})

		it("must parse XML when attribute and tag collides but tag namespaced",
			function() {
			var obj = new Hugml({"": "h"}).parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<html>
					<head title="Collides with title tag">
						<title>Page</title>
					</head>
				</html>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",

				h$html: {
					h$head: {
						title: "Collides with title tag",
						h$title: {$: "Page"}
					}
				}
			})
		})

		it("must parse XML without encoding instruction", function() {
			var obj = new Hugml().parse(outdent`
				<?xml version="1.0" ?>
				<person sex="male">
					<name>John</name>
					<age>13</age>
				</person>
			`)

			obj.must.eql({
				version: "1.0",

				person: {
					sex: "male",
					name: {$: "John"},
					age: {$: "13"},
				}
			})
		})

		// https://github.com/oozcitak/xmlbuilder-js/issues/147
		it("must parse XML with emoji", function() {
			var obj = new Hugml().parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<emoji>💩</emoji>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",
				emoji: {$: "💩"}
			})
		})

		it("must throw error given unbound namespace", function() {
			var xml = outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<dav:propfind />
			`

			var err
			try { new Hugml().parse(xml) } catch (ex) { err = ex }
			err.must.be.an.error(/unbound/i)
		})

		it("must continue parsing after error", function() {
			var hugml = new Hugml
			var err
			try { hugml.parse("<dav:propfind />") } catch (ex) { err = ex }
			err.must.be.an.error()

			var obj = hugml.parse(`<person sex="male"><name>John</name></person>`)
			obj.must.eql({person: {sex: "male", name: {$: "John"}}})
		})
	})

	describe(".prototype.stringify", function() {
		it("must stringify XML", function() {
			var obj = new Hugml().stringify({
				version: "1.0",
				encoding: "UTF-8",

				person: {
					sex: "male",
					name: {$: "John"},
					age: {$: "13"},
				}
			})

			obj.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<person sex="male">
					<name>John</name>
					<age>13</age>
				</person>
			`)
		})

		it("must stringify XML with repeating tags", function() {
			var obj = new Hugml().stringify({
				version: "1.0",
				encoding: "UTF-8",

				people: {
					person: [{
						sex: "male",
						name: {$: "John"},
						age: {$: "13"},
					}, {
						sex: "female",
						name: {$: "Mary"},
						age: {$: "42"},
					}]
				}
			})

			obj.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<people>
					<person sex="male">
						<name>John</name>
						<age>13</age>
					</person>
					<person sex="female">
						<name>Mary</name>
						<age>42</age>
					</person>
				</people>
			`)
		})

		it("must stringify self-closed tags with no attributes", function() {
			var obj = new Hugml().stringify({
				version: "1.0",
				encoding: "UTF-8",
				person: {}
			})

			obj.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<person />
			`)
		})

		it("must stringify XML given inline namespace", function() {
			var obj = new Hugml().stringify({
				version: "1.0",
				encoding: "UTF-8",

				"dav:propfind": {
					"xmlns:dav": "DAV:",
					"dav:prop": {"dav:current-user-principal": {}}
				}
			})

			obj.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<dav:propfind xmlns:dav="DAV:">
					<dav:prop>
						<dav:current-user-principal />
					</dav:prop>
				</dav:propfind>
			`)
		})

		it("must stringify XML given namespace", function() {
			var hugml = new Hugml({"DAV:": "dav"})

			var obj = hugml.stringify({
				version: "1.0",
				encoding: "UTF-8",
				dav$propfind: {dav$prop: {"dav$current-user-principal": {}}}
			})

			obj.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<dav:propfind xmlns:dav="DAV:">
					<dav:prop>
						<dav:current-user-principal />
					</dav:prop>
				</dav:propfind>
			`)
		})

		it("must stringify XML given namespaced attribute", function() {
			var hugml = new Hugml({[MANIFEST_URN]: "m"})

			var obj = hugml.stringify({
				version: "1.0",
				encoding: "UTF-8",
				m$manifest: {"m$file-entry": {"m$full-path": "/"}}
			})

			obj.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<m:manifest xmlns:m="${MANIFEST_URN}">
					<m:file-entry m:full-path="/" />
				</m:manifest>
			`)
		})

		it("must stringify XML given default namespace", function() {
			var hugml = new Hugml({"DAV:": ""})

			var obj = hugml.stringify({
				version: "1.0",
				encoding: "UTF-8",
				propfind: {prop: {"current-user-principal": {}, ":unknown": {}}}
			})

			obj.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<propfind xmlns="DAV:">
					<prop>
						<current-user-principal />
						<unknown xmlns="" />
					</prop>
				</propfind>
			`)
		})

		it("must stringify XML given renamed default namespace", function() {
			var hugml = new Hugml({"DAV:": "", "": "xml"})

			var obj = hugml.stringify({
				version: "1.0",
				encoding: "UTF-8",
				propfind: {prop: {"xml$unknown": {}}}
			})

			obj.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<propfind xmlns="DAV:" xmlns:xml="">
					<prop>
						<xml:unknown />
					</prop>
				</propfind>
			`)
		})

		it("must stringify XML with only used namespaces", function() {
			var hugml = new Hugml({
				"DAV:": "",
				"urn:ietf:params:xml:ns:caldav": "caldav",
				"http://calendarserver.org/ns/": "calsrv",
			})

			var obj = hugml.stringify({
				version: "1.0",
				encoding: "UTF-8",

				multistatus: {
					response: {"calsrv$getctag": {"$": "42"}}
				}
			})

			obj.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<multistatus xmlns="DAV:" xmlns:calsrv="http://calendarserver.org/ns/">
					<response>
						<calsrv:getctag>42</calsrv:getctag>
					</response>
				</multistatus>
			`)
		})

		it("must stringify XML with only used attribute namespaces", function() {
			var hugml = new Hugml({
				"DAV:": "",
				"urn:ietf:params:xml:ns:caldav": "caldav",
				"http://calendarserver.org/ns/": "calsrv",
			})

			var obj = hugml.stringify({
				version: "1.0",
				encoding: "UTF-8",

				multistatus: {
					response: {"calsrv$getctag": "42"}
				}
			})

			obj.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<multistatus xmlns="DAV:" xmlns:calsrv="http://calendarserver.org/ns/">
					<response calsrv:getctag="42" />
				</multistatus>
			`)
		})

		it("must throw error given unknown namespace", function() {
			var hugml = new Hugml({"DAV:": "dav"})

			var err
			try {
				hugml.stringify({
					version: "1.0",
					encoding: "UTF-8",
					dav$propfind: {gol$prop: {}}
				})
			}
			catch (ex) { err = ex }
			err.must.be.an.error(/unknown namespace/i)
		})

		it("must stringify with version 1.0 by default", function() {
			var obj = new Hugml().stringify({
				encoding: "UTF-8",
				person: {sex: "male"}
			})

			obj.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<person sex="male" />
			`)
		})

		it("must stringify with UTF-8 by default", function() {
			var obj = new Hugml().stringify({
				version: "1.0",
				person: {sex: "male"}
			})

			obj.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<person sex="male" />
			`)
		})

		// https://github.com/oozcitak/xmlbuilder-js/issues/147
		it("must stringify emoji text", function() {
			var obj = new Hugml().stringify({
				version: "1.0",
				emoji: {$: "💩"}
			})

			obj.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<emoji>💩</emoji>
			`)
		})
	})

	describe(".parse", function() {
		it("must parse XML", function() {
			var obj = Hugml.parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<person sex="male">
					<name>John</name>
					<age>13</age>
				</person>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",

				person: {
					sex: "male",
					name: {$: "John"},
					age: {$: "13"},
				}
			})
		})

		it("must continue parsing after error", function() {
			var err
			try { Hugml.parse("<dav:propfind />") } catch (ex) { err = ex }
			err.must.be.an.error()

			var obj = Hugml.parse(`<person sex="male"><name>John</name></person>`)
			obj.must.eql({person: {sex: "male", name: {$: "John"}}})
		})
	})

	describe(".stringify", function() {
		it("must stringify XML", function() {
			var obj = Hugml.stringify({
				version: "1.0",
				encoding: "UTF-8",

				person: {
					sex: "male",
					name: {$: "John"},
					age: {$: "13"},
				}
			})

			obj.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<person sex="male">
					<name>John</name>
					<age>13</age>
				</person>
			`)
		})
	})
})
