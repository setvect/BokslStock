<template>
  <div class="container body">
    <div class="main_container">
      <div class="col-md-3 left_col">
        <div class="left_col scroll-view">
          <div class="navbar nav_title" style="border: 0">
            <div class="site_title">
              <i class="fa fa-paw"></i>
              <router-link to="/" style="margin-left: 10px">
                <span style="color: white">복슬스톡</span>
              </router-link>
            </div>
          </div>

          <div class="clearfix"></div>
          <!-- sidebar menu -->
          <LeftMenu />
          <!-- /sidebar menu -->
        </div>
      </div>

      <!-- top navigation -->
      <Top />
      <!-- /top navigation -->

      <!-- page content -->
      <div class="right_col">
        <router-view />
      </div>
      <!-- /page content -->
    </div>
  </div>
</template>

<script lang="ts">
import LeftMenu from "@/components/common/Menu.vue";
import Top from "@/components/common/Top.vue";
import { Vue, Component } from "vue-property-decorator";

@Component({
  components: {
    LeftMenu,
    Top,
  },
})
export default class Home extends Vue {
  beforeCreate() {
    document.body.className = "nav-md";
  }
  mounted() {
    //
  }
}
</script>
