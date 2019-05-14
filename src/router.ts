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
      component: () => import(/* webpackChunkName: "frames" */ './views/Frames.vue'),
    },
    {
      // Animations
      path: '/animations',
      name: 'animations',
      component: () => import(/* webpackChunkName: "animations" */ './views/Animations.vue'),
    },
    {
      // Tiles
      path: '/tiles',
      name: 'tiles',
      component: () => import(/* webpackChunkName: "tiles" */ './views/Tiles.vue'),
    },
    {
      // Actors
      path: '/actors',
      name: 'actors',
      component: () => import(/* webpackChunkName: "actors" */ './views/Actors.vue'),
    },
    {
      // Maps
      path: '/maps',
      name: 'maps',
      component: () => import(/* webpackChunkName: "maps" */ './views/Maps.vue'),
    },
    {
      path: '/sounds',
      name: 'sounds',
      component: () => import(/* webpackChunkName: "maps" */ './views/Sounds.vue')
    }
  ],
});
