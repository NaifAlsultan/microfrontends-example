import { createApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { createComponent, NgZone } from "@angular/core";

window.render_angular_guest = (rootId: string) => {
  let abort = false;

  window.unmount_angular_guest = () => {
    abort = true;
  };

  createApplication().then((appRef) => {
    function destroy() {
      appRef.destroy();
      window.unmount_angular_guest = undefined;
    }

    if (abort) {
      destroy();
      return;
    }

    const root = document.getElementById(rootId);

    if (!root) {
      console.error(`Unable to find root with id: ${rootId}`);
      destroy();
      return;
    }

    const container = document.createElement("div");
    root.appendChild(container);

    const zone = appRef.injector.get(NgZone);

    zone.run(() => {
      const app = createComponent(AppComponent, {
        environmentInjector: appRef.injector,
        hostElement: container,
      });
      appRef.attachView(app.hostView);
    });

    window.unmount_angular_guest = destroy;
  });
};
