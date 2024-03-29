import Vue from 'vue';
import Vuex from 'vuex';
import Animation from './classes/Animation.ts';
import Frame from './classes/Frame.ts';
import Canvas from './classes/Canvas.ts';
import KeyboardInput from './classes/KeyboardInput.ts';
import LinkedList from './classes/LinkedList.ts';
import Mapper from './classes/Mapper.ts';

const debug = false;
const actorOptions = {
  movable: [
    { key: 'Movable', value: 'movable' },
    { key: 'Immovable', value: 'immovable' }
  ],
  threat: [
    { key: 'Harmful', value: 'harmful' },
    { key: 'Harmless', value: 'harmless' },
  ],
  volition: [
    { key: 'Benevolent', value: 'benevolent' },
    { key: 'Malevolent', value: 'malevolent' }
  ],
  vulnerable: [
    { key: 'Vulnerable', value: 'vulnerable' },
    { key: 'Invulnerable', value: 'invulnerable' }
  ],
  actionable: [
    { key: 'Active', value: 'active' },
    { key: 'Passive', value: 'passive' }
  ]
  /*
  Other options:
  collidable: [
    { key: 'Solid', value: 'solid'},
    { key: 'Not solid', value: 'notSolid' }
  ],
  visible: [
    { key: 'Visible', value: 'visible' },
    { key: 'Invisible', value: 'invisible' }
  ],*/
};

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    world: {},
    maps: [],
    actors: [],
    tiles: [],
    animations: [],
    frames: [],
    sounds: [],
    keyboard: null,
    canvas: null,
    sourceImage: null,
    actorsMapper: null,
    tilesMapper: null,
    animationsMapper: null,
    framesMapper: null,
    gridWidth: 15,
    gridHeight: 11,
    cameraWidth: 15,
    cameraHeight: 11,
    cameraX: 0,
    cameraY: 0,
    unit: 0,
    loading: true,
    debug
  },
  getters: {
    world(state): object { return state.world; },
    maps(state): [] { return state.maps; },
    actors(state): [] { return state.actors; },
    tiles(state): [] { return state.tiles; },
    animations(state): Animation[] { return state.animations; },
    frames(state): Frame[] { return state.frames; },
    sounds(state): [] { return state.sounds; },
    keyboard(state): KeyboardInput { return state.keyboard; },
    canvas(state): Canvas { return state.canvas; },
    sourceImage(state): object { return state.sourceImage; },
    framesMapper(state): Mapper { return state.framesMapper; },
    animationsMapper(state): Mapper { return state.animationsMapper; },
    tilesMapper(state): Mapper { return state.tilesMapper; },
    actorsMapper(state): Mapper { return state.actorsMapper; },
    actorOptions(): object { return actorOptions; },
    gridWidth(state): number { return state.gridWidth; },
    gridHeight(state): number { return state.gridHeight; },
    cameraWidth(state): number { return state.cameraWidth; },
    cameraHeight(state): number { return state.cameraHeight; },
    cameraX(state): number { return state.cameraX; },
    cameraY(state): number { return state.cameraY; },
    unit(state): number { return state.unit; },
    isLoading(state): boolean { return state.loading; },
    debug(state): boolean { return state.debug; }
  },
  mutations: {
    clearAll(state): void {
      state.world = {};
      state.maps = [];
      state.actors = [];
      state.tiles = [];
      state.animations = [];
      state.frames = [];
      state.sounds = [];
      state.unit = 0;
    },
    addMap(state, { grid = null, actors = null }: object = {}): void {
      const backgroundColor = '#000000';
      const stagedActors = new LinkedList();
      let newGrid: any;

      if (grid === null) {
        newGrid = new Array(3);
        for (let i: number = 0; i < 3; i++) {
          newGrid[i] = new Array(state.gridHeight);
          for (let j: number = 0; j < newGrid[i].length; j++) {
            newGrid[i][j] = new Array(state.gridWidth).fill(0);
          }
        }
      } else {
        newGrid = grid;
      }

      if (actors !== null) {
        for (const actor of actors) {
          stagedActors.push({
            actor: actor.type,
            x: actor.x,
            y: actor.y,
            condition: actor.condition || 0,
            direction: actor.direction || 0
          });
        }
      }

      state.maps.push({
        backgroundColor,
        grid: newGrid,
        stagedActors
      });
    },
    removeMap(state, index: number): void {
      // No one relies on maps, so we can easily remove them
      state.maps.splice(index, 1);
    },
    loadActorStatesTemplate(state, { index, states }: object) {
      // We will receive an array of [{ 'name': {}}] that must be turned into [{ key: 'name', value: {} }]
      state.actors[index].states = states;
    },
    addState(state, index: number): void {
      const states = state.actors[index].states;
      state.actors[index].states.push({
        key: `state${index}-${states.length}`,
        value: {
          tags: ''
        }
      });
    },
    removeState(state, { index, stateIndex }: object): void {
      // Always keep at least one state
      if (state.actors[index].states.length === 1) return;

      // Our animations in the maps don't rely on states, so we can easily remove them
      state.actors[index].states.splice(stateIndex, 1);
    },
    addActor(
      state,
      {
        name = `actor-${state.actors.length + 1}`,
        movable = actorOptions.movable[0].value,
        threat = actorOptions.threat[0].value,
        volition = actorOptions.volition[0].value,
        vulnerable = actorOptions.vulnerable[0].value,
        actionable = actorOptions.actionable[0].value,
        // collidable = actorOptions.collidable[0].key,
        // visible = actorOptions.visible[0].key,
        // updatable = actorOptions.updatable[0].key,
        states = [{
          key: `state${state.actors.length}-0`,
          value: {
            tags: ''
          }
        }]
      }: object = {}
    ): void {
      state.actors.push({
        name,
        movable,
        threat,
        volition,
        vulnerable,
        actionable,
        // collidable,
        // visible,
        // updatable,
        states
      });
      state.actorsMapper.add(state.actors.length - 1);
    },
    removeActor(state, value: number): void {
      const key: number = state.actorsMapper.getKey(value);

      // Kill all references to this actor in all maps
      for (const map of state.maps) {
        for (let actor = map.stagedActors.first(); actor !== null; actor = actor.next) {
          if (actor.element.actor === key) {
            map.stagedActors.remove(actor.element); // Now safely remove the current item
          }
        }
      }

      state.actorsMapper.remove(key); // Kill the record in the actorsMapper
      state.actorsMapper.adjustMap(key); // Adjust the actorsMapper records accordingly
      state.actors.splice(value, 1); // Finally, kill the actor
    },
    addTile(state, { type = 'solid', animation = null }: object = {}) {
      state.tiles.push({
        type,
        animation
      });
      state.tilesMapper.add(state.tiles.length - 1);
    },
    removeTile(state, value: number): void {
      const key: number = state.tilesMapper.getKey(value);

      // Kill all references to this tile in all maps
      for (const map of state.maps) {
        for (let i = 0; i < map.grid.length; i++) {
          for (let j = 0; j < map.grid[i].length; j++) {
            if (map.grid[i][j] === key) {
              map.grid[i][j] = 0;
            }
          }
        }
      }

      state.tilesMapper.remove(key); // Kill the record in the tilesMapper
      state.tilesMapper.adjustMap(key); // Adjust the tilesMapper records accordingly
      state.tiles.splice(value, 1); // Finally, kill the tile
    },
    addActorAnimation(state, { actorIndex, stateIndex, animation }: object): void {
      const key: number = state.animationsMapper.getKey(animation);
      state.actors[actorIndex].states[stateIndex].value.animationKey = key;
    },
    addTileAnimation(state, { tileIndex, animation }: object): void {
      const key: number = state.animationsMapper.getKey(animation);
      state.tiles[tileIndex].animation = key;
    },
    addAnimationIndex(state, { animationIndex, value }: object): void {
      const key: number = state.framesMapper.getKey(value);
      state.animations[animationIndex].addIndex(key);
    },
    deleteAnimationIndex(state, { animationIndex, index }: object): void {
      state.animations[animationIndex].removeIndex(index);
    },
    addAnimation(state, { indices = [], loopType = 1 }: object = {}): void {
      const animation: Animation = new Animation(
        state.frames,
        state.framesMapper,
        indices, loopType, 8
      );
      state.animations.push(animation);
      state.animationsMapper.add(state.animations.length - 1);
    },
    deleteAnimation(state, value: number): void {
      const key: number = state.animationsMapper.getKey(value);

      // Kill the references to this animation in all tiles
      for (const tile of state.tiles) {
        if (tile.animation === key) {
          tile.animation = null;
        }
      }

      // Kill the references to this animation in all actors
      for (const actor of state.actors) {
        for (const actorState of actor.states) {
          if (actorState.value === key) {
            actorState.value = null;
          }
        }
      }

      state.animationsMapper.remove(key); // Kill the record in the animationsMapper
      state.animationsMapper.adjustMap(key); // Adjust the animationsMapper records accordingly
      state.animations.splice(value, 1); // Finally, kill the animation
    },
    addSound(state, sound) {
      state.sounds.push(sound);
    },
    removeSound(state, index) {
      state.sounds.splice(index, 1);
    },
    addFrame(state, {x, y}: object): void {
      const frame: Frame = new Frame(
        state.canvas.getCanvasElement(),
        x, y, state.unit, state.unit
      );
      state.frames.push(frame);
      state.framesMapper.add(state.frames.length - 1);
    },
    deleteFrame(state, value: number): void {
      const key: number = state.framesMapper.getKey(value);

      // Kill the references to this frame in the animations
      for (const animation of state.animations) {
        animation.removeIndex(key);
      }

      state.framesMapper.remove(key); // Kill the record in the framesMapper
      state.framesMapper.adjustMap(key); // Adjust the framesMapper records accordingly
      state.frames.splice(-1, 1); // Finally, kill the last frame in the frame index
    },
    setKeyboard(state, keyboard: KeyboardInput): void {
      state.keyboard = keyboard;
    },
    setCanvas(state, canvas: Canvas): void {
      state.canvas = canvas;
    },
    setSourceImage(state, image: object): void {
      state.sourceImage = image;
    },
    setActorsMapper(state, actorsMapper: Mapper): void {
      state.actorsMapper = actorsMapper;
    },
    setTilesMapper(state, tilesMapper: Mapper): void {
      state.tilesMapper = tilesMapper;
    },
    setAnimationsMapper(state, animationsMapper: Mapper): void {
      state.animationsMapper = animationsMapper;
    },
    setFramesMapper(state, framesMapper: Mapper): void {
      state.framesMapper = framesMapper;
    },
    setGridWidth(state, gridWidth: number) {
      state.gridWidth = gridWidth;
    },
    setGridHeight(state, gridHeight: number) {
      state.gridHeight = gridHeight;
    },
    setCameraWidth(state, cameraWidth: number) {
      state.cameraWidth = cameraWidth;
    },
    setCameraHeight(state, cameraHeight: number) {
      state.cameraHeight = cameraHeight;
    },
    setCameraX(state, cameraX: number) {
      state.cameraX = cameraX;
    },
    setCameraY(state, cameraY: number) {
      state.cameraY = cameraY;
    },
    setUnit(state, unit: number): void {
      state.unit = unit;
    },
    setLoading(state, loading: boolean): void {
      state.loading = loading;
    },
    setSounds(state, sounds: object): void {
      state.sounds = sounds;
    },
  },
});
