<template>
  <b-modal id="passwordChangeForm" title="Modal with Popover" @ok.prevent="submit">
    <validation-observer ref="observer" v-slot="{ handleSubmit }">
      <b-form @submit.stop.prevent="handleSubmit(onSubmit)">
        <validation-provider v-slot="validationContext" vid="passwd" name="비밀번호" :rules="{ required: true, min: 4 }">
          <b-form-group>
            <b-form-input v-model="password" type="password" name="비밀번호" autocomplete="off" placeholder="비밀번호" :state="getValidationState(validationContext)" />
            <b-form-invalid-feedback>{{ validationContext.errors[0] }}</b-form-invalid-feedback>
          </b-form-group>
        </validation-provider>

        <validation-provider v-slot="validationContext" name="재입력" :rules="{ required: true, confirmed: 'passwd' }">
          <b-form-group>
            <b-form-input
              v-model="rePassword"
              :state="getValidationState(validationContext)"
              type="password"
              name="rePassword"
              autocomplete="off"
              placeholder="비밀번호 다시입력"
            />
            <b-form-invalid-feedback>{{ validationContext.errors[0] }}</b-form-invalid-feedback>
          </b-form-group>
        </validation-provider>

        <b-button type="submit" variant="primary">Submit</b-button>
        <b-button class="ml-2" @click="resetForm()">Reset</b-button>
      </b-form>
    </validation-observer>
  </b-modal>
</template>

<script lang="ts">
import { BvModalEvent } from "bootstrap-vue";
import Vue from "vue";

export default Vue.extend({
  data() {
    return {
      password: "",
      rePassword: "",
    };
  },
  mounted() {
    this.resetForm();
  },
  methods: {
    getValidationState({ dirty, validated, valid = null }: { dirty: boolean; validated: boolean; valid: any }) {
      return dirty || validated ? valid : null;
    },
    resetForm() {
      this.password = "";
      this.rePassword = "";
    },
    onSubmit() {
      alert("Form submitted!");
    },
    open() {
      this.$bvModal.show("passwordChangeForm");
    },
    submit(event: BvModalEvent) {
      console.log("event :>> ", event);
    },
  },
});
</script>

<style scoped>
label {
  margin-top: 10px;
}
</style>
