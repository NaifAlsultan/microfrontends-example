declare interface Window {
  render_react_guest: (rootId: string) => void;
  unmount_react_guest?: () => void;
}
