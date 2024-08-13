declare interface Window {
  render_angular_guest: (rootId: string) => void;
  unmount_angular_guest?: () => void;
}
