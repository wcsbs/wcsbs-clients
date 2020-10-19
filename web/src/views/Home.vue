<template>
  <div>
    <div v-if="isLoadingDashboards">
      正在获取主页数据...
    </div>
    <div v-else>
      <b-tabs pills content-class="mt-3" align="center">
        <b-tab
          v-if="home.studentDashboard"
          :title="studentDashboardTitle()"
          title-item-class="mytab"
          acitve
        >
          <StudentDashboard :dashboard="home.studentDashboard" />
        </b-tab>
        <b-tab
          v-if="home.classAdminDashboard"
          :title="classAdminDashboardTitle()"
          title-item-class="mytab"
          acitve
        >
          <AdminDashboard :dashboard="home.classAdminDashboard" />
        </b-tab>
        <b-tab
          v-if="home.systemAdminDashboard"
          title="学会全部课程"
          title-item-class="mytab"
          acitve
        >
          <AdminDashboard :dashboard="home.systemAdminDashboard" />
        </b-tab>
      </b-tabs>
    </div>
  </div>
</template>

<script>
import StudentDashboard from "@/components/StudentDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { mapGetters } from "vuex";
import { FETCH_DASHBOARDS } from "../store/actions.type";
import store from "@/store";

export default {
  name: "Home",
  components: {
    StudentDashboard,
    AdminDashboard
  },
  methods: {
    studentDashboardTitle() {
      return `${this.currentUser.name}的闻思修`;
    },
    classAdminDashboardTitle() {
      return `${this.currentUser.name}${
        this.isStudent ? "管理" : "辅导"
      }的课程`;
    }
  },
  computed: {
    ...mapGetters([
      "home",
      "currentUser",
      "isLoadingDashboards",
      "isSystemAdmin",
      "isStudent"
    ])
  },
  beforeRouteEnter(to, from, next) {
    console.log(`from: ${from.path}`);
    if (!from || !from.path || !from.path.startsWith("/home")) {
      store.dispatch(FETCH_DASHBOARDS).then(() => {
        next();
      });
    } else {
      next();
    }
  }
};
</script>

<style>
.nav-pills li {
  list-style-type: none;
}

.nav-pills .mytab .nav-link:not(.active) {
  background-color: red !important;
  font-size: 22px;
}

.nav-pills .mytab .nav-link {
  background-color: blue !important;
  font-size: 22px;
}
</style>
