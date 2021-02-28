import Vue from "vue";
import App from "./App.vue";
import router from "./routes/routes";
import axios, { AxiosStatic } from "axios";
import VueLoading from "vue-loading-overlay";
import BootstrapVue from "bootstrap-vue";
import VeeValidate from "vee-validate";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "font-awesome/css/font-awesome.min.css";
import "@/assets/custom.css";
import "@/assets/app.css";

Vue.config.productionTip = false;
Vue.prototype.$http = axios;
declare module "vue/types/vue" {
  interface Vue {
    $http: AxiosStatic;
  }
}
Vue.use(BootstrapVue);
Vue.use(VueLoading);
Vue.use(VeeValidate, {
  locale: "ko",
  events: "blur",
  dictionary: {
    //TODO
  },
});

new Vue({
  render: (h) => h(App),
  router,
}).$mount("#app");
