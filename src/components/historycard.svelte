<script>
    import { fly, slide, fade } from 'svelte/transition';
    export let engTitle;
    export let zhTitle;
    export let zhSubtitle;
</script>

<style>
    #card {
            text-align: left;
            width: 500px;
            height: 80px;
            border-radius: 15px;
            background-color: white;
            border: 1px solid #d7d7d7;
            position: relative;

            margin: 10px;
            padding: 10px;
    }
    h1 {
        font-weight: 100;
    }
    #seperator {
        border-left: 1px solid #d7d7d7;
        transform: rotate(-45deg);
    }
</style>

<div id="card" class="row" in:slide out:fade>
    <div class="column column-40">
        <h2 style="margin-bottom: -5px;">{zhTitle}</h2>
        <h5>{zhSubtitle}</h5>
    </div>
    <span id="seperator"></span>
    <div class="column column-60" style="text-align: right">
        <h1>{engTitle}</h1>
    </div>
</div>