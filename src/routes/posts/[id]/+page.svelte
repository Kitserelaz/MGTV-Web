<script lang="ts">
	import DiscordPost from '../../../lib/DiscordPost.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<DiscordPost message={data.message} />
