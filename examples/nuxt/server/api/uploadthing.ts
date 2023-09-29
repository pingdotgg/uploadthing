import { createH3EventHandler } from "uploadthing/h3";

import { uploadRouter } from "../uploadthing";

export default createH3EventHandler({ router: uploadRouter });
