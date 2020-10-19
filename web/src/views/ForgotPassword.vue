<template>
  <div class="auth-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-6 offset-md-3 col-xs-12">
          <h1 class="text-xs-center">重置密码</h1>
          <ul v-if="errors" class="error-messages">
            <li v-for="(v, k) in errors" :key="k">{{ k }} {{ v | error }}</li>
          </ul>
          <form @submit.prevent="onSubmit(email)">
            <fieldset class="form-group">
              <input
                class="form-control form-control-lg"
                type="text"
                v-model="email"
                placeholder="电邮地址"
              />
            </fieldset>
            <button class="btn btn-lg btn-primary pull-xs-right">提交</button>
          </form>
          <p class="text-xs-left">
            <router-link :to="{ name: 'login' }">取消</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { RESET_PASSWORD } from "@/store/actions.type";

export default {
  name: "ForgotPassword",
  data() {
    return {
      email: null,
      password: null
    };
  },
  methods: {
    onSubmit(email) {
      this.$store
        .dispatch(RESET_PASSWORD, { email })
        .then(() => this.$router.push({ name: "home" }));
    }
  },
  computed: {
    ...mapState({
      errors: state => state.auth.errors
    })
  }
};
</script>
