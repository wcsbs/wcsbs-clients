<template>
  <div>
    <b-form v-if="editing" @submit="onSubmit" @reset="onReset">
      <h4>{{ this.session.creating ? "创建新课" : session.name }}</h4>
      <b-input-group prepend="选择日期：" class="mt-3">
        <v-date-picker
          locale="zh-CN"
          v-model="session.scheduledAt"
          :input-props="{
            readonly: true
          }"
        />
        <b-input-group-append>
          <b-button v-if="!session.creating" type="reset" variant="warning">
            <b-icon icon="x-circle"></b-icon>
          </b-button>
        </b-input-group-append>
      </b-input-group>
      <b-input-group
        v-if="moduleDropdownOptions.length > 1"
        prepend="选择模块："
        class="mt-3"
      >
        <b-form-select
          v-model="session.moduleId"
          v-on:change="refreshUI"
          :options="moduleDropdownOptions"
        ></b-form-select>
      </b-input-group>
      <b-input-group prepend="选子模块：" class="mt-3">
        <b-form-select
          v-model="session.submoduleId"
          :options="submoduleDropdownOptions"
        ></b-form-select>
        <b-input-group-append>
          <b-button
            v-if="canAddSubmodule"
            variant="warning"
            v-on:click="addSubmodule()"
            >加入上课内容</b-button
          >
          <b-button type="submit" variant="success">
            <b-icon icon="check-circle"></b-icon>
          </b-button>
        </b-input-group-append>
      </b-input-group>
      <div v-if="!classInfo.singleSubmodule">
        <b-input-group
          v-for="(submodule, index) in session.submodules"
          :key="submodule.id + index"
          prepend="上课内容："
          class="mt-3"
        >
          <b-form-input
            readonly
            :value="`(${index + 1}) ${submodule.name}`"
          ></b-form-input>
          <b-input-group-append>
            <b-button variant="warning" v-on:click="removeSubmodule(index)"
              >删除</b-button
            >
          </b-input-group-append>
        </b-input-group>
        <b-input-group
          v-if="session.submodules.length > 0"
          prepend="上课名称："
          class="mt-3"
        >
          <b-form-input v-model="session.name"></b-form-input>
        </b-input-group>
      </div>
      <div v-if="!session.creating">
        <b-input-group prepend="材料链接：" type="url" class="mt-3">
          <b-form-input v-model="session.materialUrl"></b-form-input>
        </b-input-group>
        <b-input-group prepend="材料名称：" class="mt-3">
          <b-form-input v-model="session.materialName"></b-form-input>
          <b-button variant="warning" v-on:click="addMaterial()"
            >加入上课材料</b-button
          >
        </b-input-group>
        <b-input-group
          v-for="(material, index) in session.materials"
          :key="material.url + index"
          prepend="上课材料："
          class="mt-3"
        >
          <b-form-input
            readonly
            :value="`(${index + 1}) ${material.name}`"
          ></b-form-input>
          <b-input-group-append>
            <b-button variant="warning" v-on:click="removeMaterial(index)"
              >删除</b-button
            >
          </b-input-group-append>
        </b-input-group>
      </div>
      <b-form-textarea
        v-model="session.description"
        placeholder="输入上课通知"
        rows="8"
        max-rows="20"
      ></b-form-textarea>
    </b-form>
    <b-card v-else class="text-center" :header="session.name">
      <b-card-text>
        <b-input-group prepend="上课时间：" class="mt-3">
          <b-form-input
            readonly
            v-model="session.scheduledAtLocalDateTimeString"
          ></b-form-input>
          <b-input-group-append>
            <b-button
              variant="warning"
              v-if="
                !forApplication &&
                  classInfo &&
                  !session.creating &&
                  (isClassAdmin || isTeachingAssistant)
              "
              v-on:click="editSession"
              >修改</b-button
            >
            <!--
            <b-button
              variant="info"
              :href="addToGoogleCalendarUrl()"
              target="_blank"
            >
              <b-icon icon="calendar-plus"></b-icon>
            </b-button>
            -->
          </b-input-group-append>
        </b-input-group>
        <b-input-group
          v-if="sessionDetails.submodules.length == 1"
          prepend="课前学习："
          class="mt-3"
        >
          <b-form-input readonly v-model="session.prestudyState"></b-form-input>
          <b-input-group-append>
            <b-button
              variant="info"
              :href="sessionDetails.submodules[0].url"
              target="_blank"
            >
              <b-icon icon="book"></b-icon>
            </b-button>
          </b-input-group-append>
        </b-input-group>
        <div
          v-else
          v-for="(submodule, index) in sessionDetails.submodules"
          :key="submodule.id + index"
        >
          <b-link :href="submodule.url" target="_blank">{{
            `(${index + 1}) ${submodule.name}`
          }}</b-link>
          <b-input-group prepend="课前学习：" class="mt-3">
            <b-form-input
              readonly
              :value="toPrestudyStateString(sessionDetails, index)"
            ></b-form-input>
            <b-input-group-append>
              <b-button variant="info" :href="submodule.url" target="_blank">
                <b-icon icon="book"></b-icon>
              </b-button>
            </b-input-group-append>
          </b-input-group>
        </div>
        <b-input-group
          v-if="!session.forApplication"
          prepend="上课出勤："
          class="mt-3"
        >
          <b-form-input
            readonly
            v-model="session.attendanceState"
          ></b-form-input>
          <b-input-group-append>
            <b-button
              variant="warning"
              v-if="needToShowAttendanceButton()"
              v-on:click="updateAttendance()"
              >{{ attendanceButtonName() }}</b-button
            >
            <b-button
              variant="info"
              v-on:click="session.showMoreDetails = !session.showMoreDetails"
            >
              <b-icon
                v-if="session.showMoreDetails"
                icon="chevron-double-up"
              ></b-icon>
              <b-icon v-else icon="chevron-double-down"></b-icon>
            </b-button>
          </b-input-group-append>
        </b-input-group>
        <div v-if="session.showMoreDetails">
          <b-input-group
            v-for="(material, index) in session.materials"
            :key="material.url + index"
            prepend="上课材料："
            class="mt-3"
          >
            <b-form-input
              readonly
              :value="`(${index + 1}) ${material.name}`"
            ></b-form-input>
            <b-input-group-append>
              <b-button variant="info" :href="material.url" target="_blank">
                <b-icon icon="book"></b-icon>
              </b-button>
            </b-input-group-append>
          </b-input-group>
          <b-form-textarea
            v-model="session.description"
            placeholder=""
            rows="8"
            max-rows="20"
            readonly
          ></b-form-textarea>
        </div>
      </b-card-text>
    </b-card>
  </div>
