<script lang="ts">
	import { formatTimestamp, parseDiscordMarkdown, safeLink } from './discord-markdown';

	let { content, mentions }: { content: string; mentions: Record<string, string> } = $props();
	let nodes = $derived(parseDiscordMarkdown(content));
</script>

{#snippet renderNodes(nodes: ReturnType<typeof parseDiscordMarkdown>)}
	{#each nodes as node}
		{#if node.type === 'text'}{node.content}
		{:else if node.type === 'br'}<br />
		{:else if node.type === 'strong'}<strong>{@render renderNodes(node.content)}</strong>
		{:else if node.type === 'em'}<em>{@render renderNodes(node.content)}</em>
		{:else if node.type === 'underline'}<u>{@render renderNodes(node.content)}</u>
		{:else if node.type === 'strikethrough'}<s>{@render renderNodes(node.content)}</s>
		{:else if node.type === 'inlineCode'}<code>{node.content}</code>
		{:else if node.type === 'codeBlock'}<pre><code>{node.content}</code></pre>
		{:else if node.type === 'blockQuote'}<blockquote>{@render renderNodes(node.content)}</blockquote>
		{:else if node.type === 'spoiler'}<details><summary>Spoiler</summary>{@render renderNodes(node.content)}</details>
		{:else if node.type === 'heading'}<svelte:element this={`h${node.level}`}>{@render renderNodes(node.content)}</svelte:element>
		{:else if node.type === 'subtext'}<small>{@render renderNodes(node.content)}</small>
		{:else if node.type === 'url' || node.type === 'link' || node.type === 'autolink'}
			{#if safeLink(node.target)}<a class:post-button={node.type === 'link' && node.content.length === 1 && node.content[0].content?.trim() === 'Original Post'} href={safeLink(node.target)} rel="noopener noreferrer">{@render renderNodes(node.content)}</a>
			{:else}{@render renderNodes(node.content)}{/if}
		{:else if node.type === 'user' || node.type === 'role' || node.type === 'channel'}
			{mentions[node.id] ?? `${node.type === 'channel' ? '#' : '@'}${node.id}`}
		{:else if node.type === 'emoji'}
			<img class="emoji" src="https://cdn.discordapp.com/emojis/{node.id}.{node.animated ? 'gif' : 'png'}" alt=":{node.name}:" />
		{:else if node.type === 'twemoji'}{node.name}
		{:else if node.type === 'timestamp'}{formatTimestamp(node.timestamp, node.format)}
		{:else if node.type === 'everyone'}@everyone
		{:else if node.type === 'here'}@here
		{:else if typeof node.content === 'string'}{node.content}
		{:else if Array.isArray(node.content)}{@render renderNodes(node.content)}
		{/if}
	{/each}
{/snippet}

<div class="markdown">{@render renderNodes(nodes)}</div>

<style>
	.markdown {
		white-space: pre-wrap;
	}

	.emoji {
		width: 1em;
		height: 1em;
		vertical-align: middle;
	}

	.post-button {
		display: inline-block;
		padding: 0.4em 0.8em;
		border: 1px solid currentColor;
		border-radius: 0.25em;
		text-decoration: none;
	}

	div :global(h1), div :global(h2), div :global(h3) {
		margin: 0.5em 0;
	}
</style>
