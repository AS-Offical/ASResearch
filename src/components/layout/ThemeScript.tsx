/** Applies a saved theme before first paint. Without a saved choice the CSS follows the system. */
const script = `try{var t=localStorage.getItem("as-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
