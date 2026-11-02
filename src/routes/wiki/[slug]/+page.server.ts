import { error, redirect } from '@sveltejs/kit';
import { getWiki } from '../../../lib/server/wiki';
import { renderWikiMarkup } from '../../../lib/server/wiki-markup';
import { getWikiCategories } from '../../../lib/server/wiki-categories';
import { resolveWikiRedirect } from '../../../lib/wiki';
import { wikiPreview } from '../../../lib/server/discord-preview';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const wiki = await getWiki();
	const page = Object.hasOwn(wiki.pages, params.slug) ? wiki.pages[params.slug] : null;
	if (page && url.searchParams.get('redirect') !== 'no') {
		const { address, fragment, loop } = resolveWikiRedirect(wiki.pages, params.slug);
		if (loop) error(400, 'Wiki redirect loop detected');
		if (address !== params.slug) redirect(302, `/wiki/${encodeURIComponent(address)}?from=${encodeURIComponent(params.slug)}${fragment ? `#${encodeURIComponent(fragment.replace(/\s+/g, '_'))}` : ''}`);
	}
	const index = getWikiCategories(wiki.pages);
	const categories = Object.entries(index).filter(([, members]) => members.some((member) => member.address === params.slug)).map(([name]) => name);
	const members = params.slug.startsWith('Category:') ? index[params.slug] ?? [] : [];
	const counts = Object.fromEntries(Object.entries(index).map(([name, items]) => [name, items.length]));
	return {
		page,
		html: page ? renderWikiMarkup(page.content, params.slug, wiki.pages, url.origin, counts) : '',
		slug: params.slug,
		categories,
		members,
		from: url.searchParams.get('from'),
		preview: wikiPreview(params.slug, page?.content ?? '')
	};
};
