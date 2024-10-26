import { createApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { createComponent, NgZone } from "@angular/core";

export function mountMicrofrontend(root: HTMLElement) {
  createApplication().then((appRef) => {
    const zone = appRef.injector.get(NgZone);
    zone.run(() => {
      const component = createComponent(AppComponent, {
        environmentInjector: appRef.injector,
        hostElement: root,
      });
      appRef.attachView(component.hostView);
    });
  });
}

const root = document.getElementById("angular-guest");

if (root) {
  mountMicrofrontend(root);
}
