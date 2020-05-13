import Canvas from './Canvas';

export default class Frame {
  private boundingBox: any;
  private mask: any;

  constructor(
    private image: any,
    public x: number,
    public y: number,
    public width: number,
    public height: number,
  ) {
    this.determineBoundingBox();
  }

  public draw(ctx: any, x: number, y: number): void {
    ctx.drawImage(
      this.image, // image
      this.x, this.y, this.width, this.height, // source
      x, y, this.width, this.height // destination
    );
  }

  public getBoundingBox() {
    return this.boundingBox;
  }

  private determineBoundingBox() {
    const canvas = new Canvas(this.image.width, this.image.height, null, true);
    const context = canvas.getContext();
    context.drawImage(this.image, 0, 0, this.image.width, this.image.height);
    const imageData = canvas.getImageData().data;

    const left = this.getLeft(imageData);
    const top = this.getTop(imageData);
    const bottom = this.getBottom(imageData);
    const right = this.getRight(imageData);

    const boundingBox = {
      top, left, bottom, right
    };

    this.boundingBox = boundingBox;
  }

  private getTop(imageData) {
    // Do this for every row
    for (let y = this.y; y < this.y + this.height; y++) {
      // Check each column of this row
      for (let x = this.x; x < this.x + this.width; x++) {
        const base = (x + (y * this.image.width)) * 4;
        // Do we have a non-transparent pixel? Then this is the top
        if (imageData[base + 3] !== 0) return y - this.y;
      }
    }
    // By default return the maximum
    return this.height;
  }

  private getBottom(imageData) {
    // Do this for every row, in reverse order
    for (let y = this.y + this.height; y >= this.y; y--) {
      // Check each column of this row
      for (let x = this.x; x < this.x + this.width; x++) {
        const base = (x + (y * this.image.width)) * 4;
        // Do we have a non-transparent pixel? Then this is the top
        if (imageData[base + 3] !== 0) return (this.height + this.y) - y;
      }
    }
    // By default return the minimum
    return 0;
  }

  private getLeft(imageData) {
    // Do this for every column
    for (let x = this.x; x < this.x + this.width; x++) {
      // Check each row of this column
      for (let y = this.y; y < this.y + this.height; y++) {
        const base = (x + (y * this.image.width)) * 4;
        // Do we have a non-transparent pixel? Then this is the top
        if (imageData[base + 3] !== 0) return x - this.x;
      }
    }
    // By default return the maximum
    return this.width;
  }

  private getRight(imageData) {
    // Do this for every column
    for (let x = this.x + this.width; x >= this.x; x--) {
      // Check each row of this column
      for (let y = this.y; y < this.y + this.height; y++) {
        const base = (x + (y * this.image.width)) * 4;
        // Do we have a non-transparent pixel? Then this is the top
        if (imageData[base + 3] !== 0) return (this.width + this.x) - x;
      }
    }
    // By default return the minimum
    return 0;
  }
}
