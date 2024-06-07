import { setupUploader } from "./normal-upload";
import { setupResumableUploader } from "./resumable-upload";

import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <h1>UploadThing x Vanilla JS</h1>
  <div class="card" id="vanilla-upload">
    <h2>Normal upload</h2>
    <form>
      <input type="file" />
      <button type="submit">Upload</button>
    </form>
    <button type="button" disabled="true">Abort</button>
    <progress value="0" max="100" style="display: none"></progress>
  </div>

  <div class="card" id="resumable-upload">
    <h2>Resumable upload</h2>
    <form>
      <input type="file" />
      <button type="submit">Start Upload</button>
    </form>
  </div>
`;

setupUploader(document.querySelector<HTMLDivElement>("#vanilla-upload")!);
setupResumableUploader(
  document.querySelector<HTMLDivElement>("#resumable-upload")!,
);
