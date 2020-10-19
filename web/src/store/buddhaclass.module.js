import Parse from "parse";
import Toasted from "vue-toasted";
import Vue from "vue";
import {
  FETCH_SESSIONS,
  FETCH_PRACTICE_COUNTS,
  FILTER_SESSIONS,
  UPDATE_SESSION
} from "./actions.type";
import {
  FETCH_SESSIONS_START,
  FETCH_SESSIONS_END,
  FILTER_SESSIONS_IN_LIST,
  FETCH_PRACTICE_COUNTS_START,
  FETCH_PRACTICE_COUNTS_END
} from "./mutations.type";

Vue.use(Toasted);

const state = {
  classSession: {},
  classSessions: [],
  sessionDetails: [],
  classInfo: {},
  practiceInfo: {},
  isLoadingSessions: false,
  isLoadingPracticeCounts: false
};

const getters = {
  classInfo(state) {
    return state.classInfo;
  },
  classSession(state) {
    return state.classSession;
  },
  classSessions(state) {
    return state.classSessions;
  },
  sessionDetails(state) {
    return state.sessionDetails;
  },
  isLoadingSessions(state) {
    return state.isLoadingSessions;
  },
  isLoadingPracticeCounts(state) {
    return state.isLoadingPracticeCounts;
  },
  practiceInfo(state) {
    return state.practiceInfo;
  }
};

const actions = {
  [FETCH_SESSIONS](context, params) {
    const classId = params["classId"];

    var forApplication = params["forApplication"];
    if (typeof forApplication === "string") {
      forApplication = forApplication === "true";
    }

    var forAdmin = params["forAdmin"];
    if (typeof forAdmin === "string") {
      forAdmin = forAdmin === "true";
    }

    var loadingNewSessions = params["loadingNewSessions"];
    if (typeof loadingNewSessions === "string") {
      loadingNewSessions = loadingNewSessions === "true";
    }

    console.log(
      `${FETCH_SESSIONS} - classId: ${classId} forApplication: ${forApplication} forAdmin: ${forAdmin} loadingNewSessions: ${loadingNewSessions}`
    );
    context.commit(FETCH_SESSIONS_START);

    const fetchSessions = "class:fetchSessionsV2";
    Parse.Cloud.run(fetchSessions, {
      classId,
      forApplication,
      forAdmin,
      loadingNewSessions
    })
      .then(classInfo => {
        console.log(
          // `${fetchSessions} - #classSessions: ${classInfo.classSessions.length}`
          `${fetchSessions} - classInfo: ${JSON.stringify(classInfo)}`
        );
        context.commit(FETCH_SESSIONS_END, classInfo);
      })
      .catch(e => {
        // console.log(`error loading classSession list: ${e.message}`);
        console.log(`error loading classSession list: ${JSON.stringify(e)}`);
        throw new Error(e);
      });
  },
  [FETCH_PRACTICE_COUNTS](context, params) {
    const practiceId = params["practiceId"];
    var forAdmin = params["forAdmin"];

    if (typeof forAdmin === "string") {
      forAdmin = forAdmin === "true";
    }
    console.log(
      `${FETCH_PRACTICE_COUNTS} - practiceId: ${practiceId} forAdmin: ${forAdmin}`
    );
    context.commit(FETCH_PRACTICE_COUNTS_START);

    const fetchPracticeCounts = "class:fetchPracticeCountsV2";
    Parse.Cloud.run(fetchPracticeCounts, { practiceId, forAdmin })
      .then(practiceInfo => {
        console.log(
          `${FETCH_PRACTICE_COUNTS} - #practiceCount: ${practiceInfo.counts.length}`
          // `${FETCH_PRACTICE_COUNTS} - practiceInfo: ${JSON.stringify(
          //   practiceInfo
          // )}`
        );
        context.commit(FETCH_PRACTICE_COUNTS_END, practiceInfo);
      })
      .catch(e => {
        // console.log(`error loading classSession list: ${e.message}`);
        console.log(`error loading practice counts: ${JSON.stringify(e)}`);
        throw new Error(e);
      });
  },
  [FILTER_SESSIONS](context, filterText) {
    console.log(
      `${FILTER_SESSIONS} - filterText: ${JSON.stringify(filterText)}`
    );
    context.commit(FILTER_SESSIONS_IN_LIST, filterText);
  },
  [UPDATE_SESSION](classSessionToUpdate) {
    console.log(
      `${UPDATE_SESSION} - classSessionToUpdate: ${JSON.stringify(
        classSessionToUpdate
      )}`
    );
  }
};

/* eslint no-param-reassign: ["error", { "props": false }] */
const mutations = {
  [FETCH_PRACTICE_COUNTS_START](state) {
    state.isLoadingPracticeCounts = true;
  },
  [FETCH_PRACTICE_COUNTS_END](state, practiceInfo) {
    state.practiceInfo = practiceInfo;
    state.isLoadingPracticeCounts = false;
  },
  [FETCH_SESSIONS_START](state) {
    state.isLoadingSessions = true;
  },
  [FETCH_SESSIONS_END](state, classInfo) {
    state.classInfo = classInfo;
    state.classSessions = classInfo.classSessions;
    state.sessionDetails = classInfo.sessionDetails;

    state.isLoadingSessions = false;
  },
  [FILTER_SESSIONS_IN_LIST](state, filterText) {
    if (!filterText || filterText == "") {
      state.classSessions = state.classInfo.classSessions;
      state.sessionDetails = state.classInfo.sessionDetails;
    } else {
      state.classSessions = [];
      state.sessionDetails = [];

      for (var i = 0; i < state.classInfo.classSessions.length; i++) {
        const s = state.classInfo.classSessions[i];
        if (
          s
            .get("name")
            .toLowerCase()
            .includes(filterText.toLowerCase())
        ) {
          state.classSessions.push(s);
          state.sessionDetails.push(state.classInfo.sessionDetails[i]);
        }
      }
    }
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};
