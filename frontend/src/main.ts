import Vue from "vue";
import App from "./App.vue";
import router from "@/routes/routes";
import axios, { AxiosStatic } from "axios";
import VueLoading from "vue-loading-overlay";
import BootstrapVue from "bootstrap-vue";
import { ValidationObserver, ValidationProvider, extend, localize } from "vee-validate";
import ko from "vee-validate/dist/locale/ko.json";
import * as rules from "vee-validate/dist/rules";
import commonMixin from "@/mixins/common-mixin";

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
declare module "vee-validate";

Vue.use(BootstrapVue);
Vue.use(VueLoading);

// https://gracefullight.dev/2019/11/26/Vee-validate-installing-all-rules-ts7053/
for (const [rule, validation] of Object.entries(rules)) {
  extend(rule, {
    ...validation,
  });
}

localize("ko", ko);
Vue.component("ValidationObserver", ValidationObserver);
Vue.component("ValidationProvider", ValidationProvider);
Vue.mixin(commonMixin);

new Vue({
  render: (h) => h(App),
  router,
}).$mount("#app");
