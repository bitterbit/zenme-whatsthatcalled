<script>
	import translate from './fetchentry.js'
	import SearchBar from './components/searchbar.svelte';
	import ResultCard from './components/resultcard.svelte';
	import HistoryCard from './components/historycard.svelte';

	let wikiEntry;
	let toTranslate = "";

	let history = [];
	let loadedFirstItem = false;

	function onTranslateChange() {
		wikiEntry = translate(toTranslate);
		wikiEntry.then((entry) => {
			loadedFirstItem = true;
			history.push(entry);
			console.log("loaded new entry", entry, history);
		});
	}
</script>

<div class="container" align="center">
	<h1 style="text-align: center">ZenMeShuo?!</h1>
	<SearchBar on:change={onTranslateChange} bind:value={toTranslate}/>

	<div>
		{#if !loadedFirstItem}
			<code>Type to find out...</code>
		{:else}

			{#await wikiEntry}
			<code>loading...</code>
			{:then entry}
			<ResultCard title={entry.title} subtitle={entry.subtitle} img={entry.img}/>
			{:catch error}
			<p>Error {error}</p>
			{/await}
			
		{/if}
	</div>
	<br>
	<HistoryCard engTitle={"McDonald's"} zhTitle={"麦当劳"} zhSubtitle={"màidāngláo"}/>
</div>
