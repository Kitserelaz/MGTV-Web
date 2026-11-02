import type { APIComponentInContainer, APIMessageTopLevelComponent } from 'discord.js';
import type { DisplayMessage } from './discord';
import { addressToTitle } from '../wiki';
import { removeNewsFooter } from '../news-text';

const summary = (value: string, limit = 1000) => Array.from(value
	.replace(/<a?:\w+:\d+>/g, '')
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

export const componentEmbed = (preview: NonNullable<App.PageData['preview']>) => {
	const description = Array.from(preview.description.replace(/@(everyone|here)/gi, '@\u200b$1'));
	const component = {
		type: 17,
		accent_color: 5793266,
		components: [{ type: 10, content: '' }, { type: 10, content: '' }]
	};
	const title = preview.title.replace(/@(everyone|here)/gi, '@\u200b$1').replace(/[\\*_~`|]/g, '\\$&');
	component.components[0].content = `**${title}**`;
	do {
		component.components[1].content = description.join('');
		if (Buffer.byteLength(JSON.stringify({ component })) <= 3000) break;
		description.pop();
	} while (description.length);
	return { component };
};
