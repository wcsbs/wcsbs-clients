import Parse from "parse";
import Toasted from "vue-toasted";
import Vue from "vue";
import { FETCH_DASHBOARDS } from "./actions.type";
import { FETCH_DASHBOARDS_START, FETCH_DASHBOARDS_END } from "./mutations.type";
import store from "./index";

Vue.use(Toasted);

const state = {
  home: {},
  isLoadingDashboards: true
};

const getters = {
  home(state) {
    return state.home;
  },
  isLoadingDashboards(state) {
    return state.isLoadingDashboards;
  }
};

const actions = {
  [FETCH_DASHBOARDS]({ commit }) {
    const user = store.state.auth.user;
    console.log(`${FETCH_DASHBOARDS} - auth.user: ${JSON.stringify(user)}`);
    commit(FETCH_DASHBOARDS_START);
    return new Promise((resolve, reject) => {
      Parse.Cloud.run("home:loadDashboardsV2", { user })
        .then(result => {
          console.log(
            // `${FETCH_DASHBOARDS} - result: ${JSON.stringify(result)}`
            `${FETCH_DASHBOARDS} - result: ${result}`
          );
          commit(FETCH_DASHBOARDS_END, result);
          resolve();
        })
        .catch(e => {
          console.log(`error loading dashboards: ${e.message}`);
          Vue.toasted.error(`error loading dashboards: ${e.message}`, {
            duration: 5000
          });
          reject();
        });
    });
  }
};

/* eslint no-param-reassign: ["error", { "props": false }] */
const mutations = {
  [FETCH_DASHBOARDS_START](state) {
    state.isLoadingDashboards = true;
  },
  [FETCH_DASHBOARDS_END](state, result) {
    state.home = result;
    state.isLoadingDashboards = false;
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};
