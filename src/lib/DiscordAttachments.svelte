<script lang="ts">
	import { safeLink } from './discord-markdown';

	let { attachments }: {
		attachments: { id: string; name: string; url: string; contentType: string | null; description: string | null; spoiler: boolean }[];
	} = $props();
</script>

{#each attachments as attachment (attachment.id)}
	{#if safeLink(attachment.url)}
		{#snippet display()}
			{#if attachment.contentType?.startsWith('image/')}
				<a href={safeLink(attachment.url)}><img src={safeLink(attachment.url)} alt={attachment.description ?? attachment.name} /></a>
			{:else if attachment.contentType?.startsWith('video/')}
				<!-- svelte-ignore a11y_media_has_caption: Discord does not provide caption tracks for attachments. -->
				<video src={safeLink(attachment.url)} controls aria-label={attachment.description ?? attachment.name}></video>
			{:else if attachment.contentType?.startsWith('audio/')}
				<audio src={safeLink(attachment.url)} controls aria-label={attachment.description ?? attachment.name}></audio>
			{:else}
				<a href={safeLink(attachment.url)}>{attachment.name}</a>
			{/if}
		{/snippet}

		{#if attachment.spoiler}
			<details><summary>Spoiler attachment</summary>{@render display()}</details>
		{:else}
			{@render display()}
		{/if}
	{/if}
{/each}

<style>
	img, video {
		max-width: 100%;
		max-height: 20rem;
	}
</style>
