<script lang="ts">
	import { addressToTitle } from '../../../lib/wiki';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<main>
	<h2>{addressToTitle(data.slug)}</h2>
	{#if data.from}<p>Redirected from <a href="/wiki/{encodeURIComponent(data.from)}?redirect=no">{addressToTitle(data.from)}</a></p>{/if}
	{#if data.page || data.members.length}
		{#if data.page?.file}
			{#if /\.(png|jpe?g|gif|webp|avif)$/i.test(data.page.file.filename)}
				<img src="/wiki/files/{encodeURIComponent(data.slug.slice(5))}" alt={data.page.file.filename} />
			{/if}
			<p><a href="/wiki/files/{encodeURIComponent(data.slug.slice(5))}">Download {data.page.file.filename}</a></p>
		{/if}
		{@html data.html}
		{#if data.members.length}
			{#each ['Subcategories', 'Pages', 'Files'] as group}
				{@const members = data.members.filter((member) => group === 'Subcategories' ? member.address.startsWith('Category:') : group === 'Files' ? member.address.startsWith('File:') : !member.address.startsWith('Category:') && !member.address.startsWith('File:'))}
				{#if members.length}
					<h3>{group}</h3>
					<ul>
						{#each members as member}
							<li><a href="/wiki/{encodeURIComponent(member.address)}">{addressToTitle(member.address)}</a></li>
						{/each}
					</ul>
				{/if}
			{/each}
		{/if}
		{#if data.categories.length}
			<p>Categories: {#each data.categories as category}<a href="/wiki/{encodeURIComponent(category)}">{addressToTitle(category.slice(9))}</a> {/each}</p>
		{/if}
		<p><a href="/wiki/{encodeURIComponent(data.slug)}/edit">Edit page</a></p>
	{:else}
		<p>This page does not exist yet.</p>
		<p><a href="/wiki/{encodeURIComponent(data.slug)}/edit">Create this page</a></p>
	{/if}
</main>

<style>
	main {
		padding: 0 1rem;
		color: white;
	}

	a {
		color: white;
	}

	main :global(img) {
		max-width: 100%;
	}

	main :global(table) {
		display: block;
		overflow-x: auto;
	}
</style>
