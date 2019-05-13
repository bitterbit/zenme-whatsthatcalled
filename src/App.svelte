<script>
	import {getWikipediaEntry} from './wikipedia.js'
	import SearchBar from './components/searchbar.svelte';
	import ResultCard from './components/resultcard.svelte';

	let wikiEntry = getDummyWikipediaEntry();
	let toTranslate = "";
	let subtitle = "màidāngláo";
	let img = "https://www.telegraph.co.uk/content/dam/business/2016/04/23/mcdonalds3_1-xlarge_trans_NvBQzQNjv4Bqek9vKm18v_rkIPH9w2GMNvrBHlngucm5MflHTV9w6vk.jpg";

	function onTranslateChange() {
		wikiEntry = getWikipediaEntry(toTranslate);
	}
	
	async function getDummyWikipediaEntry() {
		return "Type to find out...";
	}
</script>

<div class="container" align="center">
	<h1 style="text-align: center">ZenMeShuo?!</h1>
	<SearchBar on:change={onTranslateChange} bind:value={toTranslate}/>

	<div>
		{#await wikiEntry}
		<code>loading...</code>
		{:then entry}
		<ResultCard title={entry} subtitle={subtitle} img={img}/>
		{:catch error}
		<p>Error {error}</p>
		{/await}
	</div>
	
</div>
