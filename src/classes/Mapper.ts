export default class Mapper {
  private map: Map;
  private counter: number;

  constructor() {
    this.map = new Map();
    this.counter = 0;
  }

  public add(value) {
    this.map.set(this.counter, value);
    this.counter += 1;
  }

  public remove(key) {
    this.map.delete(key);
  }

  public getValue(key) {
    return this.map.get(key);
  }

  public getMap() {
    return this.map;
  }

  public getKey(value) {
    for (const [k, v] of this.map) {
      if (v === value) {
        return k;
      }
    }
    return null;
  }

  public setItem(key, value) {
    this.map.set(key, value);
  }

  public adjustMap(start) {
    for (const key of this.map.keys()) {
      if (key > start) {
        const value = this.map.get(key);
        this.map.set(key, value - 1);
      }
    }
  }

  private clear() {
    this.map.clear();
  }
}
