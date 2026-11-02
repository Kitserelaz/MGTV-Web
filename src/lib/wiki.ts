export const titleToAddress = (title: string) => title.trim().replace(/\s+/g, '_');

export const addressToTitle = (address: string) => address.replace(/_/g, ' ');

export const validWikiAddress = (address: string) =>
	address.length > 0 && address !== '.' && address !== '..' && !/[\/\\\u0000-\u001f\u007f]/.test(address);

export const wikiRedirect = (content: string) => {
	const match = /^\s*#redirect\s*\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/i.exec(content);
	if (!match) return null;
	const [title, fragment] = match[1].split('#', 2);
	const address = titleToAddress(title);
	return validWikiAddress(address) ? { address, fragment } : null;
};

export const resolveWikiRedirect = (pages: Record<string, { content: string }>, start: string) => {
	let address = start;
	let fragment: string | undefined;
	const visited = new Set<string>();
	while (Object.hasOwn(pages, address)) {
		if (visited.has(address)) return { address, fragment, loop: true };
		visited.add(address);
		const target = wikiRedirect(pages[address].content);
		if (!target) break;
		address = target.address;
		fragment = target.fragment ?? fragment;
	}
	return { address, fragment, loop: false };
};
