<script lang="ts">
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
</script>

<main>
	<h2>Upload a file</h2>
	{#if form?.error}<p role="alert">{form.error}</p>{/if}
	<form method="POST" enctype="multipart/form-data">
		<input type="hidden" name="revision" value={data.revision} />
		<label>File <input type="file" name="file" required /></label>
		<button>Upload</button>
	</form>
</main>

<style>
	main {
		padding: 0 1rem;
		color: white;
	}
</style>
