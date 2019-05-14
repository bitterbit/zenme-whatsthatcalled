<script>
	import translate from './fetchentry.js'
	import SearchBar from './components/searchbar.svelte';
	import ResultCard from './components/resultcard.svelte';
	import HistoryCard from './components/historycard.svelte';

	let wikiPromise;
	let prevEntry;
	let err = undefined;
	let toTranslate = "";

	let history = [];
	let loadedFirstItem = false;

	function entryInHistory(e){
		for (let i=0; i<history.length; i++){
			if (history[i].title == e.title){
				return i;
			}
		}
		return -1;
	}

	function onTranslateChange() {
		wikiPromise = translate(toTranslate);
		wikiPromise.then((entry) => {
			err = undefined;
			if (loadedFirstItem) {
				
				history = [prevEntry, ...history];
			}
			prevEntry = entry; 

			const index = entryInHistory(prevEntry);
			if (index >= 0) {
				setTimeout(() => {
					history = history.filter(h => h.title !== prevEntry.title);
				}, 100)
			}

			loadedFirstItem = true;
			console.log(history);
		}).catch(e => {
			err = e;
			console.log("error", e);
		});
	}

	function hasError(){
		if (err !== undefined){
			return true;
		}
		return false;
	}
</script>

<div class="container" align="center">
	<h1 style="text-align: center">ZenMeShuo?!</h1>
	<SearchBar on:change={onTranslateChange} bind:value={toTranslate}/>

	<div>
		{#if !loadedFirstItem}
			<h3>Type to find out...</h3>
		{:else if hasError() }
			<code>{err}</code>
		{:else}
			<ResultCard title={prevEntry.title} subtitle={prevEntry.subtitle} img={prevEntry.img}/>
		{/if}
	</div>
	<br>

	{#each history as entry}
		<HistoryCard	
			engTitle={entry.origin} 
			zhTitle={entry.title} 
			zhSubtitle={entry.subtitle}/>
	{/each}
</div>
