import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "index",
    component: () => import("@/components/MovieIndexPage.vue"),
  },
  {
    path: "/:id",
    name: "show",
    component: () => import("@/components/MovieShowPage.vue"),
  }
];

export default new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});
