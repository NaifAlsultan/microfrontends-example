import { Component, HostListener } from "@angular/core";

@Component({
  standalone: true,
  templateUrl: "./app.component.html",
})
export class AppComponent {
  value = -1;

  ngOnInit() {
    const event = new Event("What is the current value?");
    window.dispatchEvent(event);
  }

  @HostListener("window:Current value is", ["$event"])
  handleValue(event: CustomEvent) {
    this.value = event.detail;
  }
}
