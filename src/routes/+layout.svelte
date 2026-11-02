<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header>
	<h1><a href="/">MGTV24 News</a></h1>
</header>

{@render children()}

<style>
	header {
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
