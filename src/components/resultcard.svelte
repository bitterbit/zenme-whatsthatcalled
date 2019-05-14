<script>
    import { fade } from 'svelte/transition';
    export let title;
    export let subtitle; // Màidāngláo
    export let img; // "https://www.telegraph.co.uk/content/dam/business/2016/04/23/mcdonalds3_1-xlarge_trans_NvBQzQNjv4Bqek9vKm18v_rkIPH9w2GMNvrBHlngucm5MflHTV9w6vk.jpg"
    export let wikiLink;
    // TODO on play
</script>
    
    <style>
        #icon {
            background-position: center center;
            background-repeat: no-repeat;
            border-radius: 25px;
        }
        #card {
            text-align: left;
            width: 500px;
            height: 180px;
            border-radius: 25px;
            background-color: #EFF2F7;
            position: relative;
        }
        #left {
            padding-top: 20px;
            padding-left: 20px;
        }
        #title {
            margin-bottom: -5px;
        }
        #buttons {
            position: absolute;
            bottom: 5px;
        }
        button {
            color: white;
            background-color: #343F4B;
            border: none;
            border-radius: 20px;
        }
    </style>
    
    <div id="card" class="row">
        <div id="left" class="column column-60"  transition:fade>
            <div class="column">
                <h1 id="title">{title}</h1>
                <h5 id="subtitle">{subtitle}</h5>
            </div>
            <div id="buttons" class="column">
                <button>PLAY</button>
                <button>WIKIPEDIA</button>
            </div>
        </div>
        <div transition:fade id="icon" style="background-image: url('{img}')" class="column column-40"></div>        
    </div>