## Unreleased
- Skips serializing duplicate root element namespace attributes.  
  This helps re-serialize parsed Hugml objects.

## 1.1.0 (Nov 14, 2019)
- Upgrades Neodoc to v2.
- Adds a space before the closing bracket (`<foo />`) by default.
- Adds support for namespaced attributes.
- Rewrites XML serializing to not depend on [Xmlbuilder.js](https://www.npmjs.com/package/xmlbuilder).
- Adds preliminary support for [Exclusive XML Canonicalization](https://www.w3.org/TR/xml-exc-c14n).

## 1.0.1 (May 4, 2018)
- Upgrades [Xmlbuilder.js](https://www.npmjs.com/package/xmlbuilder) to v10 to [fix stringifying emoji](https://github.com/oozcitak/xmlbuilder-js/issues/147).

## 1.0.0 (Sep 2, 2017)
- Changes the parsed tag name of the default XML namespace from `$foo` to `:foo` to better match other unknown namespaces.
- Adds `--namespace` argument to the CLI.
- Fixes overriding of tag attribute when its nested tag has the same name.

## 0.1.338 (Feb 6, 2017)
- Fixes `hugml --version`.
- Fixes `hugml` name in error message.

## 0.1.337 (Jan 2, 2017)
- XOXO Markup Language.
