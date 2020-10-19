<template>
  <div class="profile-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-6 offset-md-3 col-xs-12">
          <h1 class="text-xs-center">我的个人信息</h1>
          <form class="auth-form" @submit.prevent="updateSettings()">
            <fieldset>
              <fieldset class="form-group">
                <label style="font-size:22px;">用户名</label>
                <input
                  class="form-control form-control-lg"
                  type="text"
                  v-model="currentUser.username"
                  placeholder="用户名"
                />
              </fieldset>
              <fieldset class="form-group">
                <label style="font-size:22px;">姓名</label>
                <input
                  class="form-control form-control-lg"
                  type="text"
                  v-model="currentUser.name"
                  placeholder="姓名"
                />
              </fieldset>
              <fieldset class="form-group">
                <label style="font-size:22px;">电邮地址</label>
                <input
                  class="form-control form-control-lg"
                  type="email"
                  v-model="currentUser.email"
                  placeholder="电邮地址"
                />
              </fieldset>
              <fieldset class="form-group">
                <label style="font-size:22px;">电话号码</label>
                <input
                  class="form-control form-control-lg"
                  type="phone"
                  v-model="currentUser.phone"
                  placeholder="电话号码"
                />
              </fieldset>
              <fieldset class="form-group">
                <label style="font-size:22px;">密码</label>
                <input
                  class="form-control form-control-lg"
                  type="password"
                  v-model="currentUser.password"
                  placeholder="密码"
                  autocomplete="new-password"
                />
              </fieldset>
              <fieldset class="form-group">
                <label style="font-size:22px;">确认密码</label>
                <input
                  class="form-control form-control-lg"
                  type="password"
                  v-model="currentUser.confirmPassword"
                  placeholder="确认密码"
                  autocomplete="new-password"
                />
              </fieldset>
              <button class="btn btn-lg btn-primary pull-xs-right">
                更新个人信息
              </button>
              <span
                v-if="currentUser.state == 'needToChangePassword'"
                style="font-size:22px;"
              >
                <strong>
                  请马上修改密码！
                </strong>
              </span>
              <router-link v-else class="navbar-brand" :to="{ name: 'home' }"
                >返回主页</router-link
              >
            </fieldset>
          </form>
          <!-- Line break for logout button -->
          <hr />
          <button @click="logout" class="btn btn-outline-danger pull-xs-right">
            退出登录
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { LOGOUT, UPDATE_USER } from "@/store/actions.type";

export default {
  name: "Profile",
  computed: {
    ...mapGetters(["currentUser"])
  },
  mounted() {
    this.currentUser.password = null;
    this.currentUser.confirmPassword = null;
  },
  methods: {
    updateSettings() {
      this.$store.dispatch(UPDATE_USER, this.currentUser).then(() => {
        this.$router.push({ name: "home" });
      });
    },
    logout() {
      this.$store.dispatch(LOGOUT).then(() => {
        this.$router.push({ name: "home" });
      });
    }
  }
};
</script>
