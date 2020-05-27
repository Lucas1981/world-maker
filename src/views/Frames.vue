<template>
  <div class="frames">
    <button class="btn btn-primary mx-1" @click="loadImageFileProxy($event)" v-blur>Load image</button>
    <input type="file" class="d-none" ref="imageLoadSelection" @change="handleFile($event)"></button>
    {{ fileName }}
    <div class="row">
      <div class="col-6">
        <h3>Source canvas</h3>
        <canvas
          ref="sourceImageCanvas"
          @click="onClickMapCanvas"
        ></canvas>
        <p>
          Unit: {{ unit }} |
          x: {{ x }} |
          y: {{ y }}
        </p>
        <div>
          <label for="filter-color">Filter color</label>
          <input
            type="color"
            for="filter-color"
            id="filter-color"
            v-model="filterColor"
          />
          <button
            class="btn btn-primary btn-sm"
            @click="applyFilterColor()"
          >Apply filter color</button>
        </div>
        <div class="form-check">
          <input
            id="show-grid"
            type="checkbox"
            class="form-check-input"
            v-model="showGrid"
          />
          <label class="form-check-label" for="show-grid">Show grid</label>
        </div>
        <p><button @click="commitAllToFrames()" class="btn btn-primary btn-sm" v-blur>Commit all to frames</button></p>
        <p><button @click="flipImage()" class="btn btn-primary btn-sm" v-blur>Flip canvas</button></p>
      </div>
      <div class="col-6">
        <h3>Target canvas</h3>
        <canvas ref="displayCanvas" @click="deleteFrame" class="we-delete-icon"></canvas>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator';
import Base from './Base.ts';
import FileHandler from '../classes/FileHandler.ts';
import Frame from '../classes/Frame.ts';
import Canvas from '../classes/Canvas.ts'
import NextAnimationFrameFactory from '../classes/NextAnimationFrameFactory.js';

const pixelsPerSecond: number = 256;

@Component
export default class Frames extends Base {
  private sourceImageCanvas: Canvas;
  private sourceImageCanvasOffscreen: Canvas;
  private displayCanvas: Canvas;
  private maxFrames: number;
  public fileName: string = '';
  public step: number;
  public sourceFileName: string;
  public showGrid: boolean;
  public filterColor: any = '#000000';

  beforeMount() {
    this.showGrid = false;
  }

  mounted() {
    this.step = this.unit;
    this.maxFrames = Math.pow(parseInt(512 / this.unit), 2);
    this.sourceImageCanvas = new Canvas(512, 512, this.$refs.sourceImageCanvas);
    this.sourceImageCanvasOffscreen = new Canvas(512, 512, null, true);
    this.displayCanvas = new Canvas(512, 512, this.$refs.displayCanvas);

    if (this.sourceImage.src) {
      this.sourceImageCanvas.adjustToImageData(this.sourceImage);
      this.sourceImageCanvasOffscreen.adjustToImageData(this.sourceImage);
    }

    this.mainLoop();
  }

  private mainLoop(): void {
    const maxX: number = this.sourceImageCanvas.width - this.unit;
    const maxY: number = this.sourceImageCanvas.height - this.unit;

    this.displayCanvas.fillCanvas();
    this.drawFrames();
    this.sourceImageCanvas.fillCanvas();
    this.sourceImageCanvasOffscreen.clearCanvas();
    this.sourceImageCanvasOffscreen.drawImage(this.sourceImage);
    this.sourceImageCanvas.drawImage(this.sourceImageCanvasOffscreen.getCanvasElement());

    this.handleKeyboardInput(maxX, maxY);
    this.drawRubberBand(this.sourceImageCanvas);
    if (this.showGrid) this.sourceImageCanvas.drawGrid(512, 512, this.unit);

    if (!this.isDestroyed) this.request.call(window, this.mainLoop.bind(this));
  }

  public commitAllToFrames() {
    for (let x = 0; x < 512; x += this.unit) {
      for (let y = 0; y < 512; y += this.unit) {
        this.addFrame(x, y);
      }
    }
  }

  public flipImage() {
    const source = new Canvas(this.sourceImage.width, this.sourceImage.height, null, true);
    source.drawImage(this.sourceImage);
    const sourceData = source.getImageData().data;
    const destCanvas = new Canvas(this.sourceImage.width, this.sourceImage.height, null, true);
    const destContext = destCanvas.getContext();
    const destImageData = destCanvas.getImageData();
    const destData = destImageData.data;
    for (let i = 0; i < destData.length; i += 4) {
      const x = this.sourceImage.width - parseInt(parseInt(i / 4) % this.sourceImage.width);
      const y = parseInt(parseInt(i / 4) / this.sourceImage.width);
      const sourceBase = (x + (y * this.sourceImage.width)) * 4;
      destData[i + 0] = sourceData[sourceBase + 0];
      destData[i + 1] = sourceData[sourceBase + 1];
      destData[i + 2] = sourceData[sourceBase + 2];
      destData[i + 3] = sourceData[sourceBase + 3];
    }
    destContext.putImageData(destImageData, 0, 0);
    this.sourceImage.src = destCanvas.getDataURL();
  }

