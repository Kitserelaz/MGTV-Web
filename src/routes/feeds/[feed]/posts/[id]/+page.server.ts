import { error } from '@sveltejs/kit';
import { getFeed } from '../../../../../lib/server/feeds';
import { postPreview } from '../../../../../lib/server/discord-preview';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const feed = await getFeed(params.feed);
	if (!feed) error(404, 'Feed not found');
	const message = feed.messages.find((item) => item.id === params.id);
	if (!message) error(404, 'Post not found');
	return { message, preview: postPreview(message) };
};
