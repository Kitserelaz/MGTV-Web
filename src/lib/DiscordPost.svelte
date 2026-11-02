<script lang="ts">
	import DiscordMarkdown from './DiscordMarkdown.svelte';
	import DiscordComponents from './DiscordComponents.svelte';
	import DiscordAttachments from './DiscordAttachments.svelte';
	import type { messages } from './server/discord';

	let { message, showLink = false, feed = null }: { message: (typeof messages)[number]; showLink?: boolean; feed?: string | null } = $props();
</script>

<article class="newsPost">
	<strong>{message.author}</strong>
	<DiscordMarkdown content={message.content} mentions={message.mentions} />
	{#if message.ordinaryAttachments.length}
		<div><DiscordAttachments attachments={message.ordinaryAttachments} /></div>
	{/if}
	<DiscordComponents components={message.components} mentions={message.mentions} attachments={message.attachments} />
	{#if showLink}<a class="postLink" href="{feed ? `/feeds/${feed}` : ''}/posts/{message.id}">View post</a>{/if}
	<a class="postLink" href={message.url}>View in Discord</a>
</article>

<style>
	.newsPost {
		border: 1px solid #000022;
		border-radius: 0.2rem;
		background: #eeeeff;
		padding: 1rem;
		margin: 0.5rem 0;
		align-self: stretch;
		color: initial;
		overflow-wrap: anywhere;
	}

	.newsPost :global(a) {
		color: #000088;
	}

	.postLink {
		display: inline-block;
		padding: 0.4em 0.8em;
		border: 1px solid currentColor;
		border-radius: 0.25em;
		text-decoration: none;
	}

	.newsPost :global(.actions + .postLink),
	.postLink + .postLink {
		margin-left: 0.5rem;
	}
</style>
