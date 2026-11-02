import { fail, redirect } from '@sveltejs/kit';
import { getWiki, saveWikiPage } from '../../lib/server/wiki';
import { titleToAddress, validWikiAddress } from '../../lib/wiki';
import { getWikiCategories } from '../../lib/server/wiki-categories';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const wiki = await getWiki();
	return { ...wiki, categories: Object.keys(getWikiCategories(wiki.pages)).sort() };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		const slug = titleToAddress(title);
		const content = String(form.get('content') ?? '');
		const revision = String(form.get('revision') ?? '');
		if (!validWikiAddress(slug)) {
			return fail(400, { error: 'Enter a valid title without slashes.', title, content });
		}
		const problem = await saveWikiPage(slug, slug, content, revision, true);
		if (problem) return fail(409, { error: problem, title, content });
		redirect(303, `/wiki/${encodeURIComponent(slug)}`);
	}
};
