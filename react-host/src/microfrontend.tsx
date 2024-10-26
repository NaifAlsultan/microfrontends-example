import { Fragment, useEffect, useRef, useState } from "react";

interface MicrofrontendProps {
  src: string;
}

export function Microfrontend({ src }: MicrofrontendProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState({
    isLoading: true,
    isError: false,
  });

  useEffect(() => {
    let ignore = false;

    import(/* @vite-ignore */ src)
      .then(({ mountMicrofrontend }) => {
        setStatus({
          isLoading: false,
          isError: false,
        });
        if (!ignore) {
          mountMicrofrontend(ref.current);
        }
      })
      .catch((err) => {
        console.error(err);
        setStatus({
          isLoading: false,
          isError: true,
        });
      });

    return () => {
      ignore = true;
    };
  }, [src]);

  return (
    <Fragment>
      {status.isLoading && <p>Loading {src}...</p>}
      {status.isError && <p>Unable to mount from {src}</p>}
      <div ref={ref}></div>
    </Fragment>
  );
}
