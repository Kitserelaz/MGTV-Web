import { expect, test } from 'bun:test';
import { componentEmbed, wikiPreview } from '../src/lib/server/discord-preview';

test('component embeds stay within Discord’s byte limit and neutralize mass mentions', () => {
	const preview = wikiPreview('😀'.repeat(1000), '@everyone ' + '😀'.repeat(1000));
	const embed = componentEmbed(preview);
	expect(embed.component.type).toBe(17);
	expect(embed.component.components[0].type).toBe(10);
	expect(embed.component.components[0].content).not.toContain('@everyone');
	expect(Buffer.byteLength(JSON.stringify(embed))).toBeLessThanOrEqual(3000);
});
