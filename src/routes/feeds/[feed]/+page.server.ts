import { error } from '@sveltejs/kit';
import { getFeed } from '../../../lib/server/feeds';
import { getNewsPage, parsePage } from '../../../lib/server/news';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const feed = await getFeed(params.feed);
	if (!feed) error(404, 'Feed not found');
	const page = parsePage(url.searchParams.get('page'));
	const query = url.searchParams.get('q')?.trim() ?? '';
	const result = getNewsPage(page, query, feed.messages, false);
	if (page > result.pageCount) error(404, 'Page not found');
	return { page, query, feed: params.feed, ...result };
};