</template>

<script>
import Parse from "parse";
import { mapGetters } from "vuex";

export default {
  name: "ClassSession",
  props: {
    classSession: { type: Object, required: true },
    sessionDetails: { type: Object, required: false },
    classInfo: { type: Object, required: false },
    newSessions: { type: Array, required: false },
    forApplication: Boolean,
    forAdmin: Boolean
  },
  data: function() {
    return {
      session: this.classSession.dummy
        ? { creating: true, editing: true, submodules: [] }
        : this.initSession(),
      moduleDropdownOptions: [],
      submoduleDropdownOptions: [],
      editing: this.classSession.dummy,
      canAddSubmodule: false
    };
  },
  computed: {
    ...mapGetters(["isClassAdmin", "isTeachingAssistant", "isStudent"])
  },
  mounted() {
    this.refreshUI();
  },
  methods: {
    initSession() {
      return {
        id: this.classSession.id,
        forApplication: this.classInfo
          ? this.classInfo.forApplication
          : this.forApplication,
        name: this.classSession.get("name"),
        submodules: [].concat(this.sessionDetails.submodules),
        materials: this.classSession.get("content").materials
          ? [].concat(this.classSession.get("content").materials)
          : [],
        description: this.classSession.get("description"),
        scheduledAt: this.classSession.get("scheduledAt"),
        scheduledAtLocalDateTimeString: this.toLocalDateTimeString(
          this.classSession.get("scheduledAt")
        ),
        showMoreDetails: false,
        attendanceState: this.toAttendanceStateString(this.sessionDetails),
        prestudyState: this.toPrestudyStateString(this.sessionDetails, 0)
      };
    },
    refreshUI() {
      this.moduleDropdownOptions = [];
      this.submoduleDropdownOptions = [];
      if (!this.editing) {
        return;
      }

      this.moduleDropdownOptions = this.classInfo.modules.map(e => {
        return {
          value: e.id,
          text: e.name
        };
      });

      const session = this.session;

      var selectedModule;
      for (var i = 0; i < this.classInfo.modules.length; i++) {
        selectedModule = this.classInfo.modules[i];
        if (!session.moduleId || session.moduleId == selectedModule.id) {
          break;
        }
      }
      if (!session.moduleId) {
        session.moduleId = selectedModule.id;
      }
      console.log(`refreshUI - selectedModule: ${selectedModule.name}`);

      this.submoduleDropdownOptions = this.submoduleDropdownOptions.concat(
        selectedModule.newSubmodules
      );

      if (!this.classSession.dummy) {
        for (i = 0; i < this.sessionDetails.submodules.length; i++) {
          const submodule = this.sessionDetails.submodules[i];
          if (submodule.moduleId == selectedModule.id) {
            this.submoduleDropdownOptions.push(submodule);
            console.log(`refreshUI - pushed: ${submodule.name}`);
          }
        }
      }

      if (!this.classInfo.singleSubmodule) {
        for (i = 0; i < this.session.submodules.length; i++) {
          const submodule = this.session.submodules[i];
          if (submodule.moduleId == selectedModule.id) {
            this.submoduleDropdownOptions = this.submoduleDropdownOptions.filter(
              e => {
                return e.id != submodule.id;
              }
            );
          }
        }
      }

      if (this.submoduleDropdownOptions.length > 0) {
        this.submoduleDropdownOptions.sort((s1, s2) => {
          var a = s1.index;
          var b = s2.index;
          return a > b ? 1 : b > a ? -1 : 0;
        });

        const selectedSubmodule =
          this.classInfo.singleSubmodule && !this.classSession.dummy
            ? this.session.submodules[0]
            : this.submoduleDropdownOptions[0];
        console.log(`refreshUI - selectedSubmodule: ${selectedSubmodule.name}`);

        this.session.submoduleId = selectedSubmodule.id;
        this.canAddSubmodule = !this.classInfo.singleSubmodule;
      } else {
        this.canAddSubmodule = false;
      }

      this.submoduleDropdownOptions = this.submoduleDropdownOptions.map(e => {
        return {
          value: e.id,
          text: e.name
        };
      });
    },
    addSubmodule() {
      const session = this.session;
      console.log(
        `addSubmodule - moduleId: ${session.moduleId} submoduleId: ${session.submoduleId}`
      );

      var selectedModule;
      var selectedSubmodule;

      for (var i = 0; i < this.classInfo.modules.length; i++) {
        selectedModule = this.classInfo.modules[i];
        if (!session.moduleId || session.moduleId == selectedModule.id) {
          break;
        }
      }

      for (i = 0; i < this.sessionDetails.submodules.length; i++) {
        const submodule = this.sessionDetails.submodules[i];
        if (submodule.id == session.submoduleId) {
          selectedSubmodule = submodule;
          break;
        }
      }
      if (!selectedSubmodule) {
        for (i = 0; i < selectedModule.newSubmodules.length; i++) {
          const submodule = selectedModule.newSubmodules[i];
          if (submodule.id == session.submoduleId) {
            selectedSubmodule = submodule;
            break;
          }
        }
      }
      session.submodules.push(selectedSubmodule);
      if (!session.name || this.classInfo.singleSubmodule) {
        session.name = selectedSubmodule.name;
      }
      if (!this.classInfo.singleSubmodule) {
        this.refreshUI();
      } else {
        console.log(
          `addSubmodule - selectedModule: ${selectedModule.name} selectedSubmodule: ${selectedSubmodule.name}`
        );
      }
    },
    removeSubmodule(index) {
      this.session.submodules.splice(index, 1);
      this.refreshUI();
    },
    addMaterial() {
      this.session.materials.push({
        name: this.session.materialName,
        url: this.session.materialUrl
      });
      this.session.materialName = "";
      this.session.materialUrl = "";
    },
    removeMaterial(index) {
      this.session.materials.splice(index, 1);
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
    needToShowAttendanceButton() {
      // console.log(
      //   `needToShowAttendanceButton - this.isStudent: ${this.isStudent} this.forAdmin: ${this.forAdmin} this.forApplication: ${this.forApplication}`
      // );
      return this.isStudent && !this.forAdmin && !this.forApplication;
      // const scheduledAt = this.classSession.get("scheduledAt");
      // if (this.isStudent) {
      //   const today = new Date();
      //   //student must submit sessionDetails within 3 days
      //   var cutoffTime = new Date(
      //     scheduledAt.getTime() + 4 * 24 * 60 * 60 * 1000
      //   );
      //   cutoffTime.setHours(0, 0, 0, 0); //set to midnight
      //   // console.log(`needToShowAttendanceButton - cutoffTime: ${cutoffTime}`);
      //   return today.getTime() < cutoffTime.getTime();
      // }
      // return false;
    },
    toAttendanceStateString(sessionDetails) {
      if (sessionDetails) {
        if (typeof sessionDetails.attendance.attendance == "number") {
          return `${sessionDetails.attendance.attendance}人已上课`;
        }
        if (sessionDetails.attendance.onLeave) {
          return "已请假";
        }
        if (sessionDetails.attendance.attendance == true) {
          return "已上课";
        }
        if (
          sessionDetails.attendance.attendance == false &&
          sessionDetails.attendance.onLeave == undefined
        ) {
          return "未上课";
        }
      }

      return "未报考勤";
    },
    toPrestudyStateString(sessionDetails, index) {
      if (this.forApplication) {
        return "请在课前看完传承/法本";
      }
      var chuanCheng = "未看传承";
      var faBen = "未看法本";
      if (sessionDetails && sessionDetails.submodules[index].studyRecord) {
        const studyRecord = sessionDetails.submodules[index].studyRecord;
        if (typeof studyRecord.lineage == "number") {
          chuanCheng = `${studyRecord.lineage}人已看传承`;
        } else if (studyRecord.lineage) {
          chuanCheng = "已看传承";
        }
        if (typeof studyRecord.textbook == "number") {
          faBen = `${studyRecord.textbook}人已看法本`;
        } else if (studyRecord.textbook) {
          faBen = "已看法本";
        }
      }

      return `${chuanCheng}/${faBen}`;
    },
    attendanceButtonName() {
      const d = new Date();
      if (d < this.classSession.get("scheduledAt")) {
        if (this.sessionDetails.attendance.onLeave) {
          return "取消请假";
        }
        return "我要请假";
      } else {
        if (this.sessionDetails.attendance.attendance != undefined) {
          return "我要改考勤";
        }
        return "我要报考勤";
      }
    },
    updateAttendance() {
      const d = new Date();
      var msg = "确认";
      var attendance = this.sessionDetails.attendance;
      if (d < this.classSession.get("scheduledAt")) {
        if (attendance.onLeave) {
          attendance.onLeave = false;
          msg += "取消请假";
        } else {
          attendance.onLeave = true;
          attendance.attendance = false;
          msg += "请假";
        }
      } else {
        if (attendance.attendance) {
          attendance.attendance = false;
          msg += "没有上课";
        } else {
          attendance.attendance = true;
          msg += "已上课";
        }
      }

      const sessionId = this.classSession.id;
      const options = {
        okText: "确认",
        cancelText: "取消",
        loader: true // default: false - when set to true, the proceed button shows a loader when clicked; and a dialog object will be passed to the then() callback
      };
      const message = {
        title: this.session.name,
        body: msg + "?"
      };
      const thisComponent = this;

      this.$dialog
        .confirm(message, options)
        .then(function(dialog) {
          Parse.Cloud.run("home:updateAttendanceV2", { sessionId, attendance })
            .then(result => {
              console.log(
                `updateAttendanceV2 - result: ${JSON.stringify(result)}`
              );
              if (result.attendance.onLeave != undefined) {
                thisComponent.sessionDetails.attendance.onLeave =
                  result.attendance.onLeave;
              }
              if (result.attendance.attendance != undefined) {
                thisComponent.sessionDetails.attendance.attendance =
                  result.attendance.attendance;
              }
              thisComponent.session.attendanceState = thisComponent.toAttendanceStateString(
                thisComponent.sessionDetails
              );
              dialog.close();
            })
            .catch(e => {
              console.log(`error in updateAttendanceV2: ${e}`);
              dialog.close();
              thisComponent.$dialog.alert(`error in updateAttendance: ${e}`);
            });
        })
        .catch(e => {
          console.log(`error: ${e}`);
        });
    },
    editSession() {
      this.session = this.initSession();
      this.editing = true;
      this.refreshUI();
    },
    onReset(evt) {
      evt.preventDefault();
      this.session = this.initSession();
      this.editing = false;
    },
    onSubmit(evt) {
      evt.preventDefault();

      if (this.classInfo.singleSubmodule) {
        if (this.session.submodules.length > 0) {
          this.session.submodules.splice(0, 1);
        }
        this.addSubmodule();
      }
      const session = this.session;
      console.log(`session.submodules: ${JSON.stringify(session.submodules)}`);

      if (!session.scheduledAt || session.submodules.length < 1) {
        this.$dialog.alert("请输入上课时间和内容！");
        return;
      }

      const options = {
        okText: "确认",
        cancelText: "取消",
        loader: true // default: false - when set to true, the proceed button shows a loader when clicked; and a dialog object will be passed to the then() callback
      };
      const message = {
        title: this.classInfo.name,
        body: `${session.creating ? "创建新课" : "修改"} 《${
          session.name
        }》 @ ${this.toLocalDateString(session.scheduledAt)}？`
      };

      var dt = new Date(session.scheduledAt);
      dt.setHours(session.submodules[0].url.includes("rpsxl") ? 9 : 14); //TODO: allow setting time
      session.scheduledAt = dt;
      // console.log(`session.scheduledAt: ${session.scheduledAt}`);
      session.classId = this.classInfo.id;

      const thisComponent = this;

      this.$dialog
        .confirm(message, options)
        .then(function(dialog) {
          Parse.Cloud.run("class:updateClassSessionV2", { session })
            .then(result => {
              console.log(
                `updateClassSession - result: ${JSON.stringify(result)}`
              );
              dialog.close();
              // thisComponent.$router.go();
              window.location.reload();
            })
            .catch(e => {
              console.log(`error in updateClassSession: ${JSON.stringify(e)}`);
              dialog.close();
              thisComponent.$dialog.alert(`error in updateClassSession: ${e}`);
            });
        })
        .catch(e => {
          console.log(`error: ${e}`);
        });
    }
  }
};
</script>
