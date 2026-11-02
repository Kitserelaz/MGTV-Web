<script lang="ts">
	import type { APIMessageTopLevelComponent, APIComponentInContainer, APISectionAccessoryComponent, APIComponentInMessageActionRow, APIUnfurledMediaItem, APIMediaGalleryItem } from 'discord.js';
	import DiscordMarkdown from './DiscordMarkdown.svelte';
	import { safeLink } from './discord-markdown';

	type Component = APIMessageTopLevelComponent | APIComponentInContainer | APISectionAccessoryComponent | APIComponentInMessageActionRow;
	let { components, mentions, attachments }: {
		components: APIMessageTopLevelComponent[];
		mentions: Record<string, string>;
		attachments: Record<string, string>;
	} = $props();

	const mediaUrl = (media: APIUnfurledMediaItem) => safeLink(
		media.proxy_url ?? (media.url.startsWith('attachment://') ? attachments[media.url.slice(13)] : media.url) ?? ''
	);
</script>

{#snippet mediaItem(item: APIMediaGalleryItem)}
	{#if mediaUrl(item.media)}
		{#if item.media.content_type?.startsWith('video/')}
			<!-- svelte-ignore a11y_media_has_caption: Discord does not provide caption tracks for these attachments. -->
			<video src={mediaUrl(item.media)} controls aria-label={item.description ?? 'Discord video'}></video>
		{:else}
			<img src={mediaUrl(item.media)} alt={item.description ?? 'Discord attachment'} />
		{/if}
	{/if}
{/snippet}

{#snippet render(component: Component)}
	{#if component.type === 10}
		<DiscordMarkdown content={component.content} {mentions} />
	{:else if component.type === 17}
		{#snippet container()}
			<div class="container" style:border-left-color={component.accent_color == null ? undefined : `#${component.accent_color.toString(16).padStart(6, '0')}`}>
				{#each component.components as child}{@render render(child)}{/each}
			</div>
		{/snippet}
		{#if component.spoiler}<details><summary>Spoiler</summary>{@render container()}</details>{:else}{@render container()}{/if}
	{:else if component.type === 9}
		<div class="section">
			<div>{#each component.components as child}{@render render(child)}{/each}</div>
			{@render render(component.accessory)}
		</div>
	{:else if component.type === 11}
		{#if component.spoiler}<details><summary>Spoiler</summary>{@render mediaItem(component)}</details>{:else}{@render mediaItem(component)}{/if}
	{:else if component.type === 12}
		<div class="gallery">
			{#each component.items as item}
				{#if item.spoiler}<details><summary>Spoiler</summary>{@render mediaItem(item)}</details>{:else}{@render mediaItem(item)}{/if}
			{/each}
		</div>
	{:else if component.type === 13}
		{#snippet file()}{#if mediaUrl(component.file)}<a href={mediaUrl(component.file)}>{component.name ?? 'Download file'}</a>{/if}{/snippet}
		{#if component.spoiler}<details><summary>Spoiler</summary>{@render file()}</details>{:else}{@render file()}{/if}
	{:else if component.type === 14}
		{#if component.divider !== false}<hr />{:else}<div class="spacing"></div>{/if}
	{:else if component.type === 1}
		<div class="actions">{#each component.components as child}{@render render(child)}{/each}</div>
	{:else if component.type === 2}
		{#if 'url' in component && safeLink(component.url)}
			<a class="button" href={safeLink(component.url)} rel="noopener noreferrer">{component.emoji?.name} {component.label}</a>
		{:else}
			<button disabled>{'emoji' in component ? component.emoji?.name : ''} {'label' in component ? component.label : 'Discord button'}</button>
		{/if}
	{:else if 'placeholder' in component}
		<button disabled>{component.placeholder ?? 'Discord menu'}</button>
	{/if}
{/snippet}

{#each components as component}{@render render(component)}{/each}

<style>
	.button {
		display: inline-block;
		padding: 0.4em 0.8em;
		border: 1px solid currentColor;
		border-radius: 0.25em;
		text-decoration: none;
	}

	.container {
		border-left: 4px solid;
		padding: 0.5rem;
	}

	.section {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	.gallery {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.actions {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	img, video {
		max-width: 100%;
		max-height: 20rem;
	}

	.spacing {
		height: 1rem;
	}
</style>
