import { useEffect } from "react";
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
  useEffect(() => {
    let aborted = false;

    function safelyRenderMicroFrontend() {
      if (!aborted) {
        renderMicroFrontend(id);
      }
    }

    const scriptId = `micro_frontend_main_script_${id}`;
    const script = document.getElementById(scriptId);

    if (script) {
      renderMicroFrontend(id);
      script.onload = safelyRenderMicroFrontend;
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

  return <div id={`${id}_root`}></div>;
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
