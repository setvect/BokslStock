import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    redirect: "/movie",
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
  {
    path: "/mongoCrud",
    name: "mongoCrud",
    component: () => import("@/components/mongo/mongoCrud.vue"),
  }
];

export default new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});
