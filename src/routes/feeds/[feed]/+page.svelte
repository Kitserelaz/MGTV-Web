<script lang="ts">
	import NewsFeed from '../../../lib/NewsFeed.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<NewsFeed {data} />
