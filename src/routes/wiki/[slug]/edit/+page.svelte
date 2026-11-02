<script lang="ts">
	import type { PageProps } from './$types';
	import { addressToTitle } from '../../../../lib/wiki';
	let { data, form }: PageProps = $props();
</script>

<main>
	<h2>{data.page ? 'Edit' : 'Create'} {addressToTitle(data.slug)}</h2>
	{#if form?.error}<p role="alert">{form.error}</p>{/if}
	<form method="POST">
		<input type="hidden" name="revision" value={data.revision} />
		<input type="hidden" name="creating" value={String(!data.page)} />
		<label>Title <input name="title" value={form?.title ?? addressToTitle(data.slug)} required /></label>
		<label>Content <textarea name="content" rows="12">{form?.content ?? data.page?.content ?? ''}</textarea></label>
		<button>{data.page ? 'Save changes' : 'Create page'}</button>
	</form>
</main>

<style>
	main {
		padding: 0 1rem;
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
