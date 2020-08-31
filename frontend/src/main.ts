import Vue from "vue";
import App from "./App.vue";
import router from "./routes/index";
import axios from "axios";

Vue.config.productionTip = false;
Vue.prototype.$http = axios;

new Vue({
  render: (h) => h(App),
  router,
}).$mount("#app");
