<template>
  <nav v-if="isAuthenticated" class="navbar navbar-light">
    <div class="container">
      <router-link :to="{ name: 'home' }" class="navbar-brand"
        >主页</router-link
      >
      <router-link
        v-if="isSystemAdmin"
        :to="{ name: 'user-management' }"
        class="navbar-brand"
        >用户管理</router-link
      >
      <!--
      <router-link
        v-if="isClassAdmin"
        :to="{ name: 'class-management' }"
        class="navbar-brand"
        >课程管理</router-link
      >
      <router-link
        v-if="isTeachingAssistant"
        :to="{ name: 'class-management' }"
        class="navbar-brand"
        >课程助理</router-link
      >
      -->
      <ul class="nav navbar-nav pull-xs-right" style="list-style-type:none">
        <li class="nav-item float-xs-right">
          <router-link
            class="nav-link"
            active-class="active"
            exact
            :to="{ name: 'profile' }"
          >
            <i class="ion-gear-a"></i>
            &nbsp;{{ currentUser.name }}
          </router-link>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "RwvHeader",
  computed: {
    ...mapGetters([
      "currentUser",
      "isAuthenticated",
      "isSystemAdmin",
      "isClassAdmin",
      "isTeachingAssistant",
      "isStudent"
    ])
  }
};
</script>
