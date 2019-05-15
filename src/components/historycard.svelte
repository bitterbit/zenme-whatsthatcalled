<script>
    import { fly, slide, fade } from 'svelte/transition';
    export let engTitle;
    export let zhTitle;
    export let zhSubtitle;
</script>

<style>
    #card {
            text-align: left;
            max-width: 500px;
            max-height: 80px;
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

    h1, h2, h3, h4, h5 {
        overflow: hidden;
        text-overflow: clip;
        white-space: nowrap;
    }

    #right {
        margin-left: 10px;
        padding-right: 10px;
    }

    /* fix image not showing for small devices */
    @media only screen and (max-width: 600px) {
        .row {
            flex-direction: initial;
        }
    }

    
</style>

<div id="card" class="row" in:slide out:fade>
    <div class="column column-50">
        <h2 style="margin-bottom: -5px;">{zhTitle}</h2>
        <h5>{zhSubtitle}</h5>
    </div>
    <div id="right" class="column column-50" style="text-align: right">
        <h1>{engTitle}</h1>
    </div>
</div>