import "./style.css";

import { setupUploader } from "./uploader";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>UploadThing x Vanilla JS</h1>
    <div class="card">
      <form id="upload-form">
        <input type="file" />
        <button>Upload</button>
    </div>
  </div>
`;

setupUploader(document.querySelector<HTMLFormElement>("#upload-form")!);
