import VueRouter from "vue-router";
const router = new VueRouter({
    mode: "hash", // 'history',
    routes: [
        {
            name: "管理",
            meta: {
                icon: "el-icon-coin"
            },
            path: "",
            component: () => import("@/views/test.vue")
            // children: [
            //     {
            //         name: "用户管理",
            //         meta: {},
            //         path: "/userManage",
            //         // url: "/user-manage/index",
            //         component: () =>
            //             import("@/views/manage/user-manage/index.vue")
            //     },
            //     {
            //         name: "订单管理",
            //         meta: {},
            //         path: "/orderManage",
            //         // url: "/order-manage/index",
            //         component: () =>
            //             import("@/views/manage/order-manage/index.vue")
            //     }
            // ]
        }
    ]
});
export default router;
