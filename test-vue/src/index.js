import Vue from "vue";
import App from "./App.vue";
const app = new Vue({
    render(h) {
        return h(App);
    }
});
app.$mount("#App");
