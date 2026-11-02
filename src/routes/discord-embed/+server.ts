import { error, json } from '@sveltejs/kit';
import { messages } from '../../lib/server/discord';
import { getFeed } from '../../lib/server/feeds';
import { getWiki } from '../../lib/server/wiki';
import { componentEmbed, feedPreview, messageLinkButtons, messageMedia, postPreview, sitePreview, wikiPreview } from '../../lib/server/discord-preview';
import type { DisplayMessage } from '../../lib/server/discord';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const path = url.searchParams.get('path') ?? '/';
	let segments: string[];
	try {
		segments = path.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment));
	} catch {
		error(400, 'Invalid page path');
	}
	let preview: NonNullable<App.PageData['preview']> = sitePreview;
	let post: DisplayMessage | undefined;

	if (segments[0] === 'posts' && segments.length === 2) {
		const message = messages.find((item) => item.id === segments[1] && (item.isComponentsV2 || item.content.includes('NEWS')));
		if (!message) error(404, 'Post not found');
		post = message;
		preview = postPreview(message);
	} else if (segments[0] === 'feeds' && segments.length >= 2) {
		const feed = await getFeed(segments[1]);
		if (!feed) error(404, 'Feed not found');
		if (segments.length === 4 && segments[2] === 'posts') {
			const message = feed.messages.find((item) => item.id === segments[3]);
			if (!message) error(404, 'Post not found');
			post = message;
			preview = postPreview(message);
		} else if (segments.length === 2) {
			preview = feedPreview(segments[1]);
		}
	} else if (segments[0] === 'wiki' && segments.length === 2 && segments[1] !== 'upload') {
		const wiki = await getWiki();
		const content = Object.hasOwn(wiki.pages, segments[1]) ? wiki.pages[segments[1]].content : '';
		preview = wikiPreview(segments[1], content);
	}

	const postUrl = post ? new URL(path, url.origin) : undefined;
	if (postUrl && (postUrl.origin !== url.origin || postUrl.href.length > 512)) error(400, 'Invalid post URL');
	return json(componentEmbed(preview, postUrl?.href, post ? messageLinkButtons(post.components) : [], post ? messageMedia(post) : []));
};
