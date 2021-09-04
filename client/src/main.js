import Vue from "vue";
import App from "./App.vue";
import VueGoogleApi from "vue-google-api";

const config = {
  apiKey: process.env.VUE_APP_API_KEY,
  clientId: process.env.VUE_APP_CLIENT_ID,
  scope: "https://www.googleapis.com/auth/spreadsheets",
  discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"]
};

Vue.use(VueGoogleApi, config);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");
