import Vue from "vue";
import App from "./App.vue";
import router from "./routes/routes";
import axios, { AxiosStatic } from "axios";
import VueLoading from "vue-loading-overlay";

Vue.config.productionTip = false;
Vue.prototype.$http = axios;
declare module "vue/types/vue" {
  interface Vue {
    $http: AxiosStatic;
  }
}

Vue.use(VueLoading);
new Vue({
  render: (h) => h(App),
  router,
}).$mount("#app");
