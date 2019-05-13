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
<span>Word: </span>

<input class="{hasDefault? 'default_value' : ''}" on:focus={onFocus} on:change bind:value={value} type=text/>