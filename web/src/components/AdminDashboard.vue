<template>
  <div class="user-preview">
    <div v-if="dashboard.classes.length === 0" class="user-preview">
      没有找到任何佛学课程！
    </div>
    <Class
      v-else
      v-for="(buddhaClass, index) in dashboard.classes"
      :buddhaClass="buddhaClass"
      :key="buddhaClass.id + index"
    />
  </div>
</template>

<script>
import Class from "./Class";

export default {
  name: "AdminDashboard",
  props: {
    dashboard: { type: Object, required: true }
  },
  components: {
    Class
  }
};
</script>
