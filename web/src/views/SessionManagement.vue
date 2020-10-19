<template>
  <div>
    <div v-if="isLoadingSessions">
      正在获取课程详情...
    </div>
    <div v-else>
      <h3 v-text="classInfo.name" />
      <div class="input-group mb-3">
        <input
          type="text"
          class="form-control"
          aria-describedby="basic-addon2"
          v-model="filterText"
          v-on:change="filterSessions(filterText)"
          placeholder="搜索"
        />
        <div class="input-group-append">
          <button
            class="btn btn-outline-secondary"
            type="button"
            @click="clearFilter"
          >
            清除
          </button>
          <b-button
            variant="warning"
            v-if="classInfo.forApplication"
            v-on:click="applyClass()"
            >我要报名</b-button
          >
          <b-button
            variant="warning"
            v-if="
              !classInfo.forApplication && (isClassAdmin || isTeachingAssistant)
            "
            @click="createSession"
            >{{ creatingSession ? "取消创建" : "创建新课" }}</b-button
          >
        </div>
      </div>
      <div v-if="classSessions.length === 0">
        没有找到上课记录！
      </div>
      <ClassSession
        v-if="creatingSession"
        :classInfo="classInfo"
        :classSession="newClassSession"
      />
      <ClassSession
        v-for="(classSession, index) in classSessions"
        :classInfo="classInfo"
        :forApplication="classInfo.forApplication"
        :forAdmin="classInfo.forAdmin"
        :classSession="classSession"
        :sessionDetails="sessionDetails[index]"
        :key="classSession.id + index"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import ClassSession from "@/components/ClassSession";
import { FETCH_SESSIONS, FILTER_SESSIONS } from "../store/actions.type";
import store from "@/store";
import Parse from "parse";

export default {
  name: "SessionManagement",
  components: {
    ClassSession
  },
  computed: {
    ...mapGetters([
      "isLoadingSessions",
      "classInfo",
      "classSessions",
      "sessionDetails",
      "isClassAdmin",
      "isTeachingAssistant",
      "isStudent"
    ])
  },
  beforeRouteEnter(to, from, next) {
    store.dispatch(FETCH_SESSIONS, to.params).then(() => {
      next();
    });
  },
  data: function() {
    return {
      filterText: "",
      creatingSession: false,
      newClassSession: { dummy: true },
      newAttendance: { dummy: true }
    };
  },
  methods: {
    filterSessions(filterText) {
      this.$store.dispatch(FILTER_SESSIONS, filterText);
    },
    clearFilter() {
      this.filterText = "";
      this.$store.dispatch(FILTER_SESSIONS, this.filterText);
    },
    createSession() {
      this.creatingSession = !this.creatingSession;
    },
    applyClass() {
      const classId = this.classInfo.id;
      const options = {
        okText: "确认",
        cancelText: "取消"
      };
      const message = {
        title: this.classInfo.name,
        body: `顶礼上师三宝！真的要报名？`
      };
      const thisComponent = this;

      console.log(`applyClass - classId: ${classId}`);

      this.$dialog
        .confirm(message, options)
        .then(function() {
          Parse.Cloud.run("class:apply", {
            classId
          })
            .then(result => {
              console.log(`class:apply - result: ${JSON.stringify(result)}`);

              thisComponent.$router.push({ name: "home" });
            })
            .catch(e => {
              console.log(`error in class:apply: ${e}`);
            });
        })
        .catch(e => {
          console.log(`error: ${e}`);
        });
    }
  }
};
</script>
