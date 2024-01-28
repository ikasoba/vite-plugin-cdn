import { h, render } from "preact";
import { App } from "./App.js";

window.addEventListener("load", () => {
  render(h(App, null), document.body);
});
