<script lang="ts">
	import type { DisplayMessage } from './server/discord';
	import DiscordPost from './DiscordPost.svelte';
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';

	let { data }: { data: { messages: DisplayMessage[]; page: number; pageCount: number; query: string; feed: string | null } } = $props();
	let messages = $state(untrack(() => data.messages));
	let pageCount = $state(untrack(() => data.pageCount));

	$effect(() => {
		messages = data.messages;
		pageCount = data.pageCount;
		const events = new EventSource(`/messages?page=${data.page}&q=${encodeURIComponent(data.query)}&feed=${encodeURIComponent(data.feed ?? '')}`);
		events.addEventListener('snapshot', (event) => {
			const snapshot: { messages: typeof messages; pageCount: number } = JSON.parse(event.data);
			messages = snapshot.messages;
			pageCount = snapshot.pageCount;
		});
		return () => events.close();
	});
</script>

<div class="newsList">
<form method="GET">
	<label for="search">Search news</label>
	<input id="search" name="q" type="search" value={data.query} />
	<button type="submit">Search</button>
</form>

{#each messages as message (message.id)}
	<DiscordPost {message} feed={data.feed} showLink />
{:else}
	<p>No posts found.</p>
{/each}

<nav aria-label="News pages">
	{#if data.page > 1}<button onclick={() => goto(`?page=${data.page - 1}&q=${encodeURIComponent(data.query)}`)}>Previous</button>{/if}
	<span>Page {data.page} of {pageCount}</span>
	{#if data.page < pageCount}<button onclick={() => goto(`?page=${data.page + 1}&q=${encodeURIComponent(data.query)}`)}>Next</button>{/if}
</nav>
</div>
<style>
	.newsList {
		display: flex;
		flex-direction: column;
		padding-left: 1rem;
		padding-right: 1rem;
	}

	form, p {
		color: white;
	}

	nav {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: white;
	}

	nav button {
		padding: 0.6rem 1.2rem;
		font: inherit;
		font-size: 1.1rem;
	}
</style>
