import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";

window.render_angular_guest = () => {
  bootstrapApplication(AppComponent).catch((err) => console.error(err));
};
