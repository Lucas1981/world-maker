<template>
  <div class="maps">
    <div class="row">
      <div class="col-2">
        <p>
          <button class="btn btn-primary" @click="addMap()" v-blur>Add map</button>
          <span class="mx-2" v-if="activeMap !== null" >
            <button class="btn btn-danger" @click="removeMap()" v-blur>Remove map</button>
          </span>
        </p>
        <div class="list-group">
          <a
            href="#"
            v-for="(map, index) in maps"
            class="list-group-item list-group-item-action"
            :class="{ active: activeMap === index }"
            @click="activateMap(index)"
          >
            Map {{ index + 1 }}
          </a>
        </div>
      </div>
      <div class="col-8 text-center">
        <canvas ref="map" style="background-color:#f8f8f8;"></canvas>
      </div>
      <div class="col-2">
        <ul class="nav nav-tabs mb-3">
          <li class="nav-item">
            <div class="nav-link u-cursor-pointer" :class="{ 'active': tab === 'elements' }" @click="tab = 'elements'">Elements</div>
          </li>
          <li class="nav-item">
            <div class="nav-link u-cursor-pointer" :class="{ 'active': tab === 'actorsManager' }" @click="tab = 'actorsManager'">Manage actors</div>
          </li>
        </ul>
        <div v-show="tab === 'elements'">
          <h4>Tiles</h4>
          <canvas
            ref="tiles"
            style="background-color:#f8f8f8;"
            @click="onClickTilesCanvas"
          ></canvas>
          <h4>Actors</h4>
          <canvas
            ref="actors"
            style="background-color:#f8f8f8;"
            @click="onClickActorsCanvas"
          ></canvas>
        </div>
        <div v-show="tab === 'actorsManager'">
          <div v-for="(actor, index) in stagedActorsAsArray">
            <div class="card mt-1">
              <div class="card-body">
                <p>Actor {{ index + 1 }} | Type: {{ getActorType(actor.actor) }}</p>
                <p>x: {{actor.x}} | y: {{actor.y}}</p>
                <p>
                  <button
                    class="btn btn-danger btn-sm"
                    @click="removeStagedActor(actor.ref)"
                    v-blur
                  >
                    Remove actor
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.u-cursor-pointer {
  cursor: pointer;
}
</style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Base from './Base.ts';
import LinkedList from '../classes/LinkedList.ts';
import Canvas from '../classes/Canvas.ts';

@Component
export default class Maps extends Base {
  public activeMap: number = null;
  public mapCanvas: Canvas;
  public tilesCanvas: Canvas;
  public actorsCanvas: Canvas;
  public start: Date = null;
  public tab: string = 'elements';
  private selectedIndex: number = -1;
  private isTileSelected: Boolean = false;

  mounted() {
    this.start = new Date();
    this.mapCanvas = new Canvas(this.unit * this.gridWidth, this.unit * this.gridHeight, this.$refs.map);
    this.tilesCanvas = new Canvas(256, 256, this.$refs.tiles);
    this.actorsCanvas = new Canvas(256, 384, this.$refs.actors);
    this.mainLoop();
  }

  public mainLoop(): void {
    const maxX: number = this.mapCanvas.width - this.unit;
    const maxY: number = this.mapCanvas.height - this.unit;
    const now: Date = new Date();
    const elapsedTime: number = now - this.start;

    this.mapCanvas.clearCanvas();
    this.drawAvailableTiles(elapsedTime);
    this.drawAvailableActors(elapsedTime);
    this.handleKeyboardInput(maxX, maxY);
    if (this.activeMap !== null) this.drawGrid(elapsedTime);
    if(this.activeMap !== null) this.drawStagedActors(elapsedTime);
    this.drawRubberBand(this.mapCanvas);

    if (this.selectedIndex !== -1) {
      const canvas = this.isTileSelected ? this.tilesCanvas : this.actorsCanvas;
      canvas.drawRubberBand(
        parseInt(this.selectedIndex % (canvas.width / this.unit)) * this.unit,
        parseInt(this.selectedIndex / (canvas.width / this.unit)) * this.unit,
        this.unit, this.unit, '#FF0000'
      );
    }

    if (!this.isDestroyed) this.request.call(window, this.mainLoop.bind(this));
  }

  public addMap(): void {
    this.$store.commit('addMap');
    if(this.activeMap === null) this.activeMap = 0;
  }

  public removeMap(): void {
    this.$store.commit('removeMap', this.activeMap);
    if (this.maps.length === 0) {
      this.activeMap = null;
    // If this was the top tile, seek the next down
    } else if (this.activeMap === this.maps.length) {
      this.activeMap--;
    }
  }

  public activateMap(index: number): void {
    this.activeMap = index;
  }

  public onClickTilesCanvas(element: object): void {
    this.selectedIndex = this.getAnimationIndex(element);
    this.isTileSelected = true;
  }

