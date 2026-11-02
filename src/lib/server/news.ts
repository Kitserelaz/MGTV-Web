import { messages, type DisplayMessage } from './discord';
import type { APIMessageTopLevelComponent, APIComponentInContainer } from 'discord.js';

const pageSize = 20;

const searchableText = (content: string) => content.split('\n').filter((line) =>
	!/^[\s*\\>]*(?:For you who are reading this outside the server|For you who are not subscribed and reading this|Servers that support (?:MGTV(?:24)?|DLTV)\s*NEWS media on discord)\b/i.test(line)
).map((line) => {
	const branding = /^(\s*#{1,3}\s*)(?:<a?:MJV_(?:MGTV|DLTV)NEWSspin:\d+>|:MJV_(?:MGTV|DLTV)NEWSspin:)\s*(?:MGTV|DLTV)NEWS\b/i;
	if (!branding.test(line)) return line;
	return line.replace(branding, '$1').replace(/<a?:MJV_(?:MGTV|DLTV)NEWSspin:\d+>|:MJV_(?:MGTV|DLTV)NEWSspin:/gi, '');
}).join('\n');

export const parsePage = (value: string | null) => {
	const page = Number(value);
	return Number.isSafeInteger(page) && page > 0 ? page : 1;
};

const componentText = (components: (APIMessageTopLevelComponent | APIComponentInContainer)[]): string =>
	components.map((component) => {
		if (component.type === 10) return searchableText(component.content);
		if (component.type === 9 || component.type === 17) return componentText(component.components);
		return '';
	}).join(' ');

export const getNewsPage = (page: number, query: string, source: DisplayMessage[] = messages, newsOnly = true) => {
	const search = query.trim().toLowerCase();
	const posts = source.filter((message) =>
		(!newsOnly || message.isComponentsV2 || message.content.includes('NEWS')) &&
		(!search || `${message.author} ${searchableText(message.content)} ${componentText(message.components)}`.toLowerCase().includes(search))
	);
	return {
		messages: posts.slice((page - 1) * pageSize, page * pageSize),
		pageCount: Math.max(1, Math.ceil(posts.length / pageSize))
	};
};
