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
