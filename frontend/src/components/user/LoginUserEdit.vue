<template>
  <b-modal id="passwordChangeForm" title="Modal with Popover" @ok.prevent="submit">
    <form>
      <div class="form-group row">
        <label class="control-label col-md-3 col-sm-3 col-xs-12">비밀번호</label>
        <div class="col-md-9 col-sm-9 col-xs-12">
          <input ref="password" v-model="password" v-validate="'required|min:4'" type="password" class="form-control" name="password" data-vv-as="비밀번호 " autocomplete="false" />
          <span v-if="errors.has('password')" class="error">{{ errors.first("password") }}</span>
        </div>
      </div>
      <div class="form-group row">
        <label class="control-label col-md-3 col-sm-3 col-xs-12">비밀번호(확인)</label>
        <div class="col-md-9 col-sm-9 col-xs-12">
          <input
            v-model="rePassword"
            v-validate="'required|confirmed:password'"
            type="password"
            class="form-control"
            name="re-password"
            data-vv-as="비밀번호 "
            autocomplete="false"
          />
          <span v-if="errors.has('re-password')" class="error">{{ errors.first("re-password") }}</span>
        </div>
      </div>
    </form>
  </b-modal>
</template>
<script lang="ts">
import { BvModalEvent } from "bootstrap-vue";
import { Vue, Component } from "vue-property-decorator";

@Component
export default class Setting extends Vue {
  private password = "";
  private rePassword = "";
  mounted() {
    //
  }
  open() {
    this.$bvModal.show("passwordChangeForm");
  }
  submit(event: BvModalEvent) {
    this.$validator.validateAll().then((result) => {
      if (!result) {
        event.preventDefault();
        return;
      }
      this.$bvModal.hide("passwordChangeForm");

      // TODO 이후 구현
    });
  }
}
</script>

<style scoped>
label {
  margin-top: 10px;
}
</style>
