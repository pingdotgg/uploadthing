import { createUpload, setInputProps } from "./uploadthing";

/**
 * A controlled uploader that lets
 * you pause and resume uploads for individual files.
 *
 * @param el The container element with the form and all inside
 */
export const setupResumableUploader = (el: HTMLDivElement) => {
  const form = el.querySelector<HTMLFormElement>("form")!;
  const input = form.querySelector<HTMLInputElement>("input[type=file]")!;
  const submitButton = form.querySelector<HTMLButtonElement>(
    "button[type=submit]",
  )!;

  // Hook up abort button
  // abortButton.addEventListener("click", () => ac.abort());

  // Hook up form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitButton.disabled = true;

    const files = Array.from(input.files || []);

    // Create a card for each file
    const elements = new Map<File, HTMLDivElement>();
    for (const file of files) {
      const card = document.createElement("div");
      card.classList.add("card");
      card.style.padding = "0.5em";
      card.appendChild(document.createTextNode(file.name));
      card.innerHTML = `
        <span>${file.name}</span>
        <progress value="0" max="100"></progress>
        `;
      elements.set(file, card);
    }

    // Create uploads for each file
    const { done, pauseUpload, resumeUpload } = await createUpload(
      "videoAndImage",
      {
        files,
        onUploadProgress: ({ file, progress }) => {
          const progressBar = elements.get(file)?.querySelector("progress");
          if (progressBar) progressBar.value = progress;
        },
      },
    );

    // Mount the upload cards to the DOM
    elements.forEach((card, file) => {
      // Append resumability controls
      const resumeButton = document.createElement("button");
      resumeButton.innerText = "Resume";
      resumeButton.addEventListener("click", () => {
        resumeUpload(file);
        pauseButton.innerHTML = "Pause";
      });
      card.appendChild(resumeButton);

      const pauseButton = document.createElement("button");
      pauseButton.innerText = "Pause";
      pauseButton.addEventListener("click", () => {
        pauseUpload(file);
        pauseButton.innerHTML = "Abort";
      });
      card.appendChild(pauseButton);

      const controls = document.createElement("div");
      controls.classList.add("controls");
      controls.appendChild(pauseButton);
      controls.appendChild(resumeButton);

      card.appendChild(controls);
      el.appendChild(card);
    });

    // Await for all uploads to complete
    const res = await done();
    console.log(res);
    setTimeout(() => alert("Upload complete!"));
    elements.forEach((card) => card.remove());

    submitButton.disabled = false;
  });

  // Sync accept and multiple attributes with the server state
  setInputProps("videoAndImage", input);
};
