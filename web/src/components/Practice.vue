<template>
  <div>
    <b-card class="text-center" :header="practiceObj.name">
      <b-card-text>
        <b-input-group
          :prepend="forAdmin ? '统计日期：' : '最新报数：'"
          class="mt-3"
        >
          <b-form-input
            readonly
            v-model="practiceCountObj.latestCount"
          ></b-form-input>
        </b-input-group>
        <b-input-group prepend="总计报数：" class="mt-3">
          <b-form-input
            readonly
            v-model="practiceCountObj.accumulatedCount"
          ></b-form-input>
          <b-input-group-append>
            <b-button
              v-if="isStudent && !forAdmin"
              variant="warning"
              v-on:click="toggleReportingCount()"
              >{{
                practiceObj.showReportingCount ? "完成报数" : "我要报数"
              }}</b-button
            >
            <b-button
              variant="info"
              v-on:click="
                practiceObj.showDescription = !practiceObj.showDescription
              "
            >
              <b-icon
                v-if="practiceObj.showDescription"
                icon="chevron-double-up"
              ></b-icon>
              <b-icon v-else icon="chevron-double-down"></b-icon>
            </b-button>
          </b-input-group-append>
        </b-input-group>
        <b-form @submit="onSubmit" v-if="practiceObj.showReportingCount">
          <b-input-group prepend="选择日期：" class="mt-3">
            <v-date-picker
              locale="zh-CN"
              v-model="practiceObj.newCountReportedAt"
              :min-date="minDateForCountReporting()"
              :max-date="new Date()"
              :input-props="{
                readonly: true
              }"
            />
          </b-input-group>
          <b-input-group
            v-if="practiceSubmodules.length > 0"
            prepend="选择修法："
            class="mt-3"
          >
            <select v-model="practiceObj.submoduleId">
              <option
                v-for="session in practiceSubmodules"
                v-bind:key="session.id"
                v-bind:value="session.id"
                >{{ session.name }}</option
              >
            </select>
          </b-input-group>
          <b-input-group prepend="输入报数：" class="mt-3">
            <b-form-input
              id="input-count"
              v-model="practiceObj.newCount"
              type="number"
              required
              placeholder="输入报数"
            ></b-form-input>
            <b-input-group-append>
              <b-button type="submit" variant="primary">提交</b-button>
            </b-input-group-append>
          </b-input-group>
        </b-form>
        <b-form-textarea
          v-if="practiceObj.showDescription"
          v-model="practiceObj.description"
          placeholder=""
          rows="3"
          max-rows="8"
          readonly
        ></b-form-textarea>
        <div v-if="practiceCounts">
          <h5>总计有 {{ items.length }} 条报数记录</h5>
          <b-table striped hover :items="items" :fields="fields"></b-table>
        </div>
      </b-card-text>
    </b-card>
    <b-button
      v-if="!practiceCounts"
      block
      variant="info"
      @click="listPracticeCount"
      >查看详情</b-button
    >
    <hr />
  </div>
</template>

<script>
import DatePicker from "v-calendar/lib/components/date-picker.umd";
import Parse from "parse";
import { mapGetters } from "vuex";

