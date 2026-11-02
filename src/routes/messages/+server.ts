import { subscribe } from '../../lib/server/discord';
import { getNewsPage, parsePage } from '../../lib/server/news';
import { getFeed } from '../../lib/server/feeds';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
	const encoder = new TextEncoder();
	const page = parsePage(url.searchParams.get('page'));
	const query = url.searchParams.get('q')?.trim() ?? '';
	const feedName = url.searchParams.get('feed');
	const feed = feedName ? await getFeed(feedName) : null;
	if (feedName && !feed) error(404, 'Feed not found');
	let unsubscribe: () => void;
	let closed = false;

	const stream = new ReadableStream({
		start(controller) {
			const send = (event: string, data: unknown) => {
				controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
			};
			const snapshot = () => send('snapshot', feed ? getNewsPage(page, query, feed.messages, false) : getNewsPage(page, query));
			if (feed) {
				feed.listeners.add(snapshot);
				unsubscribe = () => { feed.listeners.delete(snapshot); };
			} else {
				unsubscribe = subscribe(snapshot);
			}
			snapshot();
			request.signal.addEventListener('abort', () => {
				if (closed) return;
				closed = true;
				unsubscribe();
				controller.close();
			}, { once: true });
		},
		cancel() {
			closed = true;
			unsubscribe();
		}
	});

	return new Response(stream, {
		headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
	});
};
