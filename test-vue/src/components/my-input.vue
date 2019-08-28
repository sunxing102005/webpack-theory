<template>
    <div>
        <label>输入框：</label><input v-bind="$attrs" :value="value" @input="$emit('input',$event.target.value)" />
    </div>
</template>
<script>
export default {
    inheritAttrs: false,
    props: ['value'],
    mounted() {
        console.log('$attrs', this.$attrs);
    }
}
</script>