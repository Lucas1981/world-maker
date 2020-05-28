import Vue from 'vue';

const BACKGROUND = '#f8f8f8';

export default class Canvas {
  private canvasPointer: any;
  private context: any;

  constructor(maxWidth, maxHeight, ref, offsite = false) {
    this.canvasPointer = offsite ? document.createElement('canvas') : ref;
    this.context = this.canvasPointer.getContext('2d');
    this.canvasPointer.width = maxWidth;
    this.canvasPointer.height = maxHeight;
  }

  public getCanvasElement() {
    return this.canvasPointer;
  }

  public getContext(): any {
    return this.context;
  }

  public getDataURL(): any {
    return this.canvasPointer.toDataURL();
  }

  public get width() {
    return this.canvasPointer.width;
  }

  public get height() {
    return this.canvasPointer.height;
  }

  public drawImage(img: Image, offsetX: number = 0, offsetY: number = 0) {
    this.context.drawImage(img, offsetX, offsetY);
  }

  public drawImageFromCanvas(
    canvas: Canvas,
    sx: number, sy: number, sw: number, sh: number,
    dx: number, dy: number, dw: number, dh: number
  ) {
    this.context.drawImage(
      canvas.getCanvasElement(),
      sx, sy, sw, sh, dx, dy, dw, dh
    );
  }

  public getImageData(): any {
    return this.context.getImageData(0, 0, this.canvasPointer.width, this.canvasPointer.height);
  }

  public fillCanvas(background = BACKGROUND): any {
    this.context.fillStyle = background;
    this.context.fillRect(0, 0, this.canvasPointer.width, this.canvasPointer.height);
  }

  public clearCanvas() {
    this.context.clearRect(0, 0, this.canvasPointer.width, this.canvasPointer.height);
  }

  public clearRect(x, y, width, height) {
    this.context.clearRect(x, y, width, height);
  }

  public drawRubberBand(x, y, width, height, strokeColor = 'orange') {
    this.context.beginPath();
    this.context.strokeStyle = strokeColor;
    this.context.rect(x, y, width, height);
    this.context.stroke();
  }

  public drawGrid(width, height, unit, strokeColor = 'rgba(0, 0, 0, .1)') {
    for (let x = 0; x < width; x += unit) {
      for (let y = 0; y < height; y += unit) {
        this.drawRubberBand(x, y, unit, unit, strokeColor);
      }
    }
  }

  public revealOpacityMask(sourceCanvas: Canvas) {
    const sourceImageData = sourceCanvas.getImageData();
    const sourceData = sourceImageData.data;
    const imageData = this.getImageData();
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const col = sourceData[i + 3] === 0 ? 255 : 0;
      data[i + 0] = col;
      data[i + 1] = col;
      data[i + 2] = col;
      data[i + 3] = 255;
    }
    this.context.putImageData(imageData, 0, 0);
  }

  public adjustToImageData(img) {
    this.canvasPointer.width = img.width;
    this.canvasPointer.height = img.height;
  }
}
