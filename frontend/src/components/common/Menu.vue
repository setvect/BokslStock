<template>
  <!-- sidebar menu -->
  <div id="sidebar-menu" class="main_menu_side hidden-print main_menu">
    <div class="menu_section">
      <ul class="nav side-menu">
        <li :class="{ active: currentName == 'setting' }">
          <router-link :to="{ name: 'setting' }"> <i class="fa fa-gear"></i> 설정 </router-link>
        </li>
        <li :class="{ active: currentName == 'report' }">
          <router-link :to="{ name: 'report' }"> <i class="fa fa-newspaper-o"></i> 리포트</router-link>
        </li>
      </ul>
    </div>
  </div>
  <!-- /sidebar menu -->
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  computed: {
    currentName(): string {
      return this.$route.name || "";
    },
  },
  beforeCreate() {
    document.body.className = "nav-md";
  },
});
</script>

<style scoped>
.main_menu .fa {
  text-align: left;
}
</style>
