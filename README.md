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

1. Look for an element in the DOM that has an `id` equal to `rootId`.
2. Render the `App` component inside that element.
3. Attach a function on `window` to gracefully unmount the microfrontend.

```tsx
// react-guest/src/main.tsx
window.render_react_guest = (rootId: string) => {
  const root = document.getElementById(rootId);
  if (!root) {
    console.error(`Unable to find root with id: ${rootId}`);
    window.unmount_react_guest = undefined;
    return;
  }
  const app = ReactDOM.createRoot(root);
  app.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  window.unmount_react_guest = () => {
    app.unmount();
  };
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

### Rendering Microfrontends

Our goal at the host is to attach the renderer functions (e.g., `render_react_guest`) to the `window` object. To do that, we need to load the JavaScript files of our guests into the host. When the scripts are fully loaded, we get access to our renderer functions and can use them to render the microfrontends at any location in the DOM.

In our React implementation, all of these steps will be handled in the `react-host/src/MicroFrontend.tsx` component which takes the microfrontend's JavaScript source as a prop.

```tsx
<MicroFrontend id="react_guest" mainSource="http://<path-to-guest>/index.js" />
```

Initially, this component renders an empty `div` tag with an `id`.

```tsx
// react-host/src/MicroFrontend.tsx
export function MicroFrontend(props: MicroFrontendProps) {
  // ...
  return <div id={`${props.id}_root`}></div>;
}
```

After it renders, the `useEffect` function will execute. First, it checks whether the microfrontend's script is already in the DOM or not.

```ts
// react-host/src/MicroFrontend.tsx
useEffect(() => {
  const scriptId = `micro_frontend_main_script_${props.id}`;
  const script = document.getElementById(scriptId);

  if (script) {
    renderMicroFrontend(props.id);
  }

  // ...
}, [props]);
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
  const scriptId = `micro_frontend_main_script_${props.id}`;
  const script = document.getElementById(scriptId);

  if (script) {
    renderMicroFrontend(props.id);
  } else {
    // ...

    ScriptBuilder.create()
      .id(scriptId)
      .src(props.mainSource)
      .onload(() => renderMicroFrontend(props.id))
      .append();
  }
}, [props]);
```

`MicroFrontend` takes a required `mainSource` prop and an optional `supportSources` prop:

- `mainSource` is for the main JavaScript source file that attaches the renderer function to the `window` object and enable the microfrontend to be rendered. For example, after building `react-guest/`, you will find the `mainSource` under `react-guest/dist/assets`.

- `supportSources` is for additional JavaScript source files that enable the `mainSource` to run without issue. For example, building an Angular frontend generates two files: `main.js` and `polyfills.js`, the former contains our business logic while the latter is for an external dependency that Angular requires.

We loop through the `supportSources` and append additional scripts if any were passed.

```ts
// react-host/src/MicroFrontend.tsx
useEffect(() => {
  const scriptId = `micro_frontend_main_script_${props.id}`;
  const script = document.getElementById(scriptId);

  if (script) {
    renderMicroFrontend(props.id);
  } else {
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
  }
}, [props]);
```

### Unmounting Microfrontends

To unmount a microfrontend, we must call the unmount function provided by our guest in the cleanup function of `useEffect`.

```ts
// react-host/src/MicroFrontend.tsx
useEffect(() => {
  const scriptId = `micro_frontend_main_script_${props.id}`;
  const script = document.getElementById(scriptId);

  if (script) {
    renderMicroFrontend(props.id);
  } else {
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
  }

  // added a cleanup function below
  return () => {
    unmountMicroFrontend(props.id);
  };
}, [props]);
```

Similar to `renderMicroFrontend()`, we have `unmountMicroFrontend()` which is a wrapper around our unmount functions that are attached to the `window` object.

```ts
// react-host/src/MicroFrontend.tsx
function unmountMicroFrontend(id: string) {
  const unmount = window[`unmount_${id}` as keyof Window];
  if (typeof unmount === "function") {
    unmount();
  }
}
```

### Handling Delays

Downloading, parsing, and loading scripts into the browser takes some time. What if the `MicroFrontend` component was unmounted before the scripts have fully loaded? With the above implementation, `renderMicroFrontend()` will still be called as soon as the script is loaded, but it will fail because it will not be able to find a DOM element with the given `id`.

Rather than failing in this situation, we can abort the operation by defining a `boolean` variable `aborted` and setting it to `true` in the cleanup function.

```ts
// react-host/src/MicroFrontend.tsx
useEffect(() => {
  let aborted = false;

  // ...

  return () => {
    aborted = true;
    unmountMicroFrontend(props.id);
  };
}, [props]);
```

Before calling `renderMicroFrontend()` on load, we need to check if the operation has been aborted or not.

```ts
// react-host/src/MicroFrontend.tsx
useEffect(() => {
  let aborted = false;

  function safelyRenderMicroFrontend() {
    if (!aborted) {
      renderMicroFrontend(props.id);
    }
  }

  const scriptId = `micro_frontend_main_script_${props.id}`;
  const script = document.getElementById(scriptId);

  if (script) {
    renderMicroFrontend(props.id);
    // added the line below
    script.onload = safelyRenderMicroFrontend;
  } else {
    props.supportSources?.forEach((src, i) =>
      ScriptBuilder.create()
        .id(`micro_frontend_support_script_${props.id}_${i + 1}`)
        .src(src)
        .append()
    );

    ScriptBuilder.create()
      .id(scriptId)
      .src(props.mainSource)
      // modified the line below
      .onload(safelyRenderMicroFrontend)
      .append();
  }

  return () => {
    aborted = true;
    unmountMicroFrontend(props.id);
  };
}, [props]);
```

## Implementing Cross-Application Communication

Cross-application communication is implemented by dispatching and listening for custom events.

Suppose that we have a stateful `value` in our host, and we want to share it with our guests.

```tsx
// react-host/src/App.tsx
function App() {
  const [value, setValue] = useState(0);

  // ...
}
```

Our guests can talk to the host by dispatching an event, asking for the current `value` as soon as they mount.

```ts
// react-guest/src/App.tsx
useEffect(() => {
  // ...

  // ask
  const event = new Event("What is the current value?");
  window.dispatchEvent(event);

  // ...
}, []);
```

They also need to listen for the response.

```ts
// react-guest/src/App.tsx
useEffect(() => {
  const controller = new AbortController();
  const { signal } = controller;

  // listen for the response
  window.addEventListener("Current value is", handleValue, { signal });

  // ask
  const event = new Event("What is the current value?");
  window.dispatchEvent(event);

  return () => controller.abort();
}, []);
```

Whenever we "hear" an event that is trying to tell us of the new value, we invoke the `handleValue` function. It simply updates the state of the guest.

```tsx
// react-guest/src/App.tsx
function App() {
  const [value, setValue] = useState(-1);

  // ...

  function handleValue(event: Event) {
    setValue((event as CustomEvent).detail);
  }

  // ...
}
```

Going back to our host, it can listen for this event and respond accordingly. Also, we need to inform the guests whenever `value` changes even when the guests do not explicitly ask us about the current value.

```ts
// react-host/src/App.tsx
useEffect(() => {
  const event = new CustomEvent("Current value is", { detail: value });

  const controller = new AbortController();
  const { signal } = controller;

  // respond to explicit questions
  window.addEventListener(
    "What is the current value?",
    () => {
      window.dispatchEvent(event);
    },
    { signal }
  );

  // announce when the value changes
  window.dispatchEvent(event);

  return () => controller.abort();
}, [value]);
```

Note that when we answer an explicit question, everyone can "hear" our answer because we dispatched the event on the `window` object.

At this point, you may wonder why our guests need to explicitly ask for the current `value`. Is it not enough if the host dispatches an event whenever the `value` changes?

No, because when our guests initially render, they are not aware of the current `value`, and our host does not know when the guests are ready to listen for events.

That is it when it comes to cross-application communication. Now, whenever the state changes reactively, both the host and guests have a copy of the same value.
