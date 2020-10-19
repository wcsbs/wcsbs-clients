<template>
  <div>
    <div v-if="isLoadingUsers" class="user-preview">正在获取用户列表...</div>
    <div v-else>
      <div class="input-group mb-3">
        <input
          type="text"
          class="form-control"
          aria-label="Recipient's username"
          aria-describedby="basic-addon2"
          v-model="filterText"
          v-on:change="filterUsers(filterText)"
          placeholder="搜索用户"
        />
        <div class="input-group-append">
          <button
            class="btn btn-outline-secondary"
            type="button"
            @click="clearFilter"
          >
            清除
          </button>
          <b-button variant="warning" type="button" @click="createUser">
            创建新用户
          </b-button>
        </div>
      </div>
      <div v-if="users.length === 0" class="user-preview">
        没有找到用户！
      </div>
      <UserPreview
        v-else
        v-for="(user, index) in users"
        :user="user"
        :key="index"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import UserPreview from "./UserPreview";
import { FILTER_USERS } from "../store/actions.type";

export default {
  name: "UserList",
  components: {
    UserPreview
  },
  computed: {
    ...mapGetters(["usersCount", "isLoadingUsers", "users"])
  },
  mounted() {
    this.clearFilter();
  },
  data: function() {
    return {
      filterText: ""
    };
  },
  methods: {
    filterUsers(filterText) {
      this.$store.dispatch(FILTER_USERS, filterText);
    },
    clearFilter() {
      this.filterText = "";
      this.$store.dispatch(FILTER_USERS, this.filterText);
    },
    createUser() {
      this.$router.push({ name: "userCreate" });
    }
  }
};
</script>
