<template>
  <div class="maps">
    <div class="row">
      <div class="col-2">
        <p>
          <label>
            Background color: <input type="color" v-if="maps && activeMap !== null" v-model="maps[activeMap].backgroundColor" />
            {{ maps && activeMap !== null ? maps[activeMap].backgroundColor : 'no color' }}
          </label>
        </p>
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
        <canvas
          ref="map"
          style="background-color:#f8f8f8;"
          @click="onClickMapCanvas"
        ></canvas>
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
          <div class="form-check">
            <input class="form-check-input" type="radio" id="radio-sub-layer" value="0" v-model="level" />
            <label class="form-check-label" for="radio-sub-layer">Sub</label>
            <input type="checkbox" v-model="showLevel[0]"> Show
          </div>
          <div class="form-check">
            <input class="form-check-input" type="radio" id="radio-normal-layer" value="1" v-model="level" />
            <label class="form-check-label" for="radio-sub-layer">Normal</label>
            <input type="checkbox" v-model="showLevel[1]"> Show
          </div>
          <div class="form-check">
            <input class="form-check-input" type="radio" id="radio-super-layer" value="2" v-model="level" />
            <label class="form-check-label" for="radio-sub-layer">Super</label>
            <input type="checkbox" v-model="showLevel[2]"> Show
          </div>
          <canvas
            ref="tiles"
            style="background-color:#f8f8f8;"
            @click="onClickTilesCanvas"
          ></canvas>
          <p class="fill-buttons">
            <button class="btn btn-primary btn-small" @click="fill()">Fill</button>
            <button class="btn btn-primary btn-small" @click="fillCol()">Fill col</button>
            <button class="btn btn-primary btn-small" @click="fillRow()">Fill row</button>
          </p>
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
                <div class="input-group mb-3">
                  <div class="input-group-prepend">
                    <span class="input-group-text">Condition</span>
                  </div>
                  <input type="number" class="form-control" v-model.number="actor.ref.condition" />
                </div>
                <div class="input-group mb-3">
                  <div class="input-group-prepend">
                    <span class="input-group-text">Direction</span>
                  </div>
                  <input type="number" class="form-control" v-model.number="actor.ref.direction" />
                </div>
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
  public level: number = 1;
  public showLevel: [] = [true, true, true]
  private selectedIndex: number = -1;
  private isTileSelected: Boolean = false;

  mounted() {
    this.start = new Date();
    this.mapCanvas = new Canvas(this.unit * this.cameraWidth, this.unit * this.cameraHeight, this.$refs.map);
    this.tilesCanvas = new Canvas(256, 256, this.$refs.tiles);
    this.actorsCanvas = new Canvas(256, 384, this.$refs.actors);
    this.mainLoop();
  }

  public mainLoop(): void {
    const maxX: number = (this.gridWidth - 1) * this.unit;
    const maxY: number = (this.gridHeight - 1) * this.unit;
    const now: Date = new Date();
    const elapsedTime: number = now - this.start;

    if (this.activeMap !== null) this.mapCanvas.fillCanvas(this.maps[this.activeMap].backgroundColor);
    this.drawAvailableTiles(elapsedTime);
    this.drawAvailableActors(elapsedTime);
    this.handleKeyboardInput(maxX, maxY);
    this.determineCameraPosition();
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

  // We overload this one here because we need to take into account the
  // camera position
  private drawRubberBand(canvas: Canvas, color: string = 'orange'): void {
    canvas.drawRubberBand(
      parseInt((this.x - this.cameraX) / this.unit, 10) * this.unit,
      parseInt((this.y - this.cameraY) / this.unit, 10) * this.unit,
      this.unit,
      this.unit,
      color
    );
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

  private determineCameraPosition() {
    // Set up the values we need to calculate
    const halfUnit = this.unit / 2;
    const totalFieldWidth = this.gridWidth * this.unit;
    const totalFieldHeight = this.gridHeight * this.unit;
    const distancePlayerToLeft = this.x; // the left edge is 0, so the x is all we need
    const distancePlayerToRight = totalFieldWidth - this.x;
    const distancePlayerToTop = this.y;
    const distancePlayerToBottom = totalFieldHeight - this.y;
    const maximumCameraWidth = this.cameraWidth / 2 * this.unit;
    const maximumCameraHeight = this.cameraHeight / 2 * this.unit;

    // Let's assume all is well and we can just go ahead
    let cameraX = this.x - maximumCameraWidth - halfUnit;
    let cameraY = this.y - maximumCameraHeight - halfUnit;

    // Compare values and make necessary adjustments
    if (distancePlayerToLeft < maximumCameraWidth) cameraX = 0;
    if (distancePlayerToRight < maximumCameraWidth) cameraX = totalFieldWidth - (this.cameraWidth * this.unit);
    if (distancePlayerToTop < maximumCameraHeight) cameraY = 0;
    if (distancePlayerToBottom < maximumCameraHeight) cameraY = totalFieldHeight - (this.cameraHeight * this.unit);

    this.$store.commit('setCameraX', cameraX);
    this.$store.commit('setCameraY', cameraY);
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
    const x: number = parseInt(this.x / this.unit);
    const y: number = parseInt(this.y / this.unit);
    this.placeTile(x, y);
  }

  public fill(): void {
    for (let y = 0; y < this.maps[this.activeMap].grid[this.level].length; y++) {
      for (let x = 0; x < this.maps[this.activeMap].grid[this.level][0].length; x++) {
        this.placeTile(x, y);
      }
    }
  }

  public fillRow(): void {
    const y: number = parseInt(this.y / this.unit);
    for (let x = 0; x < this.maps[this.activeMap].grid[this.level][0].length; x++) {
      this.placeTile(x, y);
    }
  }

  public fillCol(): void {
    const x: number = parseInt(this.x / this.unit);
    for (let y = 0; y < this.maps[this.activeMap].grid[this.level].length; y++) {
      this.placeTile(x, y);
    }
  }

  private placeTile(x, y) {
    if (this.activeMap === null || this.selectedIndex === -1) return;
    if(this.isTileSelected) {
      const key = this.tilesMapper.getKey(this.selectedIndex);
      this.maps[this.activeMap].grid[this.level][y][x] = key;
    }
    else {
      const key = this.actorsMapper.getKey(this.selectedIndex);
      this.maps[this.activeMap].stagedActors.push({
        actor: key,
        x: this.x,
        y: this.y,
        direction: 0,
        condition: 0
      });
    }
  }

  public drawGrid(elapsedTime: number): void {
    // Don't bother if we don't have any animations
    if(this.animations.length === 0) return;
    for (let i = 0; i < 3; i++) {
      if (!this.showLevel[i]) continue;
      const grid: Array = this.maps[this.activeMap].grid[i];
      const cameraX = parseInt(this.cameraX / this.unit);
      const cameraY = parseInt(this.cameraY / this.unit);
      for (let y: number = 0; y < this.cameraHeight; y++) {
        for (let x: number = 0; x < this.cameraWidth; x++) {
          if (grid[y + cameraY][x + cameraX] === null) continue; // Skip the null tiles
          const tileValue: any = this.tilesMapper.getValue(grid[y + cameraY][x + cameraX]);
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

  }

  public drawStagedActors(elapsedTime: number): void {
    // Don't bother if we don't have any animations
    if (this.animations.length === 0) return;
    for (let actor: object = this.maps[this.activeMap].stagedActors.first(); actor !== null; actor = actor.next) {
      const actorValue: number = this.actorsMapper.getValue(actor.element.actor);
      if (
        typeof actorValue !== 'number' ||
        this.actors[actorValue].states.length === 0 ||
        !(
          actor.element.x > this.cameraX &&
          actor.element.x < this.cameraX + (this.cameraWidth * this.unit) &&
          actor.element.y > this.cameraY &&
          actor.element.y < this.cameraY + (this.cameraHeight * this.unit)
        )
      ) continue;
      const animKey: number = this.actors[actorValue].states[0].value.animationKey;
      const animation: any = this.animationsMapper.getValue(animKey);
      if (typeof animation === 'number') {
        this.animations[animation].draw(
          this.mapCanvas.getContext(),
          actor.element.x - this.cameraX,
          actor.element.y - this.cameraY,
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

<style>
.fill-buttons {
  display: flex;
  justify-content: space-between;
  padding-right: 32px;
}
</style>
