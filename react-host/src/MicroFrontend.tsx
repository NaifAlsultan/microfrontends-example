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
    const scriptId = `micro_frontend_main_script_${id}`;

    if (document.getElementById(scriptId)) {
      renderMicroFrontend(id);
      return;
    }

    supportSources?.forEach((src, i) =>
      ScriptBuilder.create()
        .id(`micro_frontend_support_script_${id}_${i + 1}`)
        .src(src)
        .append()
    );

    ScriptBuilder.create()
      .id(scriptId)
      .src(mainSource)
      .onload(() => renderMicroFrontend(id))
      .append();
  }, [id, mainSource, supportSources]);

  return <div id={`${id}_root`}></div>;
}

function renderMicroFrontend(id: string) {
  const render = window[`render_${id}` as keyof Window];
  if (typeof render === "function") {
    render(`${id}_root`);
  }
}