export default {
  name: "Practice",
  components: {
    DatePicker
  },
  props: {
    practice: { type: Object, required: true },
    latestPracticeCount: { type: Object, required: false },
    practiceSubmodules: { type: Array, required: false },
    practiceCounts: { type: Array, required: false },
    users: { type: Array, required: false },
    forAdmin: Boolean
  },
  computed: {
    ...mapGetters(["isStudent"])
  },
  data: function() {
    return {
      practiceObj: {
        name: this.practice.get("name"),
        description: this.practice.get("description"),
        showDescription: false,
        showReportingCount: false,
        newCountReportedAt: "",
        newCount: "",
        submoduleId: undefined
      },
      practiceCountObj: this.buildPracticeCountObj(this.latestPracticeCount),
      fields: this.buildPracticeCountFields(),
      items: this.buildPracticeCountItems()
    };
  },
  methods: {
    buildPracticeCountFields() {
      var fields = [
        {
          key: this.forAdmin ? "name" : "reportedAt",
          label: this.forAdmin ? "姓名" : "日期",
          sortable: true
        },
        {
          key: "count",
          label: "报数",
          sortable: true
        }
      ];
      if (
        !this.forAdmin &&
        this.practiceSubmodules &&
        this.practiceSubmodules.length > 0
      ) {
        fields.splice(0, 0, {
          key: "sessionName",
          label: "修法",
          sortable: true
        });
      }
      return fields;
    },
    buildPracticeCountItems() {
      var items = [];
      if (this.practiceCounts) {
        if (this.forAdmin) {
          for (var i = 0; i < this.practiceCounts.length; i++) {
            items.push({
              name: this.users[i],
              count: this.practiceCounts[i].get("count")
            });
          }
        } else {
          const practiceSubmodules = this.practiceSubmodules;
          items = this.practiceCounts
            .filter(x => x.get("reportedAt"))
            .map(e => {
              const submoduleId = e.get("submoduleId");
              var sessionName = undefined;
              if (submoduleId) {
                sessionName = practiceSubmodules.find(e => e.id == submoduleId)
                  .name;
              }
              return {
                sessionName: sessionName,
                reportedAt: this.toLocalDateString(e.get("reportedAt")),
                count: e.get("count")
              };
            });
        }
      }
      return items;
    },
    buildPracticeCountObj(latestPracticeCount) {
      // console.log(
      //   `buildPracticeCountObj - this.forAdmin: ${
      //     this.forAdmin
      //   } ${JSON.stringify(latestPracticeCount)}`
      // );
      return this.forAdmin
        ? {
            latestCount:
              latestPracticeCount && latestPracticeCount.reportedAt
                ? `${this.toLocalDateString(
                    new Date(latestPracticeCount.reportedAt)
                  )}`
                : "未报数",
            accumulatedCount:
              latestPracticeCount && latestPracticeCount.accumulatedCount
                ? latestPracticeCount.accumulatedCount
                : "未报数"
          }
        : {
            latestCount:
              latestPracticeCount && latestPracticeCount.reportedAt
                ? `${latestPracticeCount.count} @ ${this.toLocalDateString(
                    latestPracticeCount.reportedAt
                  )}`
                : "未报数",
            accumulatedCount:
              latestPracticeCount && latestPracticeCount.accumulatedCount
                ? latestPracticeCount.accumulatedCount
                : "未报数"
          };
    },
    minDateForCountReporting() {
      const today = new Date();
      //student must report count within 365 days
      return new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
    },
    toLocalDateTimeString(date) {
      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric"
      };
      return date.toLocaleDateString("zh-CN", options);
    },
    toLocalDateString(date) {
      const options = {
        year: "numeric",
        month: "short",
        day: "numeric"
      };
      return date.toLocaleDateString("zh-CN", options);
    },
    toggleReportingCount() {
      this.practiceObj.showReportingCount = !this.practiceObj
        .showReportingCount;
      this.practiceObj.newCountReportedAt = undefined;
      this.practiceObj.newCount = undefined;
      this.practiceObj.submoduleId = undefined;
    },
    onSubmit(evt) {
      evt.preventDefault();
      const options = {
        okText: "确认",
        cancelText: "取消",
        loader: true // default: false - when set to true, the proceed button shows a loader when clicked; and a dialog object will be passed to the then() callback
      };
      const practiceSubmoduleId = this.practiceObj.submoduleId;
      var sessionName = "";
      if (practiceSubmoduleId) {
        sessionName = this.practiceSubmodules.find(
          e => e.id == practiceSubmoduleId
        ).name;
      }
      const message = {
        title: this.practiceObj.name,
        body: `新增${sessionName}报数${
          this.practiceObj.newCount
        } @ ${this.toLocalDateString(this.practiceObj.newCountReportedAt)}？`
      };
      const practiceId = this.practice.id;
      const reportedAt = this.practiceObj.newCountReportedAt;
      const count = parseInt(this.practiceObj.newCount);
      const thisComponent = this;

      console.log(
        `home:reportPracticeCount - practiceId: ${practiceId} practiceSubmoduleId: ${practiceSubmoduleId} reportedAt: ${reportedAt} count: ${count}`
      );

      this.$dialog
        .confirm(message, options)
        .then(function(dialog) {
          Parse.Cloud.run("home:reportPracticeCountV2", {
            practiceId,
            practiceSubmoduleId,
            reportedAt,
            count
          })
            .then(result => {
              console.log(
                `reportPracticeCount - result: ${JSON.stringify(result)}`
              );

              thisComponent.practiceCountObj = thisComponent.buildPracticeCountObj(
                result
              );

              dialog.close();
              if (thisComponent.practiceCounts) {
                // thisComponent.$router.go();
                window.location.reload();
              }
            })
            .catch(e => {
              console.log(`error in reportPracticeCount: ${e}`);
              dialog.close();
              thisComponent.$dialog.alert(`error in reportPracticeCount: ${e}`);
            });
        })
        .catch(e => {
          console.log(`error: ${e}`);
        });
    },
    listPracticeCount() {
      this.$router.push({
        name: "count-list",
        params: {
          practiceId: this.practice.id,
          forAdmin: this.forAdmin
        }
      });
    }
  }
};
</script>
