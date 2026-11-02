import { Client, Events, GatewayIntentBits, Partials, type APIMessageTopLevelComponent, type Message } from 'discord.js';
import { token } from '$app/env/private';
import { readMessageCache, writeMessageCache } from './message-cache';

const channelId = '1217494766397296771';
export const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
	partials: [Partials.Message, Partials.Channel]
});

export const messages: {
	id: string;
	url: string;
	author: string;
	content: string;
	isComponentsV2: boolean;
	mentions: Record<string, string>;
	components: APIMessageTopLevelComponent[];
	attachments: Record<string, string>;
	ordinaryAttachments: { id: string; name: string; url: string; contentType: string | null; description: string | null; spoiler: boolean }[];
}[] = [];

export type DisplayMessage = (typeof messages)[number];
const listeners = new Set<(message: DisplayMessage) => void>();
const messageIds = new Set<string>();
let cacheReady = false;
let cacheWrite = Promise.resolve();

const saveMessages = () => {
	const content = JSON.stringify(messages);
	cacheWrite = cacheWrite.catch(() => {}).then(() => writeMessageCache('news-cache.json', content));
	return cacheWrite;
};

export const subscribe = (listener: (message: DisplayMessage) => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

export const serializeMessage = ({ id, url, author, content, mentions, components, attachments, flags }: Message): DisplayMessage => ({
		id,
		url,
		author: author.username,
		content,
		isComponentsV2: flags.has('IsComponentsV2'),
		components: components.map((component) => component.toJSON()),
		attachments: Object.fromEntries(attachments.map((attachment) => [attachment.name, attachment.url])),
		ordinaryAttachments: flags.has('IsComponentsV2') ? [] : attachments.map((attachment) => ({
			id: attachment.id,
			name: attachment.name,
			url: attachment.url,
			contentType: attachment.contentType,
			description: attachment.description,
			spoiler: attachment.spoiler
		})),
		mentions: Object.fromEntries([
			...mentions.users.map((user) => [user.id, `@${user.username}`]),
			...mentions.roles.map((role) => [role.id, `@${role.name}`]),
			...mentions.channels.map((channel) => [channel.id, `#${'name' in channel ? channel.name : channel.id}`])
		])
});

const updateMessage = (discordMessage: Message, live = true) => {
	const message = serializeMessage(discordMessage);
	const { id } = message;
	if (!messageIds.has(id)) {
		messageIds.add(id);
		messages.push(message);
		if (live) messages.sort((a, b) => a.id === b.id ? 0 : BigInt(a.id) > BigInt(b.id) ? -1 : 1);
	} else {
		messages[messages.findIndex((existing) => existing.id === id)] = message;
	}
	if (live) {
		for (const listener of listeners) listener(message);
		if (cacheReady) void saveMessages().catch((error) => console.error('Failed to save Discord message cache', error));
	}
};

client.on(Events.MessageCreate, (message) => {
	if (message.channelId === channelId) updateMessage(message);
});

client.on(Events.MessageUpdate, async (_oldMessage, message) => {
	if (message.channelId !== channelId) return;
	try {
		updateMessage(message.partial ? await message.fetch() : message);
	} catch (error) {
		console.error('Failed to fetch edited Discord message', error);
	}
});

export const fetchMessages = async () => {
	if (!token) throw new Error('Missing Discord bot token');

	const cache = await readMessageCache('news-cache.json');
	if (cache !== null) {
		const saved: DisplayMessage[] = JSON.parse(cache);
		messages.push(...saved);
		for (const message of saved) messageIds.add(message.id);
	}
	const newestCachedId = messages[0]?.id;

	await client.login(token);
	const channel = await client.channels.fetch(channelId);
	if (!channel?.isTextBased() || !('messages' in channel)) {
		throw new Error('Discord channel is not a text channel');
	}

	let before: string | undefined;
	while (true) {
		const batch = await channel.messages.fetch({ limit: 100, before });
		if (batch.size === 0) break;

		for (const message of batch.values()) {
			if (!messageIds.has(message.id)) updateMessage(message, false);
		}
		if (newestCachedId && batch.some((message) => BigInt(message.id) <= BigInt(newestCachedId))) break;
		before = batch.lastKey();
	}
	messages.sort((a, b) => a.id === b.id ? 0 : BigInt(a.id) > BigInt(b.id) ? -1 : 1);
	cacheReady = true;
	await saveMessages();
};
