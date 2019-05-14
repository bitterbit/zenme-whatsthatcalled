<script>
    export let value;
    let defaultValue = "McDonald's";
    let hasDefault = true;
    value = defaultValue;

    function onFocus(){
        value = "";
        hasDefault = false;
    }
</script>
<style>
    .default_value {
        color: #ccc;
    }
    input {
        max-width: 600px;
        color: #777;
        height: 50px;
        line-height: 50px;
        font-size: 40px;
        border: none;
        border-radius: 0px;
        border-bottom: 1px solid #eee;
    }
    input:hover, input:active, input:focus{
        border-bottom: 1px solid #ccc;
    }
</style>

<div style="text-align: center">
    <input 
        style="max-width: 600px"
        class="{hasDefault? 'default_value' : ''}" 
        on:change
        on:focus={onFocus} 
        bind:value={value} 
        type=text/>
</div>
