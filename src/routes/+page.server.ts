import { error } from '@sveltejs/kit';
import { getNewsPage, parsePage } from '../lib/server/news';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const page = parsePage(url.searchParams.get('page'));
	const query = url.searchParams.get('q')?.trim() ?? '';
	const result = getNewsPage(page, query);
	if (page > result.pageCount) error(404, 'Page not found');
	return { page, query, feed: null, ...result };
};
