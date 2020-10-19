import Vue from "vue";
import Router from "vue-router";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/Home"),
      meta: { requiresAuth: true }
    },
    {
      path: "/user-management",
      name: "user-management",
      component: () => import("@/views/UserManagement"),
      meta: { requiresAuth: true }
    },
    {
      path: "/sessions/:classId/:forApplication/:forAdmin/:loadingNewSessions",
      name: "session-management",
      component: () => import("@/views/SessionManagement"),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: "/counts/:practiceId/:forAdmin",
      name: "count-list",
      component: () => import("@/views/CountList"),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      name: "login",
      path: "/login",
      component: () => import("@/views/Login")
    },
    {
      name: "forgotPassword",
      path: "/forgotPassword",
      component: () => import("@/views/ForgotPassword")
    },
    {
      name: "register",
      path: "/register",
      component: () => import("@/views/Register")
    },
    {
      name: "profile",
      path: "/profile",
      meta: { requiresAuth: true },
      component: () => import("@/views/Profile")
    },
    {
      name: "user",
      path: "/users/:slug",
      meta: { requiresAuth: true },
      component: () => import("@/views/User"),
      props: true
    },
    {
      name: "userCreate",
      path: "/userCreate",
      meta: { requiresAuth: true },
      component: () => import("@/views/User")
    },
    {
      name: "adminFunctions",
      path: "/adminFunctions",
      meta: { requiresAuth: true },
      component: () => import("@/views/AdminFunctions")
    }
  ]
});
