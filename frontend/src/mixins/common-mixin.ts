import Vue from "vue";

export default Vue.extend({
  methods: {
    mixinOutput: () => {
      console.log("called mixin method. ");
    },
  },
});
