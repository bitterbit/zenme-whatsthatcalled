
import querystring from './querystring.js';

const fetchOptions = {
	method: 'GET',
	mode: 'cors',
	credentials: 'omit'
};

export function api(apiOptions, params = {}) {
	const qs = Object.assign(
		{
			format: 'json',
			action: 'query',
			redirects: ''
		},
		params
	);
	// Remove undefined properties
	Object.keys(qs).forEach(key => {
		if (qs[key] === undefined) {
			delete qs[key];
		}
	});
	if (apiOptions.origin) {
		qs.origin = apiOptions.origin;
	}
	const url = `${apiOptions.apiUrl}?${querystring.stringify(qs)}`;
	return fetch(
		url,
		Object.assign({ headers: apiOptions.headers }, fetchOptions)
	)
		.then(res => res.json())
		.then(res => {
			if (res.error) {
				throw new Error(res.error.info);
			}
			return res;
		});
}


const headingPattern = /(==+)(?:(?!\n)\s?)((?:(?!==|\n)[^])+)(?:(?!\n)\s?)(==+)/g;

function getHeadings(text) {
	let match;
	const matches = [];
	while ((match = headingPattern.exec(text)) !== null) {
		matches.push({
			level: match[1].trim().length,
			text: match[2].trim(),
			start: match.index,
			end: match.index + match[0].length
		});
	}
	return matches;
}

export function parseContent(source) {
	const headings = getHeadings(source);

	const minLevel = Math.min(...headings.map(({ level }) => level));

	const sections = headings.map((heading, index) => {
		const next = headings[index + 1];
		const content = source
			.substring(heading.end, next ? next.start : undefined)
			.trim();
		return {
			title: heading.text,
			level: heading.level - minLevel,
			id: index,
			content,
			items: []
		};
	});

	const lastParentLevel = (index, level) => {
		if (level === 0) return null;
		for (let i = index - 1; i >= 0; i--) {
			if (sections[i].level < level) {
				return sections[i].id;
			}
		}
		return null;
	};

	// Set parents
	sections.forEach((section, index) => {
		section.parent = lastParentLevel(index, section.level);
	});

	const root = {
		items: []
	};

	const findSection = id => sections.find(s => id === s.id);

	// Organize
	sections.forEach(section => {
		if (section.parent === null) {
			root.items.push(section);
		} else {
			findSection(section.parent).items.push(section);
		}
	});

	// Clean up
	sections.forEach(section => {
		delete section.id;
		delete section.parent;
		delete section.level;
		if (!section.items.length) {
			delete section.items;
		}
	});

	return root.items;
}