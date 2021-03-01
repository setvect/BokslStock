<template>
  <b-modal id="passwordChangeForm" title="Modal with Popover" @ok.prevent="submit">
    <validation-observer ref="observer" v-slot="{ handleSubmit }">
      <b-form @submit.stop.prevent="handleSubmit(onSubmit)">
        <validation-provider v-slot="validationContext" vid="passwd" name="비밀번호" :rules="{ required: true, min: 4 }">
          <b-form-group>
            <b-form-input v-model="password" :state="getValidationState(validationContext)" type="password" name="비밀번호" autocomplete="off" placeholder="비밀번호" />
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
import { ValidationProvider } from "vee-validate";

import { Vue, Component } from "vue-property-decorator";

@Component
export default class Setting extends Vue {
  private password = "";
  private rePassword = "";
  $refs!: {
    observer: InstanceType<typeof ValidationProvider>;
    // validationObserverRef: InstanceType<typeof ValidationObserver>;
  };
  mounted() {
    this.resetForm();
  }

  getValidationState({ dirty, validated, valid = null }: { dirty: boolean; validated: boolean; valid: any }) {
    return dirty || validated ? valid : null;
  }
  resetForm() {
    this.password = "";
    this.rePassword = "";
  }
  onSubmit() {
    alert("Form submitted!");
  }

  open() {
    this.$bvModal.show("passwordChangeForm");
  }
  submit(event: BvModalEvent) {
    //
  }
}
</script>

<style scoped>
label {
  margin-top: 10px;
}
</style>
