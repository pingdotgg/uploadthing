"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { ElementType, ProviderProps, Ref, RefObject } from "react";

import {
  generateMimeTypes,
  generatePermittedFileTypes,
  getFilesFromClipboardEvent,
  resolveMaybeUrlArg,
  UploadAbortedError,
} from "@uploadthing/shared";
import type {
  ExpandedRouteConfig,
  FileRouterInputKey,
} from "@uploadthing/shared";
import type { FileRouter } from "uploadthing/types";

import type { UploadthingComponentProps } from "../../types";
import { __useUploadThingInternal } from "../../useUploadThing";
import { useControllableState } from "../../utils/useControllableState";
import { usePaste } from "../../utils/usePaste";

type PrimitiveContextValues = {
  state: "readying" | "ready" | "uploading" | "disabled";

  files: File[];
  fileTypes: FileRouterInputKey[];
  accept: string;

  /**
   * @remarks If the mode is set to 'auto' this function will upload the files too
   */
  setFiles: (_: File[]) => void;

  /**
   * Uploads the selected files
   * @remarks If the mode is set to 'auto', there is no need to call this function
   */
  uploadFiles: () => void;

  abortUpload: () => void;

  routeConfig: ExpandedRouteConfig | undefined;

  uploadProgress: number;

  options: {
    mode: "auto" | "manual";
    multiple: boolean;
  };

  refs: {
    focusElementRef: RefObject<HTMLElement>;
    fileInputRef: RefObject<HTMLInputElement>;
  };

  /**
   * @remarks This will be only defined when nested in a <Dropzone>
   */
  dropzone?: {
    isDragActive: boolean;
  };
};

const PrimitiveContext = createContext<PrimitiveContextValues | null>(null);

export function PrimitiveContextMergeProvider({
  value,
  ...props
}: ProviderProps<Partial<PrimitiveContextValues>>) {
  const currentValue = useContext(PrimitiveContext);

  if (currentValue === null) {
    throw new Error(
      "<PrimitiveContextMergeProvider> must be used within a <UT.Root>",
    );
  }

  return (
    <PrimitiveContext.Provider
      value={{ ...currentValue, ...value }}
      {...props}
    />
  );
}

export function usePrimitiveValues(componentName?: string) {
  const values = useContext(PrimitiveContext);
  if (values === null) {
    const name = componentName ? `<UT.${componentName}>` : "usePrimitiveValues";
    throw new Error(`${name} must be used within a <UT.Root>`);
  }
  return values;
}

export function PrimitiveSlot({
  children,
  componentName,
  default: defaultChildren,
}: {
  children: PrimitiveComponentChildren;
  componentName?: string;
  default?: React.ReactNode;
}) {
  if (!children) return defaultChildren;
  return typeof children === "function"
    ? children?.(usePrimitiveValues(componentName))
    : children;
}

export type HasDisplayName = {
  displayName: string;
};

export type RefProp<T extends (...args: any[]) => any> = T extends (
  props: any,
  ref: Ref<infer RefType>,
) => any
  ? { ref?: Ref<RefType> }
  : never;

export type PrimitiveComponentProps<TTag extends ElementType = "div"> = Omit<
  React.ComponentPropsWithoutRef<TTag>,
  "children"
> &
  PrimitiveComponentChildrenProp & {
    as?: TTag;
  };

export type PrimitiveComponentChildrenProp = {
  children?: PrimitiveComponentChildren;
};

export type PrimitiveComponentChildren =
  | ((values: PrimitiveContextValues) => React.ReactNode)
  | React.ReactNode;

/** These are some internal stuff we use to test the component and for forcing a state in docs */
type UploadThingInternalProps = {
  __internal_state?: "readying" | "ready" | "uploading";
  // Allow to set upload progress for testing
  __internal_upload_progress?: number;
  // Allow to set ready explicitly and independently of internal state
  __internal_ready?: boolean;
};

