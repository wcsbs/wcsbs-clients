<template>
  <div class="user-management"><UserList type="feed" /></div>
</template>

<script>
import UserList from "@/components/UserList";
import { FETCH_USERS } from "../store/actions.type";
import store from "@/store";

export default {
  name: "UserManagement",
  components: {
    UserList
  },
  beforeRouteEnter(to, from, next) {
    console.log(`from: ${from.path}`);
    if (!from || !from.path || !from.path.startsWith("/user")) {
      store.dispatch(FETCH_USERS).then(() => {
        next();
      });
    } else {
      next();
    }
  }
};
</script>
