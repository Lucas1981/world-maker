import { LOOP_TYPES } from './constants.ts';
import Frame from './Frame.ts';
import FramesMapper from './FramesMapper';

export default class Animation {
  private numberOfFrames: number;
  private boundingBox: any;
  private mask: any;

  constructor(
    private frames: Array<Frame>,
    private framesMapper: FramesMapper,
    private indices: Array<number>,
    private loopType: number,
    private framesPerSecond: number,
  ) {
    this.determineBoundingBox();
  }

  public get numberOfFrames() {
    return this.indices.length;
  }

  public addIndex(index: number) {
    this.indices.push(index);
    this.determineBoundingBox();
  }

  public getIndices() {
    return this.indices;
  }

  public removeIndex(index: number) {
    const i = this.indices.indexOf(index);
    if (i !== -1) {
      this.indices.splice(i, 1);
    }
  }

  public draw(ctx: any, x: number, y: number, elapsedTime: any = 0): void {
    if (this.indices.length === 0) return; // Don't bother if we don't have any indices
    if (this.frames.length === 0) return; // Don't bother if we don't have frames at all
    const index: number = this.determineFrame(elapsedTime);
    const mappedIndex = this.framesMapper.getValue(this.indices[index]);
    this.frames[mappedIndex].draw(ctx, x, y);
  }

  public getLoopType() {
    return this.loopType;
  }

  public getCurrentFrame(elapsedTime: any = 0) {
    const index: number = this.determineFrame(elapsedTime);
    const mappedIndex = this.framesMapper.getValue(this.indices[index]);
    const frame: Frame = this.frames[mappedIndex];
    return frame;
  }

  public getBoundingBox() {
    return this.boundingBox;
  }

  private determineBoundingBox() {
    const imageData = null;
    const frames: Frame[] = [];
    const boundingBox = {
      top: Infinity,
      bottom: Infinity,
      left: Infinity,
      right: Infinity
    };

    // Filter out the frames that are in this animation
    for (const index of this.indices) {
      const mappedIndex = this.framesMapper.getValue(index);
      const frame: Frame = this.frames[mappedIndex];
      frames.push(frame);
    }

    // Get the bounding box for the entire animation
    for (const frame: Frame of frames) {
      const { top, bottom, left, right } = frame.getBoundingBox();
      if (top < boundingBox.top) boundingBox.top = top;
      if (bottom < boundingBox.bottom) boundingBox.bottom = bottom;
      if (left < boundingBox.left) boundingBox.left = left;
      if (right < boundingBox.right) boundingBox.right = right;
    }
    this.boundingBox = boundingBox;
  }

  private determineFrame(elapsedTime: any): number {
    const frameNumber: number = Math.floor(elapsedTime * this.framesPerSecond / 1000);
    let index: number;

    switch (this.loopType) {
      case LOOP_TYPES.singleFrame:
        index = 0;
        break;
      case LOOP_TYPES.noLoop:
        if (frameNumber > this.numberOfFrames) {
          index = this.numberOfFrames;
        } else {
          index = frameNumber;
        }
        break;
      case LOOP_TYPES.loop:
        index = frameNumber % this.numberOfFrames;
        break;
      case LOOP_TYPES.loopBackAndForth:
        index = this.determineBackAndForthFrame(frameNumber);
        break;
      default:
        throw new Error('Error: Unknown loop type');
    }
    return index;
  }

  private determineBackAndForthFrame(frameNumber: number): number {
    const breakpoint: number = Math.floor(this.numberOfFrames * 1.5);
    const compFrame: number = frameNumber % breakpoint;
    return compFrame >= this.numberOfFrames ? breakpoint - compFrame : compFrame;
  }
}
