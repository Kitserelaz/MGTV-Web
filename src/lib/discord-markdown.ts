import { parse } from 'discord-markdown-parser';

export const parseDiscordMarkdown = (content: string) => {
	const nodes = parse(content);

	const normalizeNodes = (items: typeof nodes) => {
		for (let index = 0; index < items.length; index++) {
			const node = items[index];
			if (node.type === 'text' && /\[\s*Original Post$/.test(node.content) &&
				items[index + 1]?.content === ']' && items[index + 2]?.content === '(' &&
				items[index + 3]?.type === 'url' && items[index + 4]?.content === ')') {
				node.content = node.content.replace(/\[\s*Original Post$/, '');
				items.splice(index + 1, 4, {
					type: 'link',
					target: items[index + 3].target,
					content: [{ type: 'text', content: 'Original Post' }]
				});
			}
			if (Array.isArray(node.content)) normalizeNodes(node.content);
			if (node.type === 'heading') {
				while (items[index + 1]?.type === 'br') items.splice(index + 1, 1);
			}

			if (node.type !== 'url' || items[index - 1]?.type !== 'text' || items[index + 1]?.type !== 'text') continue;
			const match = /^(https?:\/\/[^\s\]]+)\]\(https:\/\/youtube\.com(https:\/\/www\.youtube\.com\/redirect\?\S+)$/.exec(node.target);
			if (!match || !items[index - 1].content.endsWith('[') || !items[index + 1].content.startsWith(')')) continue;

			const redirect = new URL(match[2]);
			if (redirect.searchParams.get('q') !== match[1] || !safeLink(match[1])) continue;

			items[index - 1].content = items[index - 1].content.slice(0, -1);
			node.target = match[1];
			node.content = [{ type: 'text', content: match[1] }];
			items[index + 1].content = items[index + 1].content.slice(1);
		}
	};

	normalizeNodes(nodes);
	return nodes;
};

export const safeLink = (target: string) => {
	try {
		const url = new URL(target);
		return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
	} catch {
		return undefined;
	}
};

export const formatTimestamp = (timestamp: string, format: string) => {
	const date = new Date(Number(timestamp) * 1000);
	if (Number.isNaN(date.getTime())) return timestamp;

	const options: Record<string, Intl.DateTimeFormatOptions> = {
		t: { timeStyle: 'short' },
		T: { timeStyle: 'medium' },
		d: { dateStyle: 'short' },
		D: { dateStyle: 'long' },
		f: { dateStyle: 'long', timeStyle: 'short' },
		F: { dateStyle: 'full', timeStyle: 'short' }
	};

	if (format === 'R') {
		const days = Math.round((date.getTime() - Date.now()) / 86400000);
		return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(days, 'day');
	}

	return new Intl.DateTimeFormat('en', { timeZone: 'UTC', ...(options[format] ?? options.f) }).format(date);
};
