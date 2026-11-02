import { Events, type Message } from 'discord.js';
import { client, serializeMessage, type DisplayMessage } from './discord';
import { readMessageCache, writeMessageCache } from './message-cache';

export const feeds: Record<string, string> = {
	uatv: '1275492633870991380',
	rgf: '1295401168297787442',
	ctv: '1295401970567217302',
	viztv: '1295407859411976286',
	icn: '1303766708884082761',
	finutria: '1298645364559183955',
	aztv: '1316575386133467207',
	logy: '1316517709219106856',
	balls: '1318542642761699338'
};

const states = new Map<string, {
	messages: DisplayMessage[];
	ids: Set<string>;
	listeners: Set<() => void>;
	ready: boolean;
	write: Promise<void>;
	loading: Promise<void>;
}>();

const save = (name: string, state: NonNullable<ReturnType<typeof states.get>>) => {
	const content = JSON.stringify(state.messages);
	state.write = state.write.catch(() => {}).then(() => writeMessageCache(`feed-cache-${name}.json`, content));
	return state.write;
};

const update = (name: string, state: NonNullable<ReturnType<typeof states.get>>, discordMessage: Message, live: boolean) => {
	const message = serializeMessage(discordMessage);
	if (state.ids.has(message.id)) {
		state.messages[state.messages.findIndex((item) => item.id === message.id)] = message;
	} else {
		state.ids.add(message.id);
		state.messages.push(message);
		if (live) state.messages.sort((a, b) => a.id === b.id ? 0 : BigInt(a.id) > BigInt(b.id) ? -1 : 1);
	}
	if (live) {
		for (const listener of state.listeners) listener();
		if (state.ready) void save(name, state).catch((error) => console.error(`Failed to save ${name} feed cache`, error));
	}
};

client.on(Events.MessageCreate, (message) => {
	for (const [name, state] of states) if (message.channelId === feeds[name]) update(name, state, message, true);
});

client.on(Events.MessageUpdate, async (_oldMessage, message) => {
	for (const [name, state] of states) {
		if (message.channelId !== feeds[name]) continue;
		try {
			update(name, state, message.partial ? await message.fetch() : message, true);
		} catch (error) {
			console.error(`Failed to fetch edited ${name} message`, error);
		}
	}
});

export const getFeed = async (name: string) => {
	if (!Object.hasOwn(feeds, name)) return null;
	let state = states.get(name);
	if (!state) {
		state = { messages: [], ids: new Set(), listeners: new Set(), ready: false, write: Promise.resolve(), loading: Promise.resolve() };
		states.set(name, state);
		const current = state;
		state.loading = (async () => {
			const cached = await readMessageCache(`feed-cache-${name}.json`);
			let newestId: string | undefined;
			if (cached !== null) {
				const saved: DisplayMessage[] = JSON.parse(cached);
				newestId = saved[0]?.id;
				for (const message of saved) {
					if (current.ids.has(message.id)) continue;
					current.messages.push(message);
					current.ids.add(message.id);
				}
			}
			const channel = await client.channels.fetch(feeds[name]);
			if (!channel?.isTextBased() || !('messages' in channel)) throw new Error(`Discord channel for ${name} is not a text channel`);
			let before: string | undefined;
			while (true) {
				const batch = await channel.messages.fetch({ limit: 100, before });
				if (batch.size === 0) break;
				for (const message of batch.values()) if (!current.ids.has(message.id)) update(name, current, message, false);
				if (newestId && batch.some((message) => BigInt(message.id) <= BigInt(newestId))) break;
				before = batch.lastKey();
			}
			current.messages.sort((a, b) => a.id === b.id ? 0 : BigInt(a.id) > BigInt(b.id) ? -1 : 1);
			current.ready = true;
			await save(name, current);
		})().catch((error) => {
			states.delete(name);
			throw error;
		});
	}
	await state.loading;
	return state;
};
