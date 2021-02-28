import "jquery.cookie";
import $ from "jquery";

(function ($, sr) {
  var debounce = function (func, threshold, execAsap) {
    var timeout;

    return function debounced() {
      var obj = this,
        args = arguments;

      function delayed() {
        if (!execAsap) func.apply(obj, args);
        timeout = null;
      }

      if (timeout) clearTimeout(timeout);
      else if (execAsap) func.apply(obj, args);

      timeout = setTimeout(delayed, threshold || 100);
    };
  };

  // smartresize
  $.fn[sr] = function (fn) {
    return fn ? this.bind("resize", debounce(fn)) : this.trigger(sr);
  };
})($, "smartresize");

const PageBody = {};

// Sidebar
PageBody.init_sidebar = function () {
  PageBody.CURRENT_URL = window.location.href.split("#")[0].split("?")[0];
  PageBody.$BODY = $("body");
  PageBody.$MENU_TOGGLE = $("#menu_toggle");
  PageBody.$SIDEBAR_MENU = $("#sidebar-menu");
  PageBody.$LEFT_COL = $(".left_col");
  PageBody.$RIGHT_COL = $(".right_col");
  PageBody.$NAV_MENU = $(".nav_menu");

  // toggle small or large menu
  PageBody.$MENU_TOGGLE.on("click", function () {
    //  console.log('clicked - menu toggle');

    PageBody.$BODY.toggleClass("nav-md nav-sm");
    $.cookie("menu-small", PageBody.$BODY.hasClass("nav-sm"), {
      expires: 30,
      path: "/",
    });
    PageBody.setContentHeight();

    $(".dataTable").each(function () {
      $(this).dataTable().fnDraw();
    });
  });

  // recompute content when resizing
  $(window).smartresize(function () {
    PageBody.setContentHeight();
  });

  PageBody.setContentHeight();

  // fixed sidebar
  if ($.fn.mCustomScrollbar) {
    $(".menu_fixed").mCustomScrollbar({
      autoHideScrollbar: true,
      theme: "minimal",
      mouseWheel: {
        preventDefault: true,
      },
    });
  }
};

PageBody.setContentHeight = function () {
  // reset height
  PageBody.$RIGHT_COL.css("min-height", $(window).height());

  var bodyHeight = PageBody.$BODY.outerHeight(),
    contentHeight = bodyHeight;

  // normalize content
  contentHeight -= PageBody.$NAV_MENU.height();
  PageBody.$RIGHT_COL.css("min-height", contentHeight + 57);
};

PageBody.init = function () {
  PageBody.init_sidebar();
  let menuSmall = $.cookie("menu-small") == "true";
  if (menuSmall) {
    PageBody.$MENU_TOGGLE.trigger("click");
  }
};

export default PageBody;
