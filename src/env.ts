import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	token: {},
	WIKI_WEBHOOK_URL: { schema: (value) => value }
});
