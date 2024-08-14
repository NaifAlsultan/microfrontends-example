import { Fragment, useEffect, useState } from "react";
import { ScriptBuilder } from "./ScriptBuilder";

interface MicroFrontendProps {
  id: string;
  mainSource: string;
  supportSources?: string[];
}

export function MicroFrontend({
  id,
  mainSource,
  supportSources,
}: MicroFrontendProps) {
  const [isLoading, setIsLoading] = useState(!scriptIsLoaded(id));

  useEffect(() => {
    let aborted = false;

    function safelyRenderMicroFrontend() {
      if (!aborted) {
        setIsLoading(false);
        renderMicroFrontend(id);
      }
    }

    const scriptId = `micro_frontend_main_script_${id}`;
    const script = document.getElementById(scriptId);

    if (script) {
      if (scriptIsLoaded(id)) {
        setIsLoading(false);
        renderMicroFrontend(id);
      } else {
        script.onload = safelyRenderMicroFrontend;
      }
    } else {
      supportSources?.forEach((src, i) =>
        ScriptBuilder.create()
          .id(`micro_frontend_support_script_${id}_${i + 1}`)
          .src(src)
          .append()
      );

      ScriptBuilder.create()
        .id(scriptId)
        .src(mainSource)
        .onload(safelyRenderMicroFrontend)
        .append();
    }

    return () => {
      aborted = true;
      unmountMicroFrontend(id);
    };
  }, [id, mainSource, supportSources]);

  return (
    <Fragment>
      {isLoading && <p>Loading {id}...</p>}
      <div id={`${id}_root`}></div>
    </Fragment>
  );
}

function renderMicroFrontend(id: string) {
  const render = window[`render_${id}` as keyof Window];
  if (typeof render === "function") {
    render(`${id}_root`);
  }
}

function unmountMicroFrontend(id: string) {
  const unmount = window[`unmount_${id}` as keyof Window];
  if (typeof unmount === "function") {
    unmount();
  }
}

function scriptIsLoaded(id: string) {
  return typeof window[`render_${id}` as keyof Window] === "function";
}
