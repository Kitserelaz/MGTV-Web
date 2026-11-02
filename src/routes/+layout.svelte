<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';

	let { children }: LayoutProps = $props();
	let preview = $derived(page.data.preview ?? {
		title: 'MGTV24 News',
		description: 'News and wiki pages from the MGTV24 community.',
		type: 'website'
	});
	let embedUrl = $derived(`${page.url.origin}/discord-embed?path=${encodeURIComponent(page.url.pathname)}`);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{preview.title}</title>
	<meta property="og:title" content={preview.title} />
	<meta property="og:description" content={preview.description} />
	<meta property="og:url" content={page.url.href} />
	<meta property="og:type" content={preview.type} />
	<link rel="discord:component-embed" type="application/json" href={embedUrl} />
</svelte:head>

<header>
	<h1><a href="/">MGTV24 News</a></h1>
	<a href="/wiki">Wiki</a>
</header>

{@render children()}

<style>
	header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 1rem;
		color: white;
	}

	header a {
		color: inherit;
		text-decoration: none;
	}

	@font-face {
		font-family: 'gg sans';
		src: url('/fonts/ggsansvf-VF.woff2') format('woff2');
		font-style: normal;
		font-weight: 100 900;
	}

	@font-face {
		font-family: 'gg sans';
		src: url('/fonts/ggsansvf-Italic-VF.woff') format('woff');
		font-style: italic;
		font-weight: 100 900;
	}

	@font-face {
		font-family: Nougat;
		src: url('/fonts/Nougat-ExtraBlack.ttf') format('truetype');
		font-weight: 900;
	}

	:global(body) {
		background: #000033;;
		font-family: 'gg sans', sans-serif;
	}

	:global(h1, h2, h3, h4, h5, h6) {
		font-family: Nougat, sans-serif;
		font-weight: 900;
	}
</style>
