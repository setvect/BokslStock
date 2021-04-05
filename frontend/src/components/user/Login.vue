<template>
  <div>
    <div class="login_wrapper">
      <div class="animate form login_form">
        <section class="login_content">
          <b-form>
            <h1>복슬 포털</h1>
            <div>
              <b-form-input v-model="form.password" type="password" placeholder="Password" @keypress.13.prevent="loginProc"></b-form-input>
            </div>
            <div>
              <b-form-checkbox v-model="form['remember-me']" value="on" unchecked-value="" @click="loginProc">로그인 유지</b-form-checkbox>
            </div>
            <div style="padding-top: 20px">
              <b-button variant="outline-secondary" @click.prevent="loginProc">Login</b-button>
            </div>
            <div class="clearfix"></div>
          </b-form>
        </section>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { GenericObject } from "@/api/types";
import Vue from "vue";

export default Vue.extend({
  name: "Home",
  components: {
    //
  },
  data() {
    return {
      redirect: {} as GenericObject,
      form: {
        password: "",
      },
    };
  },
  watch: {
    $route: {
      immediate: true,
      handler(route: GenericObject) {
        this.redirect = route.query && route.query.redirect;
      },
    },
  },
  beforeCreate() {
    document.body.className = "login";
  },
  mounted() {
    //
  },
  methods: {
    loginProc() {
      this.$router.push({ name: "setting" });
    },
  },
});
</script>
