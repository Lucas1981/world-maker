const keyLeft = 37;
const keyUp = 38;
const keyRight = 39;
const keyDown = 40;
const keySpace = 32; // space

const a = 65; // a
const d = 68; // d
const w = 87; // w
const s = 83; // s
const enter = 13; // enter
const zero = 48; // 0

const myTimer = 40; // 40 ms

const state = () => ({
  up: false,
  down: false,
  left: false,
  right: false,
  altUp: false,
  altDown: false,
  altLeft: false,
  altRight: false,
  z: false,
  x: false,
  space: false,
  toggle: false,
  suicide: false,
  enter: false,
  zero: false,
});

export default class KeyboardInput {
  private _state;

  constructor() {
    document.addEventListener('keydown', this.keyDownFunction.bind(this));
    document.addEventListener('keyup', this.keyUpFunction.bind(this));
    this._state = state();
  }

  public get state() {
    return this._state;
  }

  public reset() {
    Object.keys(this._state).forEach((key) => this._state[key] = false);
  }

  public destructor() {
    document.removeEventListener('keydown', this.keyDownFunction.bind(this));
    document.removeEventListener('keyup', this.keyUpFunction.bind(this));
  }

  private keyDownFunction(e) {

    const release = e;

    switch (release.keyCode) {
      case keyUp:
        this._state.up = true;
        break;
      case keyDown:
        this._state.down = true;
        break;
      case keyLeft:
        this._state.left = true;
        break;
      case keyRight:
        this._state.right = true;
        break;
      case keySpace:
        this._state.space = true;
        break;
      case w:
        this._state.altUp = true;
        break;
      case s:
        this._state.altDown = true;
        break;
      case a:
        this._state.altLeft = true;
        break;
      case d:
        this._state.altRight = true;
        break;
      case enter:
        this._state.enter = true;
        break;
      case zero:
        this._state.zero = true;
        break;
      default:
        break;
    }
  }

  private keyUpFunction(e) {

    const release = e;

    switch (release.keyCode) {
      case keyUp:
        this._state.up = false;
        break;
      case keyDown:
        this._state.down = false;
        break;
      case keyLeft:
        this._state.left = false;
        break;
      case keyRight:
        this._state.right = false;
        break;
      case keySpace:
        this._state.space = false;
        break;
      case w:
        this._state.altUp = false;
        break;
      case s:
        this._state.altDown = false;
        break;
      case a:
        this._state.altLeft = false;
        break;
      case d:
        this._state.altRight = false;
        break;
      case enter:
        this._state.enter = false;
        break;
      case zero:
        this._state.zero = false;
        break;
      default:
        break;
    }
  }
}
