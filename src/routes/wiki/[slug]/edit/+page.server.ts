import { fail, redirect } from '@sveltejs/kit';
import { getWiki, saveWikiPage } from '../../../../lib/server/wiki';
import { titleToAddress, validWikiAddress } from '../../../../lib/wiki';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const wiki = await getWiki();
	return { page: Object.hasOwn(wiki.pages, params.slug) ? wiki.pages[params.slug] : null, slug: params.slug, revision: wiki.revision };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		const content = String(form.get('content') ?? '');
		const revision = String(form.get('revision') ?? '');
		const creating = form.get('creating') === 'true';
		const address = titleToAddress(title);
		if (!validWikiAddress(address)) return fail(400, { error: 'Enter a valid title without slashes.', title, content });
		const problem = await saveWikiPage(params.slug, address, content, revision, creating);
		if (problem) return fail(409, { error: problem, title, content });
		redirect(303, `/wiki/${encodeURIComponent(address)}`);
	}
};
