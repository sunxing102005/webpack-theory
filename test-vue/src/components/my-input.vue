<template>
    <div>
        <label>输入框：</label><input v-bind="$attrs" v-on="$listenserAll" :value="value" />
        <div> address:{{address}}</div>
        <button @click="change">change address</button>
    </div>
</template>
<script>
function listener() {
    console.log('------listener-----');
}
export default {
    inheritAttrs: false,
    props: ['value', 'type'],
    data() {
        return {
            address: 'anShan',
            timeout: null
        }
    },
    methods: {
        change() {
            this.address = 'tieDong'
        }
    },
    beforeCreate() {
        console.log('beforeCreate-----');
        console.log('data', this.$data);
        console.log('props', this.$props);
        console.log('el', this.$el);
        console.log('-----------');
    },
    created() {
        // console.log('childCreated');
        console.log('created-----');
        console.log('data', this.$data);
        console.log('props', this.$props);
        console.log('el', this.$el);
        console.log('-----------');
    },
    beforeMount() {
        console.log('beforeMount-----');
        console.log('data', this.$data);
        console.log('props', this.$props);
        console.log('el', this.$el);
        console.log('-----------');

    },
    beforeUpdate(val) {
        console.log('beforeUpdate-----');
        console.log('data', this.$data);
        console.log('props', this.$props);
        console.log('el', this.$el);
        console.log('-----------');
    },
    updated(val) {
        console.log('updated-----');
        console.log('data', this.$data);
        console.log('props', this.$props);
        console.log('el', this.$el);
        console.log('-----------');
    },
    mounted() {
        // console.log('$attrs', this.$attrs);
        // console.log('$listeners', this.$listeners);
        console.log('mounted-----');
        console.log('data', this.$data);
        console.log('props', this.$props);
        console.log('el', this.$el);
        console.log('-----------');
        const btn = document.getElementById('listener');
        btn.addEventListener('click', listener);
        // this.timeout = window.setInterval(() => {
        //     console.log('--- setInterval ----')
        // }, 500)
    },
    beforeDestroy() {
        // console.log('$attrs', this.$attrs);
        // console.log('$listeners', this.$listeners);
        console.log('beforeDestroy-----');
        console.log('data', this.$data);
        console.log('props', this.$props);
        console.log('el', this.$el);
        console.log('-----------');

    },
    destroyed() {
        console.log('destroyed-----');
        console.log('data', this.$data);
        console.log('props', this.$props);
        console.log('el', this.$el);
        console.log('-----------');
        const btn = document.getElementById('listener');
        btn.removeEventListener('click', listener);
        window.clearInterval(this.timeout)
    },
    computed: {
        $listenserAll() {
            return Object.assign(
                {},
                this.$listeners,
                { input: (event) => this.$emit('input', event.target.value) })
        }
    }
}
</script>