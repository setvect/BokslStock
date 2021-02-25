import Vue from "vue";
import CommonUtil from "@/utils/common-util";
// TODO global 선언하는 방법으로 변경
import $ from "jquery";

/*
 * 전역적으로 사용할 디렉티브 정의
 */

// 줄바꿈 -> br 태그 적용
Vue.directive("br", {
  bind: (el: HTMLElement, binding) => {
    $(el).html(CommonUtil.toBr(binding.value));
  },
});
