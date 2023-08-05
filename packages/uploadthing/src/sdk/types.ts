export type FileEsque = Blob & { name: string };

export type UploadValue = {
  key: string;
  url: string;
};

export type SerializedUploadthingError = {
  code: string;
  message: string;
  data: any;
};

export type SuccessUpload = {
  data: UploadValue;
  error: null;
};

export type FailedUpload = {
  data: null;
  error: SerializedUploadthingError;
};
