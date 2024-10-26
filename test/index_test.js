var _ = require("../lib")
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

		it("must parse XML with character data", function() {
			var obj = new Hugml().parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<summary type="html"><![CDATA[Hello, world!]]></summary>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",
				summary: {type: "html", $: "Hello, world!"}
			})
		})

		it("must parse XML with split character data", function() {
			var obj = new Hugml().parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<summary type="html">
					<![CDATA[Hello, ]]><![CDATA[world!]]>
				</summary>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",
				summary: {type: "html", $: "Hello, world!"}
			})
		})

		it("must parse XML with empty character data", function() {
			var obj = new Hugml().parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<summary type="html"><![CDATA[]]></summary>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",
				summary: {type: "html"}
			})
		})

		// NOTE: It's unclear whether the space after "," is supposed to be dropped
		// or not...
		it("must parse XML with mixed character data and text", function() {
			var obj = new Hugml().parse(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<summary type="html">
					<![CDATA[Hello]]>, <![CDATA[world!]]>
				</summary>
			`)

			obj.must.eql({
				version: "1.0",
				encoding: "UTF-8",
				summary: {type: "html", $: "Hello,world!"}
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
		it("must stringify with version 1.0 by default", function() {
			var xml = new Hugml().stringify({
				encoding: "UTF-8",
				person: {}
			})

			xml.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<person />
			`)
		})

		it("must stringify with given version", function() {
			var xml = new Hugml().stringify({
				version: "1.1",
				person: {}
			})

			xml.must.eql(outdent`
				<?xml version="1.1" encoding="UTF-8" ?>
				<person />
			`)
		})

		it("must stringify with UTF-8 by default", function() {
			var xml = new Hugml().stringify({
				version: "1.0",
				person: {}
			})

			xml.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<person />
			`)
		})

		it("must stringify with given encoding by default", function() {
			var xml = new Hugml().stringify({
				encoding: "utf-9",
				person: {}
			})

			xml.must.eql(outdent`
				<?xml version="1.0" encoding="utf-9" ?>
				<person />
			`)
		})

		describe("given a tag", function() {
			it("must stringify empty tag", function() {
				var xml = new Hugml().stringify({person: {}})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person />
				`)
			})

			it("must render tag with undefined text", function() {
				var xml = new Hugml().stringify({person: {$: undefined}})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person />
				`)
			})

			it("must render tag with null text", function() {
				var xml = new Hugml().stringify({person: {$: null}})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person />
				`)
			})

			it("must render tag with boolean text of false", function() {
				var xml = new Hugml().stringify({person: {$: false}})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person>false</person>
				`)
			})

			it("must render tag with boolean text of true", function() {
				var xml = new Hugml().stringify({person: {$: true}})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person>true</person>
				`)
			})

			it("must render tag with number text", function() {
				var xml = new Hugml().stringify({
					person: {$: 42}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person>42</person>
				`)
			})

			it("must render tag with empty string text", function() {
				var xml = new Hugml().stringify({person: {$: ""}})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person />
				`)
			})

			it("must render tag with string text", function() {
				var xml = new Hugml().stringify({person: {$: "John"}})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person>John</person>
				`)
			})

			// These escapes also match the canonicalization model.
			// https://www.w3.org/TR/xml-c14n/#ProcessingModel
			_.each({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				"\r": "&#xD;"
			}, function(to, from) {
				it("must escape " + JSON.stringify(from) + " in string text",
					function() {
					var xml = new Hugml().stringify({person: {$: `John ${from} Doe`}})

					xml.must.eql(outdent`
						<?xml version="1.0" encoding="UTF-8" ?>
						<person>John ${to} Doe</person>
					`)
				})
			})

			_.each({
				"double quotes": "John \"Doe\" Smith",
				"single quotes": "John's Car",
				"tabs": "John\tSmith",
				"newlines": "John\nSmith"
			}, function(value, title) {
				it(`must not escape ${title} in string text`, function() {
					var xml = new Hugml().stringify({
						person: {$: value}
					})

					xml.must.eql(outdent`
						<?xml version="1.0" encoding="UTF-8" ?>
						<person>${value}</person>
					`)
				})
			})
		})

		describe("given a tag and attributes", function() {
			it("must render tag with undefined attribute", function() {
				var xml = new Hugml().stringify({person: {name: undefined}})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person />
				`)
			})

			it("must render tag with null attribute", function() {
				var xml = new Hugml().stringify({person: {name: null}})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person />
				`)
			})

			it("must render tag with boolean attribute of true", function() {
				var xml = new Hugml().stringify({person: {name: true}})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person name="true" />
				`)
			})

			it("must render tag with boolean attribute of false", function() {
				var xml = new Hugml().stringify({person: {name: false}})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person />
				`)
			})

			it("must render tag with number attribute", function() {
				var xml = new Hugml().stringify({person: {name: 42}})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person name="42" />
				`)
			})

			it("must render tag with string attribute", function() {
				var xml = new Hugml().stringify({person: {name: "John"}})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person name="John" />
				`)
			})

			it("must render tag with attributes", function() {
				var xml = new Hugml().stringify({person: {name: "John", age: 13}})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person name="John" age="13" />
				`)
			})

			// These escapes also match the canonicalization model.
			// https://www.w3.org/TR/xml-c14n/#ProcessingModel
			_.each({
				"&": "&amp;",
				"<": "&lt;",
				"\"": "&quot;",
				"\t": "&#x9;",
				"\n": "&#xA;",
				"\r": "&#xD;"
			}, function(to, from) {
				it("must escape " + JSON.stringify(from) + " in attributes",
					function() {
					var xml = new Hugml().stringify({person: {name: `John ${from} Doe`}})

					xml.must.eql(outdent`
						<?xml version="1.0" encoding="UTF-8" ?>
						<person name="John ${to} Doe" />
					`)
				})
			})

			_.each({
				"single quotes": "John's Car",
				"greater-than": "John > Car"
			}, function(value, title) {
				it(`must not escape ${title} in attribute`, function() {
					var xml = new Hugml().stringify({person: {name: value}})

					xml.must.eql(outdent`
						<?xml version="1.0" encoding="UTF-8" ?>
						<person name="${value}" />
					`)
				})
			})
		})

		describe("given a tag with children", function() {
			it("must stringify XML with children", function() {
				var xml = new Hugml().stringify({
					person: {
						sex: "male",
						name: {$: "John"},
						age: {$: "13"},
					}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person sex="male">
						<name>John</name>
						<age>13</age>
					</person>
				`)
			})

			it("must stringify XML with grandchildren", function() {
				var xml = new Hugml().stringify({
					person: {
						sex: "male",
						name: {$: "John"},
						age: {$: "13"},
						children: {child: [
							{name: {$: "Alice"}, sex: "female"},
							{name: {$: "Bob"}, sex: "male"}
						]}
					}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<person sex="male">
						<name>John</name>
						<age>13</age>
						<children>
							<child sex="female">
								<name>Alice</name>
							</child>
							<child sex="male">
								<name>Bob</name>
							</child>
						</children>
					</person>
				`)
			})

			it("must not indent multiline text", function() {
				var xml = new Hugml().stringify({
					story: {prologue: {$: "- One\n- Two\n- Three"}}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<story>
						<prologue>- One
					- Two
					- Three</prologue>
					</story>
				`)
			})
		})

		describe("given a tag with namespaces", function() {
			it("must stringify XML given inline default namespace", function() {
				var xml = new Hugml().stringify({
					multistatus: {
						xmlns: "DAV:",

						response: {
							xmlns$calsrv: "http://calendarserver.org/ns/",
							calsrv$getctag: {"$": "42"}
						}
					}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<multistatus xmlns="DAV:">
						<response xmlns:calsrv="http://calendarserver.org/ns/">
							<calsrv:getctag>42</calsrv:getctag>
						</response>
					</multistatus>
				`)
			})

			it("must stringify XML given inline namespace", function() {
				var xml = new Hugml().stringify({
					dav$multistatus: {
						xmlns$dav: "DAV:",

						dav$response: {
							xmlns$calsrv: "http://calendarserver.org/ns/",
							calsrv$getctag: {"$": "42"}
						}
					}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<dav:multistatus xmlns:dav="DAV:">
						<dav:response xmlns:calsrv="http://calendarserver.org/ns/">
							<calsrv:getctag>42</calsrv:getctag>
						</dav:response>
					</dav:multistatus>
				`)
			})

			it("must stringify XML given configured default namespace",
				function() {
				var hugml = new Hugml({"DAV:": ""})

				var xml = hugml.stringify({
					propfind: {prop: {"current-user-principal": {}}}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<propfind xmlns="DAV:">
						<prop>
							<current-user-principal />
						</prop>
					</propfind>
				`)
			})

			it("must stringify XML given configured default namespace and duplicate declaration", function() {
				var hugml = new Hugml({"DAV:": ""})

				var xml = hugml.stringify({
					propfind: {
						xmlns: "DAV:",
						prop: {"current-user-principal": {}}
					}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<propfind xmlns="DAV:">
						<prop>
							<current-user-principal />
						</prop>
					</propfind>
				`)
			})

			it("must stringify XML given configured default namespace and argument",
				function() {
				var hugml = new Hugml({"DAV:": ""})

				var xml = hugml.stringify({
					propfind: {foo: "bar", prop: {"current-user-principal": {}}}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<propfind xmlns="DAV:" foo="bar">
						<prop>
							<current-user-principal />
						</prop>
					</propfind>
				`)
			})

			it("must stringify XML given configured default namespace and rename",
				function() {
				var hugml = new Hugml({"DAV:": "", "": "xml"})

				var xml = hugml.stringify({
					propfind: {prop: {"xml$unknown": {}}}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<propfind xmlns="DAV:" xmlns:xml="">
						<prop>
							<xml:unknown />
						</prop>
					</propfind>
				`)
			})

			it("must stringify XML given configured namespace", function() {
				var hugml = new Hugml({"DAV:": "dav"})

				var xml = hugml.stringify({
					dav$propfind: {dav$prop: {"dav$current-user-principal": {}}}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<dav:propfind xmlns:dav="DAV:">
						<dav:prop>
							<dav:current-user-principal />
						</dav:prop>
					</dav:propfind>
				`)
			})

			it("must stringify XML given configured namespace and duplicate declaration", function() {
				var hugml = new Hugml({"DAV:": "dav"})

				var xml = hugml.stringify({
					dav$propfind: {
						"xmlns:dav": "DAV:",
						dav$prop: {"dav$current-user-principal": {}}
					}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<dav:propfind xmlns:dav="DAV:">
						<dav:prop>
							<dav:current-user-principal />
						</dav:prop>
					</dav:propfind>
				`)
			})

			it("must stringify XML given configured namespace and plain attribute",
				function() {
				var hugml = new Hugml({"DAV:": "dav"})

				var xml = hugml.stringify({
					dav$propfind: {
						foo: "bar",
						dav$prop: {"dav$current-user-principal": {}}
					}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<dav:propfind xmlns:dav="DAV:" foo="bar">
						<dav:prop>
							<dav:current-user-principal />
						</dav:prop>
					</dav:propfind>
				`)
			})

			it("must stringify XML given configured namespaced attribute",
				function() {
				var hugml = new Hugml({[MANIFEST_URN]: "m"})

				var xml = hugml.stringify({
					m$manifest: {"m$file-entry": {"m$full-path": "/"}}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<m:manifest xmlns:m="${MANIFEST_URN}">
						<m:file-entry m:full-path="/" />
					</m:manifest>
				`)
			})

			it("must not stringify XML configured default namespace if not used",
				function() {
				var hugml = new Hugml({
					"urn:mammals": "",
					"urn:humans": "humans"
				})

				var xml = hugml.stringify({
					humans$person: {sex: "male", humans$name: {$: "John"}}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<humans:person xmlns:humans="urn:humans" sex="male">
						<humans:name>John</humans:name>
					</humans:person>
				`)
			})

			it("must stringify XML with only used namespaces", function() {
				var hugml = new Hugml({
					"urn:mammals": "mammals",
					"urn:humans": "humans",
					"urn:birds": "birds"
				})

				var xml = hugml.stringify({
					mammals$population: {
						humans$person: {sex: "male", humans$name: {$: "John"}}
					}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<mammals:population xmlns:mammals="urn:mammals" xmlns:humans="urn:humans">
						<humans:person sex="male">
							<humans:name>John</humans:name>
						</humans:person>
					</mammals:population>
				`)
			})

			it("must stringify XML with only used namespaced attributes", function() {
				var hugml = new Hugml({
					"urn:mammals": "mammals",
					"urn:humans": "humans",
					"urn:birds": "birds"
				})

				var xml = hugml.stringify({
					population: {
						person: {
							humans$sex: "male", name: {$: "John"},
							peacocking: {birds$plumage: "dotted"}
						}
					}
				})

				xml.must.eql(outdent`
					<?xml version="1.0" encoding="UTF-8" ?>
					<population xmlns:humans="urn:humans" xmlns:birds="urn:birds">
						<person humans:sex="male">
							<name>John</name>
							<peacocking birds:plumage="dotted" />
						</person>
					</population>
				`)
			})
		})

		// https://github.com/oozcitak/xmlbuilder-js/issues/147
		it("must stringify emoji text", function() {
			var xml = new Hugml().stringify({emoji: {$: "💩"}})

			xml.must.eql(outdent`
				<?xml version="1.0" encoding="UTF-8" ?>
				<emoji>💩</emoji>
			`)
		})
	})

	describe(".prototype.canonicalize", function() {
		it("must stringify XML without XML declaration", function() {
			var xml = new Hugml().canonicalize({
				person: {
					sex: "male",
					name: {$: "John"},
					age: {$: "13"},
				}
			})

			xml.must.eql(outdent`
				<person sex="male">
					<name>John</name>
					<age>13</age>
				</person>
			`)
		})

		it("must render empty tag", function() {
			var xml = new Hugml().canonicalize({person: {}})
			xml.must.eql("<person></person>")
		})

		it("must render tag with undefined text", function() {
			var xml = new Hugml().canonicalize({person: {$: undefined}})
			xml.must.eql("<person></person>")
		})

		it("must render tag with null text", function() {
			var xml = new Hugml().canonicalize({person: {$: null}})
			xml.must.eql("<person></person>")
		})

		it("must render tag with empty string text", function() {
			var xml = new Hugml().canonicalize({person: {$: ""}})
			xml.must.eql("<person></person>")
		})

		// NOTE: Leave attributes empty intentionally to catch accidental
		// comparisons on values.
		it("must sort attributes alphabetically on the root element", function() {
			var xml = new Hugml().canonicalize({
				root: {y: "", x: ""}
			})

			xml.must.eql(`<root x="" y=""></root>`)
		})

		it("must sort attributes alphabetically on the child element", function() {
			var xml = new Hugml().canonicalize({
				root: {
					child: {y: "", x: ""}
				}
			})

			xml.must.eql(outdent`
				<root>
					<child x="" y=""></child>
				</root>
			`)
		})

		it("must sort namespaces and their attributes on the root element",
			function() {
			var hugml = new Hugml({
				"urn:z": "a",
				"urn:y": "b",
				"urn:x": ""
			})

			var xml = hugml.canonicalize({
				root: {
					b$y: "",
					b$x: "",
					a$x: "",
					x: "",
					y: ""
				}
			})

			xml.must.eql(outdent`
				<root xmlns="urn:x" xmlns:a="urn:z" xmlns:b="urn:y" x="" y="" b:x="" b:y="" a:x=""></root>
			`)
		})

		it("must sort namespaces and their attributes on the child element",
			function() {
			var hugml = new Hugml({
				"urn:z": "a",
				"urn:y": "b",
				"urn:x": ""
			})

			var xml = hugml.canonicalize({
				root: {
					child: {
						b$y: "",
						b$x: "",
						a$x: "",
						x: "",
						y: ""
					}
				}
			})

			xml.must.eql(outdent`
				<root xmlns="urn:x">
					<child xmlns:a="urn:z" xmlns:b="urn:y" x="" y="" b:x="" b:y="" a:x=""></child>
				</root>
			`)
		})

		it("must define namespaces only when first used", function() {
			var hugml = new Hugml({
				"urn:mammals": "mammals",
				"urn:humans": "humans",
				"urn:birds": "birds"
			})

			var xml = hugml.canonicalize({
				population: {
					humans$person: {
						humans$name: {$: "John"},
						humans$age: {$: 13},
						mammals$peacocking: {birds$plumage: "dotted"},
						birds$flight: {$: "none"}
					}
				}
			})

			xml.must.eql(outdent`
				<population>
					<humans:person xmlns:humans="urn:humans">
						<humans:name>John</humans:name>
						<humans:age>13</humans:age>
						<mammals:peacocking xmlns:birds="urn:birds" xmlns:mammals="urn:mammals" birds:plumage="dotted"></mammals:peacocking>
						<birds:flight xmlns:birds="urn:birds">none</birds:flight>
					</humans:person>
				</population>
			`)
		})

		it("must canonicalize given path to node", function() {
			var xml = new Hugml().canonicalize({
				population: {
					person: {
						name: {$: "John"},
						age: {$: 13}
					}
				}
			}, ["population", "person"])

			xml.must.eql(outdent`
				<person>
						<name>John</name>
						<age>13</age>
					</person>
			`)
		})

		it("must canonicalize given path to second node", function() {
			var xml = new Hugml().canonicalize({
				population: {
					person: [{
						name: {$: "John"},
						age: {$: 13}
					}, {
						name: {$: "Mike"},
						age: {$: 42}
					}]
				}
			}, ["population", "person", 1])

			xml.must.eql(outdent`
				<person>
						<name>Mike</name>
						<age>42</age>
					</person>
			`)
		})

		it("must canonicalize given path to node with namespaces", function() {
			var hugml = new Hugml({
				"urn:mammals": "mammals",
				"urn:humans": "humans"
			})

			var xml = hugml.canonicalize({
				population: {
					humans$person: {
						humans$name: {$: "John"},
						humans$age: {$: 13}
					}
				}
			}, ["population", "humans$person"])

			xml.must.eql(outdent`
				<humans:person xmlns:humans="urn:humans">
						<humans:name>John</humans:name>
						<humans:age>13</humans:age>
					</humans:person>
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

	describe(".canonicalize", function() {
		it("must canonicalize XML", function() {
			var obj = Hugml.canonicalize({
				person: {
					sex: "male",
					name: {$: "John"},
					age: {$: "13"},
				}
			})

			obj.must.eql(outdent`
				<person sex="male">
					<name>John</name>
					<age>13</age>
				</person>
			`)
		})
	})
})
