<template>
  <div>
    <div class="login_wrapper">
      <div class="animate form login_form">
        <section class="login_content">
          <b-form>
            <h1>복슬스톡</h1>
            <div>
              <b-form-input v-model="form.password" autofocus type="password" placeholder="Password" @keypress.13.prevent="loginProc"></b-form-input>
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
<script type="text/javascript">
export default {
  data() {
    return {
      form: {
        password: "",
      },
      redirect: undefined,
    };
  },
  watch: {
    $route: {
      handler(route) {
        this.redirect = route.query && route.query.redirect;
      },
      immediate: true,
    },
  },
  mounted() {
    // TODO 로그인 페이지 통과. 향후 아래 코드 제거
    // this.$router.push({ name: "setting", });
  },
  methods: {
    loginProc() {
      //TODO 로그인
    },
  },
};
</script>
