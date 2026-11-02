<script lang="ts">
	import type { PageProps } from './$types';
	import { addressToTitle } from '../../lib/wiki';
	let { data, form }: PageProps = $props();
</script>

<main>
	<h2>Wiki</h2>
	<p><a href="/wiki/upload">Upload a file</a></p>
	{#each Object.keys(data.pages) as slug}
		<p><a href="/wiki/{encodeURIComponent(slug)}">{addressToTitle(slug)}</a></p>
	{:else}
		<p>No wiki pages yet.</p>
	{/each}
	{#if data.categories.length}
		<h3>Categories</h3>
		{#each data.categories as category}
			<p><a href="/wiki/{encodeURIComponent(category)}">{addressToTitle(category.slice(9))}</a></p>
		{/each}
	{/if}

	<h3>Create a page</h3>
	{#if form?.error}<p role="alert">{form.error}</p>{/if}
	<form method="POST" action="?/create">
		<input type="hidden" name="revision" value={data.revision} />
		<label>Title <input name="title" value={form?.title ?? ''} required /></label>
		<label>Content <textarea name="content" rows="12">{form?.content ?? ''}</textarea></label>
		<button>Create page</button>
	</form>
</main>

<style>
	main {
		padding: 0 1rem;
		color: white;
	}

	a {
		color: white;
	}

	form, label {
		display: grid;
		gap: 0.5rem;
	}

	form {
		max-width: 45rem;
	}

	button {
		justify-self: start;
	}
</style>
