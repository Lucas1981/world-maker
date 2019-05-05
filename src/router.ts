import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home.vue';
import Frames from './views/Frames.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      redirect: 'frames',
    },
    {
      // Frames
      path: '/frames',
      name: 'frames',
      component: () => import(/* webpackChunkName: "about" */ './views/Frames.vue'),
    },
    {
      // Animations
      path: '/animations',
      name: 'animations',
      component: () => import(/* webpackChunkName: "about" */ './views/Animations.vue'),
    },
    {
      // Tiles
      path: '/tiles',
      name: 'tiles',
      component: () => import(/* webpackChunkName: "about" */ './views/Tiles.vue'),
    },
    {
      // Actors
      path: '/actors',
      name: 'actors',
      component: () => import(/* webpackChunkName: "about" */ './views/Actors.vue'),
    },
    {
      // Maps
      path: '/maps',
      name: 'maps',
      component: () => import(/* webpackChunkName: "about" */ './views/Maps.vue'),
    },
  ],
});
