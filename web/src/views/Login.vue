<template>
  <div class="auth-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-6 offset-md-3 col-xs-12">
          <h1 class="text-xs-center">用户登录</h1>
          <p class="text-xs-center">
            <router-link :to="{ name: 'register' }"
              >需要一个用户账号?</router-link
            >
          </p>
          <ul v-if="errors" class="error-messages">
            <li v-for="(v, k) in errors" :key="k">{{ k }} {{ v | error }}</li>
          </ul>
          <form @submit.prevent="onSubmit(email, password)">
            <fieldset class="form-group">
              <input
                class="form-control form-control-lg"
                type="text"
                v-model="email"
                placeholder="电邮地址（用户名）"
              />
            </fieldset>
            <fieldset class="form-group">
              <input
                class="form-control form-control-lg"
                type="password"
                v-model="password"
                placeholder="密码"
              />
            </fieldset>
            <button class="btn btn-lg btn-primary pull-xs-right">登录</button>
          </form>
          <p class="text-xs-left">
            <router-link :to="{ name: 'forgotPassword' }"
              >忘记密码?</router-link
            >
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import { LOGIN } from "@/store/actions.type";

export default {
  name: "Login",
  data() {
    return {
      email: null,
      password: null
    };
  },
  methods: {
    onSubmit(email, password) {
      this.$store
        .dispatch(LOGIN, { email, password })
        .then(() => this.$router.push({ name: "home" }));
    }
  },
  computed: {
    ...mapGetters(["currentUser"]),
    ...mapState({
      errors: state => state.auth.errors
    })
  }
};
</script>
