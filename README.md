# Microfrontends Example

This repository is a detailed example of how microfrontends can be implemented and integrated at runtime via JavaScript. The solution was originally inspired by [Cam Jackson's article](https://martinfowler.com/articles/micro-frontends.html).

## Terminology

A _host_ is a frontend application that contains and renders microfrontends.

A _guest_ is a microfrontend application that can be rendered within a host or in a standalone application.

## Introduction

In this example, the host is implemented with React, but the solution is framework-agnostic and can be implemented with vanilla JavaScript or with any frontend framework. For demonstration purposes, the host integrates two guests. A React guest, and an Angular guest. Both the host and the guests are fully rendered at the client.

![microfrontends demo](microfrontends-demo.gif)

## Implementing Guests

You can implement a guest with vanilla JavaScript or with any frontend framework of your choice as long as you export a function that mounts your microfrontend under a given HTML element.

For example, `react-guest/src/app.tsx` is an entry point for our React microfrontend and our goal is to render it on the host.

In `react-guest/src/main.tsx`, we export a function `mountMicrofrontend` to render the `App` component under the given element `root`.

```tsx
// react-guest/src/main.tsx
export function mountMicrofrontend(root: HTMLElement) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
```

To let our guest run as a standalone application as well, we add an if-statement that checks whether an element with an ID equal to `angular-guest` exists in the DOM or not. If it exists, then we are running as a standalone application because we know that the host cannot have an element with this ID.

```tsx
// react-guest/src/main.tsx
const root = document.getElementById("react-guest");

if (root) {
  mountMicrofrontend(root);
}
```

Implementing an Angular guest is similar to this, feel free to look at `angular-guest/` for an example.

## Implementing a Host

### Rendering Microfrontends

Our goal at the host is to dynamically import the mounting functions (i.e., `mountMicrofrontend`) and call them for each microfrontend. In our React implementation, we will handle this in the `react-host/src/microfrontend.tsx` component which takes the microfrontend's JavaScript source as a prop.

```tsx
<Microfrontend src="http://localhost:5174/src/main.tsx" />
```

Initially, this component renders an empty `div` element. When it renders, we will dynamically import the given JavaScript source and pass the `div` element to the exported `mountMicrofrontend` function.

```tsx
// react-host/src/microfrontend.tsx
export function Microfrontend({ src }: MicroFrontendProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import(src).then(({ mountMicrofrontend }) => {
      mountMicrofrontend(ref.current);
    });
  }, [src]);

  return <div ref={ref}></div>;
}
```

Since the dynamic import is asynchronous, it is possible for it to be running even when the `Microfrontend` component has unmounted. To workaround that issue, we ignore the result of the dynamic import if the component gets unmounted.

```tsx
useEffect(() => {
  let ignore = false;

  import(src).then(({ mountMicrofrontend }) => {
    if (!ignore) {
      mountMicrofrontend(ref.current);
    }
  });

  return () => {
    ignore = true;
  };
}, [src]);
```

For learning purposes, this implementation is good enough. Feel free to look at the `Microfrontend` implementation provided in this repository for handling loading and errors.

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
