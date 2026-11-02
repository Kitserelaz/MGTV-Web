import { fail, redirect } from '@sveltejs/kit';
import { getWiki, saveWikiFile } from '../../../lib/server/wiki';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ revision: (await getWiki()).revision });

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const file = form.get('file');
		if (!(file instanceof File)) return fail(400, { error: 'Choose a file.' });
		const problem = await saveWikiFile(file, String(form.get('revision') ?? ''));
		if (problem) return fail(400, { error: problem });
		redirect(303, `/wiki/${encodeURIComponent(`File:${file.name.replace(/\s+/g, '_')}`)}`);
	}
};