  public onClickActorsCanvas(element: object): void {
    this.selectedIndex = this.getAnimationIndex(element);
    this.isTileSelected = false;
  }

  private getAnimationIndex(element: object): number {
    const x: number = parseInt(element.offsetX / this.unit);
    const y: number = parseInt(element.offsetY / this.unit);
    const index: number = x + (parseInt(this.tilesCanvas.width / this.unit) * y);
    return index;
  }

  public getActorType(type: any): void {
    const key: number = this.actorsMapper.getKey(type);
    return this.actors[key].name;
  }

  public get stagedActorsAsArray(): void {
    const actorsAsArray = [];
    if(this.activeMap !== null) {
      for (let actor: object = this.maps[this.activeMap].stagedActors.first(); actor !== null; actor = actor.next) {
        actorsAsArray.push({
          actor: actor.element.actor,
          x: actor.element.x,
          y: actor.element.y,
          ref: actor.element
        });
      }
    }
    return actorsAsArray;
  }

  public removeStagedActor(actor: number): void {
    this.maps[this.activeMap].stagedActors.remove(actor);
  }

  public onSpace(): void {
    if (this.activeMap === null || this.selectedIndex === -1) return;
    const x: number = parseInt(this.x / this.unit);
    const y: number = parseInt(this.y / this.unit);
    if(this.isTileSelected) {
      const key = this.tilesMapper.getKey(this.selectedIndex);
      this.maps[this.activeMap].grid[y][x] = key;
    }
    else {
      const key = this.actorsMapper.getKey(this.selectedIndex);
      this.maps[this.activeMap].stagedActors.push({
        actor: key,
        x: this.x,
        y: this.y
      });
    }
  }

  public drawGrid(elapsedTime: number): void {
    // Don't bother if we don't have any animations
    if(this.animations.length === 0) return;
    this.mapCanvas.fillCanvas();
    const grid: Array = this.maps[this.activeMap].grid;
    for (let y: number = 0; y < grid.length; y++) {
      for (let x: number = 0; x < grid[y].length; x++) {
        const tileValue: any = this.tilesMapper.getValue(grid[y][x]);
        if (
          typeof tileValue !== 'number' ||
          !('animation' in this.tiles[tileValue])
        ) continue;
        const animKey: number = this.tiles[tileValue].animation;
        const animation: any = this.animationsMapper.getValue(animKey);
        if (typeof animation === 'number') {
          this.animations[animation].draw(
            this.mapCanvas.getContext(),
            parseInt(x * this.unit),
            parseInt(y * this.unit),
            elapsedTime
          )
        }
      }
    }
  }

  public drawStagedActors(elapsedTime: number): void {
    // Don't bother if we don't have any animations
    if (this.animations.length === 0) return;
    for (let actor: object = this.maps[this.activeMap].stagedActors.first(); actor !== null; actor = actor.next) {
      const actorValue: number = this.actorsMapper.getValue(actor.element.actor);
      if (
        typeof actorValue !== 'number' ||
        this.actors[actorValue].states.length === 0
      ) continue;
      const animKey: number = this.actors[actorValue].states[0].value.animationKey;
      const animation: any = this.animationsMapper.getValue(animKey);
      if (typeof animation === 'number') {
        this.animations[animation].draw(
          this.mapCanvas.getContext(),
          actor.element.x,
          actor.element.y,
          elapsedTime
        );
      }
    }
  }

  private drawAvailableTiles(elapsedTime: number): void {
    // Don't bother if we don't have any animations
    this.tilesCanvas.clearCanvas();
    if(this.animations.length === 0) return;
    for (let i: number = 0; i < this.tiles.length; i++) {
      const animKey: number = this.tiles[i].animation
      const animation: any = this.animationsMapper.getValue(animKey);
      // Don't bother if we can't find an animation index
      if (typeof animation === 'number') {
        this.animations[animation].draw(
          this.tilesCanvas.getContext(),
          parseInt(i % parseInt(this.tilesCanvas.width / this.unit)) * this.unit,
          parseInt(i / parseInt(this.tilesCanvas.width / this.unit)) * this.unit,
          elapsedTime
        );
      }
    }
  }

  private drawAvailableActors(elapsedTime: number): void {
    // Don't bother if we don't have any animations
    this.actorsCanvas.clearCanvas();
    if(this.animations.length === 0) return;
    for(let i: number = 0; i < this.actors.length; i++) {
      if (this.actors[i].states.length === 0) continue;
      const animKey: number = this.actors[i].states[0].value.animationKey;
      const animation: any = this.animationsMapper.getValue(animKey);
      if (typeof animation === 'number') {
        this.animations[animation].draw(
          this.actorsCanvas.getContext(),
          parseInt(i % parseInt(this.actorsCanvas.width / this.unit)) * this.unit,
          parseInt(i / parseInt(this.actorsCanvas.width / this.unit)) * this.unit,
          elapsedTime
        );
      }
    }
  }
};
</script>
