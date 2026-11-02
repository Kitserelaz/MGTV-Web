import { expect, test } from 'bun:test';
import { componentEmbed, postPreview, wikiPreview } from '../src/lib/server/discord-preview';
import type { DisplayMessage } from '../src/lib/server/discord';

test('component embeds stay within Discord’s byte limit and neutralize mass mentions', () => {
	const preview = wikiPreview('😀'.repeat(1000), '@everyone ' + '😀'.repeat(1000));
	const embed = componentEmbed(preview);
	expect(embed.component.type).toBe(17);
	expect(embed.component.components[0].type).toBe(10);
	expect(embed.component.components[1].content).not.toContain('@everyone');
	expect(Buffer.byteLength(JSON.stringify(embed))).toBeLessThanOrEqual(3000);
});

test('post previews preserve line breaks and omit recurring footers and separators', () => {
	const message = {
		author: 'Reporter',
		content: '# Headline\n\nFirst story\nSecond story\n====\n*For you who are reading this outside the server: footer*\n*Servers that support MGTV24 News media on discord: footer*',
		components: []
	} as unknown as DisplayMessage;
	const preview = postPreview(message);
	expect(preview.description).toBe('# Headline\n\nFirst story\nSecond story');
	const embed = componentEmbed(preview);
	expect(embed.component.components[0].content).toBe('**News from Reporter \\| MGTV24 News**');
	expect(embed.component.components[1].content).toBe(preview.description);
	expect(postPreview({ ...message, content: 'a'.repeat(1200) }).description).toHaveLength(1000);
});
