<script>
	import SearchBar from './components/searchbar.svelte';

	let name = 'world';
	let MODE_ENG_CHN = 0;
	let MODE_CHN_ENG = 1;
	let mode = MODE_CHN_ENG;
	let toTranslate = "";
	let wikiEntry = getDummyWikipediaEntry();
	
	var log="...";
	
	let lang_from, lang_to = "";
	updateModeString();
	
	function updateModeString() {
		if (mode == MODE_CHN_ENG) {
			lang_from = "CHN";
			lang_to = "ENG";
			return;
		}
		lang_from = "ENG";
		lang_to = "CHN";
	}
	
	function toggleMode() {
		mode = (mode+1) % 2;
		updateModeString();
	}
	
	function onTranslateChange() {
		wikiEntry = getWikipediaEntry(toTranslate);
	}
	
	async function getDummyWikipediaEntry() {
		return "Type to find out...";
	}
	
	async function getWikipediaEntry(entry) {
		const url = `https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=info|langlinks&lllang=zh&titles=`+entry;
		log = url;
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
