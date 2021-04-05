<template>
  <div class="top_nav">
    <div class="nav_menu">
      <nav>
        <div class="nav toggle">
          <a @click="toggleMenu()">
            <i class="fa fa-bars"></i>
          </a>
        </div>
        <ul class="nav navbar-nav navbar-right">
          <li class>
            <a href="javascript:void(0)" class="user-profile dropdown-toggle" @click="logout()">
              로그아웃
              <span class="glyphicon glyphicon-log-out"></span>
            </a>
          </li>
          <li class="dropdown">
            <a href="javascript:void(0);" class="dropdown-toggle info-number _edit-my" @click="chnagePassword()">
              비밀번호 변경
              <i class="glyphicon glyphicon-cog"></i>
            </a>
          </li>
        </ul>
      </nav>
    </div>
    <LoginUserEdit ref="passwordModal" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import LoginUserEdit from "../user/LoginUserEdit.vue";
import Cookies from "js-cookie";

export default Vue.extend({
  components: {
    LoginUserEdit,
  },
  computed: {
    passwordModal(): InstanceType<typeof LoginUserEdit> {
      return this.$refs.passwordModal as InstanceType<typeof LoginUserEdit>;
    },
  },
  mounted() {
    Cookies.get("menu-small") == "true" && this.toggleMenu();
  },
  methods: {
    logout() {
      // TODO
      this.$router.push({ name: "login" });
    },
    chnagePassword() {
      this.passwordModal.open();
    },
    toggleMenu() {
      $("body").toggleClass("nav-md nav-sm");
      Cookies.set("menu-small", $("body").hasClass("nav-sm").toString(), { expires: 30, path: "/" });
    },
  },
});
</script>
