import { error, redirect } from '@sveltejs/kit';
import { WebhookClient } from 'discord.js';
import { WIKI_WEBHOOK_URL } from '$app/env/private';
import { getWiki } from '../../../../lib/server/wiki';
import { resolveWikiRedirect, titleToAddress } from '../../../../lib/wiki';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const wiki = await getWiki();
	const { address, loop } = resolveWikiRedirect(wiki.pages, `File:${titleToAddress(params.name)}`);
	if (loop) error(400, 'Wiki redirect loop detected');
	const file = Object.hasOwn(wiki.pages, address) ? wiki.pages[address].file : undefined;
	if (!file) error(404, 'File not found');
	if (!WIKI_WEBHOOK_URL) throw new Error('Missing WIKI_WEBHOOK_URL');
	const webhook = new WebhookClient({ url: WIKI_WEBHOOK_URL });
	const message = await webhook.fetchMessage(file.messageId);
	const attachment = message.attachments.find((item) => item.filename === file.filename);
	if (!attachment) error(404, 'File attachment not found');
	const url = new URL(attachment.url);
	if (url.protocol !== 'https:' || url.hostname !== 'cdn.discordapp.com') throw new Error('Invalid file attachment URL');
	redirect(302, url.href);
};
