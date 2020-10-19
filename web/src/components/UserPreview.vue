<template>
  <div class="user-preview">
    <router-link :to="userLink" class="preview-link">
      <h3 v-text="user.name" />
      <ul style="list-style-type: none">
        <li>用户名：{{ user.username }}</li>
        <li>用户角色：{{ displayRoles() }}</li>
        <li>电邮地址：{{ user.email }}</li>
        <li>电话号码：{{ user.phone }}</li>
      </ul>
    </router-link>
  </div>
</template>

<script>
export default {
  name: "UserPreview",
  components: {},
  props: {
    user: { type: Object, required: true }
  },
  computed: {
    userLink() {
      return {
        name: "user",
        params: {
          slug: this.user.id
        }
      };
    }
  },
  methods: {
    displayRoles() {
      const array = [
        { name: "B4aAdminUser", displayName: "系统管理员" },
        { name: "ClassAdminUser", displayName: "学修管理员" },
        { name: "TeacherUser", displayName: "辅导员" },
        { name: "TeachingAssistantUser", displayName: "学修助理" },
        { name: "StudentUser", displayName: "学员" }
      ];
      var roles = "";
      for (var i = 0; i < array.length; i++) {
        if (this.user.roles.some(role => role == array[i].name)) {
          if (roles.length > 0) {
            roles = roles + "，";
          }
          roles = roles + array[i].displayName;
        }
      }

      return roles;
    }
  }
};
</script>
