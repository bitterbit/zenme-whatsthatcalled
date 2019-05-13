<script>
	import {getWikipediaEntry} from './wikipedia.js'
	import SearchBar from './components/searchbar.svelte';

	let wikiEntry = getDummyWikipediaEntry();
	let toTranslate = "";

	function onTranslateChange() {
		wikiEntry = getWikipediaEntry(toTranslate);
	}
	
	async function getDummyWikipediaEntry() {
		return "Type to find out...";
	}
</script>

<div class="container">
	<h1 style="text-align: center">ZenMeShuo?!</h1>
	<SearchBar on:change={onTranslateChange} bind:value={toTranslate}/>
	<div>
		{#await wikiEntry}
		<code>loading...</code>
		{:then entry}
		<h1>{entry}</h1>
		{:catch error}
		<p>Error {error}</p>
		{/await}
	</div>
	
</div>
