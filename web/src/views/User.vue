<template>
  <div class="profile-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-6 offset-md-3 col-xs-12">
          <h1 v-if="user.id" class="text-xs-center">用户信息</h1>
          <h1 v-else class="text-xs-center">创建用户</h1>
          <form @submit.prevent="updateUser()">
            <fieldset>
              <fieldset class="form-group">
                <label style="font-size:22px;">用户名</label>
                <input
                  class="form-control form-control-lg"
                  type="text"
                  v-model="user.username"
                  placeholder="用户名"
                />
              </fieldset>
              <fieldset class="form-group">
                <label style="font-size:22px;">姓名</label>
                <input
                  class="form-control form-control-lg"
                  type="text"
                  v-model="user.name"
                  placeholder="姓名"
                />
              </fieldset>
              <fieldset class="form-group">
                <label style="font-size:22px;">电邮地址</label>
                <input
                  class="form-control form-control-lg"
                  type="email"
                  v-model="user.email"
                  placeholder="电邮地址"
                />
              </fieldset>
              <fieldset class="form-group">
                <label style="font-size:22px;">电话号码</label>
                <input
                  class="form-control form-control-lg"
                  type="phone"
                  v-model="user.phone"
                  placeholder="电话号码"
                />
              </fieldset>
              <fieldset class="form-group">
                <label style="font-size:22px;">密码</label>
                <input
                  class="form-control form-control-lg"
                  type="password"
                  v-model="user.password"
                  placeholder="密码"
                  autocomplete="new-password"
                />
              </fieldset>
              <fieldset class="form-group">
                <label style="font-size:22px;">确认密码</label>
                <input
                  class="form-control form-control-lg"
                  type="password"
                  v-model="user.confirmPassword"
                  placeholder="确认密码"
                  autocomplete="new-password"
                />
              </fieldset>
              <fieldset class="form-group">
                <label style="font-size:22px;">用户角色</label>
                <div class="form-control">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="isSystemAdmin"
                      v-model="user.isSystemAdmin"
                    />
                    <label class="form-check-label" for="isSystemAdmin"
                      >&nbsp;系统管理员</label
                    >
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="isClassAdmin"
                      v-model="user.isClassAdmin"
                    />
                    <label class="form-check-label" for="isClassAdmin"
                      >&nbsp;学修管理员</label
                    >
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="isTeacher"
                      v-model="user.isTeacher"
                    />
                    <label class="form-check-label" for="isTeacher"
                      >&nbsp;辅导员</label
                    >
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="isTeachingAssistant"
                      v-model="user.isTeachingAssistant"
                    />
                    <label class="form-check-label" for="isTeachingAssistant"
                      >&nbsp;学修助理</label
                    >
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="isStudent"
                      v-model="user.isStudent"
                    />
                    <label class="form-check-label" for="isStudent"
                      >&nbsp;学员</label
                    >
                  </div>
                </div>
              </fieldset>
              <fieldset v-if="user.id" class="form-group">
                <label style="font-size:22px;">用户状态</label>
                <div class="form-control">
                  <select v-model="user.state">
                    <option
                      v-for="state in userStates"
                      v-bind:key="state.key"
                      v-bind:value="state.key"
                    >
                      {{ state.value }}
                    </option>
                  </select>
                </div>
              </fieldset>
              <button class="btn btn-lg btn-primary pull-xs-right">
                <span v-if="user.id"> 更新用户信息</span>
                <span v-else> 创建新用户</span>
              </button>
              <router-link
                class="navbar-brand"
                :to="{ name: 'user-management', skip: 'true' }"
                >返回</router-link
              >
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { ADMIN_FETCH_USER } from "@/store/actions.type";
import { UPDATE_USER_BY_ADMIN } from "@/store/actions.type";
import store from "@/store";

export default {
  name: "User",
  data() {
    return {
      userStates: [
        { value: "正常", key: undefined },
        { value: "密码需更改", key: "needToChangePassword" },
        { value: "被屏蔽", key: "blocked" }
      ]
    };
  },
  props: {
    slug: {
      type: String,
      required: false
    }
  },
  beforeRouteEnter(to, from, next) {
    store.dispatch(ADMIN_FETCH_USER, to.params.slug).then(() => {
      next();
    });
  },
  computed: {
    ...mapGetters(["user"])
  },
  methods: {
    updateUser() {
      this.$store.dispatch(UPDATE_USER_BY_ADMIN, this.user).then(() => {
        this.$router.push({ name: "user-management" });
      });
    }
  }
};
</script>
