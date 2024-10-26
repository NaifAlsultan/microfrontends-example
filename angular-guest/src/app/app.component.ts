import { Component, HostListener } from "@angular/core";

@Component({
  standalone: true,
  templateUrl: "./app.component.html",
})
export class AppComponent {
  value = 0;

  @HostListener("window:increment", ["$event.detail"])
  increment(newValue: number) {
    this.value = newValue;
  }
}
