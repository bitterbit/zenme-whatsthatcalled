<script>
    import { fade } from 'svelte/transition';
    export let title;
    export let subtitle; // Màidāngláo
    export let img; // "https://www.telegraph.co.uk/content/dam/business/2016/04/23/mcdonalds3_1-xlarge_trans_NvBQzQNjv4Bqek9vKm18v_rkIPH9w2GMNvrBHlngucm5MflHTV9w6vk.jpg"
    export let wikiLink;

    let cardHeight;


    let screen = window.screen;
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
            border-radius: 25px;
            background-color: #EFF2F7;
            
        }
            

        #left {
            padding-top: 20px;
            padding-left: 20px;
        }
        #title {
            margin-bottom: -5px;
        }

        .big-button {
            color: white;
            background-color: #343F4B;
            border: none;
            border-radius: 20px;
        }

        /* a used instead of button for small devices */
        .small-button {
            color: #343F4B;
            font-weight: 600;
            text-transform: uppercase;   
            font-size: 11px;
            margin-left: 8px;
            line-height: 50px;
        }

        /* large devices */
        @media only screen and (min-width: 600px) {
            #card {
                width: 500px;
                height: 180px;
                position: relative;
            }
            #buttons {
                position: absolute;
                bottom: 5px;
            }
           
        }

        /* fix image not showing for small devices */
        @media only screen and (max-width: 600px) {
            .row {
                flex-direction: initial;
            }
        }

    </style>
    
    <div id="card" class="row" bind:clientWidth={cardHeight}>
        <div id="left" class="column column-60"  transition:fade>
            <div class="column">
                <h1 id="title">{title}</h1>
                <h5 id="subtitle">{subtitle}</h5>
            </div>
            <div id="buttons" class="column">
                <a href="#abc" class="{screen.width > 600 ? 'button big-button':'small-button'}">Play</a>
                <a href="#abc" class="{screen.width > 600 ? 'button big-button':'small-button'}">Wikipedia</a>
            </div>
        </div>
        <div transition:fade id="icon" style="height: {cardHeight}+px; background-image: url('{img}')" class="column column-40"></div>        
    </div>