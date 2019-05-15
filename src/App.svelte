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

	function addToHistory(entry){
		history = [entry, ...history];
	}

	function removeFromHistory(entry){
		const index = entryInHistory(entry);
		if (index >= 0) {
			setTimeout(() => {
				history = history.filter(h => h.title !== entry.title);
			}, 50)
		}
	}

	function onTranslateChange() {
		if (toTranslate == ""){
			return;
		}
		
		wikiPromise = translate(toTranslate);
		wikiPromise.then((entry) => {
			err = undefined;
			if (loadedFirstItem) {
				addToHistory(prevEntry);
				removeFromHistory(entry);
			}
			prevEntry = entry; 
			loadedFirstItem = true;
		}).catch(e => {
			if(prevEntry !== undefined && entryInHistory(prevEntry) == -1){
				addToHistory(prevEntry);
				console.log("added entry after error", prevEntry);
			}
			err = e;
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
		{#if hasError()}
			<h5>{err}</h5>
		{:else if !loadedFirstItem}
			<h3>Type to find out...</h3>			
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
