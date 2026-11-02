import { expect, test } from 'bun:test';
import { componentEmbed, messageLinkButtons, postPreview, wikiPreview } from '../src/lib/server/discord-preview';
import type { DisplayMessage } from '../src/lib/server/discord';

test('component embeds stay within Discord’s byte limit and neutralize mass mentions', () => {
	const preview = wikiPreview('😀'.repeat(1000), '@everyone ' + '😀'.repeat(1000));
	const embed = componentEmbed(preview);
	expect(embed.component.type).toBe(17);
	expect(embed.component.components[0].type).toBe(10);
	expect(embed.component.components[1].content).not.toContain('@everyone');
	expect(Buffer.byteLength(JSON.stringify(embed))).toBeLessThanOrEqual(3000);
});

test('post embeds include safe message link buttons between the post and invite links', () => {
	const components = [
		{ type: 1, components: [{ type: 2, style: 5, label: 'Original Post', url: 'https://example.com/original' }] },
		{ type: 17, components: [{ type: 9, components: [], accessory: { type: 2, style: 5, label: 'More', url: 'https://example.com/more' } }] },
		{ type: 1, components: [{ type: 2, style: 1, label: 'Interactive', custom_id: 'test' }, { type: 2, style: 5, label: 'Unsafe', url: 'javascript:alert(1)' }] }
	] as unknown as DisplayMessage['components'];
	const embed = componentEmbed(wikiPreview('Example', '😀'.repeat(1000)), 'https://example.com/posts/123', messageLinkButtons(components));
	const rows = embed.component.components.filter((item) => item.type === 1);
	const buttons = rows.flatMap((row) => row.components);
	expect(buttons.map((button) => button.label)).toEqual(['View Post', 'Original Post', 'More', 'Join Millenavia']);
	expect(buttons[0].url).toBe('https://example.com/posts/123');
	expect(buttons[3].url).toBe('https://discord.gg/fk4gPDeaCP');
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
	expect(postPreview({ ...message, content: 'a'.repeat(2200) }).description).toHaveLength(2000);
});