  public applyFilterColor() {
    const rgb = this.filterColor
      .substr(1) // Ditch the hashtag
      .match(/(..?)/g) // Split up into pairs of two
      .map(e => parseInt(e, 16)); // Convert hex2dec

    const source = new Canvas(this.sourceImage.width, this.sourceImage.height, null, true);
    source.drawImage(this.sourceImage);
    const sourceContext = source.getContext();
    const sourceImageData = source.getImageData();
    const sourceData = sourceImageData.data;
    for (let i = 0; i < sourceData.length; i += 4) {
      // Is this the color we want to filter out?
      if (
        sourceData[i + 0] === rgb[0] &&
        sourceData[i + 1] === rgb[1] &&
        sourceData[i + 2] === rgb[2]
      ) {
        // Then set opacity to zero
        sourceData[i + 3] = 0;
      }
    }
    sourceContext.putImageData(sourceImageData, 0, 0);
    this.sourceImage.src = source.getDataURL();
  }

  public async handleFile(event: object): void {
    const result: string = await FileHandler.handleImageFile(event);
    this.x = 0;
    this.y = 0;
    this.fileName = event.target.files[0].name;
    this.sourceImage.src = result;
    this.sourceImage.onload = () => {
      this.sourceImageCanvas.adjustToImageData(this.sourceImage);
      this.sourceImageCanvasOffscreen.adjustToImageData(this.sourceImage);
    };
  }

  public loadImageFileProxy(event: object): void {
    const imageLoadSelectionPointer: any = this.$refs.imageLoadSelection;
    imageLoadSelectionPointer.click();
  }

  private drawFrames(): void {
    for (let i: number = 0; i < this.frames.length; i++) {
      const frame: Frame = this.frames[i];

      frame.draw(
        this.displayCanvas.getContext(),
        parseInt(i * this.unit) % this.displayCanvas.width,
        parseInt((i * this.unit) / this.displayCanvas.width) * this.unit
      );
    }
  }

  private onSpace(): void {
    this.addFrame(this.x, this.y);
  }

  private addFrame(x, y): void {
    const framesLength: number = this.frames.length < this.maxFrames ? this.frames.length : this.maxFrames - 1;
    const sx: number = parseInt(x / this.unit) * this.unit;
    const sy: number = parseInt(y / this.unit) * this.unit;
    const dx: number = (framesLength * this.unit) % this.canvas.width;
    const dy: number = parseInt((framesLength * this.unit) / this.canvas.width) * this.unit;

    if (!this.sourceImage.src) return;

    // First, clear out anything still lingering on the canvas
    this.canvas.clearRect(
      dx, dy, this.unit, this.unit
    );

    // Then draw the image on the canvas itself
    this.canvas.drawImageFromCanvas(
      this.sourceImageCanvasOffscreen,
      sx, sy, this.unit, this.unit,
      dx, dy, this.unit, this.unit
    );

    // Finally, grab it from the target canvas and commit the frame
    if (this.frames.length < this.maxFrames) {
      this.$store.commit('addFrame', { x: dx, y: dy });
    }
  }

  public deleteFrame(element: object): void {
    const bufferCanvas = new Canvas(512, 512, null, true);
    const x: number = parseInt(element.offsetX / this.unit);
    const y: number = parseInt(element.offsetY / this.unit);
    const index: number = x + (parseInt(this.canvas.width / this.unit) * y);
    // If we are outside our frame scope, continue
    if (index >= this.frames.length) return;

    // Draw all frames but eliminated one onto buffer canvas in sequence
    let j = 0;
    for (let i: number = 0; i < this.frames.length; i++) {
      if(i === index) {
        continue;
      }

      const frame: Frame = this.frames[i];
      const dx = parseInt(j * this.unit) % bufferCanvas.width;
      const dy = parseInt((j * this.unit) / bufferCanvas.width) * this.unit;
      frame.draw(
        bufferCanvas.getContext(),
        dx, dy
      );

      j++;
    }

    // Eliminate the frame
    this.$store.commit('deleteFrame', index);

    // Finally, paint the buffered canvas back to the canvas
    this.canvas.clearCanvas(); // Make sure no trailing pixels are left
    this.canvas.drawImageFromCanvas(
      bufferCanvas,
      0, 0, 512, 512,
      0, 0, 512, 512
    );
  }
}
</script>
