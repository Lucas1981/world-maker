<template>
  <div>
    <p>
      <button class="btn btn-primary mx-1" @click="loadWorldProxy($event)" v-blur>Load world</button>
      <input type="file" class="d-none" ref="loadSelection" @change="loadWorld($event)"></button>
      <button class="btn btn-primary mx-1" @click="saveWorld" v-blur>Save world</button>
      <button class="btn btn-danger mx-1" @click="newWorld" v-blur>New world</button>
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import FileHandler from '../classes/FileHandler';
import Frame from '../classes/Frame';
import Animation from '../classes/Animation';
import Canvas from '../classes/Canvas';
import Mapper from '../classes/Mapper';

@Component({
  name: 'FileMenu'
})
export default class FileMenu extends Vue {

  public saveWorld(event) {
    // Let's create a world
    const world: object = {};

    // First, let's record the basic stuff, like units
    world.config = {
      unit: this.$store.getters.unit,
    };

    // Then, let's record the frames
    world.frames = this.$store.getters.frames.map(frame => ({
      width: frame.width,
      height: frame.height,
      x: frame.x,
      y: frame.y
    }));

    // Next, let's record the animations
    world.animations = this.$store.getters.animations.map(animation => ({
      // Make sure to convert back to the actual frame indices
      data: animation.indices.map(key => this.$store.getters.framesMapper.getValue(key)),
      loopType: animation.loopType
    }));

    // Next, let's record the tiles
    world.tiles = this.$store.getters.tiles.map(tile => ({
      type: tile.type,
      animation: this.$store.getters.animationsMapper.getValue(tile.animation)
    }));

    // Next, let's record the actors
    world.actors = this.$store.getters.actors.map(actor => ({
      name: actor.name,
      collidable: actor.collidable,
      visible: actor.visible,
      updatable: actor.updatable,
      states: actor.states.map(state => ({
        key: state.key,
        value: this.$store.getters.animationsMapper.getValue(state.value)
      }))
    }));

    // Then, let's record the maps
    world.maps = this.$store.getters.maps.map(map => {
      const actors: [] = [];
      const grid: [] = [];

      // Get the proper actors
      for (let actor: object = map.stagedActors.first(); actor !== null; actor = actor.next) {
        actors.push({
          type: this.$store.getters.actorsMapper.getValue(actor.element.actor),
          x: actor.element.x,
          y: actor.element.y
        });
      }

      // Get the proper tiles
      for (let i: number = 0; i < map.grid.length; i++) {
        grid[i] = [];
        for (let j: number = 0; j < map.grid[i].length; j++) {
          grid[i][j] = this.$store.getters.tilesMapper.getValue(map.grid[i][j]);
        }
      }

      return {
        grid,
        actors
      };
    });

    // Finally, add the image data
    world.imageData = this.$store.getters.canvas.getCanvasElement().toDataURL();

    // Finally, download the json
    FileHandler.downloadJsonFile('world.json', world);
  }

  public loadWorldProxy(event) {
    const loadSelectionsPointer = this.$refs.loadSelection;
    loadSelectionsPointer.click();
  }

  public async loadWorld(event) {
    // Essentially, we have to do everything that you would do manually in one go.
    // Since there is never any deletion involved, we can treat key and value
    // in our maps as the same and we don't have to convert to mapped values

    // ?We might have to globally lock down the animation loop while we do this?

    const content: object = await FileHandler.handleJsonFile(event);
    const image: Image = new Image();

    this.$store.commit('setLoading', true);
    await this.$nextTick();

    // Clear out what we have to be sure we start fresh
    this.$store.commit('clearAll');
    this.$store.commit('setSourceImage', new Image());
    this.$store.commit('setCanvas', new Canvas(512, 512, null, true));
    this.$store.commit('setFramesMapper', new Mapper());
    this.$store.commit('setAnimationsMapper', new Mapper());
    this.$store.commit('setTilesMapper', new Mapper());
    this.$store.commit('setActorsMapper', new Mapper());
    this.$store.commit('setUnit', 64);

    // First, load the image source data
    image.src = content.imageData;
    await new Promise((resolve, reject) => {
      image.onload = () => {
        resolve();
      };
      image.onerror = () => {
        reject();
      }
    }).catch(err => {
      console.log(err);
    });

    this.$store.getters.canvas.drawImage(image);

    // Set the global configuration
    this.$store.commit('setUnit', content.config.unit);

    // Then, populate the frames
    for (const frame of content.frames) {
      this.$store.commit('addFrame', { x: frame.x, y: frame.y });
    }

    // Then, populate the animations
    for (const animation of content.animations) {
      this.$store.commit('addAnimation', { indices: animation.data, loopType: animation.loopType });
    }

    // Then, populate the tiles
    for (const tile of content.tiles) {
      this.$store.commit('addTile', { type: tile.type, animation: tile.animation });
    }

    // Then, populate the actors
    for (const actor of content.actors) {
      this.$store.commit('addActor', {
        name: actor.name,
        collidable: actor.collidable,
        visible: actor.visible,
        updatable: actor.updatable,
        states: actor.states
      });
    }

    // Finally, populate the maps
    for (const map of content.maps) {
      this.$store.commit('addMap', { grid: map.grid, actors: map.actors });
    }

    this.$store.commit('setLoading', false);

    // This is required because if we load the same file again it will not be picked up
    // as a change if we don't reset the value of the field
    this.$refs.loadSelection.value = '';
  }

  public newWorld() {
    this.$store.commit('setLoading', true);
    this.$store.commit('clearAll');
    this.$store.commit('setSourceImage', new Image());
    this.$store.commit('setCanvas', new Canvas(512, 512, null, true));
    this.$store.commit('setFramesMapper', new Mapper());
    this.$store.commit('setAnimationsMapper', new Mapper());
    this.$store.commit('setTilesMapper', new Mapper());
    this.$store.commit('setActorsMapper', new Mapper());
    this.$store.commit('setUnit', 64);
    this.$store.commit('setLoading', false);
  }
}
</script>
