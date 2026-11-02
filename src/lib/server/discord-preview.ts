import type { APIComponentInContainer, APIComponentInMessageActionRow, APIMessageTopLevelComponent, APISectionAccessoryComponent } from 'discord.js';
import type { DisplayMessage } from './discord';
import { addressToTitle } from '../wiki';
import { removeNewsFooter } from '../news-text';

const summary = (value: string, limit = 2000) => Array.from(value
	.replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f]+/g, ' ')
	.replace(/[^\S\n]+/g, ' ')
	.replace(/\n{3,}/g, '\n\n')
	.trim()).slice(0, limit).join('');

const componentText = (components: (APIMessageTopLevelComponent | APIComponentInContainer)[]): string =>
	components.map((component) => {
		if (component.type === 10) return component.content;
		if (component.type === 9 || component.type === 17) return componentText(component.components);
		return '';
	}).join('\n');

export const postPreview = (message: DisplayMessage) => ({
	title: `News from ${summary(message.author, 100)} | MGTV24 News`,
	description: summary(removeNewsFooter(message.content || componentText(message.components))
		.split('\n').filter((line) => !/^\s*[=*_-]{4,}\s*$/.test(line)).join('\n')) || 'Read this post on MGTV24 News.',
	type: 'article' as const
});

export const wikiPreview = (slug: string, content: string) => ({
	title: `${summary(addressToTitle(slug), 100)} | MGTV24 News Wiki`,
	description: summary(content) || `Read ${summary(addressToTitle(slug), 100)} on the MGTV24 News wiki.`,
	type: 'article' as const
});

export const sitePreview = {
	title: 'MGTV24 News',
	description: 'News and wiki pages from the MGTV24 community.',
	type: 'website' as const
};

export const feedPreview = (feed: string) => ({
	title: `${feed.toUpperCase()} | MGTV24 News`,
	description: `Read the latest posts from ${feed.toUpperCase()}.`,
	type: 'website' as const
});

type PreviewButton = {
	type: 2;
	style: 5;
	url: string;
	label?: string;
	emoji?: { id?: string; name?: string; animated?: boolean };
	disabled?: boolean;
};

type MessageComponent = APIMessageTopLevelComponent | APIComponentInContainer | APIComponentInMessageActionRow | APISectionAccessoryComponent;

export const messageLinkButtons = (components: readonly MessageComponent[]): PreviewButton[] => components.flatMap((component) => {
	if (component.type === 1 || component.type === 17) return messageLinkButtons(component.components);
	if (component.type === 9) return messageLinkButtons([...component.components, component.accessory]);
	if (component.type !== 2 || component.style !== 5 || !('url' in component) || component.url.length > 512) return [];
	try {
		const url = new URL(component.url);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return [];
	} catch {
		return [];
	}
	if (!component.label && !component.emoji) return [];
	return [{
		type: 2 as const,
		style: 5 as const,
		url: component.url,
		...(component.label ? { label: Array.from(component.label).slice(0, 80).join('') } : {}),
		...(component.emoji ? { emoji: component.emoji } : {}),
		...(component.disabled ? { disabled: true } : {})
	}];
});

type GalleryItem = { media: { url: string }; description?: string; spoiler?: boolean };

export const messageMedia = (message: DisplayMessage): GalleryItem[] => {
	const items: GalleryItem[] = [];
	const add = (url: string, description?: string | null, spoiler?: boolean) => {
		const resolved = url.startsWith('attachment://') ? message.attachments[url.slice(13)] : url;
		try {
			const parsed = new URL(resolved);
			if (!['http:', 'https:'].includes(parsed.protocol) || resolved.length > 2048 || !/\.(png|gif|jpe?g|webp|avif|mp4|webm|mov)$/i.test(parsed.pathname)) return;
		} catch {
			return;
		}
		items.push({ media: { url: resolved }, ...(description ? { description: description.slice(0, 1024) } : {}), ...(spoiler ? { spoiler: true } : {}) });
	};
	for (const attachment of message.ordinaryAttachments) add(attachment.url, attachment.description, attachment.spoiler);
	const visit = (components: (APIMessageTopLevelComponent | APIComponentInContainer)[], spoiler = false) => {
		for (const component of components) {
			if (component.type === 17) visit(component.components, spoiler || !!component.spoiler);
			if (component.type === 9 && component.accessory.type === 11) add(component.accessory.media.url, component.accessory.description, spoiler || component.accessory.spoiler);
			if (component.type === 12) for (const item of component.items) add(item.media.url, item.description, spoiler || item.spoiler);
		}
	};
	visit(message.components);
	return items.slice(0, 10);
};

export const componentEmbed = (preview: NonNullable<App.PageData['preview']>, postUrl?: string, messageButtons: PreviewButton[] = [], media: GalleryItem[] = []) => {
	const description = Array.from(preview.description.replace(/@(everyone|here)/gi, '@\u200b$1'));
	const title = preview.title.replace(/@(everyone|here)/gi, '@\u200b$1').replace(/[\\*_~`|]/g, '\\$&');
	const text = [{ type: 10 as const, content: `**${title}**` }, { type: 10 as const, content: '…' }];
	const view: PreviewButton = { type: 2, style: 5, label: 'View Post', url: postUrl ?? '' };
	const join: PreviewButton = { type: 2, style: 5, label: 'Join Millennavia', url: 'https://discord.gg/fk4gPDeaCP' };
	const selected: PreviewButton[] = [];
	const rows = () => {
		if (!postUrl) return [];
		const buttons = [view, ...selected, join];
		return Array.from({ length: Math.ceil(buttons.length / 5) }, (_, index) => ({
			type: 1 as const,
			components: buttons.slice(index * 5, index * 5 + 5)
		}));
	};
	for (const button of messageButtons) {
		if (selected.length >= 28) break;
		selected.push(button);
		if (Buffer.byteLength(JSON.stringify({ component: { type: 17, accent_color: 0x020089, components: [...text, ...rows()] } })) > 3000) selected.pop();
	}
	const gallery: GalleryItem[] = [];
	for (const item of media.slice(0, 10)) {
		gallery.push(item);
		if (Buffer.byteLength(JSON.stringify({ component: { type: 17, accent_color: 0x020089, components: [...text, { type: 12, items: gallery }, ...rows()] } })) > 3000) gallery.pop();
	}
	const component = {
		type: 17,
		accent_color: 0x020089,
		components: [...text, ...(gallery.length ? [{ type: 12 as const, items: gallery }] : []), ...rows()]
	};
	text[1].content = description.join('') || '…';
	while (Buffer.byteLength(JSON.stringify({ component })) > 3000 && description.length) {
		description.pop();
		text[1].content = description.join('') || '…';
	}
	return { component };
};
