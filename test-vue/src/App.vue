<template>
    <div>
        <div> this is webpack demo!!</div>
        <my-input placeholder="请输入你的姓名" v-if="flag" @hook:created="childCreated" sunx="sx" @focus="focusIp" type="text" title="姓名" v-model="name" />
        <input placeholder="请输入你的性别" v-else type="text" title="性别" v-model="name" />
        <div>name:{{name}}</div>
        <button @click="flag=!flag">toggle input1</button>
        <button id="listener">test listener</button>
    </div>
</template>

<script>    
import MyInput from './components/my-input'
export default {
    components: { MyInput },
    data() {
        return {
            name: 'sunx',
            flag: true
        }
    },
    methods: {
        focusIp(val) {

        },
        childCreated() {
            console.log('parentCreated');
        }
    }


}
</script>

<style>
</style>
