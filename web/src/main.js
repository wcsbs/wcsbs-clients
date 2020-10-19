import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import Parse from "parse";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";

import VuejsDialog from "vuejs-dialog";
import "vuejs-dialog/dist/vuejs-dialog.min.css";
import VCalendar from "v-calendar";

import { CHECK_AUTH } from "./store/actions.type";
import DateFilter from "./common/date.filter";
import ErrorFilter from "./common/error.filter";

Vue.config.productionTip = false;
Vue.filter("date", DateFilter);
Vue.filter("error", ErrorFilter);

Parse.initialize(
  process.env.VUE_APP_PARSE_APP_ID, // YOUR APP ID
  process.env.VUE_APP_PARSE_JS_KEY // YOUR Javascript  KEY
);
// YOUR SERVER URL
Parse.serverURL = "https://parseapi.back4app.com";

// Ensure we checked auth before each page load.
router.beforeEach((to, from, next) => {
  Promise.all([store.dispatch(CHECK_AUTH)]).then(() => {
    if (
      store.state.auth &&
      store.state.auth.user.state == "needToChangePassword" &&
      to.path != "/profile"
    ) {
      next({
        path: "/profile",
        query: { redirect: to.fullPath }
      });
    } else if (to.matched.some(record => record.meta.requiresAuth)) {
      // this route requires auth, check if logged in
      // if not, redirect to login page.
      if (!Parse.User.current()) {
        next({
          path: "/login",
          query: { redirect: to.fullPath }
        });
      } else {
        next();
      }
    } else {
      next(); // make sure to always call next()!
    }
  });
});

// Install BootstrapVue
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

// Install VCalendar
Vue.use(VCalendar, {
  locales: {
    "zh-CN": {
      firstDayOfWeek: 1,
      masks: {
        L: "YYYY年MM月DD日",
        title: "YYYY年MMM"
      }
    }
  }
});

// Install VuejsDialog
Vue.use(VuejsDialog);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
