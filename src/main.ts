import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import directives from './directives/directives';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

Vue.config.productionTip = false;

for (const [key, value] of Object.entries(directives)) {
  Vue.directive(key, value);
}

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
