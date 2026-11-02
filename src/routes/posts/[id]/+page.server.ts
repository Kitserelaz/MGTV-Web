import { error } from '@sveltejs/kit';
import { messages } from '../../../lib/server/discord';
import { postPreview } from '../../../lib/server/discord-preview';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const message = messages.find((item) => item.id === params.id && (item.isComponentsV2 || item.content.includes('NEWS')));
	if (!message) error(404, 'Post not found');
	return { message, preview: postPreview(message) };
};
