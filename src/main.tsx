import "./index.css";
import { loadRuntimeConfig } from "./config/runtime";

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function bootstrap() {
  await loadRuntimeConfig();

  // Import app code only after runtime config is available.
  const [{ createRoot }, { default: App }] = await Promise.all([
    import("react-dom/client"),
    import("./App"),
  ]);

  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap().catch((err) => {
  // Fail fast + readable error in the UI.
  console.error(err);
  const root = document.getElementById("root");
  if (!root) return;

  const message = err instanceof Error ? err.message : String(err);
  root.innerHTML = `
    <div style="padding:16px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;">
      <h1 style="font-size:16px;margin:0 0 8px 0;">Runtime configuration error</h1>
      <pre style="white-space:pre-wrap;margin:0;">${escapeHtml(message)}</pre>
    </div>
  `;
});
