import Parser, { type TranscludeToken } from 'wikiparser-node';
import type { Wiki } from './wiki';

export const checkWikiExpansion = (content: string, pages: Wiki['pages']) => {
	const templates = new Map(Object.entries(pages).map(([name, page]) => [Parser.normalizeTitle(name, 0).title, page.content]));
	const maxSize = 1_000_000;
	let expansions = 0;
	const estimate = (text: string, stack: string[]): number => {
		if (text.length > maxSize) throw new Error('Wiki content is too large to render');
		let size = text.length;
		for (const token of Parser.parse(text).querySelectorAll<TranscludeToken>('template')) {
			const name = token.name;
			if (name.includes('{{')) throw new Error('Dynamic template names are not supported');
			const template = templates.get(name);
			if (template === undefined || stack.includes(name)) continue;
			if (++expansions > 1000) throw new Error('Too many wiki template expansions');
			if (stack.length >= 20) throw new Error('Wiki template nesting is too deep');
			size += estimate(template, [...stack, name]);
			if (size > maxSize) throw new Error('Expanded wiki content is too large');
		}
		return size;
	};
	estimate(content, []);
};
