<template>
  <div id="userEdit" class="modal fade" role="dialog">
    <div class="modal-dialog">
      <!-- Modal content-->
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">비밀번호 수정</h5>
          <button type="button" class="close" data-dismiss="modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group row">
            <label class="control-label col-md-3 col-sm-3 col-xs-12">비밀번호</label>
            <div class="col-md-9 col-sm-9 col-xs-12">
              <input ref="password" v-model="password" v-validate="'required|min:4'" type="password" class="form-control" name="password" data-vv-as="비밀번호 " />
              <span v-if="errors.has('password')" class="error">{{ errors.first("password") }}</span>
            </div>
          </div>
          <div class="form-group row">
            <label class="control-label col-md-3 col-sm-3 col-xs-12">비밀번호(확인)</label>
            <div class="col-md-9 col-sm-9 col-xs-12">
              <input v-model="rePassword" v-validate="'required|confirmed:password'" type="password" class="form-control" name="re-password" data-vv-as="비밀번호 " />
              <span v-if="errors.has('re-password')" class="error">{{ errors.first("re-password") }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" @click="submit()">확인</button>
            <button type="button" class="btn btn-secondary" data-dismiss="modal">닫기</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script type="text/javascript">
export default {
  data() {
    return {
      password: null,
      rePassword: null,
    };
  },
  mounted() {},
  methods: {
    openForm() {
      $("#userEdit").modal();
    },
    submit() {
      this.$validator.validateAll().then((result) => {
        if (!result) {
          return;
        }
        // TODO 이후 구현
      });
    },
  },
};
</script>
<style scoped>
label {
  margin-top: 10px;
}
</style>
