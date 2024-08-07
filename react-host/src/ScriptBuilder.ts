export class ScriptBuilder {
  private script;

  private constructor() {
    this.script = document.createElement("script");
    this.script.type = "module";
  }

  static create() {
    return new ScriptBuilder();
  }

  id(id: string) {
    this.script.id = id;
    return this;
  }

  src(src: string) {
    this.script.src = src;
    return this;
  }

  onload(fn: () => void) {
    this.script.onload = fn;
    return this;
  }

  append() {
    document.body.appendChild(this.script);
  }
}
