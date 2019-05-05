<template>
  <div class="tiles">
    <div class="row">
      <div class="col-6">
        <h3>Actors</h3>
        <div class="my-2">
          <button @click="addActor()" class="btn btn-primary" v-blur>Add actor</button>
        </div>
        <div class="row">
          <div v-for="(actor, index) in actors" class="col-6">
          <div class="card mt-1">
            <div class="card-body">
              <div class="my-1">
                <span><strong>Actor {{ index + 1}}</strong></span>
                <button class="btn btn-danger btn-sm ml-1" @click="removeActor(index)" v-blur>Remove actor</button>
              </div>
              <div class="input-group mb-3 mt-2">
                <div class="input-group-prepend">
                  <span class="input-group-text">Name</span>
                </div>
                <input type="text" class="form-control" v-model="actor.name" v-blur />
              </div>
              <div v-for="(value, key) in actorOptions" class="input-group mb-3">
                <div class="input-group-prepend">
                  <span class="input-group-text">{{ key }}</span>
                </div>
                <select v-model="actor[key]" class="form-control">
                  <option v-for="record in value" :bind="record.value">{{ record.key }}</option>
                </select>
              </div>
              <div v-for="(state, stateIndex) in actor.states" class="my-2">
                <div class="row">
                  <div class="col-3">
                    <div class="form-check">
                      <input
                        type="radio"
                        class="form-check-input"
                        :name="`${index}${separator}${stateIndex}`"
                        :id="`${index}${separator}${stateIndex}`"
                        :value="`${index}${separator}${stateIndex}`"
                        :checked="activeSelection == `${index}${separator}${stateIndex}`"
                        v-model="activeSelection"
                        v-blur
                      />
                      <label class="form-check-label" :for="`${index}${separator}${stateIndex}`">
                        Active
                      </label>
                    </div>
                    <button class="btn btn-danger btn-sm mt-1" @click="deleteState(index, stateIndex)">Delete</button>
                  </div>
                  <div class="col-6">
                    <input type="text" class="form-control" v-model="state.key" v-blur />
                  </div>
                  <div class="col-3">
                    <canvas :ref="`prev-anim-${index}${separator}${stateIndex}`" style="background: #f8f8f8;"></canvas>
                  </div>
                </div>
              </div>
              <button class="btn btn-primary btn-sm" @click="addState(index, actor.states.length)" v-blur>Add state</button>
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
import Canvas from '../classes/Canvas.ts'
import Actor from '../classes/Actor.ts';

const separator = '-';

@Component
export default class Tiles extends Base {
  private displayCanvas: Canvas;
  private start: any;
  private canvases: any = {};
  public activeSelection: string = '';
  public separator: string = separator;

  async mounted() {
    this.displayCanvas = new Canvas(512, 512, this.$refs.displayCanvas);
    this.start = new Date();
    await this.initiatePreviewAnimations();
    if (this.canvas !== null) this.mainLoop();
  }

  public mainLoop() {
    const maxX: number = this.displayCanvas.width - this.unit;
    const maxY: number = this.displayCanvas.height - this.unit;
    const now: Date = new Date();
    const elapsedTime: number = now - this.start;
    const canvasKeys: Array<string> = Object.keys(this.$refs).filter(key => key.includes('prev-anim'));

    this.handleKeyboardInput(maxX, maxY);
    this.displayCanvas.fillCanvas();
    this.drawAnimations(elapsedTime);
    this.drawCanvases(elapsedTime);
    this.drawRubberBand(this.displayCanvas);

    if (!this.isDestroyed) this.request.call(window, this.mainLoop.bind(this));
  }

  public addActor() {
    this.$store.commit('addActor');
    this.$nextTick(() => {
      const key: string = `prev-anim-${this.actors.length - 1}${separator}${0}`;
      this.canvases[key] = new Canvas(this.unit, this.unit, this.$refs[key][0]);
      this.activeSelection = `${this.actors.length - 1}${separator}0`;
    });
  }

  public removeActor(index) {
    this.$store.commit('removeActor', index);

    /* If the selected state was in this actor, we need to select another one */
    const selectedStateBreakdown = this.activeSelection.split(separator);

    if (parseInt(selectedStateBreakdown[0]) === index) {
      if (this.actors.length === 0) {
        this.activeSelection = '';
      } else if (index === this.actors.length) {
        this.activeSelection = `${index - 1}${separator}0`;
      }
    }
  }

  private async initiatePreviewAnimations() {
    return new Promise( (resolve, reject) => {
      this.$nextTick(() => {
        for (let i: number = 0; i < this.actors.length; i++) {
          for (let j: number = 0; j < this.actors[i].states.length; j++) {
            const key: string = `prev-anim-${i}${separator}${j}`;
            this.canvases[key] = new Canvas(this.unit, this.unit, this.$refs[key][0]);
          }
        }
        resolve('Done initiating canvases');
      });
    });
  }

  public addState(index, stateIndex) {
    this.$store.commit('addState', index);
    this.$nextTick(() => {
      const key: string = `prev-anim-${index}${separator}${stateIndex}`;
      this.canvases[key] = new Canvas(this.unit, this.unit, this.$refs[key][0]);
      this.activeSelection = `${index}${separator}${stateIndex}`;
    });
  }

  public deleteState(index, stateIndex) {
    this.$store.commit('removeState', { index, stateIndex });
    const max = this.actors[index].states.length;

    /* If this state was selected, we need to select another one */

    // If this was the top state, seek the next down
    if (this.activeSelection === `${index}${separator}${max}`) {
      this.activeSelection = `${index}${separator}${max - 1}`;
    }
  }

  private onSpace() {
    this.addAnimation();
  }

  private addAnimation() {
    // Don't bother if no selection has been activated
    if (this.activeSelection === '') return;

    // First get the index based on our coordinates
    const dx: number = parseInt(this.x / this.unit);
    const dy: number = parseInt(this.y / this.unit);
    const index: number = dx + (parseInt(this.canvas.width / this.unit) * dy);
    const splitActorIndex: Array<string> = this.activeSelection.split(this.separator);
    const actorIndex: string = splitActorIndex[0];
    const stateIndex: string = splitActorIndex[1];

    // Don't bother if the index doesn't refer to an animation
    if(index >= this.animations.length) return;

    this.$store.commit('addActorAnimation', { actorIndex, stateIndex, animation: index });
  }

  private drawAnimations(elapsedTime) {
    for (let i: number = 0; i < this.animations.length; i++) {
      this.animations[i].draw(
        this.displayCanvas.getContext(),
        parseInt(i % parseInt(this.displayCanvas.width / this.unit)) * this.unit,
        parseInt(i / parseInt(this.displayCanvas.width / this.unit)) * this.unit,
        elapsedTime
      );
    }
  }

  private drawCanvases(elapsedTime) {
    for (let i: number = 0; i < this.actors.length; i++) {
      for (let j: number = 0; j < this.actors[i].states.length; j++) {
        if(this.actors[i].states[j].value !== null) {
          const key = `prev-anim-${i}${separator}${j}`;
          const animKey = this.actors[i].states[j].value;
          const animation = this.animationsMapper.getValue(animKey);
          if (typeof animation === 'number') {
            this.canvases[key].fillCanvas();
            this.animations[animation].draw(
              this.canvases[key].getContext(),
              0, 0, elapsedTime
            );
          }
        }
      }
    }
  }
}
</script>
