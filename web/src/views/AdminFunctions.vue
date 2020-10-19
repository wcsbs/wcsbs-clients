<template>
  <div>
    <b-form @submit="onSubmit" @reset="onReset">
      <h4>Run Admin Functions</h4>
      <b-input-group prepend="Name：" class="mt-3">
        <b-form-input v-model="name" placeholder="Enter function name" trim />
        <b-input-group-append>
          <b-button type="reset" variant="warning">
            <b-icon icon="x-circle"></b-icon>
          </b-button>
          <b-button type="submit" variant="success">
            <b-icon icon="check-circle"></b-icon>
          </b-button>
        </b-input-group-append>
      </b-input-group>
      <b-form-textarea
        v-model="params"
        placeholder="Enter parameters"
        rows="8"
        max-rows="20"
      ></b-form-textarea>
    </b-form>
    <div class="multiline">Result: {{ result }}</div>
  </div>
</template>

<script>
import Parse from "parse";

export default {
  name: "AdminDashboard",
  data: function() {
    return {
      name: "",
      params: "",
      result: ""
    };
  },
  methods: {
    onReset(evt) {
      evt.preventDefault();
      this.name = "";
      this.params = "";
      this.result = "";
    },
    onSubmit(evt) {
      evt.preventDefault();
      const options = {
        okText: "Confirm",
        cancelText: "Cancel",
        loader: true // default: false - when set to true, the proceed button shows a loader when clicked; and a dialog object will be passed to the then() callback
      };
      const message = {
        title: "Run Admin Function",
        body: `Confirm to run function ${this.name}？`
      };

      const thisComponent = this;

      this.$dialog
        .confirm(message, options)
        .then(function(dialog) {
          Parse.Cloud.run(thisComponent.name, JSON.parse(thisComponent.params))
            .then(result => {
              thisComponent.result = JSON.stringify(result, null, 4);
              dialog.close();
            })
            .catch(e => {
              thisComponent.result = JSON.stringify(e, null, 4);
              dialog.close();
            });
        })
        .catch(e => {
          console.log(`error: ${e}`);
        });
    }
  }
};
</script>

<style>
.multiline {
  white-space: pre-wrap;
}
</style>
