import { parseWikiMarkup } from './wiki-markup';
import type { CategoryToken, Token } from 'wikiparser-node';
import { titleToAddress } from '../wiki';
import type { Wiki } from './wiki';

export const pageCategories = (document: Token) => document.querySelectorAll<CategoryToken>('category').map((category) => {
	const target = String(category.firstChild);
	return [`Category:${titleToAddress(target.slice(target.indexOf(':') + 1))}`, category.sortkey] as const;
});

export const getWikiCategories = (pages: Wiki['pages']) => {
	const categories: Record<string, { address: string; sort: string }[]> = Object.create(null);
	for (const [address, page] of Object.entries(pages)) {
		const metadata: { defaultSort?: string } = {};
		const document = parseWikiMarkup(page.content, address, pages, '', {}, metadata);
		for (const [category, sort] of pageCategories(document)) {
			(categories[category] ??= []).push({ address, sort: sort ?? metadata.defaultSort ?? address });
		}
	}
	for (const members of Object.values(categories)) members.sort((a, b) => a.sort.localeCompare(b.sort));
	return categories;
};
