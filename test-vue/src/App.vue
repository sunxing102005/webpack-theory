<template>
    <div>
        <div> this is webpack demo!!</div>
        <my-input placeholder="请输入你的姓名" type="text" title="姓名" v-model="name" />
    </div>
</template>

<script>    
import MyInput from './components/my-input'
export default {
    components: { MyInput },
    data() {
        return {
            name: 'sunx',
        }
    }
}
</script>

<style>
</style>
