<template>
  <div id="app" ref="root">

    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <h1>World editor</h1>
    </nav>

    <div class="m-3">

      <file-menu />

      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <router-link class="nav-link" :class="{ 'active': activeLink === '/frames' }" to="/frames">Frames</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" :class="{ 'active': activeLink === '/animations' }" to="/animations">Animations</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" :class="{ 'active': activeLink === '/tiles' }" to="/tiles">Tiles</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" :class="{ 'active': activeLink === '/actors' }" to="/actors">Actors</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" :class="{ 'active': activeLink === '/maps' }" to="/maps">Maps</router-link>
        </li>
      </ul>

      <div v-if="!isLoading">
        <router-view/>
      </div>

    </div>
  </div>
</template>

<style>

.we-delete-icon:hover {
  cursor: url('./assets/trash.png') 0 0, pointer;
}

</style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import KeyboardInput from './classes/KeyboardInput.ts';
import Canvas from './classes/Canvas.ts';
import Mapper from './classes/Mapper';
import FileMenu from '@/components/FileMenu.vue';

@Component({
  components: {
    FileMenu
  }
})
export default class App extends Vue {

  get activeLink() {
    return this.$route.path;
  }

  get isLoading() {
    return this.$store.getters.isLoading;
  }

  mounted() {
    this.$store.commit('setKeyboard', new KeyboardInput(this.$refs.root));
    this.$store.commit('setCanvas', new Canvas(512, 512, null, true));
    this.$store.commit('setSourceImage', new Image());
    this.$store.commit('setFramesMapper', new Mapper());
    this.$store.commit('setAnimationsMapper', new Mapper());
    this.$store.commit('setTilesMapper', new Mapper());
    this.$store.commit('setActorsMapper', new Mapper());
    this.$store.commit('setUnit', 64);
    this.$store.commit('setGridWidth', 15);
    this.$store.commit('setGridHeight', 11);
    this.$store.commit('setLoading', false);
  }
}
</script>
