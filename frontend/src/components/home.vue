<template>
  <div class="container body">
    <div class="main_container">
      <div class="col-md-3 left_col">
        <div class="left_col scroll-view">
          <div class="navbar nav_title" style="border: 0">
            <a href="index.html" class="site_title">
              <i class="fa fa-paw"></i>
              <router-link to="/" style="padding-left: 10px">
                <span style="color: white">복슬스톡</span>
              </router-link>
            </a>
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

<script>
import LeftMenu from "./common/Menu";
import Top from "./common/Top";
import pageBody from "@/utils/custom.js";
export default {
  name: "Home",
  components: {
    LeftMenu,
    Top,
  },
  mounted() {
    pageBody.init();
  },
};
</script>
