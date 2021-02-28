import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "login",
    component: () => import("@/components/user/Login.vue"),
  },
  {
    path: "/home",
    name: "home",
    component: () => import("@/components/home.vue"),
    children: [
      {
        path: "setting",
        name: "setting",
        component: () => import("@/components/setting/Setting.vue"),
      },
      {
        path: "report",
        name: "report",
        component: () => import("@/components/report/Report.vue"),
      },
    ],
  },
  {
    path: "/movie",
    name: "index",
    component: () => import("@/components/MovieIndexPage.vue"),
  },
  {
    path: "/movie/:id",
    name: "show",
    component: () => import("@/components/MovieShowPage.vue"),
  },
];

export default new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});
