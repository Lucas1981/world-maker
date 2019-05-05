<template>
  <div class="tiles">
    <div class="row">
      <div class="col-6">
        <h3>Tiles</h3>
        <button @click="addTile()" class="btn btn-primary" v-blur>Add tile</button>
        <div class="row">
          <div v-for="(tile, index) in tiles" class="col-6">
          <div class="card mt-1">
            <div class="card-body">
              <div class="my-1">
                <strong>Tile {{ index + 1 }}</strong>
                <button class="btn btn-danger btn-sm ml-2" @click="removeTile(index)" v-blur>Remove tile</button>
              </div>
              <div class="input-group my-3">
                <div class="input-group-prepend">
                  <span class="input-group-text" id="basic-addon1">Type</span>
                </div>
                <select v-model="tile.type" class="form-control">
                  <option v-for="option in typeOptions" :bind="option">{{ option }}</option>
                </select>
              </div>
              <div class="row">
                <div class="col-6">
                  <div class="form-check">
                    <input
                      type="radio"
                      class="form-check-input"
                      :id="index"
                      :value="index"
                      :checked="activeSelection == index"
                      v-model="activeSelection"
                      v-blur
                    />
                    <label>
                      Active
                    </label>
                  </div>
                </div>
                <div class="col-6 text-right">
                  <!-- A tile has only one animation -->
                  <canvas :ref="`prev-anim-${index}`" style="background: #f8f8f8;"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      <div class="col-6">
        <h3>Animations</h3>
        <canvas ref="displayCanvas"></canvas>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Base from './Base.ts';
import Animation from '../classes/Animation.ts';
import Canvas from '../classes/Canvas.ts'

const typeOptions = [ 'solid', 'background' ];

@Component
export default class Tiles extends Base {
  private displayCanvas: Canvas;
  private start: any;
  private canvases: any = {};
  public typeOptions: Array<string> = null;
  public activeSelection: number = -1;

  async mounted(): void {
    this.typeOptions = typeOptions;
    this.displayCanvas = new Canvas(512, 512, this.$refs.displayCanvas);
    this.start = new Date();
    await this.initiatePreviewAnimations();
    if (this.canvas !== null) this.mainLoop();
  }

  public mainLoop(): void {
    const now: Date = new Date();
    const elapsedTime: number = now - this.start;
    const maxX: number = this.displayCanvas.width - this.unit;
    const maxY: number = this.displayCanvas.height - this.unit;

    this.handleKeyboardInput(maxX, maxY);
    this.displayCanvas.fillCanvas();
    this.drawAnimations(elapsedTime);
    this.drawRubberBand(this.displayCanvas);
    this.drawCanvases(elapsedTime);

    if (!this.isDestroyed) this.request.call(window, this.mainLoop.bind(this));
  }

  private async initiatePreviewAnimations(): Promise {
    return new Promise( (resolve, reject) => {
      this.$nextTick(() => {
        for (let i: number = 0; i < this.tiles.length; i++) {
          const key: string = `prev-anim-${i}`;
          this.canvases[key] = new Canvas(this.unit, this.unit, this.$refs[key][0]);
        }
        resolve('Done initiating canvases');
      });
    });
  }

  public addTile(): void {
    this.$store.commit('addTile')
    this.$nextTick(() => {
      const key: string = `prev-anim-${this.tiles.length - 1}`;
      this.canvases[key] = new Canvas(this.unit, this.unit, this.$refs[key][0]);
      this.activeSelection = this.tiles.length - 1;
    });
  }

  public removeTile(index: number): void {
    this.$store.commit('removeTile', index);

    /* If this tile was selected, we need to select another one */

    if (this.tiles.length === 0) {
      this.activeSelection = -1;
    // If this was the top tile, seek the next down
    } else if (this.activeSelection === this.tiles.length) {
      this.activeSelection--;
    }
  }

  private onSpace(): void {
    this.addAnimation();
  }

  private addAnimation(): void {
    // Don't bother if no selection has been activated
    if (this.activeSelection === -1) return;

    // First get the index based on our coordinates
    const dx: number = parseInt(this.x / this.unit);
    const dy: number = parseInt(this.y / this.unit);
    const index: number = dx + (parseInt(this.canvas.width / this.unit) * dy);

    // Don't bother if the index doesn't refer to an animation
    if (index >= this.animations.length) return;

    this.$store.commit('addTileAnimation', { tileIndex: this.activeSelection, animation: index });
  }

  private drawAnimations(elapsedTime: number): void {
    for(let i: number = 0; i < this.animations.length; i++) {
      this.animations[i].draw(
        this.displayCanvas.getContext(),
        parseInt(i % parseInt(this.displayCanvas.width / this.unit)) * this.unit,
        parseInt(i / parseInt(this.displayCanvas.width / this.unit)) * this.unit,
        elapsedTime
      );
    }
  }

  private drawCanvases(elapsedTime: number): void {
    for (let i: number = 0; i < this.tiles.length; i++) {
      if (this.tiles[i].animation !== null) {
        const key: string = `prev-anim-${i}`;
        const animKey: number = this.tiles[i].animation;
        const animation: number = this.animationsMapper.getValue(animKey);
        if (typeof animation === 'number') {
          this.canvases[key].fillCanvas
          this.animations[animation].draw(
            this.canvases[key].getContext(),
            0, 0, elapsedTime
          );
        }
      }
    }
  }
}
</script>
