import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Index from "@/components/MovieIndexPage.vue";
import Show from "@/components/MovieShowPage.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "index",
    component: Index,
  },
  {
    path: "/:id",
    name: "show",
    component: Show,
  },
];

export default new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});
