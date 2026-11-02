import { WIKI_WEBHOOK_URL } from '$app/env/private';
import { DiscordAPIError, Routes, WebhookClient, type APIWebhook } from 'discord.js';
import { client } from './discord';
import { validWikiAddress } from '../wiki';
import { checkWikiExpansion } from './wiki-expansion';

export type WikiPage = { content: string; file?: { messageId: string; filename: string } };
export type Wiki = { pages: Record<string, WikiPage> };

let write = Promise.resolve();

const getChannel = async () => {
	if (!WIKI_WEBHOOK_URL) throw new Error('Missing WIKI_WEBHOOK_URL');
	const webhook = new WebhookClient({ url: WIKI_WEBHOOK_URL });
	const info = await client.rest.get(Routes.webhook(webhook.id, webhook.token!), { auth: false }) as APIWebhook;
	if (!info.channel_id) throw new Error('Wiki webhook has no channel');
	const channel = await client.channels.fetch(info.channel_id).catch((error: unknown) => {
		if (error instanceof DiscordAPIError && (error.code === 50001 || error.code === 50013)) {
			throw new Error('The bot cannot access the wiki webhook channel. Add it to that server and grant it View Channel and Read Message History permissions.');
		}
		throw error;
	});
	if (!channel?.isTextBased() || !('messages' in channel)) throw new Error('Wiki webhook channel is not a text channel');
	if (!channel.isDMBased() && !channel.permissionsFor(client.user!)?.has(['ViewChannel', 'ReadMessageHistory'])) {
		throw new Error('The bot needs View Channel and Read Message History permissions for the wiki channel');
	}
	return { webhook, channel };
};

export const getWiki = async () => {
	const { webhook, channel } = await getChannel();
	let before: string | undefined;
	while (true) {
		const messages = await channel.messages.fetch({ limit: 100, before });
		if (messages.size === 0) return { pages: {} as Wiki['pages'], revision: '' };
		const message = messages.find((item) => item.webhookId === webhook.id && item.attachments.some((file) => file.name === 'wiki.json'));
		if (message) {
			const attachment = message.attachments.find((file) => file.name === 'wiki.json')!;
			const url = new URL(attachment.url);
			if (url.protocol !== 'https:' || url.hostname !== 'cdn.discordapp.com') throw new Error('Invalid wiki attachment URL');
			const response = await fetch(url);
			if (!response.ok) throw new Error('Failed to download wiki snapshot');
			const wiki: unknown = await response.json();
			if (!wiki || typeof wiki !== 'object' || !('pages' in wiki) || !wiki.pages || typeof wiki.pages !== 'object' || Array.isArray(wiki.pages)) {
				throw new Error('Invalid wiki snapshot');
			}
			const pages = Object.entries(wiki.pages);
			if (pages.some(([slug, page]) => !validWikiAddress(slug) || !page || typeof page !== 'object' || typeof page.content !== 'string' || (page.file !== undefined && (!page.file || typeof page.file !== 'object' || typeof page.file.messageId !== 'string' || typeof page.file.filename !== 'string')))) {
				throw new Error('Invalid wiki snapshot');
			}
			return { pages: Object.fromEntries(pages) as Wiki['pages'], revision: message.id };
		}
		before = messages.lastKey();
	}
};

export const saveWikiFile = async (file: File, revision: string) => {
	const task = write.catch(() => {}).then(async () => {
		const wiki = await getWiki();
		if (wiki.revision !== revision) return 'The wiki changed while you were uploading. Reload and try again.';
		if (!validWikiAddress(file.name) || file.size === 0 || file.size > 20 * 1024 * 1024) return 'Choose a valid file no larger than 20 MiB.';
		const address = `File:${file.name.replace(/\s+/g, '_')}`;
		const { webhook } = await getChannel();
		const message = await webhook.send({ files: [{ attachment: Buffer.from(await file.arrayBuffer()), name: file.name }] });
		const pages = {
			...Object.fromEntries(Object.entries(wiki.pages).map(([key, page]) => [key, page.file ? { content: page.content, file: page.file } : { content: page.content }])),
			[address]: { content: wiki.pages[address]?.content ?? '', file: { messageId: message.id, filename: file.name } }
		};
		await webhook.send({ files: [{ attachment: Buffer.from(JSON.stringify({ pages }, null, 2)), name: 'wiki.json' }] });
		return null;
	});
	write = task.then(() => {}, () => {});
	return task;
};

export const saveWikiPage = async (slug: string, address: string, content: string, revision: string, creating: boolean) => {
	const task = write.catch(() => {}).then(async () => {
		const wiki = await getWiki();
		if (!validWikiAddress(address)) return 'Enter a valid title without slashes.';
		if (wiki.revision !== revision) return 'The wiki changed while you were editing. Reload and try again.';
		if (!creating && !Object.hasOwn(wiki.pages, slug)) return 'This page no longer exists.';
		if (!creating && wiki.pages[slug].file && !address.startsWith('File:')) return 'Files must remain in the File namespace.';
		if ((creating || slug !== address) && Object.hasOwn(wiki.pages, address)) return 'A page with this title already exists.';
		const pages = {
			...Object.fromEntries(Object.entries(wiki.pages).map(([key, page]) => [key, page.file ? { content: page.content, file: page.file } : { content: page.content }])),
			[address]: wiki.pages[slug]?.file ? { content, file: wiki.pages[slug].file } : { content }
		};
		if (!creating && slug !== address) pages[slug] = { content: `#REDIRECT [[${address}]]` };
		try {
			for (const page of Object.values(pages)) checkWikiExpansion(page.content, pages);
		} catch (error) {
			return error instanceof Error ? error.message : 'Unable to render wiki content.';
		}
		const { webhook } = await getChannel();
		await webhook.send({ files: [{ attachment: Buffer.from(JSON.stringify({ pages }, null, 2)), name: 'wiki.json' }] });
		return null;
	});
	write = task.then(() => {}, () => {});
	return task;
};
