<template>
  <div class="user-preview">
    <div v-if="dashboard.enrolledClasses.length === 0" class="user-preview">
      您还没有参加任何佛学课程！
    </div>
    <Class
      v-else
      v-for="(buddhaClass, index) in dashboard.enrolledClasses"
      :buddhaClass="buddhaClass"
      :key="buddhaClass.id + index"
    />
    <h2 v-if="dashboard.newClasses.length">学会最新课程</h2>
    <Class
      v-for="(buddhaClass, index) in dashboard.newClasses"
      :buddhaClass="buddhaClass"
      :key="buddhaClass.id + index"
      :forApplication="true"
    />
  </div>
</template>

<script>
import Class from "./Class";

export default {
  name: "StudentDashboard",
  props: {
    dashboard: { type: Object, required: true }
  },
  components: {
    Class
  }
};
</script>
