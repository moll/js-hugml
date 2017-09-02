HugML.js
========
[![NPM version][npm-badge]](https://www.npmjs.com/package/hugml)

HugML.js is an XML parsing and serializing/stringifying library for JavaScript based on **[Google's GData][gdata]** and **[BadgerFish][badgerfish]** conversion conventions. It **supports namespaces** and **namespace aliasing** to make working with more complex XML convenient. The *ML* at the end of HugML stands for "Markup Language" — a markup language of angled hugs (`<<<>>>`). :)

[npm-badge]: https://img.shields.io/npm/v/hugml.svg
[gdata]: https://developers.google.com/gdata/docs/json?csw=1
[badgerfish]: http://badgerfish.ning.com

### Tour
See below for a description of the entire format, but for a quick example, take the following XML:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<people xmlns="urn:example:people" xmlns:ns0="urn:example:properties">
  <person sex="male">
    <ns0:name>John</ns0:name>
    <ns0:age>13</ns0:age>
  </person>

  <person sex="female">
    <ns0:name>Mary</ns0:name>
    <ns0:age>42</ns0:age>
  </person>
</people>
```

With proper namespace aliasing configuration, you can get back the following plain object, regardless of what namespace aliases the original XML used. That's especially useful if the XML input is out of your control and you can't depend on it always having the same aliases.

```json
{
  "version": "1.0",
  "encoding": "UTF-8",

  "people": {
    "xmlns": "urn:example:people",
    "xmlns:ns0": "urn:example:properties",

    "person": [{
      "sex": "male",
      "props$name": {"$": "John"},
      "props$age": {"$": "13"}
    }, {
      "sex": "female",
      "props$name": {"$": "Mary"},
      "props$age": {"$": "42"}
    }]
  }
}
```


Installing
----------
```sh
npm install hugml
```

HugML.js follows [semantic versioning](http://semver.org), so feel free to depend on its major version with something like `>= 1.0.0 < 2` (a.k.a `^1.0.0`).


Using
-----
```javascript
var Hugml = require("hugml")

Hugml.parse(xml) // => Returns a plain object in the format described below.
Hugml.stringify(obj)
```

### Namespaces
The export from `require("hugml")` has both static methods shown above and can be invoked as a constructor to configure namespaces and get back an instance of `Hugml`.

Using the XML example above, you could set the `people` namespace to be the default and `properties` to be renamed as `props`:

```javascript
var Hugml = require("hugml")

var hugml = new Hugml({
  "urn:example:people": "",
  "urn:example:properties": "props"
})

hugml.parse(`
  <people xmlns="urn:example:people" xmlns:ns0="urn:example:properties">
    <person sex="female">
      <ns0:name>Mary</ns0:name>
      <ns0:age>42</ns0:age>
    </person>
  </people>
`)
```

Tags in the `urn:example:people` namespace will end up as unqualified properties (accessed `obj.people.person`) and tags in the `urn:example:properties` namespace will get the `props$` prefix. Values of tag attributes will still end up as string values of properties and the textual content of a tag will end up in a property called `$`.

```json
{
  "people": {
    "xmlns": "urn:example:people",
    "xmlns:ns0": "urn:example:properties",

    "person": {
      "sex": "female",
      "props$name": {"$": "Mary"},
      "props$age": {"$": "42"}
    }
  }
}
```

To rename the default XML namespace to something else, use `""` as the namespace URI:

```javascript
var hugml = new Hugml({"": "h"})

hugml.parse(`
  <html>
    <head>
      <title>Page</title>
    </head>
  </html>
`)
```

```json
{
  "h$html": {
    "h$head": {
      "h$title": {"$": "Page"}
    }
  }
}
```

For serializing a plain object back to XML, just pass it in the same format as above to `Hugml.prototype.stringify`. You don't need the namespace `xmlns` attributes. They'll be added automatically based on the namespaces you've configured and the ones you've actually used.

```js
var hugml = new Hugml({"urn:example:people": ""})
hugml.stringify({"people": {"person": {}}})
```

CLI
---
There's a `hugml` executable installed along with the library. You can use that to do quick tests.

If you've installed HugML.js globally, invoke `hugml`. If you've installed it as a module in the current directory, you'll find `hugml` in `node_modules/.bin/hugml`.

Give the executable an XML file to process. If you leave it out, it'll get the XML from stdin. It'll print the output to stdout.

```sh
hugml foo.xml
curl http://example.com/foo.xml | hugml > foo.json
```

I used the executable to generate examples for this README by copying some XML to the clipboard and then used MacOS's `pbpaste` to pass it on:

```sh
pbpaste | hugml
```

### CLI namespaces
You can also set up namespace aliases for the CLI. Use the `--namespace` argument:

```sh
hugml --namespace http://www.w3.org/2001/XMLSchema=schema <<end
<?xml version="1.0" encoding="ISO-8859-1" ?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"></xs:schema>
end
```

It'll then print the following to stdout:
```json
{
  "version": "1.0",
  "encoding": "ISO-8859-1",
  "schema$schema": {
    "xmlns:xs": "http://www.w3.org/2001/XMLSchema"
  }
}
```

Format
------
The general algorithm for converting between XML and JSON is as follows:

1. All **XML** is returned as an object with the XML pragma's attributes as properties of it:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   ```

   Parses to:
   ```json
   {"version": "1.0", "encoding": "UTF-8"}
   ```

   Root tags will be added to that object as properties following the same rules as nested tags.

2. **Tags** will be converted to properties with the tag name as key and an object as value:
   ```xml
   <people>
     <person />
   </people>
   ```

   Parses to:
   ```json
   {"people": {"person": {}}}
   ```

3. **Tags in namespaces** will retain their colon-separated name if it's an unknown alias:
   ```xml
   <p:people xmlns:p="urn:example:people">
     <p:person />
   </p:people>
   ```

   Parses to:
   ```json
   {"p:people": {"p:person": {}}}
   ```

   If it's a renamed alias (see above for further details), its renamed alias will be concatenated with "$" and its local name:
   ```js
   var hugml = new Hugml({"urn:example:people": "peeps"})
   ```

   ```xml
   <p:people xmlns:p="urn:example:people">
     <p:person />
   </p:people>
   ```

   Parses to:
   ```json
   {"peeps$people": {"peeps$person": {}}}
   ```

3. **Tag attributes** will be converted to string properties of the above object value:
   ```xml
   <person id="42" sex="male" />
   ```

   Parses to:
   ```json
   {
     "person": {
       "id": "42",
       "sex": "male"
     }
   }
   ```

4. **Tag textual content** will be added as another property with the `$` name:
   ```xml
   <html>
     <head title="Collides with title tag">
       <title>Page</title>
     </head>
   </html>
   ```

   Parses to:
   ```json
   {
    "html": {
      "head": {
        "title": {"$": "Page"}
      }
    }
   }
   ```

5. **Nested tags** will be properties just like attributes, but following step 2, will have object values.

   Note that because attributes and tags go on the same object, tags may collide with and shadow attributes. In practice that happens rarely and the convenience outweighs the risk. However, if it does affect you, you can work-around it by configuring a namespace:

   ```js
   new Hugml({"": "h"}).parse(`
     <html>
       <head title="Collides with title tag">
         <title>Page</title>
       </head>
     </html>
   `)
   ```

   ```json
   {
     "h$html": {
       "h$head": {
         "title": "Collides with title tag",
         "h$title": {"$:" "Page"}
       }
     }
   }
   ```

The serializing format you give to `Hugml.prototype.stringify` matches the above and is applied in reverse.


License
-------
HugML.js is released under a *Lesser GNU Affero General Public License*, which in summary means:

- You **can** use this program for **no cost**.
- You **can** use this program for **both personal and commercial reasons**.
- You **do not have to share your own program's code** which uses this program.
- You **have to share modifications** (e.g. bug-fixes) you've made to this program.

For more convoluted language, see the `LICENSE` file.


About
-----
**[Andri Möll][moll]** typed this and the code.  
[Monday Calendar][monday] supported the engineering work.

If you find HugML.js needs improving, please don't hesitate to type to me now at [andri@dot.ee][email] or [create an issue online][issues].

[email]: mailto:andri@dot.ee
[issues]: https://github.com/moll/js-hugml/issues
[moll]: http://themoll.com
[monday]: https://mondayapp.com
