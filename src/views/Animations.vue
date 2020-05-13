<template>
  <div class="animations">
    <div class="row">
      <div class="col-6">
        <h3>Frames</h3>
        <canvas
          ref="displayCanvas"
          @click="onClickMapCanvas"
        ></canvas>
      </div>
      <div class="col-6">
        <button @click="addAnimation()" class="btn btn-primary" v-blur>Add animation</button>
        <div class="animations-wrapper" ref="animationsWrapper">
          <div v-for="(animation, index) in animations">
            <div class="card mt-1">
              <div class="card-body">
                <h5 class="card-title">Animation {{ index + 1 }}</h5>
                <div class="form-check d-inline-block">
                  <input
                    type="radio"
                    class="form-check-input"
                    :id="index"
                    :value="index"
                    :checked="activeSelection == index"
                    v-model="activeSelection"
                    v-blur
                  />
                  <label :for="index">
                    Active
                  </label>
                </div>
                <button class="btn btn-danger ml-2" @click="deleteAnimation(index)" v-blur>Delete</button>
                <div class="input-group my-3">
                  <div class="input-group-prepend">
                    <span class="input-group-text" id="basic-addon1">Loop type</span>
                  </div>
                  <select v-model="animation.loopType" class="form-control">
                    <option v-for="(loopTypeVal, loopTypeKey) in loopTypes" :value="loopTypeVal" :bind="loopTypeKey">{{ loopTypeKey }}</option>
                  </select>
                </div>
                <img
                  class="se-frame we-delete-icon"
                  v-for="frameIndex in animation.indices"
                  :width="unit"
                  :height="unit"
                  :src="getDataURL(frameIndex)"
                  @click="deleteFrame(index, frameIndex)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import Base from './Base.ts';
import InputHandler from './InputHandler.ts'
import NextAnimationFrameFactory from '../classes/NextAnimationFrameFactory.js';
import Animation from '../classes/Animation.ts';
import KeyboardInput from '../classes/KeyboardInput.ts';
import Frame from '../classes/Frame.ts';
import Canvas from '../classes/Canvas.ts';

const loopTypes = {
  "No loop": 0,
  "Continuous loop": 1,
  "Loop back and forth": 2,
};

@Component
export default class Animations extends Base {
  private displayCanvas: Canvas;
  public activeSelection: number = -1;
  public loopTypes: object = loopTypes;

  mounted() {
    this.displayCanvas = new Canvas(512, 512, this.$refs.displayCanvas);
    if (this.canvas !== null) this.mainLoop();
  }

  private mainLoop() {
    const maxX: number = this.canvas.width - this.unit;
    const maxY: number = this.canvas.height - this.unit;

    this.handleKeyboardInput(maxX, maxY);
    this.displayCanvas.fillCanvas();
    this.displayCanvas.drawImageFromCanvas(
      this.canvas,
      0, 0, 512, 512,
      0, 0, 512, 512
    )

    this.drawRubberBand(this.displayCanvas);

    if (!this.isDestroyed) this.request.call(window, this.mainLoop.bind(this));

    this.$refs.firstRow.focus();
  }

  public addAnimation() {
    this.$store.commit('addAnimation');
    this.activeSelection = this.animations.length - 1;
    const element = this.$refs.animationsWrapper;
    element.scrollTop = element.scrollHeight;
  }

  public deleteAnimation(index) {
    this.$store.commit('deleteAnimation', index);

    /* If this animation was selected, we need to select another one */

    if (this.animations.length === 0) {
      this.activeSelection = -1;
    // If this was the top tile, seek the next down
    } else if (this.activeSelection === this.animations.length) {
      this.activeSelection--;
    }
  }

  public addFrame() {
    // First get the index based on our coordinates
    const dx: number = parseInt(this.x / this.unit);
    const dy: number = parseInt(this.y / this.unit);
    const index: number = dx + (parseInt(this.canvas.width / this.unit) * dy);

    // Check if we want to commit a known frame
    if (typeof this.framesMapper.getKey(index) !== 'number') return; // If not, don't bother

    // Then commit it to the active animation
    if (this.activeSelection === -1) return; // If no active animation is selected, don't bother
    this.$store.commit('addAnimationIndex', { animationIndex: this.activeSelection, value: index });
  }

  public deleteFrame(animationIndex, index) {
    // Here we are already looking at a mapped index, so we don't have to convert
    this.$store.commit('deleteAnimationIndex', { animationIndex, index });
  }

  public getDataURL(frameIndex) {
    const canvas: Canvas = new Canvas(this.unit, this.unit, null, true);
    const frame: Frame = this.frames[this.framesMapper.getValue(frameIndex)];
    canvas.drawImageFromCanvas(
      this.canvas,
      frame.x, frame.y, this.unit, this.unit,
      0, 0, this.unit, this.unit
    );
    return canvas.getCanvasElement().toDataURL();
  }

  private onSpace() {
    this.addFrame();
  }
}
</script>

<style>
.animations-wrapper {
  position: absolute;
  top: 40px;
  height: 100%;
  left: 0;
  width: 100%;
  overflow-y: scroll;
}
</style>
