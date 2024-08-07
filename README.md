# Microfrontends Example

This repository is an example of how microfrontends can be implemented and integrated at runtime via JavaScript. The solution was inspired by [Cam Jackson's article](https://martinfowler.com/articles/micro-frontends.html).

## Terminology

A _host_ is a frontend application that contains and renders microfrontends.

A _guest_ is a microfrontend application that can be rendered within a host or in a standalone application.

## Introduction

In this example, the host is implemented with React, but the solution is framework-agnostic and can be implemented with vanilla JavaScript or with any frontend framework. For demonstration purposes, the host integrates two guests. A React guest, and an Angular guest. Both the host and the guests are fully rendered at the client.

## Implementing Guests

You can implement a guest with vanilla JavaScript or with any frontend framework of your choice as long as you expose a function on the `window` object that renders your microfrontend.

For example, `react-guest/src/App.tsx` is an entry point for our React microfrontend and our goal is to render it on the host.

In `react-guest/src/main.tsx`, we expose a function `render_react_guest` on the `window` object to:

1. Look for an element in the DOM that has an ID equal to `rootId`.
2. Render the `App` component inside that element.

```tsx
// react-guest/src/main.tsx
window.render_react_guest = (rootId: string) => {
  const root = document.getElementById(rootId);
  if (!root) {
    console.error(`Unable to find root with ID: ${rootId}`);
    return;
  }
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};
```

To let our guest run as a standalone application as well, we add a `script` tag in `index.html` that calls the `render_react_guest` function after the `window` loads.

```html
<!-- react-guest/index.html -->
<div id="root"></div>
<script>
  window.onload = () => {
    window.render_react_guest("root");
  };
</script>
```

Implementing an Angular guest is very similar to this. Feel free to look at `angular-guest/` for an example.

You can build both guests with `npm run build` and serve them through NGINX so that the host can reference them later.

## Implementing a Host

Our goal at the host is to attach the renderer functions (e.g., `render_react_guest`) to the `window` object. To do that, we need to load the JavaScript files of our guests into the host. When the scripts are fully loaded, we get access to our renderer functions and can use them to render the microfrontends at any location in the DOM through the usage of IDs.

In our React implementation, all of these steps will be handled in the `react-host/src/MicroFrontend.tsx` component. To use that component, we only need to pass the microfrontend's JavaScript source and its ID.

```tsx
<MicroFrontend id="react_guest" mainSource="http://<path-to-guest>/index.js" />
```

Initially, this component renders an empty `div` tag with an ID.

```tsx
// react-host/src/MicroFrontend.tsx
export function MicroFrontend(props: MicroFrontendProps) {
  // ...
  return <div id={`${props.id}_root`}></div>;
}
```

After it renders, the `useEffect` function will execute. It checks whether the `script` tag is already in the DOM or not.

```ts
// react-host/src/MicroFrontend.tsx
useEffect(() => {
  const scriptId = `micro_frontend_main_script_${props.id}`;

  if (document.getElementById(scriptId)) {
    renderMicroFrontend(props.id);
    return;
  }

  // ...
}, []);
```

If it is, we render the microfrontend by calling `renderMicroFrontend()` which is a wrapper around our renderer functions that are attached to the `window` object.

```ts
// react-host/src/MicroFrontend.tsx
function renderMicroFrontend(id: string) {
  const render = window[`render_${id}` as keyof Window];
  // e.g., const render = window.render_react_guest;
  if (typeof render === "function") {
    render(`${id}_root`);
    // e.g., window.render_react_guest("react_guest_root");
  }
}
```

If the `script` tag has not been appended yet, we dynamically create and append it using a custom-made builder. By leveraging the `onload` property of the `script` tag, we instruct the browser to execute the passed function as soon as the script fully loads.

```ts
// react-host/src/MicroFrontend.tsx
useEffect(() => {
  // ...

  ScriptBuilder.create()
    .id(scriptId)
    .src(props.mainSource)
    .onload(() => renderMicroFrontend(props.id))
    .append();
}, []);
```

You may have noticed that we have a required `mainSource` property and an optional `supportSources` property:

- `mainSource` is for the main JavaScript source file that attaches the renderer function to the `window` object and enable the microfrontend to be rendered. For example, after building `react-guest/`, you will find the `mainSource` under `react-guest/dist/assets`.

- `supportSources` is for additional JavaScript source files that enable the `mainSource` to run without issue. For example, building an Angular frontend generates two files: `main.js` and `polyfills.js`, the former contains our business logic while the latter is for an external dependency that Angular requires to run.

That is why we loop through the `supportSources` and append the scripts.

```ts
// react-host/src/MicroFrontend.tsx
useEffect(() => {
  // ...

  props.supportSources?.forEach((src, i) =>
    ScriptBuilder.create()
      .id(`micro_frontend_support_script_${props.id}_${i + 1}`)
      .src(src)
      .append()
  );

  // ...
}, []);
```

Putting all of this together, we end up with the following `useEffect` function:

```ts
// react-host/src/MicroFrontend.tsx
useEffect(() => {
  const scriptId = `micro_frontend_main_script_${props.id}`;

  if (document.getElementById(scriptId)) {
    renderMicroFrontend(props.id);
    return;
  }

  props.supportSources?.forEach((src, i) =>
    ScriptBuilder.create()
      .id(`micro_frontend_support_script_${props.id}_${i + 1}`)
      .src(src)
      .append()
  );

  ScriptBuilder.create()
    .id(scriptId)
    .src(props.mainSource)
    .onload(() => renderMicroFrontend(props.id))
    .append();
}, [props]);
```

## Colliding Styles

To avoid having CSS collisions between different microfrontends, guest authors are advised to use one of the following solutions:

- Use CSS-in-JS to have scoped CSS that never leaks out of the microfrontend.
- Use CSS, but prefix each class with a unique identifier and avoid directly styling HTML tags.