export type RootPrimitiveComponentProps<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
> = UploadthingComponentProps<TRouter, TEndpoint> & {
  // TODO: add @see comment for docs
  children?: PrimitiveComponentChildren;
  files?: File[];
  onFilesChange?: (_: File[]) => void;
};

export function Root<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
  props: RootPrimitiveComponentProps<TRouter, TEndpoint> &
    UploadThingInternalProps,
) {
  const fileRouteInput = "input" in props ? props.input : undefined;

  const { mode = "auto", appendOnPaste = false } = props.config ?? {};
  const acRef = useRef(new AbortController());

  const focusElementRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(
    props.__internal_upload_progress ?? 0,
  );
  const [files, setFiles] = useControllableState<File[]>({
    prop: props.files,
    onChange: props.onFilesChange,
    defaultProp: [],
  });

  const { startUpload, isUploading, routeConfig } = __useUploadThingInternal(
    resolveMaybeUrlArg(props.url),
    props.endpoint,
    {
      signal: acRef.current.signal,
      headers: props.headers,
      onClientUploadComplete: (res) => {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setFiles([]);
        void props.onClientUploadComplete?.(res);
        setUploadProgress(0);
      },
      onUploadProgress: (p) => {
        setUploadProgress(p);
        props.onUploadProgress?.(p);
      },
      onUploadError: props.onUploadError,
      onUploadBegin: props.onUploadBegin,
      onBeforeUploadBegin: props.onBeforeUploadBegin,
    },
  );

  const { onUploadAborted } = props;
  const uploadFiles = useCallback(
    (files: File[]) => {
      startUpload(files, fileRouteInput).catch((e) => {
        if (e instanceof UploadAbortedError) {
          void onUploadAborted?.();
        } else {
          throw e;
        }
      });
    },
    [onUploadAborted, startUpload, fileRouteInput],
  );

  const { fileTypes, multiple } = generatePermittedFileTypes(routeConfig);

  const accept = generateMimeTypes(fileTypes).join(", ");

  const state = (() => {
    if (props.__internal_state) return props.__internal_state;

    const ready =
      props.__internal_ready ??
      (props.__internal_state === "ready" || fileTypes.length > 0);

    if (fileTypes.length === 0 || !!props.disabled) return "disabled";
    if (!ready) return "readying";
    if (ready && !isUploading) return "ready";
    return "uploading";
  })();

  usePaste((event) => {
    if (!appendOnPaste) return;
    const ref = focusElementRef.current || fileInputRef.current;

    if (document.activeElement !== ref) return;

    const pastedFiles = getFilesFromClipboardEvent(event);
    if (!pastedFiles) return;

    let filesToUpload = pastedFiles;
    setFiles((prev) => {
      filesToUpload = [...prev, ...pastedFiles];

      props.onChange?.(filesToUpload);

      return filesToUpload;
    });

    if (mode === "auto") void uploadFiles(filesToUpload);
  });

  const primitiveValues = useMemo<PrimitiveContextValues>(() => ({
    files,
    setFiles: (files) => {
      setFiles(files);
      props.onChange?.(files);

      if (files.length <= 0) {
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (mode === "manual") return;

      void uploadFiles(files);
    },
    uploadFiles: () => void uploadFiles(files),
    abortUpload: () => {
      acRef.current.abort();
      acRef.current = new AbortController();
    },
    uploadProgress,
    state,
    accept,
    fileTypes,
    options: { mode, multiple },
    refs: {
      focusElementRef,
      fileInputRef,
    },
    routeConfig,
  }), [
    files,
    setFiles,
    uploadFiles,
    uploadProgress,
    state,
    accept,
    fileTypes,
    mode,
    multiple,
    routeConfig,
  ]);

  return (
    <PrimitiveContext.Provider value={primitiveValues}>
      <PrimitiveSlot>{props.children}</PrimitiveSlot>
    </PrimitiveContext.Provider>
  );
}
