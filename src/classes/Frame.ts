import Canvas from './Canvas';

export default class Frame {

  constructor(
    private image: any,
    public x: number,
    public y: number,
    public width: number,
    public height: number,
  ) {}

  public draw(ctx: any, x: number, y: number): void {
    ctx.drawImage(
      this.image, // image
      this.x, this.y, this.width, this.height, // source
      x, y, this.width, this.height // destination
    );
  }
}
