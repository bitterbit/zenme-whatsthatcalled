<script>
	import SearchBar from './components/searchbar.svelte';
	let wikiEntry = getDummyWikipediaEntry();
	let toTranslate = "";

	function onTranslateChange() {
		wikiEntry = getWikipediaEntry(toTranslate);
	}
	
	async function getDummyWikipediaEntry() {
		return "Type to find out...";
	}
	
	async function getWikipediaEntry(entry) {
		const url = `https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=info|langlinks&lllang=zh&titles=`+entry;
		const res = await fetch(url);
		const j = await res.json();
		if (res.ok) {
			const pages = j.query.pages;
			const key = Object.keys(pages)[0];
			const title = pages[key].langlinks[0]["*"];
			return title;
		}
		throw new Error("Could'nt fetch from wikipedia");
	}
</script>

<div>
	<h1>ZenMeShuo?!</h1>
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
