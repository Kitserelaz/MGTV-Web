import { fetchMessages } from './lib/server/discord';

export const init = async () => {
	await fetchMessages();
};
