/* https://stackoverflow.com/questions/12980648/map-html-to-json */
/* html2json */
const html2json = (e) => {
	const TextElem = (e) => ({
		type: 'TextElem',
		textContent: e.textContent
	});

	const Elem = (e) => ({
		type: 'Elem',
		tagName: e.tagName,
		attributes: Array.from(e.attributes, ({ name, value }) => [name, value]),
		children: Array.from(e.childNodes, fromNode)
	});

	const fromNode = (e) => {
		switch (e?.nodeType) {
		case 1: return Elem(e);
		case 3: return TextElem(e);
		default: throw Error(`unsupported nodeType: ${e.nodeType}`);
		}
	};

	return JSON.stringify(Elem(e), null, '  ');
};