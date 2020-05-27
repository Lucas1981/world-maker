import { Component, Vue } from 'vue-property-decorator';
import NextAnimationFrameFactory from '../classes/NextAnimationFrameFactory.js';
import Canvas from './classes/Canvas';
import KeyboardInput from './classes/KeyboardInput';
import Frame from './classes/Frame';
import Actor from './classes/Actor';
import Animation from './classes/Animation';
import Mapper from './classes/Mapper';

const hasPressed = {
  up: false,
  down: false,
  left: false,
  right: false,
  space: false
};

@Component
export default abstract class Base extends Vue {
  public x: number = 0;
  public y: number = 0;
  private isDestroyed: boolean = false;
  private request: any = NextAnimationFrameFactory.getRequest();
  private hasPressed: any = hasPressed;

  public get unit(): number { return this.$store.getters.unit; }
  public get gridWidth(): number { return this.$store.getters.gridWidth; }
  public get gridHeight(): number { return this.$store.getters.gridHeight; }
  public get cameraWidth(): number { return this.$store.getters.cameraWidth; }
  public get cameraHeight(): number { return this.$store.getters.cameraHeight; }
  public get cameraX(): number { return this.$store.getters.cameraX; }
  public get cameraY(): number { return this.$store.getters.cameraY; }
  public get frames(): Frame[] { return this.$store.getters.frames; }
  public get framesMapper(): Mapper { return this.$store.getters.framesMapper; }
  public get animationsMapper(): Mapper { return this.$store.getters.animationsMapper; }
  public get tilesMapper(): Mapper { return this.$store.getters.tilesMapper; }
  public get actorsMapper(): Mapper { return this.$store.getters.actorsMapper; }
  public get keyboard(): KeyboardInput { return this.$store.getters.keyboard; }
  public get sourceImage(): object { return this.$store.getters.sourceImage; }
  public get canvas(): Canvas { return this.$store.getters.canvas; }
  public get animations(): Animation[] { return this.$store.getters.animations; }
  public get tiles(): [] { return this.$store.getters.tiles; }
  public get actors(): [] { return this.$store.getters.actors; }
  public get actorOptions(): object { return this.$store.getters.actorOptions; }
  public get maps(): [] { return this.$store.getters.maps; }
  public get debug(): boolean { return this.$store.getters.debug; }

  public enableKeyboardPreventDefault() {
    this.keyboard.setPreventDefault(true);
  }

  public disableKeyboardPreventDefault() {
    this.keyboard.setPreventDefault(false);
  }

  public destroyed(): void {
    this.isDestroyed = true;
  }

  public handleKeyboardInput(maxX: number, maxY: number): void {
    if (this.keyboard.state.up && !this.hasPressed.up) {
      this.hasPressed.up = true;
      setTimeout(() => this.hasPressed.up = false, 500);
      this.y = this.y - this.unit < 0 ? 0 : this.y - this.unit;
    }
    if (this.keyboard.state.down && !this.hasPressed.down) {
      this.hasPressed.down = true;
      setTimeout(() => this.hasPressed.down = false, 500);
      this.y = this.y + this.unit > maxY ? maxY : this.y + this.unit;
    }
    if (this.keyboard.state.left && !this.hasPressed.left) {
      this.hasPressed.left = true;
      setTimeout(() => this.hasPressed.left = false, 500);
      this.x = this.x - this.unit < 0 ? 0 : this.x - this.unit;
    }
    if (this.keyboard.state.right && !this.hasPressed.right) {
      this.hasPressed.right = true;
      setTimeout(() => this.hasPressed.right = false, 500);
      this.x = this.x + this.unit > maxX ? maxX : this.x + this.unit;
    }
    if (this.keyboard.state.space && !this.hasPressed.space) {
      this.hasPressed.space = true;
      this.onSpace();
    }
    if (!this.keyboard.state.up) { this.hasPressed.up = false; }
    if (!this.keyboard.state.down) { this.hasPressed.down = false; }
    if (!this.keyboard.state.left) { this.hasPressed.left = false; }
    if (!this.keyboard.state.right) { this.hasPressed.right = false; }
    if (!this.keyboard.state.space) { this.hasPressed.space = false; }
  }

  public onClickMapCanvas(element: object): void {
    this.x = parseInt(element.offsetX / this.unit, 0) * this.unit;
    this.y = parseInt(element.offsetY / this.unit, 0) * this.unit;
  }

  private onSpace(): void {
    // Overload this function
  }

  private drawRubberBand(canvas: Canvas, color: string = 'orange'): void {
    canvas.drawRubberBand(
      parseInt(this.x / this.unit, 10) * this.unit,
      parseInt(this.y / this.unit, 10) * this.unit,
      this.unit,
      this.unit,
      color
    );
  }
}
