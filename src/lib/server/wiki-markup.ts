import Parser, { type FileToken, type LinkToken } from 'wikiparser-node';
import sanitizeHtml from 'sanitize-html';
import { titleToAddress, validWikiAddress } from '../wiki';
import type { Wiki } from './wiki';
import { checkWikiExpansion } from './wiki-expansion';

export const parseWikiMarkup = (content: string, title: string, pages: Wiki['pages'], origin = '', categoryCounts: Record<string, number> = {}, metadata: { defaultSort?: string } = {}) => {
	checkWikiExpansion(content, pages);
	Parser.templates.clear();
	try {
		for (const [name, page] of Object.entries(pages)) {
			Parser.templates.set(Parser.normalizeTitle(name, 0).title, page.content);
		}
		Parser.setFunctionHook('sitename', () => 'MGTV24 News');
		Parser.setFunctionHook('numberofpages', () => String(Object.keys(pages).length));
		Parser.setFunctionHook('numberofarticles', () => String(Object.keys(pages).filter((name) => !name.includes(':')).length));
		Parser.setFunctionHook('numberoffiles', () => String(Object.values(pages).filter((page) => page.file).length));
		Parser.setFunctionHook('defaultsort', (token) => {
			metadata.defaultSort = token.getValue(1)?.trim();
			return '';
		});
		Parser.setFunctionHook('pagesincategory', (token) => {
			const name = (token.getValue(1) ?? '').replace(/^Category:/i, '');
			return String(categoryCounts[`Category:${titleToAddress(name)}`] ?? 0);
		});
		Parser.setFunctionHook('ifexist', (token) => {
			const address = titleToAddress(token.getValue(1) ?? '');
			return (Object.hasOwn(pages, address) ? token.getValue(2) : token.getValue(3)) ?? '';
		});
		const config = { ...Parser.getConfig(), server: origin, articlePath: '/wiki/$1' };
		return Parser.parse(content, title, false, undefined, config).expand();
	} finally {
		Parser.templates.clear();
	}
};

export const renderWikiMarkup = (content: string, title = '', pages: Wiki['pages'] = {}, origin = '', categoryCounts: Record<string, number> = {}) => {
	const document = parseWikiMarkup(content, title, pages, origin, categoryCounts);
	const links = new Map<string, string[]>();
	const files = new Map<string, string[]>();
	for (const link of document.querySelectorAll<LinkToken | FileToken>('link, file')) {
		const [rawTitle] = String(link.firstChild).split('#');
		const title = rawTitle.replace(/^:/, '').replace(/^image:/i, 'File:');
		const address = titleToAddress(title);
		const target = link.link;
		if (typeof target === 'string') continue;
		const normalized = target.getUrl();
		if (!validWikiAddress(address) || !normalized.startsWith('/wiki/')) continue;
		const fragment = normalized.includes('#') ? normalized.slice(normalized.indexOf('#')) : '';
		const targets = links.get(normalized) ?? [];
		targets.push(`/wiki/${encodeURIComponent(address)}${fragment}`);
		links.set(normalized, targets);
		if (link.type === 'file') {
			const normalizedName = decodeURIComponent(normalized.slice('/wiki/'.length)).slice(5);
			const names = files.get(normalizedName) ?? [];
			names.push(title.slice(title.indexOf(':') + 1));
			files.set(normalizedName, names);
		}
	}
	const html = document.toHtml({ cats: false });
	return sanitizeHtml(html, {
		allowedTags: [...sanitizeHtml.defaults.allowedTags, 'del', 'ins', 's', 'u', 'figure', 'figcaption', 'img'],
		allowedAttributes: {
			'*': ['id', 'class'],
			a: ['href', 'title', 'rel'],
			div: ['id', 'class', 'role', 'aria-labelledby'],
			img: ['src', 'alt', 'width', 'height', 'loading'],
			td: ['colspan', 'rowspan'],
			th: ['colspan', 'rowspan', 'scope']
		},
		transformTags: {
			a: (tagName, attribs) => ({
				tagName,
				attribs: { ...attribs, ...(links.get(attribs.href)?.length ? { href: links.get(attribs.href)!.shift()! } : {}) }
			}),
			img: (tagName, attribs) => {
				let path = '';
				try {
					path = decodeURIComponent((attribs.src ?? '').split('?')[0]);
				} catch {
					return { tagName, attribs: { ...attribs, src: '' } };
				}
				const prefix = '/wiki/Special:Redirect/file/';
				const name = path.startsWith(prefix) ? path.slice(prefix.length) : '';
				const original = files.get(name)?.shift() ?? name;
				return { tagName, attribs: { ...attribs, src: name ? `/wiki/files/${encodeURIComponent(original)}` : '' } };
			}
		},
		allowedSchemes: ['http', 'https', 'mailto'],
		allowProtocolRelative: false
	});
};
