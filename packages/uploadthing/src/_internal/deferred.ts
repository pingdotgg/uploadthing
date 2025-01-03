export type Deferred<T> = {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  ac: AbortController;
  promise: Promise<T>;
};

export const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  const ac = new AbortController();
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, ac, resolve, reject };
};
