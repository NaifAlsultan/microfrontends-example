import { createApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { createComponent, NgZone } from "@angular/core";

window.render_angular_guest = (rootId: string) => {
  window.unmount_angular_guest = undefined;
  createApplication().then((appRef) => {
    const root = document.getElementById(rootId);
    if (!root) {
      console.error(`Unable to find root with id: ${rootId}`);
      return;
    }
    const zone = appRef.injector.get(NgZone);
    zone.run(() => {
      const app = createComponent(AppComponent, {
        environmentInjector: appRef.injector,
        hostElement: root,
      });
      appRef.attachView(app.hostView);
    });
    window.unmount_angular_guest = () => appRef.destroy();
  });
};
