import Canvas from './Canvas';

export default class Frame {
  private boundingBox: any = {
    top: null,
    bottom: null,
    left: null,
    right: null,
  };
  private contour: any = {
    top: [],
    bottom: [],
    left: [],
    right: [],
  };

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

  public getContour() {
    return this.contour;
  }

  private determineBoundingBox() {
    const canvas = new Canvas(this.image.width, this.image.height, null, true);
    const context = canvas.getContext();
    context.drawImage(this.image, 0, 0, this.image.width, this.image.height);
    const imageData = canvas.getImageData().data;

    this.processLeft(imageData);
    this.processTop(imageData);
    this.processBottom(imageData);
    this.processRight(imageData);
  }

  private processTop(imageData) {
    for (let x = this.x; x < this.x + this.width; x++) {
      let y = this.y;
      while (y < this.y + this.height) {
        const base = (x + (y * this.image.width)) * 4;
        // Do we have a non-transparent pixel? Then this is the top
        if (imageData[base + 3] !== 0) {
          break;
        }
        y++;
      }
      const finalY = y - this.y;
      this.contour.top.push(finalY);
    }
    this.boundingBox.top = Math.min(...this.contour.top);
  }

  private processBottom(imageData) {
    for (let x = this.x; x < this.x + this.width; x++) {
      let y = this.y + (this.height - 1);
      while (y >= this.y) {
        const base = (x + (y * this.image.width)) * 4;
        if (imageData[base + 3] !== 0) {
          break;
        }
        y--;
      }
      const finalY = y - this.y;
      this.contour.bottom.push(finalY);
    }
    this.boundingBox.bottom = Math.min(...this.contour.bottom.map(value => this.height - value));
  }

  private processLeft(imageData) {
    for (let y = this.y; y < this.y + this.height; y++) {
      let x = this.x;
      while (x < this.x + this.width) {
        const base = (x + (y * this.image.width)) * 4;
        if (imageData[base + 3] !== 0) {
          break;
        }
        x++;
      }
      const finalX = x - this.x;
      this.contour.left.push(finalX);
    }
    this.boundingBox.left = Math.min(...this.contour.left);
  }

  private processRight(imageData) {
    this.boundingBox.right = this.width;
    for (let y = this.y; y < this.y + this.height; y++) {
      let x = this.x + (this.width - 1);
      while (x >= this.x) {
        const base = (x + (y * this.image.width)) * 4;
        if (imageData[base + 3] !== 0) {
          break;
        }
        x--;
      }
      const finalX = x - this.x;
      this.contour.right.push(finalX);
    }
    this.boundingBox.right = Math.min(...this.contour.right.map(value => this.width - value));
  }
}
