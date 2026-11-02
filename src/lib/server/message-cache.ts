import { readFile, rename, writeFile } from 'node:fs/promises';

export const readMessageCache = async (path: string) => {
	try {
		return await readFile(path, 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw error;
	}
};

export const writeMessageCache = async (path: string, content: string) => {
	await writeFile(`${path}.tmp`, content);
	await rename(`${path}.tmp`, path);
};
