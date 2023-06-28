import { version, useSSRContext, hasInjectionContext, getCurrentInstance, inject, ref, watchEffect, watch, defineComponent, mergeProps, createApp, reactive, unref, createElementBlock, provide, onErrorCaptured, onServerPrefetch, createVNode, resolveDynamicComponent, toRef, h as h$2, isReadonly, defineAsyncComponent, isRef, isShallow, isReactive, toRaw } from 'vue';
import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import Stream, { pipeline as pipeline$1, PassThrough } from 'node:stream';
import { Buffer as Buffer$1 } from 'node:buffer';
import { promisify, deprecate, types } from 'node:util';
import { format } from 'node:url';
import { isIP } from 'node:net';
import { withQuery, hasProtocol, parseURL, joinURL, withBase, isEqual, stringifyParsedURL, stringifyQuery, parseQuery } from 'ufo';
import { getContext } from 'unctx';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderSuspense, ssrRenderVNode } from 'vue/server-renderer';
import { a as useRuntimeConfig$1 } from '../nitro/node-server.mjs';
import 'node-fetch-native/polyfill';
import 'destr';
import 'h3';
import 'ofetch';
import 'unenv/runtime/fetch/index';
import 'hookable';
import 'scule';
import 'klona';
import 'defu';
import 'ohash';
import 'unstorage';
import 'radix3';
import 'node:fs';
import 'pathe';
import 'http-graceful-shutdown';

var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _parts, _type, _size, _endings, _a, _lastModified, _name, _b, _d, _c;
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i2 = 1; i2 < meta.length; i2++) {
    if (meta[i2] === "base64") {
      base64 = true;
    } else if (meta[i2]) {
      typeFull += `;${meta[i2]}`;
      if (meta[i2].indexOf("charset=") === 0) {
        charset = meta[i2].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var ponyfill_es2018 = { exports: {} };
var hasRequiredPonyfill_es2018;
function requirePonyfill_es2018() {
  if (hasRequiredPonyfill_es2018)
    return ponyfill_es2018.exports;
  hasRequiredPonyfill_es2018 = 1;
  (function(module, exports) {
    (function(global2, factory) {
      factory(exports);
    })(commonjsGlobal, function(exports2) {
      const SymbolPolyfill = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? Symbol : (description) => `Symbol(${description})`;
      function noop() {
        return void 0;
      }
      function getGlobals() {
        if (typeof self !== "undefined") {
          return self;
        } else if (typeof commonjsGlobal !== "undefined") {
          return commonjsGlobal;
        }
        return void 0;
      }
      const globals = getGlobals();
      function typeIsObject(x2) {
        return typeof x2 === "object" && x2 !== null || typeof x2 === "function";
      }
      const rethrowAssertionErrorRejection = noop;
      const originalPromise = Promise;
      const originalPromiseThen = Promise.prototype.then;
      const originalPromiseResolve = Promise.resolve.bind(originalPromise);
      const originalPromiseReject = Promise.reject.bind(originalPromise);
      function newPromise(executor) {
        return new originalPromise(executor);
      }
      function promiseResolvedWith(value) {
        return originalPromiseResolve(value);
      }
      function promiseRejectedWith(reason) {
        return originalPromiseReject(reason);
      }
      function PerformPromiseThen(promise, onFulfilled, onRejected) {
        return originalPromiseThen.call(promise, onFulfilled, onRejected);
      }
      function uponPromise(promise, onFulfilled, onRejected) {
        PerformPromiseThen(PerformPromiseThen(promise, onFulfilled, onRejected), void 0, rethrowAssertionErrorRejection);
      }
      function uponFulfillment(promise, onFulfilled) {
        uponPromise(promise, onFulfilled);
      }
      function uponRejection(promise, onRejected) {
        uponPromise(promise, void 0, onRejected);
      }
      function transformPromiseWith(promise, fulfillmentHandler, rejectionHandler) {
        return PerformPromiseThen(promise, fulfillmentHandler, rejectionHandler);
      }
      function setPromiseIsHandledToTrue(promise) {
        PerformPromiseThen(promise, void 0, rethrowAssertionErrorRejection);
      }
      const queueMicrotask = (() => {
        const globalQueueMicrotask = globals && globals.queueMicrotask;
        if (typeof globalQueueMicrotask === "function") {
          return globalQueueMicrotask;
        }
        const resolvedPromise = promiseResolvedWith(void 0);
        return (fn) => PerformPromiseThen(resolvedPromise, fn);
      })();
      function reflectCall(F, V, args) {
        if (typeof F !== "function") {
          throw new TypeError("Argument is not a function");
        }
        return Function.prototype.apply.call(F, V, args);
      }
      function promiseCall(F, V, args) {
        try {
          return promiseResolvedWith(reflectCall(F, V, args));
        } catch (value) {
          return promiseRejectedWith(value);
        }
      }
      const QUEUE_MAX_ARRAY_SIZE = 16384;
      class SimpleQueue {
        constructor() {
          this._cursor = 0;
          this._size = 0;
          this._front = {
            _elements: [],
            _next: void 0
          };
          this._back = this._front;
          this._cursor = 0;
          this._size = 0;
        }
        get length() {
          return this._size;
        }
        // For exception safety, this method is structured in order:
        // 1. Read state
        // 2. Calculate required state mutations
        // 3. Perform state mutations
        push(element) {
          const oldBack = this._back;
          let newBack = oldBack;
          if (oldBack._elements.length === QUEUE_MAX_ARRAY_SIZE - 1) {
            newBack = {
              _elements: [],
              _next: void 0
            };
          }
          oldBack._elements.push(element);
          if (newBack !== oldBack) {
            this._back = newBack;
            oldBack._next = newBack;
          }
          ++this._size;
        }
        // Like push(), shift() follows the read -> calculate -> mutate pattern for
        // exception safety.
        shift() {
          const oldFront = this._front;
          let newFront = oldFront;
          const oldCursor = this._cursor;
          let newCursor = oldCursor + 1;
          const elements = oldFront._elements;
          const element = elements[oldCursor];
          if (newCursor === QUEUE_MAX_ARRAY_SIZE) {
            newFront = oldFront._next;
            newCursor = 0;
          }
          --this._size;
          this._cursor = newCursor;
          if (oldFront !== newFront) {
            this._front = newFront;
          }
          elements[oldCursor] = void 0;
          return element;
        }
        // The tricky thing about forEach() is that it can be called
        // re-entrantly. The queue may be mutated inside the callback. It is easy to
        // see that push() within the callback has no negative effects since the end
        // of the queue is checked for on every iteration. If shift() is called
        // repeatedly within the callback then the next iteration may return an
        // element that has been removed. In this case the callback will be called
        // with undefined values until we either "catch up" with elements that still
        // exist or reach the back of the queue.
        forEach(callback) {
          let i2 = this._cursor;
          let node = this._front;
          let elements = node._elements;
          while (i2 !== elements.length || node._next !== void 0) {
            if (i2 === elements.length) {
              node = node._next;
              elements = node._elements;
              i2 = 0;
              if (elements.length === 0) {
                break;
              }
            }
            callback(elements[i2]);
            ++i2;
          }
        }
        // Return the element that would be returned if shift() was called now,
        // without modifying the queue.
        peek() {
          const front = this._front;
          const cursor = this._cursor;
          return front._elements[cursor];
        }
      }
      function ReadableStreamReaderGenericInitialize(reader, stream) {
        reader._ownerReadableStream = stream;
        stream._reader = reader;
        if (stream._state === "readable") {
          defaultReaderClosedPromiseInitialize(reader);
        } else if (stream._state === "closed") {
          defaultReaderClosedPromiseInitializeAsResolved(reader);
        } else {
          defaultReaderClosedPromiseInitializeAsRejected(reader, stream._storedError);
        }
      }
      function ReadableStreamReaderGenericCancel(reader, reason) {
        const stream = reader._ownerReadableStream;
        return ReadableStreamCancel(stream, reason);
      }
      function ReadableStreamReaderGenericRelease(reader) {
        if (reader._ownerReadableStream._state === "readable") {
          defaultReaderClosedPromiseReject(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
        } else {
          defaultReaderClosedPromiseResetToRejected(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
        }
        reader._ownerReadableStream._reader = void 0;
        reader._ownerReadableStream = void 0;
      }
      function readerLockException(name) {
        return new TypeError("Cannot " + name + " a stream using a released reader");
      }
      function defaultReaderClosedPromiseInitialize(reader) {
        reader._closedPromise = newPromise((resolve, reject) => {
          reader._closedPromise_resolve = resolve;
          reader._closedPromise_reject = reject;
        });
      }
      function defaultReaderClosedPromiseInitializeAsRejected(reader, reason) {
        defaultReaderClosedPromiseInitialize(reader);
        defaultReaderClosedPromiseReject(reader, reason);
      }
      function defaultReaderClosedPromiseInitializeAsResolved(reader) {
        defaultReaderClosedPromiseInitialize(reader);
        defaultReaderClosedPromiseResolve(reader);
      }
      function defaultReaderClosedPromiseReject(reader, reason) {
        if (reader._closedPromise_reject === void 0) {
          return;
        }
        setPromiseIsHandledToTrue(reader._closedPromise);
        reader._closedPromise_reject(reason);
        reader._closedPromise_resolve = void 0;
        reader._closedPromise_reject = void 0;
      }
      function defaultReaderClosedPromiseResetToRejected(reader, reason) {
        defaultReaderClosedPromiseInitializeAsRejected(reader, reason);
      }
      function defaultReaderClosedPromiseResolve(reader) {
        if (reader._closedPromise_resolve === void 0) {
          return;
        }
        reader._closedPromise_resolve(void 0);
        reader._closedPromise_resolve = void 0;
        reader._closedPromise_reject = void 0;
      }
      const AbortSteps = SymbolPolyfill("[[AbortSteps]]");
      const ErrorSteps = SymbolPolyfill("[[ErrorSteps]]");
      const CancelSteps = SymbolPolyfill("[[CancelSteps]]");
      const PullSteps = SymbolPolyfill("[[PullSteps]]");
      const NumberIsFinite = Number.isFinite || function(x2) {
        return typeof x2 === "number" && isFinite(x2);
      };
      const MathTrunc = Math.trunc || function(v2) {
        return v2 < 0 ? Math.ceil(v2) : Math.floor(v2);
      };
      function isDictionary(x2) {
        return typeof x2 === "object" || typeof x2 === "function";
      }
      function assertDictionary(obj, context) {
        if (obj !== void 0 && !isDictionary(obj)) {
          throw new TypeError(`${context} is not an object.`);
        }
      }
      function assertFunction(x2, context) {
        if (typeof x2 !== "function") {
          throw new TypeError(`${context} is not a function.`);
        }
      }
      function isObject2(x2) {
        return typeof x2 === "object" && x2 !== null || typeof x2 === "function";
      }
      function assertObject(x2, context) {
        if (!isObject2(x2)) {
          throw new TypeError(`${context} is not an object.`);
        }
      }
      function assertRequiredArgument(x2, position, context) {
        if (x2 === void 0) {
          throw new TypeError(`Parameter ${position} is required in '${context}'.`);
        }
      }
      function assertRequiredField(x2, field, context) {
        if (x2 === void 0) {
          throw new TypeError(`${field} is required in '${context}'.`);
        }
      }
      function convertUnrestrictedDouble(value) {
        return Number(value);
      }
      function censorNegativeZero(x2) {
        return x2 === 0 ? 0 : x2;
      }
      function integerPart(x2) {
        return censorNegativeZero(MathTrunc(x2));
      }
      function convertUnsignedLongLongWithEnforceRange(value, context) {
        const lowerBound = 0;
        const upperBound = Number.MAX_SAFE_INTEGER;
        let x2 = Number(value);
        x2 = censorNegativeZero(x2);
        if (!NumberIsFinite(x2)) {
          throw new TypeError(`${context} is not a finite number`);
        }
        x2 = integerPart(x2);
        if (x2 < lowerBound || x2 > upperBound) {
          throw new TypeError(`${context} is outside the accepted range of ${lowerBound} to ${upperBound}, inclusive`);
        }
        if (!NumberIsFinite(x2) || x2 === 0) {
          return 0;
        }
        return x2;
      }
      function assertReadableStream(x2, context) {
        if (!IsReadableStream(x2)) {
          throw new TypeError(`${context} is not a ReadableStream.`);
        }
      }
      function AcquireReadableStreamDefaultReader(stream) {
        return new ReadableStreamDefaultReader(stream);
      }
      function ReadableStreamAddReadRequest(stream, readRequest) {
        stream._reader._readRequests.push(readRequest);
      }
      function ReadableStreamFulfillReadRequest(stream, chunk, done) {
        const reader = stream._reader;
        const readRequest = reader._readRequests.shift();
        if (done) {
          readRequest._closeSteps();
        } else {
          readRequest._chunkSteps(chunk);
        }
      }
      function ReadableStreamGetNumReadRequests(stream) {
        return stream._reader._readRequests.length;
      }
      function ReadableStreamHasDefaultReader(stream) {
        const reader = stream._reader;
        if (reader === void 0) {
          return false;
        }
        if (!IsReadableStreamDefaultReader(reader)) {
          return false;
        }
        return true;
      }
      class ReadableStreamDefaultReader {
        constructor(stream) {
          assertRequiredArgument(stream, 1, "ReadableStreamDefaultReader");
          assertReadableStream(stream, "First parameter");
          if (IsReadableStreamLocked(stream)) {
            throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          }
          ReadableStreamReaderGenericInitialize(this, stream);
          this._readRequests = new SimpleQueue();
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed,
         * or rejected if the stream ever errors or the reader's lock is released before the stream finishes closing.
         */
        get closed() {
          if (!IsReadableStreamDefaultReader(this)) {
            return promiseRejectedWith(defaultReaderBrandCheckException("closed"));
          }
          return this._closedPromise;
        }
        /**
         * If the reader is active, behaves the same as {@link ReadableStream.cancel | stream.cancel(reason)}.
         */
        cancel(reason = void 0) {
          if (!IsReadableStreamDefaultReader(this)) {
            return promiseRejectedWith(defaultReaderBrandCheckException("cancel"));
          }
          if (this._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("cancel"));
          }
          return ReadableStreamReaderGenericCancel(this, reason);
        }
        /**
         * Returns a promise that allows access to the next chunk from the stream's internal queue, if available.
         *
         * If reading a chunk causes the queue to become empty, more data will be pulled from the underlying source.
         */
        read() {
          if (!IsReadableStreamDefaultReader(this)) {
            return promiseRejectedWith(defaultReaderBrandCheckException("read"));
          }
          if (this._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("read from"));
          }
          let resolvePromise;
          let rejectPromise;
          const promise = newPromise((resolve, reject) => {
            resolvePromise = resolve;
            rejectPromise = reject;
          });
          const readRequest = {
            _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
            _closeSteps: () => resolvePromise({ value: void 0, done: true }),
            _errorSteps: (e2) => rejectPromise(e2)
          };
          ReadableStreamDefaultReaderRead(this, readRequest);
          return promise;
        }
        /**
         * Releases the reader's lock on the corresponding stream. After the lock is released, the reader is no longer active.
         * If the associated stream is errored when the lock is released, the reader will appear errored in the same way
         * from now on; otherwise, the reader will appear closed.
         *
         * A reader's lock cannot be released while it still has a pending read request, i.e., if a promise returned by
         * the reader's {@link ReadableStreamDefaultReader.read | read()} method has not yet been settled. Attempting to
         * do so will throw a `TypeError` and leave the reader locked to the stream.
         */
        releaseLock() {
          if (!IsReadableStreamDefaultReader(this)) {
            throw defaultReaderBrandCheckException("releaseLock");
          }
          if (this._ownerReadableStream === void 0) {
            return;
          }
          if (this._readRequests.length > 0) {
            throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
          }
          ReadableStreamReaderGenericRelease(this);
        }
      }
      Object.defineProperties(ReadableStreamDefaultReader.prototype, {
        cancel: { enumerable: true },
        read: { enumerable: true },
        releaseLock: { enumerable: true },
        closed: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(ReadableStreamDefaultReader.prototype, SymbolPolyfill.toStringTag, {
          value: "ReadableStreamDefaultReader",
          configurable: true
        });
      }
      function IsReadableStreamDefaultReader(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_readRequests")) {
          return false;
        }
        return x2 instanceof ReadableStreamDefaultReader;
      }
      function ReadableStreamDefaultReaderRead(reader, readRequest) {
        const stream = reader._ownerReadableStream;
        stream._disturbed = true;
        if (stream._state === "closed") {
          readRequest._closeSteps();
        } else if (stream._state === "errored") {
          readRequest._errorSteps(stream._storedError);
        } else {
          stream._readableStreamController[PullSteps](readRequest);
        }
      }
      function defaultReaderBrandCheckException(name) {
        return new TypeError(`ReadableStreamDefaultReader.prototype.${name} can only be used on a ReadableStreamDefaultReader`);
      }
      const AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
      }).prototype);
      class ReadableStreamAsyncIteratorImpl {
        constructor(reader, preventCancel) {
          this._ongoingPromise = void 0;
          this._isFinished = false;
          this._reader = reader;
          this._preventCancel = preventCancel;
        }
        next() {
          const nextSteps = () => this._nextSteps();
          this._ongoingPromise = this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, nextSteps, nextSteps) : nextSteps();
          return this._ongoingPromise;
        }
        return(value) {
          const returnSteps = () => this._returnSteps(value);
          return this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, returnSteps, returnSteps) : returnSteps();
        }
        _nextSteps() {
          if (this._isFinished) {
            return Promise.resolve({ value: void 0, done: true });
          }
          const reader = this._reader;
          if (reader._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("iterate"));
          }
          let resolvePromise;
          let rejectPromise;
          const promise = newPromise((resolve, reject) => {
            resolvePromise = resolve;
            rejectPromise = reject;
          });
          const readRequest = {
            _chunkSteps: (chunk) => {
              this._ongoingPromise = void 0;
              queueMicrotask(() => resolvePromise({ value: chunk, done: false }));
            },
            _closeSteps: () => {
              this._ongoingPromise = void 0;
              this._isFinished = true;
              ReadableStreamReaderGenericRelease(reader);
              resolvePromise({ value: void 0, done: true });
            },
            _errorSteps: (reason) => {
              this._ongoingPromise = void 0;
              this._isFinished = true;
              ReadableStreamReaderGenericRelease(reader);
              rejectPromise(reason);
            }
          };
          ReadableStreamDefaultReaderRead(reader, readRequest);
          return promise;
        }
        _returnSteps(value) {
          if (this._isFinished) {
            return Promise.resolve({ value, done: true });
          }
          this._isFinished = true;
          const reader = this._reader;
          if (reader._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("finish iterating"));
          }
          if (!this._preventCancel) {
            const result = ReadableStreamReaderGenericCancel(reader, value);
            ReadableStreamReaderGenericRelease(reader);
            return transformPromiseWith(result, () => ({ value, done: true }));
          }
          ReadableStreamReaderGenericRelease(reader);
          return promiseResolvedWith({ value, done: true });
        }
      }
      const ReadableStreamAsyncIteratorPrototype = {
        next() {
          if (!IsReadableStreamAsyncIterator(this)) {
            return promiseRejectedWith(streamAsyncIteratorBrandCheckException("next"));
          }
          return this._asyncIteratorImpl.next();
        },
        return(value) {
          if (!IsReadableStreamAsyncIterator(this)) {
            return promiseRejectedWith(streamAsyncIteratorBrandCheckException("return"));
          }
          return this._asyncIteratorImpl.return(value);
        }
      };
      if (AsyncIteratorPrototype !== void 0) {
        Object.setPrototypeOf(ReadableStreamAsyncIteratorPrototype, AsyncIteratorPrototype);
      }
      function AcquireReadableStreamAsyncIterator(stream, preventCancel) {
        const reader = AcquireReadableStreamDefaultReader(stream);
        const impl = new ReadableStreamAsyncIteratorImpl(reader, preventCancel);
        const iterator = Object.create(ReadableStreamAsyncIteratorPrototype);
        iterator._asyncIteratorImpl = impl;
        return iterator;
      }
      function IsReadableStreamAsyncIterator(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_asyncIteratorImpl")) {
          return false;
        }
        try {
          return x2._asyncIteratorImpl instanceof ReadableStreamAsyncIteratorImpl;
        } catch (_a2) {
          return false;
        }
      }
      function streamAsyncIteratorBrandCheckException(name) {
        return new TypeError(`ReadableStreamAsyncIterator.${name} can only be used on a ReadableSteamAsyncIterator`);
      }
      const NumberIsNaN = Number.isNaN || function(x2) {
        return x2 !== x2;
      };
      function CreateArrayFromList(elements) {
        return elements.slice();
      }
      function CopyDataBlockBytes(dest, destOffset, src, srcOffset, n) {
        new Uint8Array(dest).set(new Uint8Array(src, srcOffset, n), destOffset);
      }
      function TransferArrayBuffer(O) {
        return O;
      }
      function IsDetachedBuffer(O) {
        return false;
      }
      function ArrayBufferSlice(buffer, begin, end) {
        if (buffer.slice) {
          return buffer.slice(begin, end);
        }
        const length = end - begin;
        const slice = new ArrayBuffer(length);
        CopyDataBlockBytes(slice, 0, buffer, begin, length);
        return slice;
      }
      function IsNonNegativeNumber(v2) {
        if (typeof v2 !== "number") {
          return false;
        }
        if (NumberIsNaN(v2)) {
          return false;
        }
        if (v2 < 0) {
          return false;
        }
        return true;
      }
      function CloneAsUint8Array(O) {
        const buffer = ArrayBufferSlice(O.buffer, O.byteOffset, O.byteOffset + O.byteLength);
        return new Uint8Array(buffer);
      }
      function DequeueValue(container) {
        const pair = container._queue.shift();
        container._queueTotalSize -= pair.size;
        if (container._queueTotalSize < 0) {
          container._queueTotalSize = 0;
        }
        return pair.value;
      }
      function EnqueueValueWithSize(container, value, size) {
        if (!IsNonNegativeNumber(size) || size === Infinity) {
          throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
        }
        container._queue.push({ value, size });
        container._queueTotalSize += size;
      }
      function PeekQueueValue(container) {
        const pair = container._queue.peek();
        return pair.value;
      }
      function ResetQueue(container) {
        container._queue = new SimpleQueue();
        container._queueTotalSize = 0;
      }
      class ReadableStreamBYOBRequest {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the view for writing in to, or `null` if the BYOB request has already been responded to.
         */
        get view() {
          if (!IsReadableStreamBYOBRequest(this)) {
            throw byobRequestBrandCheckException("view");
          }
          return this._view;
        }
        respond(bytesWritten) {
          if (!IsReadableStreamBYOBRequest(this)) {
            throw byobRequestBrandCheckException("respond");
          }
          assertRequiredArgument(bytesWritten, 1, "respond");
          bytesWritten = convertUnsignedLongLongWithEnforceRange(bytesWritten, "First parameter");
          if (this._associatedReadableByteStreamController === void 0) {
            throw new TypeError("This BYOB request has been invalidated");
          }
          if (IsDetachedBuffer(this._view.buffer))
            ;
          ReadableByteStreamControllerRespond(this._associatedReadableByteStreamController, bytesWritten);
        }
        respondWithNewView(view) {
          if (!IsReadableStreamBYOBRequest(this)) {
            throw byobRequestBrandCheckException("respondWithNewView");
          }
          assertRequiredArgument(view, 1, "respondWithNewView");
          if (!ArrayBuffer.isView(view)) {
            throw new TypeError("You can only respond with array buffer views");
          }
          if (this._associatedReadableByteStreamController === void 0) {
            throw new TypeError("This BYOB request has been invalidated");
          }
          if (IsDetachedBuffer(view.buffer))
            ;
          ReadableByteStreamControllerRespondWithNewView(this._associatedReadableByteStreamController, view);
        }
      }
      Object.defineProperties(ReadableStreamBYOBRequest.prototype, {
        respond: { enumerable: true },
        respondWithNewView: { enumerable: true },
        view: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(ReadableStreamBYOBRequest.prototype, SymbolPolyfill.toStringTag, {
          value: "ReadableStreamBYOBRequest",
          configurable: true
        });
      }
      class ReadableByteStreamController {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the current BYOB pull request, or `null` if there isn't one.
         */
        get byobRequest() {
          if (!IsReadableByteStreamController(this)) {
            throw byteStreamControllerBrandCheckException("byobRequest");
          }
          return ReadableByteStreamControllerGetBYOBRequest(this);
        }
        /**
         * Returns the desired size to fill the controlled stream's internal queue. It can be negative, if the queue is
         * over-full. An underlying byte source ought to use this information to determine when and how to apply backpressure.
         */
        get desiredSize() {
          if (!IsReadableByteStreamController(this)) {
            throw byteStreamControllerBrandCheckException("desiredSize");
          }
          return ReadableByteStreamControllerGetDesiredSize(this);
        }
        /**
         * Closes the controlled readable stream. Consumers will still be able to read any previously-enqueued chunks from
         * the stream, but once those are read, the stream will become closed.
         */
        close() {
          if (!IsReadableByteStreamController(this)) {
            throw byteStreamControllerBrandCheckException("close");
          }
          if (this._closeRequested) {
            throw new TypeError("The stream has already been closed; do not close it again!");
          }
          const state = this._controlledReadableByteStream._state;
          if (state !== "readable") {
            throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be closed`);
          }
          ReadableByteStreamControllerClose(this);
        }
        enqueue(chunk) {
          if (!IsReadableByteStreamController(this)) {
            throw byteStreamControllerBrandCheckException("enqueue");
          }
          assertRequiredArgument(chunk, 1, "enqueue");
          if (!ArrayBuffer.isView(chunk)) {
            throw new TypeError("chunk must be an array buffer view");
          }
          if (chunk.byteLength === 0) {
            throw new TypeError("chunk must have non-zero byteLength");
          }
          if (chunk.buffer.byteLength === 0) {
            throw new TypeError(`chunk's buffer must have non-zero byteLength`);
          }
          if (this._closeRequested) {
            throw new TypeError("stream is closed or draining");
          }
          const state = this._controlledReadableByteStream._state;
          if (state !== "readable") {
            throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be enqueued to`);
          }
          ReadableByteStreamControllerEnqueue(this, chunk);
        }
        /**
         * Errors the controlled readable stream, making all future interactions with it fail with the given error `e`.
         */
        error(e2 = void 0) {
          if (!IsReadableByteStreamController(this)) {
            throw byteStreamControllerBrandCheckException("error");
          }
          ReadableByteStreamControllerError(this, e2);
        }
        /** @internal */
        [CancelSteps](reason) {
          ReadableByteStreamControllerClearPendingPullIntos(this);
          ResetQueue(this);
          const result = this._cancelAlgorithm(reason);
          ReadableByteStreamControllerClearAlgorithms(this);
          return result;
        }
        /** @internal */
        [PullSteps](readRequest) {
          const stream = this._controlledReadableByteStream;
          if (this._queueTotalSize > 0) {
            const entry2 = this._queue.shift();
            this._queueTotalSize -= entry2.byteLength;
            ReadableByteStreamControllerHandleQueueDrain(this);
            const view = new Uint8Array(entry2.buffer, entry2.byteOffset, entry2.byteLength);
            readRequest._chunkSteps(view);
            return;
          }
          const autoAllocateChunkSize = this._autoAllocateChunkSize;
          if (autoAllocateChunkSize !== void 0) {
            let buffer;
            try {
              buffer = new ArrayBuffer(autoAllocateChunkSize);
            } catch (bufferE) {
              readRequest._errorSteps(bufferE);
              return;
            }
            const pullIntoDescriptor = {
              buffer,
              bufferByteLength: autoAllocateChunkSize,
              byteOffset: 0,
              byteLength: autoAllocateChunkSize,
              bytesFilled: 0,
              elementSize: 1,
              viewConstructor: Uint8Array,
              readerType: "default"
            };
            this._pendingPullIntos.push(pullIntoDescriptor);
          }
          ReadableStreamAddReadRequest(stream, readRequest);
          ReadableByteStreamControllerCallPullIfNeeded(this);
        }
      }
      Object.defineProperties(ReadableByteStreamController.prototype, {
        close: { enumerable: true },
        enqueue: { enumerable: true },
        error: { enumerable: true },
        byobRequest: { enumerable: true },
        desiredSize: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(ReadableByteStreamController.prototype, SymbolPolyfill.toStringTag, {
          value: "ReadableByteStreamController",
          configurable: true
        });
      }
      function IsReadableByteStreamController(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_controlledReadableByteStream")) {
          return false;
        }
        return x2 instanceof ReadableByteStreamController;
      }
      function IsReadableStreamBYOBRequest(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_associatedReadableByteStreamController")) {
          return false;
        }
        return x2 instanceof ReadableStreamBYOBRequest;
      }
      function ReadableByteStreamControllerCallPullIfNeeded(controller) {
        const shouldPull = ReadableByteStreamControllerShouldCallPull(controller);
        if (!shouldPull) {
          return;
        }
        if (controller._pulling) {
          controller._pullAgain = true;
          return;
        }
        controller._pulling = true;
        const pullPromise = controller._pullAlgorithm();
        uponPromise(pullPromise, () => {
          controller._pulling = false;
          if (controller._pullAgain) {
            controller._pullAgain = false;
            ReadableByteStreamControllerCallPullIfNeeded(controller);
          }
        }, (e2) => {
          ReadableByteStreamControllerError(controller, e2);
        });
      }
      function ReadableByteStreamControllerClearPendingPullIntos(controller) {
        ReadableByteStreamControllerInvalidateBYOBRequest(controller);
        controller._pendingPullIntos = new SimpleQueue();
      }
      function ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor) {
        let done = false;
        if (stream._state === "closed") {
          done = true;
        }
        const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
        if (pullIntoDescriptor.readerType === "default") {
          ReadableStreamFulfillReadRequest(stream, filledView, done);
        } else {
          ReadableStreamFulfillReadIntoRequest(stream, filledView, done);
        }
      }
      function ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor) {
        const bytesFilled = pullIntoDescriptor.bytesFilled;
        const elementSize = pullIntoDescriptor.elementSize;
        return new pullIntoDescriptor.viewConstructor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, bytesFilled / elementSize);
      }
      function ReadableByteStreamControllerEnqueueChunkToQueue(controller, buffer, byteOffset, byteLength) {
        controller._queue.push({ buffer, byteOffset, byteLength });
        controller._queueTotalSize += byteLength;
      }
      function ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor) {
        const elementSize = pullIntoDescriptor.elementSize;
        const currentAlignedBytes = pullIntoDescriptor.bytesFilled - pullIntoDescriptor.bytesFilled % elementSize;
        const maxBytesToCopy = Math.min(controller._queueTotalSize, pullIntoDescriptor.byteLength - pullIntoDescriptor.bytesFilled);
        const maxBytesFilled = pullIntoDescriptor.bytesFilled + maxBytesToCopy;
        const maxAlignedBytes = maxBytesFilled - maxBytesFilled % elementSize;
        let totalBytesToCopyRemaining = maxBytesToCopy;
        let ready = false;
        if (maxAlignedBytes > currentAlignedBytes) {
          totalBytesToCopyRemaining = maxAlignedBytes - pullIntoDescriptor.bytesFilled;
          ready = true;
        }
        const queue = controller._queue;
        while (totalBytesToCopyRemaining > 0) {
          const headOfQueue = queue.peek();
          const bytesToCopy = Math.min(totalBytesToCopyRemaining, headOfQueue.byteLength);
          const destStart = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
          CopyDataBlockBytes(pullIntoDescriptor.buffer, destStart, headOfQueue.buffer, headOfQueue.byteOffset, bytesToCopy);
          if (headOfQueue.byteLength === bytesToCopy) {
            queue.shift();
          } else {
            headOfQueue.byteOffset += bytesToCopy;
            headOfQueue.byteLength -= bytesToCopy;
          }
          controller._queueTotalSize -= bytesToCopy;
          ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesToCopy, pullIntoDescriptor);
          totalBytesToCopyRemaining -= bytesToCopy;
        }
        return ready;
      }
      function ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, size, pullIntoDescriptor) {
        pullIntoDescriptor.bytesFilled += size;
      }
      function ReadableByteStreamControllerHandleQueueDrain(controller) {
        if (controller._queueTotalSize === 0 && controller._closeRequested) {
          ReadableByteStreamControllerClearAlgorithms(controller);
          ReadableStreamClose(controller._controlledReadableByteStream);
        } else {
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
      }
      function ReadableByteStreamControllerInvalidateBYOBRequest(controller) {
        if (controller._byobRequest === null) {
          return;
        }
        controller._byobRequest._associatedReadableByteStreamController = void 0;
        controller._byobRequest._view = null;
        controller._byobRequest = null;
      }
      function ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller) {
        while (controller._pendingPullIntos.length > 0) {
          if (controller._queueTotalSize === 0) {
            return;
          }
          const pullIntoDescriptor = controller._pendingPullIntos.peek();
          if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
            ReadableByteStreamControllerShiftPendingPullInto(controller);
            ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
          }
        }
      }
      function ReadableByteStreamControllerPullInto(controller, view, readIntoRequest) {
        const stream = controller._controlledReadableByteStream;
        let elementSize = 1;
        if (view.constructor !== DataView) {
          elementSize = view.constructor.BYTES_PER_ELEMENT;
        }
        const ctor = view.constructor;
        const buffer = TransferArrayBuffer(view.buffer);
        const pullIntoDescriptor = {
          buffer,
          bufferByteLength: buffer.byteLength,
          byteOffset: view.byteOffset,
          byteLength: view.byteLength,
          bytesFilled: 0,
          elementSize,
          viewConstructor: ctor,
          readerType: "byob"
        };
        if (controller._pendingPullIntos.length > 0) {
          controller._pendingPullIntos.push(pullIntoDescriptor);
          ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
          return;
        }
        if (stream._state === "closed") {
          const emptyView = new ctor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, 0);
          readIntoRequest._closeSteps(emptyView);
          return;
        }
        if (controller._queueTotalSize > 0) {
          if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
            const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
            ReadableByteStreamControllerHandleQueueDrain(controller);
            readIntoRequest._chunkSteps(filledView);
            return;
          }
          if (controller._closeRequested) {
            const e2 = new TypeError("Insufficient bytes to fill elements in the given buffer");
            ReadableByteStreamControllerError(controller, e2);
            readIntoRequest._errorSteps(e2);
            return;
          }
        }
        controller._pendingPullIntos.push(pullIntoDescriptor);
        ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
        ReadableByteStreamControllerCallPullIfNeeded(controller);
      }
      function ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor) {
        const stream = controller._controlledReadableByteStream;
        if (ReadableStreamHasBYOBReader(stream)) {
          while (ReadableStreamGetNumReadIntoRequests(stream) > 0) {
            const pullIntoDescriptor = ReadableByteStreamControllerShiftPendingPullInto(controller);
            ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor);
          }
        }
      }
      function ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, pullIntoDescriptor) {
        ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesWritten, pullIntoDescriptor);
        if (pullIntoDescriptor.bytesFilled < pullIntoDescriptor.elementSize) {
          return;
        }
        ReadableByteStreamControllerShiftPendingPullInto(controller);
        const remainderSize = pullIntoDescriptor.bytesFilled % pullIntoDescriptor.elementSize;
        if (remainderSize > 0) {
          const end = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
          const remainder = ArrayBufferSlice(pullIntoDescriptor.buffer, end - remainderSize, end);
          ReadableByteStreamControllerEnqueueChunkToQueue(controller, remainder, 0, remainder.byteLength);
        }
        pullIntoDescriptor.bytesFilled -= remainderSize;
        ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
        ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
      }
      function ReadableByteStreamControllerRespondInternal(controller, bytesWritten) {
        const firstDescriptor = controller._pendingPullIntos.peek();
        ReadableByteStreamControllerInvalidateBYOBRequest(controller);
        const state = controller._controlledReadableByteStream._state;
        if (state === "closed") {
          ReadableByteStreamControllerRespondInClosedState(controller);
        } else {
          ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, firstDescriptor);
        }
        ReadableByteStreamControllerCallPullIfNeeded(controller);
      }
      function ReadableByteStreamControllerShiftPendingPullInto(controller) {
        const descriptor = controller._pendingPullIntos.shift();
        return descriptor;
      }
      function ReadableByteStreamControllerShouldCallPull(controller) {
        const stream = controller._controlledReadableByteStream;
        if (stream._state !== "readable") {
          return false;
        }
        if (controller._closeRequested) {
          return false;
        }
        if (!controller._started) {
          return false;
        }
        if (ReadableStreamHasDefaultReader(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
          return true;
        }
        if (ReadableStreamHasBYOBReader(stream) && ReadableStreamGetNumReadIntoRequests(stream) > 0) {
          return true;
        }
        const desiredSize = ReadableByteStreamControllerGetDesiredSize(controller);
        if (desiredSize > 0) {
          return true;
        }
        return false;
      }
      function ReadableByteStreamControllerClearAlgorithms(controller) {
        controller._pullAlgorithm = void 0;
        controller._cancelAlgorithm = void 0;
      }
      function ReadableByteStreamControllerClose(controller) {
        const stream = controller._controlledReadableByteStream;
        if (controller._closeRequested || stream._state !== "readable") {
          return;
        }
        if (controller._queueTotalSize > 0) {
          controller._closeRequested = true;
          return;
        }
        if (controller._pendingPullIntos.length > 0) {
          const firstPendingPullInto = controller._pendingPullIntos.peek();
          if (firstPendingPullInto.bytesFilled > 0) {
            const e2 = new TypeError("Insufficient bytes to fill elements in the given buffer");
            ReadableByteStreamControllerError(controller, e2);
            throw e2;
          }
        }
        ReadableByteStreamControllerClearAlgorithms(controller);
        ReadableStreamClose(stream);
      }
      function ReadableByteStreamControllerEnqueue(controller, chunk) {
        const stream = controller._controlledReadableByteStream;
        if (controller._closeRequested || stream._state !== "readable") {
          return;
        }
        const buffer = chunk.buffer;
        const byteOffset = chunk.byteOffset;
        const byteLength = chunk.byteLength;
        const transferredBuffer = TransferArrayBuffer(buffer);
        if (controller._pendingPullIntos.length > 0) {
          const firstPendingPullInto = controller._pendingPullIntos.peek();
          if (IsDetachedBuffer(firstPendingPullInto.buffer))
            ;
          firstPendingPullInto.buffer = TransferArrayBuffer(firstPendingPullInto.buffer);
        }
        ReadableByteStreamControllerInvalidateBYOBRequest(controller);
        if (ReadableStreamHasDefaultReader(stream)) {
          if (ReadableStreamGetNumReadRequests(stream) === 0) {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
          } else {
            if (controller._pendingPullIntos.length > 0) {
              ReadableByteStreamControllerShiftPendingPullInto(controller);
            }
            const transferredView = new Uint8Array(transferredBuffer, byteOffset, byteLength);
            ReadableStreamFulfillReadRequest(stream, transferredView, false);
          }
        } else if (ReadableStreamHasBYOBReader(stream)) {
          ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
          ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
        } else {
          ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
        }
        ReadableByteStreamControllerCallPullIfNeeded(controller);
      }
      function ReadableByteStreamControllerError(controller, e2) {
        const stream = controller._controlledReadableByteStream;
        if (stream._state !== "readable") {
          return;
        }
        ReadableByteStreamControllerClearPendingPullIntos(controller);
        ResetQueue(controller);
        ReadableByteStreamControllerClearAlgorithms(controller);
        ReadableStreamError(stream, e2);
      }
      function ReadableByteStreamControllerGetBYOBRequest(controller) {
        if (controller._byobRequest === null && controller._pendingPullIntos.length > 0) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          const view = new Uint8Array(firstDescriptor.buffer, firstDescriptor.byteOffset + firstDescriptor.bytesFilled, firstDescriptor.byteLength - firstDescriptor.bytesFilled);
          const byobRequest = Object.create(ReadableStreamBYOBRequest.prototype);
          SetUpReadableStreamBYOBRequest(byobRequest, controller, view);
          controller._byobRequest = byobRequest;
        }
        return controller._byobRequest;
      }
      function ReadableByteStreamControllerGetDesiredSize(controller) {
        const state = controller._controlledReadableByteStream._state;
        if (state === "errored") {
          return null;
        }
        if (state === "closed") {
          return 0;
        }
        return controller._strategyHWM - controller._queueTotalSize;
      }
      function ReadableByteStreamControllerRespond(controller, bytesWritten) {
        const firstDescriptor = controller._pendingPullIntos.peek();
        const state = controller._controlledReadableByteStream._state;
        if (state === "closed") {
          if (bytesWritten !== 0) {
            throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
          }
        } else {
          if (bytesWritten === 0) {
            throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
          }
          if (firstDescriptor.bytesFilled + bytesWritten > firstDescriptor.byteLength) {
            throw new RangeError("bytesWritten out of range");
          }
        }
        firstDescriptor.buffer = TransferArrayBuffer(firstDescriptor.buffer);
        ReadableByteStreamControllerRespondInternal(controller, bytesWritten);
      }
      function ReadableByteStreamControllerRespondWithNewView(controller, view) {
        const firstDescriptor = controller._pendingPullIntos.peek();
        const state = controller._controlledReadableByteStream._state;
        if (state === "closed") {
          if (view.byteLength !== 0) {
            throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
          }
        } else {
          if (view.byteLength === 0) {
            throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
          }
        }
        if (firstDescriptor.byteOffset + firstDescriptor.bytesFilled !== view.byteOffset) {
          throw new RangeError("The region specified by view does not match byobRequest");
        }
        if (firstDescriptor.bufferByteLength !== view.buffer.byteLength) {
          throw new RangeError("The buffer of view has different capacity than byobRequest");
        }
        if (firstDescriptor.bytesFilled + view.byteLength > firstDescriptor.byteLength) {
          throw new RangeError("The region specified by view is larger than byobRequest");
        }
        const viewByteLength = view.byteLength;
        firstDescriptor.buffer = TransferArrayBuffer(view.buffer);
        ReadableByteStreamControllerRespondInternal(controller, viewByteLength);
      }
      function SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize) {
        controller._controlledReadableByteStream = stream;
        controller._pullAgain = false;
        controller._pulling = false;
        controller._byobRequest = null;
        controller._queue = controller._queueTotalSize = void 0;
        ResetQueue(controller);
        controller._closeRequested = false;
        controller._started = false;
        controller._strategyHWM = highWaterMark;
        controller._pullAlgorithm = pullAlgorithm;
        controller._cancelAlgorithm = cancelAlgorithm;
        controller._autoAllocateChunkSize = autoAllocateChunkSize;
        controller._pendingPullIntos = new SimpleQueue();
        stream._readableStreamController = controller;
        const startResult = startAlgorithm();
        uponPromise(promiseResolvedWith(startResult), () => {
          controller._started = true;
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }, (r2) => {
          ReadableByteStreamControllerError(controller, r2);
        });
      }
      function SetUpReadableByteStreamControllerFromUnderlyingSource(stream, underlyingByteSource, highWaterMark) {
        const controller = Object.create(ReadableByteStreamController.prototype);
        let startAlgorithm = () => void 0;
        let pullAlgorithm = () => promiseResolvedWith(void 0);
        let cancelAlgorithm = () => promiseResolvedWith(void 0);
        if (underlyingByteSource.start !== void 0) {
          startAlgorithm = () => underlyingByteSource.start(controller);
        }
        if (underlyingByteSource.pull !== void 0) {
          pullAlgorithm = () => underlyingByteSource.pull(controller);
        }
        if (underlyingByteSource.cancel !== void 0) {
          cancelAlgorithm = (reason) => underlyingByteSource.cancel(reason);
        }
        const autoAllocateChunkSize = underlyingByteSource.autoAllocateChunkSize;
        if (autoAllocateChunkSize === 0) {
          throw new TypeError("autoAllocateChunkSize must be greater than 0");
        }
        SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize);
      }
      function SetUpReadableStreamBYOBRequest(request, controller, view) {
        request._associatedReadableByteStreamController = controller;
        request._view = view;
      }
      function byobRequestBrandCheckException(name) {
        return new TypeError(`ReadableStreamBYOBRequest.prototype.${name} can only be used on a ReadableStreamBYOBRequest`);
      }
      function byteStreamControllerBrandCheckException(name) {
        return new TypeError(`ReadableByteStreamController.prototype.${name} can only be used on a ReadableByteStreamController`);
      }
      function AcquireReadableStreamBYOBReader(stream) {
        return new ReadableStreamBYOBReader(stream);
      }
      function ReadableStreamAddReadIntoRequest(stream, readIntoRequest) {
        stream._reader._readIntoRequests.push(readIntoRequest);
      }
      function ReadableStreamFulfillReadIntoRequest(stream, chunk, done) {
        const reader = stream._reader;
        const readIntoRequest = reader._readIntoRequests.shift();
        if (done) {
          readIntoRequest._closeSteps(chunk);
        } else {
          readIntoRequest._chunkSteps(chunk);
        }
      }
      function ReadableStreamGetNumReadIntoRequests(stream) {
        return stream._reader._readIntoRequests.length;
      }
      function ReadableStreamHasBYOBReader(stream) {
        const reader = stream._reader;
        if (reader === void 0) {
          return false;
        }
        if (!IsReadableStreamBYOBReader(reader)) {
          return false;
        }
        return true;
      }
      class ReadableStreamBYOBReader {
        constructor(stream) {
          assertRequiredArgument(stream, 1, "ReadableStreamBYOBReader");
          assertReadableStream(stream, "First parameter");
          if (IsReadableStreamLocked(stream)) {
            throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          }
          if (!IsReadableByteStreamController(stream._readableStreamController)) {
            throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
          }
          ReadableStreamReaderGenericInitialize(this, stream);
          this._readIntoRequests = new SimpleQueue();
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed, or rejected if the stream ever errors or
         * the reader's lock is released before the stream finishes closing.
         */
        get closed() {
          if (!IsReadableStreamBYOBReader(this)) {
            return promiseRejectedWith(byobReaderBrandCheckException("closed"));
          }
          return this._closedPromise;
        }
        /**
         * If the reader is active, behaves the same as {@link ReadableStream.cancel | stream.cancel(reason)}.
         */
        cancel(reason = void 0) {
          if (!IsReadableStreamBYOBReader(this)) {
            return promiseRejectedWith(byobReaderBrandCheckException("cancel"));
          }
          if (this._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("cancel"));
          }
          return ReadableStreamReaderGenericCancel(this, reason);
        }
        /**
         * Attempts to reads bytes into view, and returns a promise resolved with the result.
         *
         * If reading a chunk causes the queue to become empty, more data will be pulled from the underlying source.
         */
        read(view) {
          if (!IsReadableStreamBYOBReader(this)) {
            return promiseRejectedWith(byobReaderBrandCheckException("read"));
          }
          if (!ArrayBuffer.isView(view)) {
            return promiseRejectedWith(new TypeError("view must be an array buffer view"));
          }
          if (view.byteLength === 0) {
            return promiseRejectedWith(new TypeError("view must have non-zero byteLength"));
          }
          if (view.buffer.byteLength === 0) {
            return promiseRejectedWith(new TypeError(`view's buffer must have non-zero byteLength`));
          }
          if (IsDetachedBuffer(view.buffer))
            ;
          if (this._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("read from"));
          }
          let resolvePromise;
          let rejectPromise;
          const promise = newPromise((resolve, reject) => {
            resolvePromise = resolve;
            rejectPromise = reject;
          });
          const readIntoRequest = {
            _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
            _closeSteps: (chunk) => resolvePromise({ value: chunk, done: true }),
            _errorSteps: (e2) => rejectPromise(e2)
          };
          ReadableStreamBYOBReaderRead(this, view, readIntoRequest);
          return promise;
        }
        /**
         * Releases the reader's lock on the corresponding stream. After the lock is released, the reader is no longer active.
         * If the associated stream is errored when the lock is released, the reader will appear errored in the same way
         * from now on; otherwise, the reader will appear closed.
         *
         * A reader's lock cannot be released while it still has a pending read request, i.e., if a promise returned by
         * the reader's {@link ReadableStreamBYOBReader.read | read()} method has not yet been settled. Attempting to
         * do so will throw a `TypeError` and leave the reader locked to the stream.
         */
        releaseLock() {
          if (!IsReadableStreamBYOBReader(this)) {
            throw byobReaderBrandCheckException("releaseLock");
          }
          if (this._ownerReadableStream === void 0) {
            return;
          }
          if (this._readIntoRequests.length > 0) {
            throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
          }
          ReadableStreamReaderGenericRelease(this);
        }
      }
      Object.defineProperties(ReadableStreamBYOBReader.prototype, {
        cancel: { enumerable: true },
        read: { enumerable: true },
        releaseLock: { enumerable: true },
        closed: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(ReadableStreamBYOBReader.prototype, SymbolPolyfill.toStringTag, {
          value: "ReadableStreamBYOBReader",
          configurable: true
        });
      }
      function IsReadableStreamBYOBReader(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_readIntoRequests")) {
          return false;
        }
        return x2 instanceof ReadableStreamBYOBReader;
      }
      function ReadableStreamBYOBReaderRead(reader, view, readIntoRequest) {
        const stream = reader._ownerReadableStream;
        stream._disturbed = true;
        if (stream._state === "errored") {
          readIntoRequest._errorSteps(stream._storedError);
        } else {
          ReadableByteStreamControllerPullInto(stream._readableStreamController, view, readIntoRequest);
        }
      }
      function byobReaderBrandCheckException(name) {
        return new TypeError(`ReadableStreamBYOBReader.prototype.${name} can only be used on a ReadableStreamBYOBReader`);
      }
      function ExtractHighWaterMark(strategy, defaultHWM) {
        const { highWaterMark } = strategy;
        if (highWaterMark === void 0) {
          return defaultHWM;
        }
        if (NumberIsNaN(highWaterMark) || highWaterMark < 0) {
          throw new RangeError("Invalid highWaterMark");
        }
        return highWaterMark;
      }
      function ExtractSizeAlgorithm(strategy) {
        const { size } = strategy;
        if (!size) {
          return () => 1;
        }
        return size;
      }
      function convertQueuingStrategy(init, context) {
        assertDictionary(init, context);
        const highWaterMark = init === null || init === void 0 ? void 0 : init.highWaterMark;
        const size = init === null || init === void 0 ? void 0 : init.size;
        return {
          highWaterMark: highWaterMark === void 0 ? void 0 : convertUnrestrictedDouble(highWaterMark),
          size: size === void 0 ? void 0 : convertQueuingStrategySize(size, `${context} has member 'size' that`)
        };
      }
      function convertQueuingStrategySize(fn, context) {
        assertFunction(fn, context);
        return (chunk) => convertUnrestrictedDouble(fn(chunk));
      }
      function convertUnderlyingSink(original, context) {
        assertDictionary(original, context);
        const abort = original === null || original === void 0 ? void 0 : original.abort;
        const close = original === null || original === void 0 ? void 0 : original.close;
        const start = original === null || original === void 0 ? void 0 : original.start;
        const type = original === null || original === void 0 ? void 0 : original.type;
        const write = original === null || original === void 0 ? void 0 : original.write;
        return {
          abort: abort === void 0 ? void 0 : convertUnderlyingSinkAbortCallback(abort, original, `${context} has member 'abort' that`),
          close: close === void 0 ? void 0 : convertUnderlyingSinkCloseCallback(close, original, `${context} has member 'close' that`),
          start: start === void 0 ? void 0 : convertUnderlyingSinkStartCallback(start, original, `${context} has member 'start' that`),
          write: write === void 0 ? void 0 : convertUnderlyingSinkWriteCallback(write, original, `${context} has member 'write' that`),
          type
        };
      }
      function convertUnderlyingSinkAbortCallback(fn, original, context) {
        assertFunction(fn, context);
        return (reason) => promiseCall(fn, original, [reason]);
      }
      function convertUnderlyingSinkCloseCallback(fn, original, context) {
        assertFunction(fn, context);
        return () => promiseCall(fn, original, []);
      }
      function convertUnderlyingSinkStartCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => reflectCall(fn, original, [controller]);
      }
      function convertUnderlyingSinkWriteCallback(fn, original, context) {
        assertFunction(fn, context);
        return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
      }
      function assertWritableStream(x2, context) {
        if (!IsWritableStream(x2)) {
          throw new TypeError(`${context} is not a WritableStream.`);
        }
      }
      function isAbortSignal2(value) {
        if (typeof value !== "object" || value === null) {
          return false;
        }
        try {
          return typeof value.aborted === "boolean";
        } catch (_a2) {
          return false;
        }
      }
      const supportsAbortController = typeof AbortController === "function";
      function createAbortController() {
        if (supportsAbortController) {
          return new AbortController();
        }
        return void 0;
      }
      class WritableStream {
        constructor(rawUnderlyingSink = {}, rawStrategy = {}) {
          if (rawUnderlyingSink === void 0) {
            rawUnderlyingSink = null;
          } else {
            assertObject(rawUnderlyingSink, "First parameter");
          }
          const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
          const underlyingSink = convertUnderlyingSink(rawUnderlyingSink, "First parameter");
          InitializeWritableStream(this);
          const type = underlyingSink.type;
          if (type !== void 0) {
            throw new RangeError("Invalid type is specified");
          }
          const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
          const highWaterMark = ExtractHighWaterMark(strategy, 1);
          SetUpWritableStreamDefaultControllerFromUnderlyingSink(this, underlyingSink, highWaterMark, sizeAlgorithm);
        }
        /**
         * Returns whether or not the writable stream is locked to a writer.
         */
        get locked() {
          if (!IsWritableStream(this)) {
            throw streamBrandCheckException$2("locked");
          }
          return IsWritableStreamLocked(this);
        }
        /**
         * Aborts the stream, signaling that the producer can no longer successfully write to the stream and it is to be
         * immediately moved to an errored state, with any queued-up writes discarded. This will also execute any abort
         * mechanism of the underlying sink.
         *
         * The returned promise will fulfill if the stream shuts down successfully, or reject if the underlying sink signaled
         * that there was an error doing so. Additionally, it will reject with a `TypeError` (without attempting to cancel
         * the stream) if the stream is currently locked.
         */
        abort(reason = void 0) {
          if (!IsWritableStream(this)) {
            return promiseRejectedWith(streamBrandCheckException$2("abort"));
          }
          if (IsWritableStreamLocked(this)) {
            return promiseRejectedWith(new TypeError("Cannot abort a stream that already has a writer"));
          }
          return WritableStreamAbort(this, reason);
        }
        /**
         * Closes the stream. The underlying sink will finish processing any previously-written chunks, before invoking its
         * close behavior. During this time any further attempts to write will fail (without erroring the stream).
         *
         * The method returns a promise that will fulfill if all remaining chunks are successfully written and the stream
         * successfully closes, or rejects if an error is encountered during this process. Additionally, it will reject with
         * a `TypeError` (without attempting to cancel the stream) if the stream is currently locked.
         */
        close() {
          if (!IsWritableStream(this)) {
            return promiseRejectedWith(streamBrandCheckException$2("close"));
          }
          if (IsWritableStreamLocked(this)) {
            return promiseRejectedWith(new TypeError("Cannot close a stream that already has a writer"));
          }
          if (WritableStreamCloseQueuedOrInFlight(this)) {
            return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
          }
          return WritableStreamClose(this);
        }
        /**
         * Creates a {@link WritableStreamDefaultWriter | writer} and locks the stream to the new writer. While the stream
         * is locked, no other writer can be acquired until this one is released.
         *
         * This functionality is especially useful for creating abstractions that desire the ability to write to a stream
         * without interruption or interleaving. By getting a writer for the stream, you can ensure nobody else can write at
         * the same time, which would cause the resulting written data to be unpredictable and probably useless.
         */
        getWriter() {
          if (!IsWritableStream(this)) {
            throw streamBrandCheckException$2("getWriter");
          }
          return AcquireWritableStreamDefaultWriter(this);
        }
      }
      Object.defineProperties(WritableStream.prototype, {
        abort: { enumerable: true },
        close: { enumerable: true },
        getWriter: { enumerable: true },
        locked: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(WritableStream.prototype, SymbolPolyfill.toStringTag, {
          value: "WritableStream",
          configurable: true
        });
      }
      function AcquireWritableStreamDefaultWriter(stream) {
        return new WritableStreamDefaultWriter(stream);
      }
      function CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
        const stream = Object.create(WritableStream.prototype);
        InitializeWritableStream(stream);
        const controller = Object.create(WritableStreamDefaultController.prototype);
        SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
        return stream;
      }
      function InitializeWritableStream(stream) {
        stream._state = "writable";
        stream._storedError = void 0;
        stream._writer = void 0;
        stream._writableStreamController = void 0;
        stream._writeRequests = new SimpleQueue();
        stream._inFlightWriteRequest = void 0;
        stream._closeRequest = void 0;
        stream._inFlightCloseRequest = void 0;
        stream._pendingAbortRequest = void 0;
        stream._backpressure = false;
      }
      function IsWritableStream(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_writableStreamController")) {
          return false;
        }
        return x2 instanceof WritableStream;
      }
      function IsWritableStreamLocked(stream) {
        if (stream._writer === void 0) {
          return false;
        }
        return true;
      }
      function WritableStreamAbort(stream, reason) {
        var _a2;
        if (stream._state === "closed" || stream._state === "errored") {
          return promiseResolvedWith(void 0);
        }
        stream._writableStreamController._abortReason = reason;
        (_a2 = stream._writableStreamController._abortController) === null || _a2 === void 0 ? void 0 : _a2.abort();
        const state = stream._state;
        if (state === "closed" || state === "errored") {
          return promiseResolvedWith(void 0);
        }
        if (stream._pendingAbortRequest !== void 0) {
          return stream._pendingAbortRequest._promise;
        }
        let wasAlreadyErroring = false;
        if (state === "erroring") {
          wasAlreadyErroring = true;
          reason = void 0;
        }
        const promise = newPromise((resolve, reject) => {
          stream._pendingAbortRequest = {
            _promise: void 0,
            _resolve: resolve,
            _reject: reject,
            _reason: reason,
            _wasAlreadyErroring: wasAlreadyErroring
          };
        });
        stream._pendingAbortRequest._promise = promise;
        if (!wasAlreadyErroring) {
          WritableStreamStartErroring(stream, reason);
        }
        return promise;
      }
      function WritableStreamClose(stream) {
        const state = stream._state;
        if (state === "closed" || state === "errored") {
          return promiseRejectedWith(new TypeError(`The stream (in ${state} state) is not in the writable state and cannot be closed`));
        }
        const promise = newPromise((resolve, reject) => {
          const closeRequest = {
            _resolve: resolve,
            _reject: reject
          };
          stream._closeRequest = closeRequest;
        });
        const writer = stream._writer;
        if (writer !== void 0 && stream._backpressure && state === "writable") {
          defaultWriterReadyPromiseResolve(writer);
        }
        WritableStreamDefaultControllerClose(stream._writableStreamController);
        return promise;
      }
      function WritableStreamAddWriteRequest(stream) {
        const promise = newPromise((resolve, reject) => {
          const writeRequest = {
            _resolve: resolve,
            _reject: reject
          };
          stream._writeRequests.push(writeRequest);
        });
        return promise;
      }
      function WritableStreamDealWithRejection(stream, error) {
        const state = stream._state;
        if (state === "writable") {
          WritableStreamStartErroring(stream, error);
          return;
        }
        WritableStreamFinishErroring(stream);
      }
      function WritableStreamStartErroring(stream, reason) {
        const controller = stream._writableStreamController;
        stream._state = "erroring";
        stream._storedError = reason;
        const writer = stream._writer;
        if (writer !== void 0) {
          WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, reason);
        }
        if (!WritableStreamHasOperationMarkedInFlight(stream) && controller._started) {
          WritableStreamFinishErroring(stream);
        }
      }
      function WritableStreamFinishErroring(stream) {
        stream._state = "errored";
        stream._writableStreamController[ErrorSteps]();
        const storedError = stream._storedError;
        stream._writeRequests.forEach((writeRequest) => {
          writeRequest._reject(storedError);
        });
        stream._writeRequests = new SimpleQueue();
        if (stream._pendingAbortRequest === void 0) {
          WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          return;
        }
        const abortRequest = stream._pendingAbortRequest;
        stream._pendingAbortRequest = void 0;
        if (abortRequest._wasAlreadyErroring) {
          abortRequest._reject(storedError);
          WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          return;
        }
        const promise = stream._writableStreamController[AbortSteps](abortRequest._reason);
        uponPromise(promise, () => {
          abortRequest._resolve();
          WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
        }, (reason) => {
          abortRequest._reject(reason);
          WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
        });
      }
      function WritableStreamFinishInFlightWrite(stream) {
        stream._inFlightWriteRequest._resolve(void 0);
        stream._inFlightWriteRequest = void 0;
      }
      function WritableStreamFinishInFlightWriteWithError(stream, error) {
        stream._inFlightWriteRequest._reject(error);
        stream._inFlightWriteRequest = void 0;
        WritableStreamDealWithRejection(stream, error);
      }
      function WritableStreamFinishInFlightClose(stream) {
        stream._inFlightCloseRequest._resolve(void 0);
        stream._inFlightCloseRequest = void 0;
        const state = stream._state;
        if (state === "erroring") {
          stream._storedError = void 0;
          if (stream._pendingAbortRequest !== void 0) {
            stream._pendingAbortRequest._resolve();
            stream._pendingAbortRequest = void 0;
          }
        }
        stream._state = "closed";
        const writer = stream._writer;
        if (writer !== void 0) {
          defaultWriterClosedPromiseResolve(writer);
        }
      }
      function WritableStreamFinishInFlightCloseWithError(stream, error) {
        stream._inFlightCloseRequest._reject(error);
        stream._inFlightCloseRequest = void 0;
        if (stream._pendingAbortRequest !== void 0) {
          stream._pendingAbortRequest._reject(error);
          stream._pendingAbortRequest = void 0;
        }
        WritableStreamDealWithRejection(stream, error);
      }
      function WritableStreamCloseQueuedOrInFlight(stream) {
        if (stream._closeRequest === void 0 && stream._inFlightCloseRequest === void 0) {
          return false;
        }
        return true;
      }
      function WritableStreamHasOperationMarkedInFlight(stream) {
        if (stream._inFlightWriteRequest === void 0 && stream._inFlightCloseRequest === void 0) {
          return false;
        }
        return true;
      }
      function WritableStreamMarkCloseRequestInFlight(stream) {
        stream._inFlightCloseRequest = stream._closeRequest;
        stream._closeRequest = void 0;
      }
      function WritableStreamMarkFirstWriteRequestInFlight(stream) {
        stream._inFlightWriteRequest = stream._writeRequests.shift();
      }
      function WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream) {
        if (stream._closeRequest !== void 0) {
          stream._closeRequest._reject(stream._storedError);
          stream._closeRequest = void 0;
        }
        const writer = stream._writer;
        if (writer !== void 0) {
          defaultWriterClosedPromiseReject(writer, stream._storedError);
        }
      }
      function WritableStreamUpdateBackpressure(stream, backpressure) {
        const writer = stream._writer;
        if (writer !== void 0 && backpressure !== stream._backpressure) {
          if (backpressure) {
            defaultWriterReadyPromiseReset(writer);
          } else {
            defaultWriterReadyPromiseResolve(writer);
          }
        }
        stream._backpressure = backpressure;
      }
      class WritableStreamDefaultWriter {
        constructor(stream) {
          assertRequiredArgument(stream, 1, "WritableStreamDefaultWriter");
          assertWritableStream(stream, "First parameter");
          if (IsWritableStreamLocked(stream)) {
            throw new TypeError("This stream has already been locked for exclusive writing by another writer");
          }
          this._ownerWritableStream = stream;
          stream._writer = this;
          const state = stream._state;
          if (state === "writable") {
            if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._backpressure) {
              defaultWriterReadyPromiseInitialize(this);
            } else {
              defaultWriterReadyPromiseInitializeAsResolved(this);
            }
            defaultWriterClosedPromiseInitialize(this);
          } else if (state === "erroring") {
            defaultWriterReadyPromiseInitializeAsRejected(this, stream._storedError);
            defaultWriterClosedPromiseInitialize(this);
          } else if (state === "closed") {
            defaultWriterReadyPromiseInitializeAsResolved(this);
            defaultWriterClosedPromiseInitializeAsResolved(this);
          } else {
            const storedError = stream._storedError;
            defaultWriterReadyPromiseInitializeAsRejected(this, storedError);
            defaultWriterClosedPromiseInitializeAsRejected(this, storedError);
          }
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed, or rejected if the stream ever errors or
         * the writer’s lock is released before the stream finishes closing.
         */
        get closed() {
          if (!IsWritableStreamDefaultWriter(this)) {
            return promiseRejectedWith(defaultWriterBrandCheckException("closed"));
          }
          return this._closedPromise;
        }
        /**
         * Returns the desired size to fill the stream’s internal queue. It can be negative, if the queue is over-full.
         * A producer can use this information to determine the right amount of data to write.
         *
         * It will be `null` if the stream cannot be successfully written to (due to either being errored, or having an abort
         * queued up). It will return zero if the stream is closed. And the getter will throw an exception if invoked when
         * the writer’s lock is released.
         */
        get desiredSize() {
          if (!IsWritableStreamDefaultWriter(this)) {
            throw defaultWriterBrandCheckException("desiredSize");
          }
          if (this._ownerWritableStream === void 0) {
            throw defaultWriterLockException("desiredSize");
          }
          return WritableStreamDefaultWriterGetDesiredSize(this);
        }
        /**
         * Returns a promise that will be fulfilled when the desired size to fill the stream’s internal queue transitions
         * from non-positive to positive, signaling that it is no longer applying backpressure. Once the desired size dips
         * back to zero or below, the getter will return a new promise that stays pending until the next transition.
         *
         * If the stream becomes errored or aborted, or the writer’s lock is released, the returned promise will become
         * rejected.
         */
        get ready() {
          if (!IsWritableStreamDefaultWriter(this)) {
            return promiseRejectedWith(defaultWriterBrandCheckException("ready"));
          }
          return this._readyPromise;
        }
        /**
         * If the reader is active, behaves the same as {@link WritableStream.abort | stream.abort(reason)}.
         */
        abort(reason = void 0) {
          if (!IsWritableStreamDefaultWriter(this)) {
            return promiseRejectedWith(defaultWriterBrandCheckException("abort"));
          }
          if (this._ownerWritableStream === void 0) {
            return promiseRejectedWith(defaultWriterLockException("abort"));
          }
          return WritableStreamDefaultWriterAbort(this, reason);
        }
        /**
         * If the reader is active, behaves the same as {@link WritableStream.close | stream.close()}.
         */
        close() {
          if (!IsWritableStreamDefaultWriter(this)) {
            return promiseRejectedWith(defaultWriterBrandCheckException("close"));
          }
          const stream = this._ownerWritableStream;
          if (stream === void 0) {
            return promiseRejectedWith(defaultWriterLockException("close"));
          }
          if (WritableStreamCloseQueuedOrInFlight(stream)) {
            return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
          }
          return WritableStreamDefaultWriterClose(this);
        }
        /**
         * Releases the writer’s lock on the corresponding stream. After the lock is released, the writer is no longer active.
         * If the associated stream is errored when the lock is released, the writer will appear errored in the same way from
         * now on; otherwise, the writer will appear closed.
         *
         * Note that the lock can still be released even if some ongoing writes have not yet finished (i.e. even if the
         * promises returned from previous calls to {@link WritableStreamDefaultWriter.write | write()} have not yet settled).
         * It’s not necessary to hold the lock on the writer for the duration of the write; the lock instead simply prevents
         * other producers from writing in an interleaved manner.
         */
        releaseLock() {
          if (!IsWritableStreamDefaultWriter(this)) {
            throw defaultWriterBrandCheckException("releaseLock");
          }
          const stream = this._ownerWritableStream;
          if (stream === void 0) {
            return;
          }
          WritableStreamDefaultWriterRelease(this);
        }
        write(chunk = void 0) {
          if (!IsWritableStreamDefaultWriter(this)) {
            return promiseRejectedWith(defaultWriterBrandCheckException("write"));
          }
          if (this._ownerWritableStream === void 0) {
            return promiseRejectedWith(defaultWriterLockException("write to"));
          }
          return WritableStreamDefaultWriterWrite(this, chunk);
        }
      }
      Object.defineProperties(WritableStreamDefaultWriter.prototype, {
        abort: { enumerable: true },
        close: { enumerable: true },
        releaseLock: { enumerable: true },
        write: { enumerable: true },
        closed: { enumerable: true },
        desiredSize: { enumerable: true },
        ready: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(WritableStreamDefaultWriter.prototype, SymbolPolyfill.toStringTag, {
          value: "WritableStreamDefaultWriter",
          configurable: true
        });
      }
      function IsWritableStreamDefaultWriter(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_ownerWritableStream")) {
          return false;
        }
        return x2 instanceof WritableStreamDefaultWriter;
      }
      function WritableStreamDefaultWriterAbort(writer, reason) {
        const stream = writer._ownerWritableStream;
        return WritableStreamAbort(stream, reason);
      }
      function WritableStreamDefaultWriterClose(writer) {
        const stream = writer._ownerWritableStream;
        return WritableStreamClose(stream);
      }
      function WritableStreamDefaultWriterCloseWithErrorPropagation(writer) {
        const stream = writer._ownerWritableStream;
        const state = stream._state;
        if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
          return promiseResolvedWith(void 0);
        }
        if (state === "errored") {
          return promiseRejectedWith(stream._storedError);
        }
        return WritableStreamDefaultWriterClose(writer);
      }
      function WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, error) {
        if (writer._closedPromiseState === "pending") {
          defaultWriterClosedPromiseReject(writer, error);
        } else {
          defaultWriterClosedPromiseResetToRejected(writer, error);
        }
      }
      function WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, error) {
        if (writer._readyPromiseState === "pending") {
          defaultWriterReadyPromiseReject(writer, error);
        } else {
          defaultWriterReadyPromiseResetToRejected(writer, error);
        }
      }
      function WritableStreamDefaultWriterGetDesiredSize(writer) {
        const stream = writer._ownerWritableStream;
        const state = stream._state;
        if (state === "errored" || state === "erroring") {
          return null;
        }
        if (state === "closed") {
          return 0;
        }
        return WritableStreamDefaultControllerGetDesiredSize(stream._writableStreamController);
      }
      function WritableStreamDefaultWriterRelease(writer) {
        const stream = writer._ownerWritableStream;
        const releasedError = new TypeError(`Writer was released and can no longer be used to monitor the stream's closedness`);
        WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, releasedError);
        WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, releasedError);
        stream._writer = void 0;
        writer._ownerWritableStream = void 0;
      }
      function WritableStreamDefaultWriterWrite(writer, chunk) {
        const stream = writer._ownerWritableStream;
        const controller = stream._writableStreamController;
        const chunkSize = WritableStreamDefaultControllerGetChunkSize(controller, chunk);
        if (stream !== writer._ownerWritableStream) {
          return promiseRejectedWith(defaultWriterLockException("write to"));
        }
        const state = stream._state;
        if (state === "errored") {
          return promiseRejectedWith(stream._storedError);
        }
        if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
          return promiseRejectedWith(new TypeError("The stream is closing or closed and cannot be written to"));
        }
        if (state === "erroring") {
          return promiseRejectedWith(stream._storedError);
        }
        const promise = WritableStreamAddWriteRequest(stream);
        WritableStreamDefaultControllerWrite(controller, chunk, chunkSize);
        return promise;
      }
      const closeSentinel = {};
      class WritableStreamDefaultController {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * The reason which was passed to `WritableStream.abort(reason)` when the stream was aborted.
         *
         * @deprecated
         *  This property has been removed from the specification, see https://github.com/whatwg/streams/pull/1177.
         *  Use {@link WritableStreamDefaultController.signal}'s `reason` instead.
         */
        get abortReason() {
          if (!IsWritableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$2("abortReason");
          }
          return this._abortReason;
        }
        /**
         * An `AbortSignal` that can be used to abort the pending write or close operation when the stream is aborted.
         */
        get signal() {
          if (!IsWritableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$2("signal");
          }
          if (this._abortController === void 0) {
            throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
          }
          return this._abortController.signal;
        }
        /**
         * Closes the controlled writable stream, making all future interactions with it fail with the given error `e`.
         *
         * This method is rarely used, since usually it suffices to return a rejected promise from one of the underlying
         * sink's methods. However, it can be useful for suddenly shutting down a stream in response to an event outside the
         * normal lifecycle of interactions with the underlying sink.
         */
        error(e2 = void 0) {
          if (!IsWritableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$2("error");
          }
          const state = this._controlledWritableStream._state;
          if (state !== "writable") {
            return;
          }
          WritableStreamDefaultControllerError(this, e2);
        }
        /** @internal */
        [AbortSteps](reason) {
          const result = this._abortAlgorithm(reason);
          WritableStreamDefaultControllerClearAlgorithms(this);
          return result;
        }
        /** @internal */
        [ErrorSteps]() {
          ResetQueue(this);
        }
      }
      Object.defineProperties(WritableStreamDefaultController.prototype, {
        abortReason: { enumerable: true },
        signal: { enumerable: true },
        error: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(WritableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
          value: "WritableStreamDefaultController",
          configurable: true
        });
      }
      function IsWritableStreamDefaultController(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_controlledWritableStream")) {
          return false;
        }
        return x2 instanceof WritableStreamDefaultController;
      }
      function SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm) {
        controller._controlledWritableStream = stream;
        stream._writableStreamController = controller;
        controller._queue = void 0;
        controller._queueTotalSize = void 0;
        ResetQueue(controller);
        controller._abortReason = void 0;
        controller._abortController = createAbortController();
        controller._started = false;
        controller._strategySizeAlgorithm = sizeAlgorithm;
        controller._strategyHWM = highWaterMark;
        controller._writeAlgorithm = writeAlgorithm;
        controller._closeAlgorithm = closeAlgorithm;
        controller._abortAlgorithm = abortAlgorithm;
        const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
        WritableStreamUpdateBackpressure(stream, backpressure);
        const startResult = startAlgorithm();
        const startPromise = promiseResolvedWith(startResult);
        uponPromise(startPromise, () => {
          controller._started = true;
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }, (r2) => {
          controller._started = true;
          WritableStreamDealWithRejection(stream, r2);
        });
      }
      function SetUpWritableStreamDefaultControllerFromUnderlyingSink(stream, underlyingSink, highWaterMark, sizeAlgorithm) {
        const controller = Object.create(WritableStreamDefaultController.prototype);
        let startAlgorithm = () => void 0;
        let writeAlgorithm = () => promiseResolvedWith(void 0);
        let closeAlgorithm = () => promiseResolvedWith(void 0);
        let abortAlgorithm = () => promiseResolvedWith(void 0);
        if (underlyingSink.start !== void 0) {
          startAlgorithm = () => underlyingSink.start(controller);
        }
        if (underlyingSink.write !== void 0) {
          writeAlgorithm = (chunk) => underlyingSink.write(chunk, controller);
        }
        if (underlyingSink.close !== void 0) {
          closeAlgorithm = () => underlyingSink.close();
        }
        if (underlyingSink.abort !== void 0) {
          abortAlgorithm = (reason) => underlyingSink.abort(reason);
        }
        SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
      }
      function WritableStreamDefaultControllerClearAlgorithms(controller) {
        controller._writeAlgorithm = void 0;
        controller._closeAlgorithm = void 0;
        controller._abortAlgorithm = void 0;
        controller._strategySizeAlgorithm = void 0;
      }
      function WritableStreamDefaultControllerClose(controller) {
        EnqueueValueWithSize(controller, closeSentinel, 0);
        WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
      }
      function WritableStreamDefaultControllerGetChunkSize(controller, chunk) {
        try {
          return controller._strategySizeAlgorithm(chunk);
        } catch (chunkSizeE) {
          WritableStreamDefaultControllerErrorIfNeeded(controller, chunkSizeE);
          return 1;
        }
      }
      function WritableStreamDefaultControllerGetDesiredSize(controller) {
        return controller._strategyHWM - controller._queueTotalSize;
      }
      function WritableStreamDefaultControllerWrite(controller, chunk, chunkSize) {
        try {
          EnqueueValueWithSize(controller, chunk, chunkSize);
        } catch (enqueueE) {
          WritableStreamDefaultControllerErrorIfNeeded(controller, enqueueE);
          return;
        }
        const stream = controller._controlledWritableStream;
        if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._state === "writable") {
          const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
          WritableStreamUpdateBackpressure(stream, backpressure);
        }
        WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
      }
      function WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller) {
        const stream = controller._controlledWritableStream;
        if (!controller._started) {
          return;
        }
        if (stream._inFlightWriteRequest !== void 0) {
          return;
        }
        const state = stream._state;
        if (state === "erroring") {
          WritableStreamFinishErroring(stream);
          return;
        }
        if (controller._queue.length === 0) {
          return;
        }
        const value = PeekQueueValue(controller);
        if (value === closeSentinel) {
          WritableStreamDefaultControllerProcessClose(controller);
        } else {
          WritableStreamDefaultControllerProcessWrite(controller, value);
        }
      }
      function WritableStreamDefaultControllerErrorIfNeeded(controller, error) {
        if (controller._controlledWritableStream._state === "writable") {
          WritableStreamDefaultControllerError(controller, error);
        }
      }
      function WritableStreamDefaultControllerProcessClose(controller) {
        const stream = controller._controlledWritableStream;
        WritableStreamMarkCloseRequestInFlight(stream);
        DequeueValue(controller);
        const sinkClosePromise = controller._closeAlgorithm();
        WritableStreamDefaultControllerClearAlgorithms(controller);
        uponPromise(sinkClosePromise, () => {
          WritableStreamFinishInFlightClose(stream);
        }, (reason) => {
          WritableStreamFinishInFlightCloseWithError(stream, reason);
        });
      }
      function WritableStreamDefaultControllerProcessWrite(controller, chunk) {
        const stream = controller._controlledWritableStream;
        WritableStreamMarkFirstWriteRequestInFlight(stream);
        const sinkWritePromise = controller._writeAlgorithm(chunk);
        uponPromise(sinkWritePromise, () => {
          WritableStreamFinishInFlightWrite(stream);
          const state = stream._state;
          DequeueValue(controller);
          if (!WritableStreamCloseQueuedOrInFlight(stream) && state === "writable") {
            const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
            WritableStreamUpdateBackpressure(stream, backpressure);
          }
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }, (reason) => {
          if (stream._state === "writable") {
            WritableStreamDefaultControllerClearAlgorithms(controller);
          }
          WritableStreamFinishInFlightWriteWithError(stream, reason);
        });
      }
      function WritableStreamDefaultControllerGetBackpressure(controller) {
        const desiredSize = WritableStreamDefaultControllerGetDesiredSize(controller);
        return desiredSize <= 0;
      }
      function WritableStreamDefaultControllerError(controller, error) {
        const stream = controller._controlledWritableStream;
        WritableStreamDefaultControllerClearAlgorithms(controller);
        WritableStreamStartErroring(stream, error);
      }
      function streamBrandCheckException$2(name) {
        return new TypeError(`WritableStream.prototype.${name} can only be used on a WritableStream`);
      }
      function defaultControllerBrandCheckException$2(name) {
        return new TypeError(`WritableStreamDefaultController.prototype.${name} can only be used on a WritableStreamDefaultController`);
      }
      function defaultWriterBrandCheckException(name) {
        return new TypeError(`WritableStreamDefaultWriter.prototype.${name} can only be used on a WritableStreamDefaultWriter`);
      }
      function defaultWriterLockException(name) {
        return new TypeError("Cannot " + name + " a stream using a released writer");
      }
      function defaultWriterClosedPromiseInitialize(writer) {
        writer._closedPromise = newPromise((resolve, reject) => {
          writer._closedPromise_resolve = resolve;
          writer._closedPromise_reject = reject;
          writer._closedPromiseState = "pending";
        });
      }
      function defaultWriterClosedPromiseInitializeAsRejected(writer, reason) {
        defaultWriterClosedPromiseInitialize(writer);
        defaultWriterClosedPromiseReject(writer, reason);
      }
      function defaultWriterClosedPromiseInitializeAsResolved(writer) {
        defaultWriterClosedPromiseInitialize(writer);
        defaultWriterClosedPromiseResolve(writer);
      }
      function defaultWriterClosedPromiseReject(writer, reason) {
        if (writer._closedPromise_reject === void 0) {
          return;
        }
        setPromiseIsHandledToTrue(writer._closedPromise);
        writer._closedPromise_reject(reason);
        writer._closedPromise_resolve = void 0;
        writer._closedPromise_reject = void 0;
        writer._closedPromiseState = "rejected";
      }
      function defaultWriterClosedPromiseResetToRejected(writer, reason) {
        defaultWriterClosedPromiseInitializeAsRejected(writer, reason);
      }
      function defaultWriterClosedPromiseResolve(writer) {
        if (writer._closedPromise_resolve === void 0) {
          return;
        }
        writer._closedPromise_resolve(void 0);
        writer._closedPromise_resolve = void 0;
        writer._closedPromise_reject = void 0;
        writer._closedPromiseState = "resolved";
      }
      function defaultWriterReadyPromiseInitialize(writer) {
        writer._readyPromise = newPromise((resolve, reject) => {
          writer._readyPromise_resolve = resolve;
          writer._readyPromise_reject = reject;
        });
        writer._readyPromiseState = "pending";
      }
      function defaultWriterReadyPromiseInitializeAsRejected(writer, reason) {
        defaultWriterReadyPromiseInitialize(writer);
        defaultWriterReadyPromiseReject(writer, reason);
      }
      function defaultWriterReadyPromiseInitializeAsResolved(writer) {
        defaultWriterReadyPromiseInitialize(writer);
        defaultWriterReadyPromiseResolve(writer);
      }
      function defaultWriterReadyPromiseReject(writer, reason) {
        if (writer._readyPromise_reject === void 0) {
          return;
        }
        setPromiseIsHandledToTrue(writer._readyPromise);
        writer._readyPromise_reject(reason);
        writer._readyPromise_resolve = void 0;
        writer._readyPromise_reject = void 0;
        writer._readyPromiseState = "rejected";
      }
      function defaultWriterReadyPromiseReset(writer) {
        defaultWriterReadyPromiseInitialize(writer);
      }
      function defaultWriterReadyPromiseResetToRejected(writer, reason) {
        defaultWriterReadyPromiseInitializeAsRejected(writer, reason);
      }
      function defaultWriterReadyPromiseResolve(writer) {
        if (writer._readyPromise_resolve === void 0) {
          return;
        }
        writer._readyPromise_resolve(void 0);
        writer._readyPromise_resolve = void 0;
        writer._readyPromise_reject = void 0;
        writer._readyPromiseState = "fulfilled";
      }
      const NativeDOMException = typeof DOMException !== "undefined" ? DOMException : void 0;
      function isDOMExceptionConstructor(ctor) {
        if (!(typeof ctor === "function" || typeof ctor === "object")) {
          return false;
        }
        try {
          new ctor();
          return true;
        } catch (_a2) {
          return false;
        }
      }
      function createDOMExceptionPolyfill() {
        const ctor = function DOMException2(message, name) {
          this.message = message || "";
          this.name = name || "Error";
          if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
          }
        };
        ctor.prototype = Object.create(Error.prototype);
        Object.defineProperty(ctor.prototype, "constructor", { value: ctor, writable: true, configurable: true });
        return ctor;
      }
      const DOMException$1 = isDOMExceptionConstructor(NativeDOMException) ? NativeDOMException : createDOMExceptionPolyfill();
      function ReadableStreamPipeTo(source, dest, preventClose, preventAbort, preventCancel, signal) {
        const reader = AcquireReadableStreamDefaultReader(source);
        const writer = AcquireWritableStreamDefaultWriter(dest);
        source._disturbed = true;
        let shuttingDown = false;
        let currentWrite = promiseResolvedWith(void 0);
        return newPromise((resolve, reject) => {
          let abortAlgorithm;
          if (signal !== void 0) {
            abortAlgorithm = () => {
              const error = new DOMException$1("Aborted", "AbortError");
              const actions = [];
              if (!preventAbort) {
                actions.push(() => {
                  if (dest._state === "writable") {
                    return WritableStreamAbort(dest, error);
                  }
                  return promiseResolvedWith(void 0);
                });
              }
              if (!preventCancel) {
                actions.push(() => {
                  if (source._state === "readable") {
                    return ReadableStreamCancel(source, error);
                  }
                  return promiseResolvedWith(void 0);
                });
              }
              shutdownWithAction(() => Promise.all(actions.map((action) => action())), true, error);
            };
            if (signal.aborted) {
              abortAlgorithm();
              return;
            }
            signal.addEventListener("abort", abortAlgorithm);
          }
          function pipeLoop() {
            return newPromise((resolveLoop, rejectLoop) => {
              function next(done) {
                if (done) {
                  resolveLoop();
                } else {
                  PerformPromiseThen(pipeStep(), next, rejectLoop);
                }
              }
              next(false);
            });
          }
          function pipeStep() {
            if (shuttingDown) {
              return promiseResolvedWith(true);
            }
            return PerformPromiseThen(writer._readyPromise, () => {
              return newPromise((resolveRead, rejectRead) => {
                ReadableStreamDefaultReaderRead(reader, {
                  _chunkSteps: (chunk) => {
                    currentWrite = PerformPromiseThen(WritableStreamDefaultWriterWrite(writer, chunk), void 0, noop);
                    resolveRead(false);
                  },
                  _closeSteps: () => resolveRead(true),
                  _errorSteps: rejectRead
                });
              });
            });
          }
          isOrBecomesErrored(source, reader._closedPromise, (storedError) => {
            if (!preventAbort) {
              shutdownWithAction(() => WritableStreamAbort(dest, storedError), true, storedError);
            } else {
              shutdown(true, storedError);
            }
          });
          isOrBecomesErrored(dest, writer._closedPromise, (storedError) => {
            if (!preventCancel) {
              shutdownWithAction(() => ReadableStreamCancel(source, storedError), true, storedError);
            } else {
              shutdown(true, storedError);
            }
          });
          isOrBecomesClosed(source, reader._closedPromise, () => {
            if (!preventClose) {
              shutdownWithAction(() => WritableStreamDefaultWriterCloseWithErrorPropagation(writer));
            } else {
              shutdown();
            }
          });
          if (WritableStreamCloseQueuedOrInFlight(dest) || dest._state === "closed") {
            const destClosed = new TypeError("the destination writable stream closed before all data could be piped to it");
            if (!preventCancel) {
              shutdownWithAction(() => ReadableStreamCancel(source, destClosed), true, destClosed);
            } else {
              shutdown(true, destClosed);
            }
          }
          setPromiseIsHandledToTrue(pipeLoop());
          function waitForWritesToFinish() {
            const oldCurrentWrite = currentWrite;
            return PerformPromiseThen(currentWrite, () => oldCurrentWrite !== currentWrite ? waitForWritesToFinish() : void 0);
          }
          function isOrBecomesErrored(stream, promise, action) {
            if (stream._state === "errored") {
              action(stream._storedError);
            } else {
              uponRejection(promise, action);
            }
          }
          function isOrBecomesClosed(stream, promise, action) {
            if (stream._state === "closed") {
              action();
            } else {
              uponFulfillment(promise, action);
            }
          }
          function shutdownWithAction(action, originalIsError, originalError) {
            if (shuttingDown) {
              return;
            }
            shuttingDown = true;
            if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
              uponFulfillment(waitForWritesToFinish(), doTheRest);
            } else {
              doTheRest();
            }
            function doTheRest() {
              uponPromise(action(), () => finalize(originalIsError, originalError), (newError) => finalize(true, newError));
            }
          }
          function shutdown(isError2, error) {
            if (shuttingDown) {
              return;
            }
            shuttingDown = true;
            if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
              uponFulfillment(waitForWritesToFinish(), () => finalize(isError2, error));
            } else {
              finalize(isError2, error);
            }
          }
          function finalize(isError2, error) {
            WritableStreamDefaultWriterRelease(writer);
            ReadableStreamReaderGenericRelease(reader);
            if (signal !== void 0) {
              signal.removeEventListener("abort", abortAlgorithm);
            }
            if (isError2) {
              reject(error);
            } else {
              resolve(void 0);
            }
          }
        });
      }
      class ReadableStreamDefaultController {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the desired size to fill the controlled stream's internal queue. It can be negative, if the queue is
         * over-full. An underlying source ought to use this information to determine when and how to apply backpressure.
         */
        get desiredSize() {
          if (!IsReadableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$1("desiredSize");
          }
          return ReadableStreamDefaultControllerGetDesiredSize(this);
        }
        /**
         * Closes the controlled readable stream. Consumers will still be able to read any previously-enqueued chunks from
         * the stream, but once those are read, the stream will become closed.
         */
        close() {
          if (!IsReadableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$1("close");
          }
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
            throw new TypeError("The stream is not in a state that permits close");
          }
          ReadableStreamDefaultControllerClose(this);
        }
        enqueue(chunk = void 0) {
          if (!IsReadableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$1("enqueue");
          }
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
            throw new TypeError("The stream is not in a state that permits enqueue");
          }
          return ReadableStreamDefaultControllerEnqueue(this, chunk);
        }
        /**
         * Errors the controlled readable stream, making all future interactions with it fail with the given error `e`.
         */
        error(e2 = void 0) {
          if (!IsReadableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$1("error");
          }
          ReadableStreamDefaultControllerError(this, e2);
        }
        /** @internal */
        [CancelSteps](reason) {
          ResetQueue(this);
          const result = this._cancelAlgorithm(reason);
          ReadableStreamDefaultControllerClearAlgorithms(this);
          return result;
        }
        /** @internal */
        [PullSteps](readRequest) {
          const stream = this._controlledReadableStream;
          if (this._queue.length > 0) {
            const chunk = DequeueValue(this);
            if (this._closeRequested && this._queue.length === 0) {
              ReadableStreamDefaultControllerClearAlgorithms(this);
              ReadableStreamClose(stream);
            } else {
              ReadableStreamDefaultControllerCallPullIfNeeded(this);
            }
            readRequest._chunkSteps(chunk);
          } else {
            ReadableStreamAddReadRequest(stream, readRequest);
            ReadableStreamDefaultControllerCallPullIfNeeded(this);
          }
        }
      }
      Object.defineProperties(ReadableStreamDefaultController.prototype, {
        close: { enumerable: true },
        enqueue: { enumerable: true },
        error: { enumerable: true },
        desiredSize: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(ReadableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
          value: "ReadableStreamDefaultController",
          configurable: true
        });
      }
      function IsReadableStreamDefaultController(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_controlledReadableStream")) {
          return false;
        }
        return x2 instanceof ReadableStreamDefaultController;
      }
      function ReadableStreamDefaultControllerCallPullIfNeeded(controller) {
        const shouldPull = ReadableStreamDefaultControllerShouldCallPull(controller);
        if (!shouldPull) {
          return;
        }
        if (controller._pulling) {
          controller._pullAgain = true;
          return;
        }
        controller._pulling = true;
        const pullPromise = controller._pullAlgorithm();
        uponPromise(pullPromise, () => {
          controller._pulling = false;
          if (controller._pullAgain) {
            controller._pullAgain = false;
            ReadableStreamDefaultControllerCallPullIfNeeded(controller);
          }
        }, (e2) => {
          ReadableStreamDefaultControllerError(controller, e2);
        });
      }
      function ReadableStreamDefaultControllerShouldCallPull(controller) {
        const stream = controller._controlledReadableStream;
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
          return false;
        }
        if (!controller._started) {
          return false;
        }
        if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
          return true;
        }
        const desiredSize = ReadableStreamDefaultControllerGetDesiredSize(controller);
        if (desiredSize > 0) {
          return true;
        }
        return false;
      }
      function ReadableStreamDefaultControllerClearAlgorithms(controller) {
        controller._pullAlgorithm = void 0;
        controller._cancelAlgorithm = void 0;
        controller._strategySizeAlgorithm = void 0;
      }
      function ReadableStreamDefaultControllerClose(controller) {
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
          return;
        }
        const stream = controller._controlledReadableStream;
        controller._closeRequested = true;
        if (controller._queue.length === 0) {
          ReadableStreamDefaultControllerClearAlgorithms(controller);
          ReadableStreamClose(stream);
        }
      }
      function ReadableStreamDefaultControllerEnqueue(controller, chunk) {
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
          return;
        }
        const stream = controller._controlledReadableStream;
        if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
          ReadableStreamFulfillReadRequest(stream, chunk, false);
        } else {
          let chunkSize;
          try {
            chunkSize = controller._strategySizeAlgorithm(chunk);
          } catch (chunkSizeE) {
            ReadableStreamDefaultControllerError(controller, chunkSizeE);
            throw chunkSizeE;
          }
          try {
            EnqueueValueWithSize(controller, chunk, chunkSize);
          } catch (enqueueE) {
            ReadableStreamDefaultControllerError(controller, enqueueE);
            throw enqueueE;
          }
        }
        ReadableStreamDefaultControllerCallPullIfNeeded(controller);
      }
      function ReadableStreamDefaultControllerError(controller, e2) {
        const stream = controller._controlledReadableStream;
        if (stream._state !== "readable") {
          return;
        }
        ResetQueue(controller);
        ReadableStreamDefaultControllerClearAlgorithms(controller);
        ReadableStreamError(stream, e2);
      }
      function ReadableStreamDefaultControllerGetDesiredSize(controller) {
        const state = controller._controlledReadableStream._state;
        if (state === "errored") {
          return null;
        }
        if (state === "closed") {
          return 0;
        }
        return controller._strategyHWM - controller._queueTotalSize;
      }
      function ReadableStreamDefaultControllerHasBackpressure(controller) {
        if (ReadableStreamDefaultControllerShouldCallPull(controller)) {
          return false;
        }
        return true;
      }
      function ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) {
        const state = controller._controlledReadableStream._state;
        if (!controller._closeRequested && state === "readable") {
          return true;
        }
        return false;
      }
      function SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm) {
        controller._controlledReadableStream = stream;
        controller._queue = void 0;
        controller._queueTotalSize = void 0;
        ResetQueue(controller);
        controller._started = false;
        controller._closeRequested = false;
        controller._pullAgain = false;
        controller._pulling = false;
        controller._strategySizeAlgorithm = sizeAlgorithm;
        controller._strategyHWM = highWaterMark;
        controller._pullAlgorithm = pullAlgorithm;
        controller._cancelAlgorithm = cancelAlgorithm;
        stream._readableStreamController = controller;
        const startResult = startAlgorithm();
        uponPromise(promiseResolvedWith(startResult), () => {
          controller._started = true;
          ReadableStreamDefaultControllerCallPullIfNeeded(controller);
        }, (r2) => {
          ReadableStreamDefaultControllerError(controller, r2);
        });
      }
      function SetUpReadableStreamDefaultControllerFromUnderlyingSource(stream, underlyingSource, highWaterMark, sizeAlgorithm) {
        const controller = Object.create(ReadableStreamDefaultController.prototype);
        let startAlgorithm = () => void 0;
        let pullAlgorithm = () => promiseResolvedWith(void 0);
        let cancelAlgorithm = () => promiseResolvedWith(void 0);
        if (underlyingSource.start !== void 0) {
          startAlgorithm = () => underlyingSource.start(controller);
        }
        if (underlyingSource.pull !== void 0) {
          pullAlgorithm = () => underlyingSource.pull(controller);
        }
        if (underlyingSource.cancel !== void 0) {
          cancelAlgorithm = (reason) => underlyingSource.cancel(reason);
        }
        SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
      }
      function defaultControllerBrandCheckException$1(name) {
        return new TypeError(`ReadableStreamDefaultController.prototype.${name} can only be used on a ReadableStreamDefaultController`);
      }
      function ReadableStreamTee(stream, cloneForBranch2) {
        if (IsReadableByteStreamController(stream._readableStreamController)) {
          return ReadableByteStreamTee(stream);
        }
        return ReadableStreamDefaultTee(stream);
      }
      function ReadableStreamDefaultTee(stream, cloneForBranch2) {
        const reader = AcquireReadableStreamDefaultReader(stream);
        let reading = false;
        let readAgain = false;
        let canceled1 = false;
        let canceled2 = false;
        let reason1;
        let reason2;
        let branch1;
        let branch2;
        let resolveCancelPromise;
        const cancelPromise = newPromise((resolve) => {
          resolveCancelPromise = resolve;
        });
        function pullAlgorithm() {
          if (reading) {
            readAgain = true;
            return promiseResolvedWith(void 0);
          }
          reading = true;
          const readRequest = {
            _chunkSteps: (chunk) => {
              queueMicrotask(() => {
                readAgain = false;
                const chunk1 = chunk;
                const chunk2 = chunk;
                if (!canceled1) {
                  ReadableStreamDefaultControllerEnqueue(branch1._readableStreamController, chunk1);
                }
                if (!canceled2) {
                  ReadableStreamDefaultControllerEnqueue(branch2._readableStreamController, chunk2);
                }
                reading = false;
                if (readAgain) {
                  pullAlgorithm();
                }
              });
            },
            _closeSteps: () => {
              reading = false;
              if (!canceled1) {
                ReadableStreamDefaultControllerClose(branch1._readableStreamController);
              }
              if (!canceled2) {
                ReadableStreamDefaultControllerClose(branch2._readableStreamController);
              }
              if (!canceled1 || !canceled2) {
                resolveCancelPromise(void 0);
              }
            },
            _errorSteps: () => {
              reading = false;
            }
          };
          ReadableStreamDefaultReaderRead(reader, readRequest);
          return promiseResolvedWith(void 0);
        }
        function cancel1Algorithm(reason) {
          canceled1 = true;
          reason1 = reason;
          if (canceled2) {
            const compositeReason = CreateArrayFromList([reason1, reason2]);
            const cancelResult = ReadableStreamCancel(stream, compositeReason);
            resolveCancelPromise(cancelResult);
          }
          return cancelPromise;
        }
        function cancel2Algorithm(reason) {
          canceled2 = true;
          reason2 = reason;
          if (canceled1) {
            const compositeReason = CreateArrayFromList([reason1, reason2]);
            const cancelResult = ReadableStreamCancel(stream, compositeReason);
            resolveCancelPromise(cancelResult);
          }
          return cancelPromise;
        }
        function startAlgorithm() {
        }
        branch1 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel1Algorithm);
        branch2 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel2Algorithm);
        uponRejection(reader._closedPromise, (r2) => {
          ReadableStreamDefaultControllerError(branch1._readableStreamController, r2);
          ReadableStreamDefaultControllerError(branch2._readableStreamController, r2);
          if (!canceled1 || !canceled2) {
            resolveCancelPromise(void 0);
          }
        });
        return [branch1, branch2];
      }
      function ReadableByteStreamTee(stream) {
        let reader = AcquireReadableStreamDefaultReader(stream);
        let reading = false;
        let readAgainForBranch1 = false;
        let readAgainForBranch2 = false;
        let canceled1 = false;
        let canceled2 = false;
        let reason1;
        let reason2;
        let branch1;
        let branch2;
        let resolveCancelPromise;
        const cancelPromise = newPromise((resolve) => {
          resolveCancelPromise = resolve;
        });
        function forwardReaderError(thisReader) {
          uponRejection(thisReader._closedPromise, (r2) => {
            if (thisReader !== reader) {
              return;
            }
            ReadableByteStreamControllerError(branch1._readableStreamController, r2);
            ReadableByteStreamControllerError(branch2._readableStreamController, r2);
            if (!canceled1 || !canceled2) {
              resolveCancelPromise(void 0);
            }
          });
        }
        function pullWithDefaultReader() {
          if (IsReadableStreamBYOBReader(reader)) {
            ReadableStreamReaderGenericRelease(reader);
            reader = AcquireReadableStreamDefaultReader(stream);
            forwardReaderError(reader);
          }
          const readRequest = {
            _chunkSteps: (chunk) => {
              queueMicrotask(() => {
                readAgainForBranch1 = false;
                readAgainForBranch2 = false;
                const chunk1 = chunk;
                let chunk2 = chunk;
                if (!canceled1 && !canceled2) {
                  try {
                    chunk2 = CloneAsUint8Array(chunk);
                  } catch (cloneE) {
                    ReadableByteStreamControllerError(branch1._readableStreamController, cloneE);
                    ReadableByteStreamControllerError(branch2._readableStreamController, cloneE);
                    resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                    return;
                  }
                }
                if (!canceled1) {
                  ReadableByteStreamControllerEnqueue(branch1._readableStreamController, chunk1);
                }
                if (!canceled2) {
                  ReadableByteStreamControllerEnqueue(branch2._readableStreamController, chunk2);
                }
                reading = false;
                if (readAgainForBranch1) {
                  pull1Algorithm();
                } else if (readAgainForBranch2) {
                  pull2Algorithm();
                }
              });
            },
            _closeSteps: () => {
              reading = false;
              if (!canceled1) {
                ReadableByteStreamControllerClose(branch1._readableStreamController);
              }
              if (!canceled2) {
                ReadableByteStreamControllerClose(branch2._readableStreamController);
              }
              if (branch1._readableStreamController._pendingPullIntos.length > 0) {
                ReadableByteStreamControllerRespond(branch1._readableStreamController, 0);
              }
              if (branch2._readableStreamController._pendingPullIntos.length > 0) {
                ReadableByteStreamControllerRespond(branch2._readableStreamController, 0);
              }
              if (!canceled1 || !canceled2) {
                resolveCancelPromise(void 0);
              }
            },
            _errorSteps: () => {
              reading = false;
            }
          };
          ReadableStreamDefaultReaderRead(reader, readRequest);
        }
        function pullWithBYOBReader(view, forBranch2) {
          if (IsReadableStreamDefaultReader(reader)) {
            ReadableStreamReaderGenericRelease(reader);
            reader = AcquireReadableStreamBYOBReader(stream);
            forwardReaderError(reader);
          }
          const byobBranch = forBranch2 ? branch2 : branch1;
          const otherBranch = forBranch2 ? branch1 : branch2;
          const readIntoRequest = {
            _chunkSteps: (chunk) => {
              queueMicrotask(() => {
                readAgainForBranch1 = false;
                readAgainForBranch2 = false;
                const byobCanceled = forBranch2 ? canceled2 : canceled1;
                const otherCanceled = forBranch2 ? canceled1 : canceled2;
                if (!otherCanceled) {
                  let clonedChunk;
                  try {
                    clonedChunk = CloneAsUint8Array(chunk);
                  } catch (cloneE) {
                    ReadableByteStreamControllerError(byobBranch._readableStreamController, cloneE);
                    ReadableByteStreamControllerError(otherBranch._readableStreamController, cloneE);
                    resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                    return;
                  }
                  if (!byobCanceled) {
                    ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                  }
                  ReadableByteStreamControllerEnqueue(otherBranch._readableStreamController, clonedChunk);
                } else if (!byobCanceled) {
                  ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                }
                reading = false;
                if (readAgainForBranch1) {
                  pull1Algorithm();
                } else if (readAgainForBranch2) {
                  pull2Algorithm();
                }
              });
            },
            _closeSteps: (chunk) => {
              reading = false;
              const byobCanceled = forBranch2 ? canceled2 : canceled1;
              const otherCanceled = forBranch2 ? canceled1 : canceled2;
              if (!byobCanceled) {
                ReadableByteStreamControllerClose(byobBranch._readableStreamController);
              }
              if (!otherCanceled) {
                ReadableByteStreamControllerClose(otherBranch._readableStreamController);
              }
              if (chunk !== void 0) {
                if (!byobCanceled) {
                  ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                }
                if (!otherCanceled && otherBranch._readableStreamController._pendingPullIntos.length > 0) {
                  ReadableByteStreamControllerRespond(otherBranch._readableStreamController, 0);
                }
              }
              if (!byobCanceled || !otherCanceled) {
                resolveCancelPromise(void 0);
              }
            },
            _errorSteps: () => {
              reading = false;
            }
          };
          ReadableStreamBYOBReaderRead(reader, view, readIntoRequest);
        }
        function pull1Algorithm() {
          if (reading) {
            readAgainForBranch1 = true;
            return promiseResolvedWith(void 0);
          }
          reading = true;
          const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch1._readableStreamController);
          if (byobRequest === null) {
            pullWithDefaultReader();
          } else {
            pullWithBYOBReader(byobRequest._view, false);
          }
          return promiseResolvedWith(void 0);
        }
        function pull2Algorithm() {
          if (reading) {
            readAgainForBranch2 = true;
            return promiseResolvedWith(void 0);
          }
          reading = true;
          const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch2._readableStreamController);
          if (byobRequest === null) {
            pullWithDefaultReader();
          } else {
            pullWithBYOBReader(byobRequest._view, true);
          }
          return promiseResolvedWith(void 0);
        }
        function cancel1Algorithm(reason) {
          canceled1 = true;
          reason1 = reason;
          if (canceled2) {
            const compositeReason = CreateArrayFromList([reason1, reason2]);
            const cancelResult = ReadableStreamCancel(stream, compositeReason);
            resolveCancelPromise(cancelResult);
          }
          return cancelPromise;
        }
        function cancel2Algorithm(reason) {
          canceled2 = true;
          reason2 = reason;
          if (canceled1) {
            const compositeReason = CreateArrayFromList([reason1, reason2]);
            const cancelResult = ReadableStreamCancel(stream, compositeReason);
            resolveCancelPromise(cancelResult);
          }
          return cancelPromise;
        }
        function startAlgorithm() {
          return;
        }
        branch1 = CreateReadableByteStream(startAlgorithm, pull1Algorithm, cancel1Algorithm);
        branch2 = CreateReadableByteStream(startAlgorithm, pull2Algorithm, cancel2Algorithm);
        forwardReaderError(reader);
        return [branch1, branch2];
      }
      function convertUnderlyingDefaultOrByteSource(source, context) {
        assertDictionary(source, context);
        const original = source;
        const autoAllocateChunkSize = original === null || original === void 0 ? void 0 : original.autoAllocateChunkSize;
        const cancel = original === null || original === void 0 ? void 0 : original.cancel;
        const pull = original === null || original === void 0 ? void 0 : original.pull;
        const start = original === null || original === void 0 ? void 0 : original.start;
        const type = original === null || original === void 0 ? void 0 : original.type;
        return {
          autoAllocateChunkSize: autoAllocateChunkSize === void 0 ? void 0 : convertUnsignedLongLongWithEnforceRange(autoAllocateChunkSize, `${context} has member 'autoAllocateChunkSize' that`),
          cancel: cancel === void 0 ? void 0 : convertUnderlyingSourceCancelCallback(cancel, original, `${context} has member 'cancel' that`),
          pull: pull === void 0 ? void 0 : convertUnderlyingSourcePullCallback(pull, original, `${context} has member 'pull' that`),
          start: start === void 0 ? void 0 : convertUnderlyingSourceStartCallback(start, original, `${context} has member 'start' that`),
          type: type === void 0 ? void 0 : convertReadableStreamType(type, `${context} has member 'type' that`)
        };
      }
      function convertUnderlyingSourceCancelCallback(fn, original, context) {
        assertFunction(fn, context);
        return (reason) => promiseCall(fn, original, [reason]);
      }
      function convertUnderlyingSourcePullCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => promiseCall(fn, original, [controller]);
      }
      function convertUnderlyingSourceStartCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => reflectCall(fn, original, [controller]);
      }
      function convertReadableStreamType(type, context) {
        type = `${type}`;
        if (type !== "bytes") {
          throw new TypeError(`${context} '${type}' is not a valid enumeration value for ReadableStreamType`);
        }
        return type;
      }
      function convertReaderOptions(options, context) {
        assertDictionary(options, context);
        const mode = options === null || options === void 0 ? void 0 : options.mode;
        return {
          mode: mode === void 0 ? void 0 : convertReadableStreamReaderMode(mode, `${context} has member 'mode' that`)
        };
      }
      function convertReadableStreamReaderMode(mode, context) {
        mode = `${mode}`;
        if (mode !== "byob") {
          throw new TypeError(`${context} '${mode}' is not a valid enumeration value for ReadableStreamReaderMode`);
        }
        return mode;
      }
      function convertIteratorOptions(options, context) {
        assertDictionary(options, context);
        const preventCancel = options === null || options === void 0 ? void 0 : options.preventCancel;
        return { preventCancel: Boolean(preventCancel) };
      }
      function convertPipeOptions(options, context) {
        assertDictionary(options, context);
        const preventAbort = options === null || options === void 0 ? void 0 : options.preventAbort;
        const preventCancel = options === null || options === void 0 ? void 0 : options.preventCancel;
        const preventClose = options === null || options === void 0 ? void 0 : options.preventClose;
        const signal = options === null || options === void 0 ? void 0 : options.signal;
        if (signal !== void 0) {
          assertAbortSignal(signal, `${context} has member 'signal' that`);
        }
        return {
          preventAbort: Boolean(preventAbort),
          preventCancel: Boolean(preventCancel),
          preventClose: Boolean(preventClose),
          signal
        };
      }
      function assertAbortSignal(signal, context) {
        if (!isAbortSignal2(signal)) {
          throw new TypeError(`${context} is not an AbortSignal.`);
        }
      }
      function convertReadableWritablePair(pair, context) {
        assertDictionary(pair, context);
        const readable = pair === null || pair === void 0 ? void 0 : pair.readable;
        assertRequiredField(readable, "readable", "ReadableWritablePair");
        assertReadableStream(readable, `${context} has member 'readable' that`);
        const writable = pair === null || pair === void 0 ? void 0 : pair.writable;
        assertRequiredField(writable, "writable", "ReadableWritablePair");
        assertWritableStream(writable, `${context} has member 'writable' that`);
        return { readable, writable };
      }
      class ReadableStream2 {
        constructor(rawUnderlyingSource = {}, rawStrategy = {}) {
          if (rawUnderlyingSource === void 0) {
            rawUnderlyingSource = null;
          } else {
            assertObject(rawUnderlyingSource, "First parameter");
          }
          const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
          const underlyingSource = convertUnderlyingDefaultOrByteSource(rawUnderlyingSource, "First parameter");
          InitializeReadableStream(this);
          if (underlyingSource.type === "bytes") {
            if (strategy.size !== void 0) {
              throw new RangeError("The strategy for a byte stream cannot have a size function");
            }
            const highWaterMark = ExtractHighWaterMark(strategy, 0);
            SetUpReadableByteStreamControllerFromUnderlyingSource(this, underlyingSource, highWaterMark);
          } else {
            const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
            const highWaterMark = ExtractHighWaterMark(strategy, 1);
            SetUpReadableStreamDefaultControllerFromUnderlyingSource(this, underlyingSource, highWaterMark, sizeAlgorithm);
          }
        }
        /**
         * Whether or not the readable stream is locked to a {@link ReadableStreamDefaultReader | reader}.
         */
        get locked() {
          if (!IsReadableStream(this)) {
            throw streamBrandCheckException$1("locked");
          }
          return IsReadableStreamLocked(this);
        }
        /**
         * Cancels the stream, signaling a loss of interest in the stream by a consumer.
         *
         * The supplied `reason` argument will be given to the underlying source's {@link UnderlyingSource.cancel | cancel()}
         * method, which might or might not use it.
         */
        cancel(reason = void 0) {
          if (!IsReadableStream(this)) {
            return promiseRejectedWith(streamBrandCheckException$1("cancel"));
          }
          if (IsReadableStreamLocked(this)) {
            return promiseRejectedWith(new TypeError("Cannot cancel a stream that already has a reader"));
          }
          return ReadableStreamCancel(this, reason);
        }
        getReader(rawOptions = void 0) {
          if (!IsReadableStream(this)) {
            throw streamBrandCheckException$1("getReader");
          }
          const options = convertReaderOptions(rawOptions, "First parameter");
          if (options.mode === void 0) {
            return AcquireReadableStreamDefaultReader(this);
          }
          return AcquireReadableStreamBYOBReader(this);
        }
        pipeThrough(rawTransform, rawOptions = {}) {
          if (!IsReadableStream(this)) {
            throw streamBrandCheckException$1("pipeThrough");
          }
          assertRequiredArgument(rawTransform, 1, "pipeThrough");
          const transform = convertReadableWritablePair(rawTransform, "First parameter");
          const options = convertPipeOptions(rawOptions, "Second parameter");
          if (IsReadableStreamLocked(this)) {
            throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
          }
          if (IsWritableStreamLocked(transform.writable)) {
            throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
          }
          const promise = ReadableStreamPipeTo(this, transform.writable, options.preventClose, options.preventAbort, options.preventCancel, options.signal);
          setPromiseIsHandledToTrue(promise);
          return transform.readable;
        }
        pipeTo(destination, rawOptions = {}) {
          if (!IsReadableStream(this)) {
            return promiseRejectedWith(streamBrandCheckException$1("pipeTo"));
          }
          if (destination === void 0) {
            return promiseRejectedWith(`Parameter 1 is required in 'pipeTo'.`);
          }
          if (!IsWritableStream(destination)) {
            return promiseRejectedWith(new TypeError(`ReadableStream.prototype.pipeTo's first argument must be a WritableStream`));
          }
          let options;
          try {
            options = convertPipeOptions(rawOptions, "Second parameter");
          } catch (e2) {
            return promiseRejectedWith(e2);
          }
          if (IsReadableStreamLocked(this)) {
            return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream"));
          }
          if (IsWritableStreamLocked(destination)) {
            return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream"));
          }
          return ReadableStreamPipeTo(this, destination, options.preventClose, options.preventAbort, options.preventCancel, options.signal);
        }
        /**
         * Tees this readable stream, returning a two-element array containing the two resulting branches as
         * new {@link ReadableStream} instances.
         *
         * Teeing a stream will lock it, preventing any other consumer from acquiring a reader.
         * To cancel the stream, cancel both of the resulting branches; a composite cancellation reason will then be
         * propagated to the stream's underlying source.
         *
         * Note that the chunks seen in each branch will be the same object. If the chunks are not immutable,
         * this could allow interference between the two branches.
         */
        tee() {
          if (!IsReadableStream(this)) {
            throw streamBrandCheckException$1("tee");
          }
          const branches = ReadableStreamTee(this);
          return CreateArrayFromList(branches);
        }
        values(rawOptions = void 0) {
          if (!IsReadableStream(this)) {
            throw streamBrandCheckException$1("values");
          }
          const options = convertIteratorOptions(rawOptions, "First parameter");
          return AcquireReadableStreamAsyncIterator(this, options.preventCancel);
        }
      }
      Object.defineProperties(ReadableStream2.prototype, {
        cancel: { enumerable: true },
        getReader: { enumerable: true },
        pipeThrough: { enumerable: true },
        pipeTo: { enumerable: true },
        tee: { enumerable: true },
        values: { enumerable: true },
        locked: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.toStringTag, {
          value: "ReadableStream",
          configurable: true
        });
      }
      if (typeof SymbolPolyfill.asyncIterator === "symbol") {
        Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.asyncIterator, {
          value: ReadableStream2.prototype.values,
          writable: true,
          configurable: true
        });
      }
      function CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
        const stream = Object.create(ReadableStream2.prototype);
        InitializeReadableStream(stream);
        const controller = Object.create(ReadableStreamDefaultController.prototype);
        SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
        return stream;
      }
      function CreateReadableByteStream(startAlgorithm, pullAlgorithm, cancelAlgorithm) {
        const stream = Object.create(ReadableStream2.prototype);
        InitializeReadableStream(stream);
        const controller = Object.create(ReadableByteStreamController.prototype);
        SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, 0, void 0);
        return stream;
      }
      function InitializeReadableStream(stream) {
        stream._state = "readable";
        stream._reader = void 0;
        stream._storedError = void 0;
        stream._disturbed = false;
      }
      function IsReadableStream(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_readableStreamController")) {
          return false;
        }
        return x2 instanceof ReadableStream2;
      }
      function IsReadableStreamLocked(stream) {
        if (stream._reader === void 0) {
          return false;
        }
        return true;
      }
      function ReadableStreamCancel(stream, reason) {
        stream._disturbed = true;
        if (stream._state === "closed") {
          return promiseResolvedWith(void 0);
        }
        if (stream._state === "errored") {
          return promiseRejectedWith(stream._storedError);
        }
        ReadableStreamClose(stream);
        const reader = stream._reader;
        if (reader !== void 0 && IsReadableStreamBYOBReader(reader)) {
          reader._readIntoRequests.forEach((readIntoRequest) => {
            readIntoRequest._closeSteps(void 0);
          });
          reader._readIntoRequests = new SimpleQueue();
        }
        const sourceCancelPromise = stream._readableStreamController[CancelSteps](reason);
        return transformPromiseWith(sourceCancelPromise, noop);
      }
      function ReadableStreamClose(stream) {
        stream._state = "closed";
        const reader = stream._reader;
        if (reader === void 0) {
          return;
        }
        defaultReaderClosedPromiseResolve(reader);
        if (IsReadableStreamDefaultReader(reader)) {
          reader._readRequests.forEach((readRequest) => {
            readRequest._closeSteps();
          });
          reader._readRequests = new SimpleQueue();
        }
      }
      function ReadableStreamError(stream, e2) {
        stream._state = "errored";
        stream._storedError = e2;
        const reader = stream._reader;
        if (reader === void 0) {
          return;
        }
        defaultReaderClosedPromiseReject(reader, e2);
        if (IsReadableStreamDefaultReader(reader)) {
          reader._readRequests.forEach((readRequest) => {
            readRequest._errorSteps(e2);
          });
          reader._readRequests = new SimpleQueue();
        } else {
          reader._readIntoRequests.forEach((readIntoRequest) => {
            readIntoRequest._errorSteps(e2);
          });
          reader._readIntoRequests = new SimpleQueue();
        }
      }
      function streamBrandCheckException$1(name) {
        return new TypeError(`ReadableStream.prototype.${name} can only be used on a ReadableStream`);
      }
      function convertQueuingStrategyInit(init, context) {
        assertDictionary(init, context);
        const highWaterMark = init === null || init === void 0 ? void 0 : init.highWaterMark;
        assertRequiredField(highWaterMark, "highWaterMark", "QueuingStrategyInit");
        return {
          highWaterMark: convertUnrestrictedDouble(highWaterMark)
        };
      }
      const byteLengthSizeFunction = (chunk) => {
        return chunk.byteLength;
      };
      try {
        Object.defineProperty(byteLengthSizeFunction, "name", {
          value: "size",
          configurable: true
        });
      } catch (_a2) {
      }
      class ByteLengthQueuingStrategy {
        constructor(options) {
          assertRequiredArgument(options, 1, "ByteLengthQueuingStrategy");
          options = convertQueuingStrategyInit(options, "First parameter");
          this._byteLengthQueuingStrategyHighWaterMark = options.highWaterMark;
        }
        /**
         * Returns the high water mark provided to the constructor.
         */
        get highWaterMark() {
          if (!IsByteLengthQueuingStrategy(this)) {
            throw byteLengthBrandCheckException("highWaterMark");
          }
          return this._byteLengthQueuingStrategyHighWaterMark;
        }
        /**
         * Measures the size of `chunk` by returning the value of its `byteLength` property.
         */
        get size() {
          if (!IsByteLengthQueuingStrategy(this)) {
            throw byteLengthBrandCheckException("size");
          }
          return byteLengthSizeFunction;
        }
      }
      Object.defineProperties(ByteLengthQueuingStrategy.prototype, {
        highWaterMark: { enumerable: true },
        size: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(ByteLengthQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
          value: "ByteLengthQueuingStrategy",
          configurable: true
        });
      }
      function byteLengthBrandCheckException(name) {
        return new TypeError(`ByteLengthQueuingStrategy.prototype.${name} can only be used on a ByteLengthQueuingStrategy`);
      }
      function IsByteLengthQueuingStrategy(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_byteLengthQueuingStrategyHighWaterMark")) {
          return false;
        }
        return x2 instanceof ByteLengthQueuingStrategy;
      }
      const countSizeFunction = () => {
        return 1;
      };
      try {
        Object.defineProperty(countSizeFunction, "name", {
          value: "size",
          configurable: true
        });
      } catch (_a2) {
      }
      class CountQueuingStrategy {
        constructor(options) {
          assertRequiredArgument(options, 1, "CountQueuingStrategy");
          options = convertQueuingStrategyInit(options, "First parameter");
          this._countQueuingStrategyHighWaterMark = options.highWaterMark;
        }
        /**
         * Returns the high water mark provided to the constructor.
         */
        get highWaterMark() {
          if (!IsCountQueuingStrategy(this)) {
            throw countBrandCheckException("highWaterMark");
          }
          return this._countQueuingStrategyHighWaterMark;
        }
        /**
         * Measures the size of `chunk` by always returning 1.
         * This ensures that the total queue size is a count of the number of chunks in the queue.
         */
        get size() {
          if (!IsCountQueuingStrategy(this)) {
            throw countBrandCheckException("size");
          }
          return countSizeFunction;
        }
      }
      Object.defineProperties(CountQueuingStrategy.prototype, {
        highWaterMark: { enumerable: true },
        size: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(CountQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
          value: "CountQueuingStrategy",
          configurable: true
        });
      }
      function countBrandCheckException(name) {
        return new TypeError(`CountQueuingStrategy.prototype.${name} can only be used on a CountQueuingStrategy`);
      }
      function IsCountQueuingStrategy(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_countQueuingStrategyHighWaterMark")) {
          return false;
        }
        return x2 instanceof CountQueuingStrategy;
      }
      function convertTransformer(original, context) {
        assertDictionary(original, context);
        const flush = original === null || original === void 0 ? void 0 : original.flush;
        const readableType = original === null || original === void 0 ? void 0 : original.readableType;
        const start = original === null || original === void 0 ? void 0 : original.start;
        const transform = original === null || original === void 0 ? void 0 : original.transform;
        const writableType = original === null || original === void 0 ? void 0 : original.writableType;
        return {
          flush: flush === void 0 ? void 0 : convertTransformerFlushCallback(flush, original, `${context} has member 'flush' that`),
          readableType,
          start: start === void 0 ? void 0 : convertTransformerStartCallback(start, original, `${context} has member 'start' that`),
          transform: transform === void 0 ? void 0 : convertTransformerTransformCallback(transform, original, `${context} has member 'transform' that`),
          writableType
        };
      }
      function convertTransformerFlushCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => promiseCall(fn, original, [controller]);
      }
      function convertTransformerStartCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => reflectCall(fn, original, [controller]);
      }
      function convertTransformerTransformCallback(fn, original, context) {
        assertFunction(fn, context);
        return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
      }
      class TransformStream {
        constructor(rawTransformer = {}, rawWritableStrategy = {}, rawReadableStrategy = {}) {
          if (rawTransformer === void 0) {
            rawTransformer = null;
          }
          const writableStrategy = convertQueuingStrategy(rawWritableStrategy, "Second parameter");
          const readableStrategy = convertQueuingStrategy(rawReadableStrategy, "Third parameter");
          const transformer = convertTransformer(rawTransformer, "First parameter");
          if (transformer.readableType !== void 0) {
            throw new RangeError("Invalid readableType specified");
          }
          if (transformer.writableType !== void 0) {
            throw new RangeError("Invalid writableType specified");
          }
          const readableHighWaterMark = ExtractHighWaterMark(readableStrategy, 0);
          const readableSizeAlgorithm = ExtractSizeAlgorithm(readableStrategy);
          const writableHighWaterMark = ExtractHighWaterMark(writableStrategy, 1);
          const writableSizeAlgorithm = ExtractSizeAlgorithm(writableStrategy);
          let startPromise_resolve;
          const startPromise = newPromise((resolve) => {
            startPromise_resolve = resolve;
          });
          InitializeTransformStream(this, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
          SetUpTransformStreamDefaultControllerFromTransformer(this, transformer);
          if (transformer.start !== void 0) {
            startPromise_resolve(transformer.start(this._transformStreamController));
          } else {
            startPromise_resolve(void 0);
          }
        }
        /**
         * The readable side of the transform stream.
         */
        get readable() {
          if (!IsTransformStream(this)) {
            throw streamBrandCheckException("readable");
          }
          return this._readable;
        }
        /**
         * The writable side of the transform stream.
         */
        get writable() {
          if (!IsTransformStream(this)) {
            throw streamBrandCheckException("writable");
          }
          return this._writable;
        }
      }
      Object.defineProperties(TransformStream.prototype, {
        readable: { enumerable: true },
        writable: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(TransformStream.prototype, SymbolPolyfill.toStringTag, {
          value: "TransformStream",
          configurable: true
        });
      }
      function InitializeTransformStream(stream, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm) {
        function startAlgorithm() {
          return startPromise;
        }
        function writeAlgorithm(chunk) {
          return TransformStreamDefaultSinkWriteAlgorithm(stream, chunk);
        }
        function abortAlgorithm(reason) {
          return TransformStreamDefaultSinkAbortAlgorithm(stream, reason);
        }
        function closeAlgorithm() {
          return TransformStreamDefaultSinkCloseAlgorithm(stream);
        }
        stream._writable = CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, writableHighWaterMark, writableSizeAlgorithm);
        function pullAlgorithm() {
          return TransformStreamDefaultSourcePullAlgorithm(stream);
        }
        function cancelAlgorithm(reason) {
          TransformStreamErrorWritableAndUnblockWrite(stream, reason);
          return promiseResolvedWith(void 0);
        }
        stream._readable = CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
        stream._backpressure = void 0;
        stream._backpressureChangePromise = void 0;
        stream._backpressureChangePromise_resolve = void 0;
        TransformStreamSetBackpressure(stream, true);
        stream._transformStreamController = void 0;
      }
      function IsTransformStream(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_transformStreamController")) {
          return false;
        }
        return x2 instanceof TransformStream;
      }
      function TransformStreamError(stream, e2) {
        ReadableStreamDefaultControllerError(stream._readable._readableStreamController, e2);
        TransformStreamErrorWritableAndUnblockWrite(stream, e2);
      }
      function TransformStreamErrorWritableAndUnblockWrite(stream, e2) {
        TransformStreamDefaultControllerClearAlgorithms(stream._transformStreamController);
        WritableStreamDefaultControllerErrorIfNeeded(stream._writable._writableStreamController, e2);
        if (stream._backpressure) {
          TransformStreamSetBackpressure(stream, false);
        }
      }
      function TransformStreamSetBackpressure(stream, backpressure) {
        if (stream._backpressureChangePromise !== void 0) {
          stream._backpressureChangePromise_resolve();
        }
        stream._backpressureChangePromise = newPromise((resolve) => {
          stream._backpressureChangePromise_resolve = resolve;
        });
        stream._backpressure = backpressure;
      }
      class TransformStreamDefaultController {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the desired size to fill the readable side’s internal queue. It can be negative, if the queue is over-full.
         */
        get desiredSize() {
          if (!IsTransformStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException("desiredSize");
          }
          const readableController = this._controlledTransformStream._readable._readableStreamController;
          return ReadableStreamDefaultControllerGetDesiredSize(readableController);
        }
        enqueue(chunk = void 0) {
          if (!IsTransformStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException("enqueue");
          }
          TransformStreamDefaultControllerEnqueue(this, chunk);
        }
        /**
         * Errors both the readable side and the writable side of the controlled transform stream, making all future
         * interactions with it fail with the given error `e`. Any chunks queued for transformation will be discarded.
         */
        error(reason = void 0) {
          if (!IsTransformStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException("error");
          }
          TransformStreamDefaultControllerError(this, reason);
        }
        /**
         * Closes the readable side and errors the writable side of the controlled transform stream. This is useful when the
         * transformer only needs to consume a portion of the chunks written to the writable side.
         */
        terminate() {
          if (!IsTransformStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException("terminate");
          }
          TransformStreamDefaultControllerTerminate(this);
        }
      }
      Object.defineProperties(TransformStreamDefaultController.prototype, {
        enqueue: { enumerable: true },
        error: { enumerable: true },
        terminate: { enumerable: true },
        desiredSize: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(TransformStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
          value: "TransformStreamDefaultController",
          configurable: true
        });
      }
      function IsTransformStreamDefaultController(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_controlledTransformStream")) {
          return false;
        }
        return x2 instanceof TransformStreamDefaultController;
      }
      function SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm) {
        controller._controlledTransformStream = stream;
        stream._transformStreamController = controller;
        controller._transformAlgorithm = transformAlgorithm;
        controller._flushAlgorithm = flushAlgorithm;
      }
      function SetUpTransformStreamDefaultControllerFromTransformer(stream, transformer) {
        const controller = Object.create(TransformStreamDefaultController.prototype);
        let transformAlgorithm = (chunk) => {
          try {
            TransformStreamDefaultControllerEnqueue(controller, chunk);
            return promiseResolvedWith(void 0);
          } catch (transformResultE) {
            return promiseRejectedWith(transformResultE);
          }
        };
        let flushAlgorithm = () => promiseResolvedWith(void 0);
        if (transformer.transform !== void 0) {
          transformAlgorithm = (chunk) => transformer.transform(chunk, controller);
        }
        if (transformer.flush !== void 0) {
          flushAlgorithm = () => transformer.flush(controller);
        }
        SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm);
      }
      function TransformStreamDefaultControllerClearAlgorithms(controller) {
        controller._transformAlgorithm = void 0;
        controller._flushAlgorithm = void 0;
      }
      function TransformStreamDefaultControllerEnqueue(controller, chunk) {
        const stream = controller._controlledTransformStream;
        const readableController = stream._readable._readableStreamController;
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
          throw new TypeError("Readable side is not in a state that permits enqueue");
        }
        try {
          ReadableStreamDefaultControllerEnqueue(readableController, chunk);
        } catch (e2) {
          TransformStreamErrorWritableAndUnblockWrite(stream, e2);
          throw stream._readable._storedError;
        }
        const backpressure = ReadableStreamDefaultControllerHasBackpressure(readableController);
        if (backpressure !== stream._backpressure) {
          TransformStreamSetBackpressure(stream, true);
        }
      }
      function TransformStreamDefaultControllerError(controller, e2) {
        TransformStreamError(controller._controlledTransformStream, e2);
      }
      function TransformStreamDefaultControllerPerformTransform(controller, chunk) {
        const transformPromise = controller._transformAlgorithm(chunk);
        return transformPromiseWith(transformPromise, void 0, (r2) => {
          TransformStreamError(controller._controlledTransformStream, r2);
          throw r2;
        });
      }
      function TransformStreamDefaultControllerTerminate(controller) {
        const stream = controller._controlledTransformStream;
        const readableController = stream._readable._readableStreamController;
        ReadableStreamDefaultControllerClose(readableController);
        const error = new TypeError("TransformStream terminated");
        TransformStreamErrorWritableAndUnblockWrite(stream, error);
      }
      function TransformStreamDefaultSinkWriteAlgorithm(stream, chunk) {
        const controller = stream._transformStreamController;
        if (stream._backpressure) {
          const backpressureChangePromise = stream._backpressureChangePromise;
          return transformPromiseWith(backpressureChangePromise, () => {
            const writable = stream._writable;
            const state = writable._state;
            if (state === "erroring") {
              throw writable._storedError;
            }
            return TransformStreamDefaultControllerPerformTransform(controller, chunk);
          });
        }
        return TransformStreamDefaultControllerPerformTransform(controller, chunk);
      }
      function TransformStreamDefaultSinkAbortAlgorithm(stream, reason) {
        TransformStreamError(stream, reason);
        return promiseResolvedWith(void 0);
      }
      function TransformStreamDefaultSinkCloseAlgorithm(stream) {
        const readable = stream._readable;
        const controller = stream._transformStreamController;
        const flushPromise = controller._flushAlgorithm();
        TransformStreamDefaultControllerClearAlgorithms(controller);
        return transformPromiseWith(flushPromise, () => {
          if (readable._state === "errored") {
            throw readable._storedError;
          }
          ReadableStreamDefaultControllerClose(readable._readableStreamController);
        }, (r2) => {
          TransformStreamError(stream, r2);
          throw readable._storedError;
        });
      }
      function TransformStreamDefaultSourcePullAlgorithm(stream) {
        TransformStreamSetBackpressure(stream, false);
        return stream._backpressureChangePromise;
      }
      function defaultControllerBrandCheckException(name) {
        return new TypeError(`TransformStreamDefaultController.prototype.${name} can only be used on a TransformStreamDefaultController`);
      }
      function streamBrandCheckException(name) {
        return new TypeError(`TransformStream.prototype.${name} can only be used on a TransformStream`);
      }
      exports2.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy;
      exports2.CountQueuingStrategy = CountQueuingStrategy;
      exports2.ReadableByteStreamController = ReadableByteStreamController;
      exports2.ReadableStream = ReadableStream2;
      exports2.ReadableStreamBYOBReader = ReadableStreamBYOBReader;
      exports2.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest;
      exports2.ReadableStreamDefaultController = ReadableStreamDefaultController;
      exports2.ReadableStreamDefaultReader = ReadableStreamDefaultReader;
      exports2.TransformStream = TransformStream;
      exports2.TransformStreamDefaultController = TransformStreamDefaultController;
      exports2.WritableStream = WritableStream;
      exports2.WritableStreamDefaultController = WritableStreamDefaultController;
      exports2.WritableStreamDefaultWriter = WritableStreamDefaultWriter;
      Object.defineProperty(exports2, "__esModule", { value: true });
    });
  })(ponyfill_es2018, ponyfill_es2018.exports);
  return ponyfill_es2018.exports;
}
const POOL_SIZE$1 = 65536;
if (!globalThis.ReadableStream) {
  try {
    const process2 = require("node:process");
    const { emitWarning } = process2;
    try {
      process2.emitWarning = () => {
      };
      Object.assign(globalThis, require("node:stream/web"));
      process2.emitWarning = emitWarning;
    } catch (error) {
      process2.emitWarning = emitWarning;
      throw error;
    }
  } catch (error) {
    Object.assign(globalThis, requirePonyfill_es2018());
  }
}
try {
  const { Blob: Blob2 } = require("buffer");
  if (Blob2 && !Blob2.prototype.stream) {
    Blob2.prototype.stream = function name(params) {
      let position = 0;
      const blob = this;
      return new ReadableStream({
        type: "bytes",
        async pull(ctrl) {
          const chunk = blob.slice(position, Math.min(blob.size, position + POOL_SIZE$1));
          const buffer = await chunk.arrayBuffer();
          position += buffer.byteLength;
          ctrl.enqueue(new Uint8Array(buffer));
          if (position === blob.size) {
            ctrl.close();
          }
        }
      });
    };
  }
} catch (error) {
}
/*! fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
const POOL_SIZE = 65536;
async function* toIterator(parts, clone2 = true) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* (
        /** @type {AsyncIterableIterator<Uint8Array>} */
        part.stream()
      );
    } else if (ArrayBuffer.isView(part)) {
      if (clone2) {
        let position = part.byteOffset;
        const end = part.byteOffset + part.byteLength;
        while (position !== end) {
          const size = Math.min(end - position, POOL_SIZE);
          const chunk = part.buffer.slice(position, position + size);
          position += chunk.byteLength;
          yield new Uint8Array(chunk);
        }
      } else {
        yield part;
      }
    } else {
      let position = 0, b = (
        /** @type {Blob} */
        part
      );
      while (position !== b.size) {
        const chunk = b.slice(position, Math.min(b.size, position + POOL_SIZE));
        const buffer = await chunk.arrayBuffer();
        position += buffer.byteLength;
        yield new Uint8Array(buffer);
      }
    }
  }
}
const _Blob = (_a = class {
  /**
   * The Blob() constructor returns a new Blob object. The content
   * of the blob consists of the concatenation of the values given
   * in the parameter array.
   *
   * @param {*} blobParts
   * @param {{ type?: string, endings?: string }} [options]
   */
  constructor(blobParts = [], options = {}) {
    /** @type {Array.<(Blob|Uint8Array)>} */
    __privateAdd(this, _parts, []);
    __privateAdd(this, _type, "");
    __privateAdd(this, _size, 0);
    __privateAdd(this, _endings, "transparent");
    if (typeof blobParts !== "object" || blobParts === null) {
      throw new TypeError("Failed to construct 'Blob': The provided value cannot be converted to a sequence.");
    }
    if (typeof blobParts[Symbol.iterator] !== "function") {
      throw new TypeError("Failed to construct 'Blob': The object must have a callable @@iterator property.");
    }
    if (typeof options !== "object" && typeof options !== "function") {
      throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
    }
    if (options === null)
      options = {};
    const encoder = new TextEncoder();
    for (const element of blobParts) {
      let part;
      if (ArrayBuffer.isView(element)) {
        part = new Uint8Array(element.buffer.slice(element.byteOffset, element.byteOffset + element.byteLength));
      } else if (element instanceof ArrayBuffer) {
        part = new Uint8Array(element.slice(0));
      } else if (element instanceof _a) {
        part = element;
      } else {
        part = encoder.encode(`${element}`);
      }
      __privateSet(this, _size, __privateGet(this, _size) + (ArrayBuffer.isView(part) ? part.byteLength : part.size));
      __privateGet(this, _parts).push(part);
    }
    __privateSet(this, _endings, `${options.endings === void 0 ? "transparent" : options.endings}`);
    const type = options.type === void 0 ? "" : String(options.type);
    __privateSet(this, _type, /^[\x20-\x7E]*$/.test(type) ? type : "");
  }
  /**
   * The Blob interface's size property returns the
   * size of the Blob in bytes.
   */
  get size() {
    return __privateGet(this, _size);
  }
  /**
   * The type property of a Blob object returns the MIME type of the file.
   */
  get type() {
    return __privateGet(this, _type);
  }
  /**
   * The text() method in the Blob interface returns a Promise
   * that resolves with a string containing the contents of
   * the blob, interpreted as UTF-8.
   *
   * @return {Promise<string>}
   */
  async text() {
    const decoder = new TextDecoder();
    let str = "";
    for await (const part of toIterator(__privateGet(this, _parts), false)) {
      str += decoder.decode(part, { stream: true });
    }
    str += decoder.decode();
    return str;
  }
  /**
   * The arrayBuffer() method in the Blob interface returns a
   * Promise that resolves with the contents of the blob as
   * binary data contained in an ArrayBuffer.
   *
   * @return {Promise<ArrayBuffer>}
   */
  async arrayBuffer() {
    const data = new Uint8Array(this.size);
    let offset = 0;
    for await (const chunk of toIterator(__privateGet(this, _parts), false)) {
      data.set(chunk, offset);
      offset += chunk.length;
    }
    return data.buffer;
  }
  stream() {
    const it = toIterator(__privateGet(this, _parts), true);
    return new globalThis.ReadableStream({
      // @ts-ignore
      type: "bytes",
      async pull(ctrl) {
        const chunk = await it.next();
        chunk.done ? ctrl.close() : ctrl.enqueue(chunk.value);
      },
      async cancel() {
        await it.return();
      }
    });
  }
  /**
   * The Blob interface's slice() method creates and returns a
   * new Blob object which contains data from a subset of the
   * blob on which it's called.
   *
   * @param {number} [start]
   * @param {number} [end]
   * @param {string} [type]
   */
  slice(start = 0, end = this.size, type = "") {
    const { size } = this;
    let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
    let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
    const span = Math.max(relativeEnd - relativeStart, 0);
    const parts = __privateGet(this, _parts);
    const blobParts = [];
    let added = 0;
    for (const part of parts) {
      if (added >= span) {
        break;
      }
      const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
      if (relativeStart && size2 <= relativeStart) {
        relativeStart -= size2;
        relativeEnd -= size2;
      } else {
        let chunk;
        if (ArrayBuffer.isView(part)) {
          chunk = part.subarray(relativeStart, Math.min(size2, relativeEnd));
          added += chunk.byteLength;
        } else {
          chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
          added += chunk.size;
        }
        relativeEnd -= size2;
        blobParts.push(chunk);
        relativeStart = 0;
      }
    }
    const blob = new _a([], { type: String(type).toLowerCase() });
    __privateSet(blob, _size, span);
    __privateSet(blob, _parts, blobParts);
    return blob;
  }
  get [Symbol.toStringTag]() {
    return "Blob";
  }
  static [Symbol.hasInstance](object) {
    return object && typeof object === "object" && typeof object.constructor === "function" && (typeof object.stream === "function" || typeof object.arrayBuffer === "function") && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
  }
}, _parts = new WeakMap(), _type = new WeakMap(), _size = new WeakMap(), _endings = new WeakMap(), _a);
Object.defineProperties(_Blob.prototype, {
  size: { enumerable: true },
  type: { enumerable: true },
  slice: { enumerable: true }
});
const Blob = _Blob;
const _Blob$1 = Blob;
const _File = (_b = class extends _Blob$1 {
  /**
   * @param {*[]} fileBits
   * @param {string} fileName
   * @param {{lastModified?: number, type?: string}} options
   */
  // @ts-ignore
  constructor(fileBits, fileName, options = {}) {
    if (arguments.length < 2) {
      throw new TypeError(`Failed to construct 'File': 2 arguments required, but only ${arguments.length} present.`);
    }
    super(fileBits, options);
    __privateAdd(this, _lastModified, 0);
    __privateAdd(this, _name, "");
    if (options === null)
      options = {};
    const lastModified = options.lastModified === void 0 ? Date.now() : Number(options.lastModified);
    if (!Number.isNaN(lastModified)) {
      __privateSet(this, _lastModified, lastModified);
    }
    __privateSet(this, _name, String(fileName));
  }
  get name() {
    return __privateGet(this, _name);
  }
  get lastModified() {
    return __privateGet(this, _lastModified);
  }
  get [Symbol.toStringTag]() {
    return "File";
  }
  static [Symbol.hasInstance](object) {
    return !!object && object instanceof _Blob$1 && /^(File)$/.test(object[Symbol.toStringTag]);
  }
}, _lastModified = new WeakMap(), _name = new WeakMap(), _b);
const File = _File;
const File$1 = File;
/*! formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
var { toStringTag: t, iterator: i, hasInstance: h$1 } = Symbol, r = Math.random, m = "append,set,get,getAll,delete,keys,values,entries,forEach,constructor".split(","), f = (a, b, c) => (a += "", /^(Blob|File)$/.test(b && b[t]) ? [(c = c !== void 0 ? c + "" : b[t] == "File" ? b.name : "blob", a), b.name !== c || b[t] == "blob" ? new File$1([b], c, b) : b] : [a, b + ""]), e = (c, f2) => (f2 ? c : c.replace(/\r?\n|\r/g, "\r\n")).replace(/\n/g, "%0A").replace(/\r/g, "%0D").replace(/"/g, "%22"), x$1 = (n, a, e2) => {
  if (a.length < e2) {
    throw new TypeError(`Failed to execute '${n}' on 'FormData': ${e2} arguments required, but only ${a.length} present.`);
  }
};
const FormData = (_c = class {
  constructor(...a) {
    __privateAdd(this, _d, []);
    if (a.length)
      throw new TypeError(`Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'.`);
  }
  get [t]() {
    return "FormData";
  }
  [i]() {
    return this.entries();
  }
  static [h$1](o) {
    return o && typeof o === "object" && o[t] === "FormData" && !m.some((m2) => typeof o[m2] != "function");
  }
  append(...a) {
    x$1("append", arguments, 2);
    __privateGet(this, _d).push(f(...a));
  }
  delete(a) {
    x$1("delete", arguments, 1);
    a += "";
    __privateSet(this, _d, __privateGet(this, _d).filter(([b]) => b !== a));
  }
  get(a) {
    x$1("get", arguments, 1);
    a += "";
    for (var b = __privateGet(this, _d), l = b.length, c = 0; c < l; c++)
      if (b[c][0] === a)
        return b[c][1];
    return null;
  }
  getAll(a, b) {
    x$1("getAll", arguments, 1);
    b = [];
    a += "";
    __privateGet(this, _d).forEach((c) => c[0] === a && b.push(c[1]));
    return b;
  }
  has(a) {
    x$1("has", arguments, 1);
    a += "";
    return __privateGet(this, _d).some((b) => b[0] === a);
  }
  forEach(a, b) {
    x$1("forEach", arguments, 1);
    for (var [c, d2] of this)
      a.call(b, d2, c, this);
  }
  set(...a) {
    x$1("set", arguments, 2);
    var b = [], c = true;
    a = f(...a);
    __privateGet(this, _d).forEach((d2) => {
      d2[0] === a[0] ? c && (c = !b.push(a)) : b.push(d2);
    });
    c && b.push(a);
    __privateSet(this, _d, b);
  }
  *entries() {
    yield* __privateGet(this, _d);
  }
  *keys() {
    for (var [a] of this)
      yield a;
  }
  *values() {
    for (var [, a] of this)
      yield a;
  }
}, _d = new WeakMap(), _c);
function formDataToBlob(F, B = _Blob$1) {
  var b = `${r()}${r()}`.replace(/\./g, "").slice(-28).padStart(32, "-"), c = [], p2 = `--${b}\r
Content-Disposition: form-data; name="`;
  F.forEach((v2, n) => typeof v2 == "string" ? c.push(p2 + e(n) + `"\r
\r
${v2.replace(new RegExp("\\r(?!\\n)|(?<!\\r)\\n", "g"), "\r\n")}\r
`) : c.push(p2 + e(n) + `"; filename="${e(v2.name, 1)}"\r
Content-Type: ${v2.type || "application/octet-stream"}\r
\r
`, v2, "\r\n"));
  c.push(`--${b}--`);
  return new B(c, { type: "multipart/form-data; boundary=" + b });
}
class FetchBaseError extends Error {
  constructor(message, type) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.type = type;
  }
  get name() {
    return this.constructor.name;
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
}
let FetchError$1 = class FetchError extends FetchBaseError {
  /**
   * @param  {string} message -      Error message for human
   * @param  {string} [type] -        Error type for machine
   * @param  {SystemError} [systemError] - For Node.js system error
   */
  constructor(message, type, systemError) {
    super(message, type);
    if (systemError) {
      this.code = this.errno = systemError.code;
      this.erroredSysCall = systemError.syscall;
    }
  }
};
const NAME = Symbol.toStringTag;
const isURLSearchParameters = (object) => {
  return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
};
const isBlob = (object) => {
  return object && typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
};
const isAbortSignal = (object) => {
  return typeof object === "object" && (object[NAME] === "AbortSignal" || object[NAME] === "EventTarget");
};
const isDomainOrSubdomain = (destination, original) => {
  const orig = new URL(original).hostname;
  const dest = new URL(destination).hostname;
  return orig === dest || orig.endsWith(`.${dest}`);
};
const isSameProtocol = (destination, original) => {
  const orig = new URL(original).protocol;
  const dest = new URL(destination).protocol;
  return orig === dest;
};
const pipeline = promisify(Stream.pipeline);
const INTERNALS$2 = Symbol("Body internals");
class Body {
  constructor(body, {
    size = 0
  } = {}) {
    let boundary = null;
    if (body === null) {
      body = null;
    } else if (isURLSearchParameters(body)) {
      body = Buffer$1.from(body.toString());
    } else if (isBlob(body))
      ;
    else if (Buffer$1.isBuffer(body))
      ;
    else if (types.isAnyArrayBuffer(body)) {
      body = Buffer$1.from(body);
    } else if (ArrayBuffer.isView(body)) {
      body = Buffer$1.from(body.buffer, body.byteOffset, body.byteLength);
    } else if (body instanceof Stream)
      ;
    else if (body instanceof FormData) {
      body = formDataToBlob(body);
      boundary = body.type.split("=")[1];
    } else {
      body = Buffer$1.from(String(body));
    }
    let stream = body;
    if (Buffer$1.isBuffer(body)) {
      stream = Stream.Readable.from(body);
    } else if (isBlob(body)) {
      stream = Stream.Readable.from(body.stream());
    }
    this[INTERNALS$2] = {
      body,
      stream,
      boundary,
      disturbed: false,
      error: null
    };
    this.size = size;
    if (body instanceof Stream) {
      body.on("error", (error_) => {
        const error = error_ instanceof FetchBaseError ? error_ : new FetchError$1(`Invalid response body while trying to fetch ${this.url}: ${error_.message}`, "system", error_);
        this[INTERNALS$2].error = error;
      });
    }
  }
  get body() {
    return this[INTERNALS$2].stream;
  }
  get bodyUsed() {
    return this[INTERNALS$2].disturbed;
  }
  /**
   * Decode response as ArrayBuffer
   *
   * @return  Promise
   */
  async arrayBuffer() {
    const { buffer, byteOffset, byteLength } = await consumeBody(this);
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }
  async formData() {
    const ct = this.headers.get("content-type");
    if (ct.startsWith("application/x-www-form-urlencoded")) {
      const formData = new FormData();
      const parameters = new URLSearchParams(await this.text());
      for (const [name, value] of parameters) {
        formData.append(name, value);
      }
      return formData;
    }
    const { toFormData } = await import('./_nuxt/multipart-parser-0eba90e1.mjs');
    return toFormData(this.body, ct);
  }
  /**
   * Return raw response as Blob
   *
   * @return Promise
   */
  async blob() {
    const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
    const buf = await this.arrayBuffer();
    return new _Blob$1([buf], {
      type: ct
    });
  }
  /**
   * Decode response as json
   *
   * @return  Promise
   */
  async json() {
    const text = await this.text();
    return JSON.parse(text);
  }
  /**
   * Decode response as text
   *
   * @return  Promise
   */
  async text() {
    const buffer = await consumeBody(this);
    return new TextDecoder().decode(buffer);
  }
  /**
   * Decode response as buffer (non-spec api)
   *
   * @return  Promise
   */
  buffer() {
    return consumeBody(this);
  }
}
Body.prototype.buffer = deprecate(Body.prototype.buffer, "Please use 'response.arrayBuffer()' instead of 'response.buffer()'", "node-fetch#buffer");
Object.defineProperties(Body.prototype, {
  body: { enumerable: true },
  bodyUsed: { enumerable: true },
  arrayBuffer: { enumerable: true },
  blob: { enumerable: true },
  json: { enumerable: true },
  text: { enumerable: true },
  data: { get: deprecate(
    () => {
    },
    "data doesn't exist, use json(), text(), arrayBuffer(), or body instead",
    "https://github.com/node-fetch/node-fetch/issues/1000 (response)"
  ) }
});
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  const { body } = data;
  if (body === null) {
    return Buffer$1.alloc(0);
  }
  if (!(body instanceof Stream)) {
    return Buffer$1.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const error = new FetchError$1(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(error);
        throw error;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error) {
    const error_ = error instanceof FetchBaseError ? error : new FetchError$1(`Invalid response body while trying to fetch ${data.url}: ${error.message}`, "system", error);
    throw error_;
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer$1.from(accum.join(""));
      }
      return Buffer$1.concat(accum, accumBytes);
    } catch (error) {
      throw new FetchError$1(`Could not create Buffer from response body for ${data.url}: ${error.message}`, "system", error);
    }
  } else {
    throw new FetchError$1(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
const clone = (instance, highWaterMark) => {
  let p1;
  let p2;
  let { body } = instance[INTERNALS$2];
  if (instance.bodyUsed) {
    throw new Error("cannot clone body after it is used");
  }
  if (body instanceof Stream && typeof body.getBoundary !== "function") {
    p1 = new PassThrough({ highWaterMark });
    p2 = new PassThrough({ highWaterMark });
    body.pipe(p1);
    body.pipe(p2);
    instance[INTERNALS$2].stream = p1;
    body = p2;
  }
  return body;
};
const getNonSpecFormDataBoundary = deprecate(
  (body) => body.getBoundary(),
  "form-data doesn't follow the spec and requires special treatment. Use alternative package",
  "https://github.com/node-fetch/node-fetch/issues/1167"
);
const extractContentType = (body, request) => {
  if (body === null) {
    return null;
  }
  if (typeof body === "string") {
    return "text/plain;charset=UTF-8";
  }
  if (isURLSearchParameters(body)) {
    return "application/x-www-form-urlencoded;charset=UTF-8";
  }
  if (isBlob(body)) {
    return body.type || null;
  }
  if (Buffer$1.isBuffer(body) || types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
    return null;
  }
  if (body instanceof FormData) {
    return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
  }
  if (body && typeof body.getBoundary === "function") {
    return `multipart/form-data;boundary=${getNonSpecFormDataBoundary(body)}`;
  }
  if (body instanceof Stream) {
    return null;
  }
  return "text/plain;charset=UTF-8";
};
const getTotalBytes = (request) => {
  const { body } = request[INTERNALS$2];
  if (body === null) {
    return 0;
  }
  if (isBlob(body)) {
    return body.size;
  }
  if (Buffer$1.isBuffer(body)) {
    return body.length;
  }
  if (body && typeof body.getLengthSync === "function") {
    return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
  }
  return null;
};
const writeToStream = async (dest, { body }) => {
  if (body === null) {
    dest.end();
  } else {
    await pipeline(body, dest);
  }
};
const validateHeaderName = typeof http.validateHeaderName === "function" ? http.validateHeaderName : (name) => {
  if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
    const error = new TypeError(`Header name must be a valid HTTP token [${name}]`);
    Object.defineProperty(error, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
    throw error;
  }
};
const validateHeaderValue = typeof http.validateHeaderValue === "function" ? http.validateHeaderValue : (name, value) => {
  if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
    const error = new TypeError(`Invalid character in header content ["${name}"]`);
    Object.defineProperty(error, "code", { value: "ERR_INVALID_CHAR" });
    throw error;
  }
};
let Headers$2 = class Headers extends URLSearchParams {
  /**
   * Headers class
   *
   * @constructor
   * @param {HeadersInit} [init] - Response headers
   */
  constructor(init) {
    let result = [];
    if (init instanceof Headers) {
      const raw = init.raw();
      for (const [name, values] of Object.entries(raw)) {
        result.push(...values.map((value) => [name, value]));
      }
    } else if (init == null)
      ;
    else if (typeof init === "object" && !types.isBoxedPrimitive(init)) {
      const method = init[Symbol.iterator];
      if (method == null) {
        result.push(...Object.entries(init));
      } else {
        if (typeof method !== "function") {
          throw new TypeError("Header pairs must be iterable");
        }
        result = [...init].map((pair) => {
          if (typeof pair !== "object" || types.isBoxedPrimitive(pair)) {
            throw new TypeError("Each header pair must be an iterable object");
          }
          return [...pair];
        }).map((pair) => {
          if (pair.length !== 2) {
            throw new TypeError("Each header pair must be a name/value tuple");
          }
          return [...pair];
        });
      }
    } else {
      throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
    }
    result = result.length > 0 ? result.map(([name, value]) => {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return [String(name).toLowerCase(), String(value)];
    }) : void 0;
    super(result);
    return new Proxy(this, {
      get(target, p2, receiver) {
        switch (p2) {
          case "append":
          case "set":
            return (name, value) => {
              validateHeaderName(name);
              validateHeaderValue(name, String(value));
              return URLSearchParams.prototype[p2].call(
                target,
                String(name).toLowerCase(),
                String(value)
              );
            };
          case "delete":
          case "has":
          case "getAll":
            return (name) => {
              validateHeaderName(name);
              return URLSearchParams.prototype[p2].call(
                target,
                String(name).toLowerCase()
              );
            };
          case "keys":
            return () => {
              target.sort();
              return new Set(URLSearchParams.prototype.keys.call(target)).keys();
            };
          default:
            return Reflect.get(target, p2, receiver);
        }
      }
    });
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
  toString() {
    return Object.prototype.toString.call(this);
  }
  get(name) {
    const values = this.getAll(name);
    if (values.length === 0) {
      return null;
    }
    let value = values.join(", ");
    if (/^content-encoding$/i.test(name)) {
      value = value.toLowerCase();
    }
    return value;
  }
  forEach(callback, thisArg = void 0) {
    for (const name of this.keys()) {
      Reflect.apply(callback, thisArg, [this.get(name), name, this]);
    }
  }
  *values() {
    for (const name of this.keys()) {
      yield this.get(name);
    }
  }
  /**
   * @type {() => IterableIterator<[string, string]>}
   */
  *entries() {
    for (const name of this.keys()) {
      yield [name, this.get(name)];
    }
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  /**
   * Node-fetch non-spec method
   * returning all headers and their values as array
   * @returns {Record<string, string[]>}
   */
  raw() {
    return [...this.keys()].reduce((result, key) => {
      result[key] = this.getAll(key);
      return result;
    }, {});
  }
  /**
   * For better console.log(headers) and also to convert Headers into Node.js Request compatible format
   */
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return [...this.keys()].reduce((result, key) => {
      const values = this.getAll(key);
      if (key === "host") {
        result[key] = values[0];
      } else {
        result[key] = values.length > 1 ? values : values[0];
      }
      return result;
    }, {});
  }
};
Object.defineProperties(
  Headers$2.prototype,
  ["get", "entries", "forEach", "values"].reduce((result, property) => {
    result[property] = { enumerable: true };
    return result;
  }, {})
);
function fromRawHeaders(headers = []) {
  return new Headers$2(
    headers.reduce((result, value, index, array) => {
      if (index % 2 === 0) {
        result.push(array.slice(index, index + 2));
      }
      return result;
    }, []).filter(([name, value]) => {
      try {
        validateHeaderName(name);
        validateHeaderValue(name, String(value));
        return true;
      } catch {
        return false;
      }
    })
  );
}
const redirectStatus = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
const isRedirect = (code) => {
  return redirectStatus.has(code);
};
const INTERNALS$1 = Symbol("Response internals");
class Response extends Body {
  constructor(body = null, options = {}) {
    super(body, options);
    const status = options.status != null ? options.status : 200;
    const headers = new Headers$2(options.headers);
    if (body !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(body, this);
      if (contentType) {
        headers.append("Content-Type", contentType);
      }
    }
    this[INTERNALS$1] = {
      type: "default",
      url: options.url,
      status,
      statusText: options.statusText || "",
      headers,
      counter: options.counter,
      highWaterMark: options.highWaterMark
    };
  }
  get type() {
    return this[INTERNALS$1].type;
  }
  get url() {
    return this[INTERNALS$1].url || "";
  }
  get status() {
    return this[INTERNALS$1].status;
  }
  /**
   * Convenience property representing if the request ended normally
   */
  get ok() {
    return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
  }
  get redirected() {
    return this[INTERNALS$1].counter > 0;
  }
  get statusText() {
    return this[INTERNALS$1].statusText;
  }
  get headers() {
    return this[INTERNALS$1].headers;
  }
  get highWaterMark() {
    return this[INTERNALS$1].highWaterMark;
  }
  /**
   * Clone this response
   *
   * @return  Response
   */
  clone() {
    return new Response(clone(this, this.highWaterMark), {
      type: this.type,
      url: this.url,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      ok: this.ok,
      redirected: this.redirected,
      size: this.size,
      highWaterMark: this.highWaterMark
    });
  }
  /**
   * @param {string} url    The URL that the new response is to originate from.
   * @param {number} status An optional status code for the response (e.g., 302.)
   * @returns {Response}    A Response object.
   */
  static redirect(url, status = 302) {
    if (!isRedirect(status)) {
      throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
    }
    return new Response(null, {
      headers: {
        location: new URL(url).toString()
      },
      status
    });
  }
  static error() {
    const response = new Response(null, { status: 0, statusText: "" });
    response[INTERNALS$1].type = "error";
    return response;
  }
  static json(data = void 0, init = {}) {
    const body = JSON.stringify(data);
    if (body === void 0) {
      throw new TypeError("data is not JSON serializable");
    }
    const headers = new Headers$2(init && init.headers);
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    return new Response(body, {
      ...init,
      headers
    });
  }
  get [Symbol.toStringTag]() {
    return "Response";
  }
}
Object.defineProperties(Response.prototype, {
  type: { enumerable: true },
  url: { enumerable: true },
  status: { enumerable: true },
  ok: { enumerable: true },
  redirected: { enumerable: true },
  statusText: { enumerable: true },
  headers: { enumerable: true },
  clone: { enumerable: true }
});
const getSearch = (parsedURL) => {
  if (parsedURL.search) {
    return parsedURL.search;
  }
  const lastOffset = parsedURL.href.length - 1;
  const hash = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
  return parsedURL.href[lastOffset - hash.length] === "?" ? "?" : "";
};
function stripURLForUseAsAReferrer(url, originOnly = false) {
  if (url == null) {
    return "no-referrer";
  }
  url = new URL(url);
  if (/^(about|blob|data):$/.test(url.protocol)) {
    return "no-referrer";
  }
  url.username = "";
  url.password = "";
  url.hash = "";
  if (originOnly) {
    url.pathname = "";
    url.search = "";
  }
  return url;
}
const ReferrerPolicy = /* @__PURE__ */ new Set([
  "",
  "no-referrer",
  "no-referrer-when-downgrade",
  "same-origin",
  "origin",
  "strict-origin",
  "origin-when-cross-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url"
]);
const DEFAULT_REFERRER_POLICY = "strict-origin-when-cross-origin";
function validateReferrerPolicy(referrerPolicy) {
  if (!ReferrerPolicy.has(referrerPolicy)) {
    throw new TypeError(`Invalid referrerPolicy: ${referrerPolicy}`);
  }
  return referrerPolicy;
}
function isOriginPotentiallyTrustworthy(url) {
  if (/^(http|ws)s:$/.test(url.protocol)) {
    return true;
  }
  const hostIp = url.host.replace(/(^\[)|(]$)/g, "");
  const hostIPVersion = isIP(hostIp);
  if (hostIPVersion === 4 && /^127\./.test(hostIp)) {
    return true;
  }
  if (hostIPVersion === 6 && /^(((0+:){7})|(::(0+:){0,6}))0*1$/.test(hostIp)) {
    return true;
  }
  if (url.host === "localhost" || url.host.endsWith(".localhost")) {
    return false;
  }
  if (url.protocol === "file:") {
    return true;
  }
  return false;
}
function isUrlPotentiallyTrustworthy(url) {
  if (/^about:(blank|srcdoc)$/.test(url)) {
    return true;
  }
  if (url.protocol === "data:") {
    return true;
  }
  if (/^(blob|filesystem):$/.test(url.protocol)) {
    return true;
  }
  return isOriginPotentiallyTrustworthy(url);
}
function determineRequestsReferrer(request, { referrerURLCallback, referrerOriginCallback } = {}) {
  if (request.referrer === "no-referrer" || request.referrerPolicy === "") {
    return null;
  }
  const policy = request.referrerPolicy;
  if (request.referrer === "about:client") {
    return "no-referrer";
  }
  const referrerSource = request.referrer;
  let referrerURL = stripURLForUseAsAReferrer(referrerSource);
  let referrerOrigin = stripURLForUseAsAReferrer(referrerSource, true);
  if (referrerURL.toString().length > 4096) {
    referrerURL = referrerOrigin;
  }
  if (referrerURLCallback) {
    referrerURL = referrerURLCallback(referrerURL);
  }
  if (referrerOriginCallback) {
    referrerOrigin = referrerOriginCallback(referrerOrigin);
  }
  const currentURL = new URL(request.url);
  switch (policy) {
    case "no-referrer":
      return "no-referrer";
    case "origin":
      return referrerOrigin;
    case "unsafe-url":
      return referrerURL;
    case "strict-origin":
      if (isUrlPotentiallyTrustworthy(referrerURL) && !isUrlPotentiallyTrustworthy(currentURL)) {
        return "no-referrer";
      }
      return referrerOrigin.toString();
    case "strict-origin-when-cross-origin":
      if (referrerURL.origin === currentURL.origin) {
        return referrerURL;
      }
      if (isUrlPotentiallyTrustworthy(referrerURL) && !isUrlPotentiallyTrustworthy(currentURL)) {
        return "no-referrer";
      }
      return referrerOrigin;
    case "same-origin":
      if (referrerURL.origin === currentURL.origin) {
        return referrerURL;
      }
      return "no-referrer";
    case "origin-when-cross-origin":
      if (referrerURL.origin === currentURL.origin) {
        return referrerURL;
      }
      return referrerOrigin;
    case "no-referrer-when-downgrade":
      if (isUrlPotentiallyTrustworthy(referrerURL) && !isUrlPotentiallyTrustworthy(currentURL)) {
        return "no-referrer";
      }
      return referrerURL;
    default:
      throw new TypeError(`Invalid referrerPolicy: ${policy}`);
  }
}
function parseReferrerPolicyFromHeader(headers) {
  const policyTokens = (headers.get("referrer-policy") || "").split(/[,\s]+/);
  let policy = "";
  for (const token of policyTokens) {
    if (token && ReferrerPolicy.has(token)) {
      policy = token;
    }
  }
  return policy;
}
const INTERNALS = Symbol("Request internals");
const isRequest = (object) => {
  return typeof object === "object" && typeof object[INTERNALS] === "object";
};
const doBadDataWarn = deprecate(
  () => {
  },
  ".data is not a valid RequestInit property, use .body instead",
  "https://github.com/node-fetch/node-fetch/issues/1000 (request)"
);
class Request extends Body {
  constructor(input, init = {}) {
    let parsedURL;
    if (isRequest(input)) {
      parsedURL = new URL(input.url);
    } else {
      parsedURL = new URL(input);
      input = {};
    }
    if (parsedURL.username !== "" || parsedURL.password !== "") {
      throw new TypeError(`${parsedURL} is an url with embedded credentials.`);
    }
    let method = init.method || input.method || "GET";
    if (/^(delete|get|head|options|post|put)$/i.test(method)) {
      method = method.toUpperCase();
    }
    if (!isRequest(init) && "data" in init) {
      doBadDataWarn();
    }
    if ((init.body != null || isRequest(input) && input.body !== null) && (method === "GET" || method === "HEAD")) {
      throw new TypeError("Request with GET/HEAD method cannot have body");
    }
    const inputBody = init.body ? init.body : isRequest(input) && input.body !== null ? clone(input) : null;
    super(inputBody, {
      size: init.size || input.size || 0
    });
    const headers = new Headers$2(init.headers || input.headers || {});
    if (inputBody !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(inputBody, this);
      if (contentType) {
        headers.set("Content-Type", contentType);
      }
    }
    let signal = isRequest(input) ? input.signal : null;
    if ("signal" in init) {
      signal = init.signal;
    }
    if (signal != null && !isAbortSignal(signal)) {
      throw new TypeError("Expected signal to be an instanceof AbortSignal or EventTarget");
    }
    let referrer = init.referrer == null ? input.referrer : init.referrer;
    if (referrer === "") {
      referrer = "no-referrer";
    } else if (referrer) {
      const parsedReferrer = new URL(referrer);
      referrer = /^about:(\/\/)?client$/.test(parsedReferrer) ? "client" : parsedReferrer;
    } else {
      referrer = void 0;
    }
    this[INTERNALS] = {
      method,
      redirect: init.redirect || input.redirect || "follow",
      headers,
      parsedURL,
      signal,
      referrer
    };
    this.follow = init.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init.follow;
    this.compress = init.compress === void 0 ? input.compress === void 0 ? true : input.compress : init.compress;
    this.counter = init.counter || input.counter || 0;
    this.agent = init.agent || input.agent;
    this.highWaterMark = init.highWaterMark || input.highWaterMark || 16384;
    this.insecureHTTPParser = init.insecureHTTPParser || input.insecureHTTPParser || false;
    this.referrerPolicy = init.referrerPolicy || input.referrerPolicy || "";
  }
  /** @returns {string} */
  get method() {
    return this[INTERNALS].method;
  }
  /** @returns {string} */
  get url() {
    return format(this[INTERNALS].parsedURL);
  }
  /** @returns {Headers} */
  get headers() {
    return this[INTERNALS].headers;
  }
  get redirect() {
    return this[INTERNALS].redirect;
  }
  /** @returns {AbortSignal} */
  get signal() {
    return this[INTERNALS].signal;
  }
  // https://fetch.spec.whatwg.org/#dom-request-referrer
  get referrer() {
    if (this[INTERNALS].referrer === "no-referrer") {
      return "";
    }
    if (this[INTERNALS].referrer === "client") {
      return "about:client";
    }
    if (this[INTERNALS].referrer) {
      return this[INTERNALS].referrer.toString();
    }
    return void 0;
  }
  get referrerPolicy() {
    return this[INTERNALS].referrerPolicy;
  }
  set referrerPolicy(referrerPolicy) {
    this[INTERNALS].referrerPolicy = validateReferrerPolicy(referrerPolicy);
  }
  /**
   * Clone this request
   *
   * @return  Request
   */
  clone() {
    return new Request(this);
  }
  get [Symbol.toStringTag]() {
    return "Request";
  }
}
Object.defineProperties(Request.prototype, {
  method: { enumerable: true },
  url: { enumerable: true },
  headers: { enumerable: true },
  redirect: { enumerable: true },
  clone: { enumerable: true },
  signal: { enumerable: true },
  referrer: { enumerable: true },
  referrerPolicy: { enumerable: true }
});
const getNodeRequestOptions = (request) => {
  const { parsedURL } = request[INTERNALS];
  const headers = new Headers$2(request[INTERNALS].headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "*/*");
  }
  let contentLengthValue = null;
  if (request.body === null && /^(post|put)$/i.test(request.method)) {
    contentLengthValue = "0";
  }
  if (request.body !== null) {
    const totalBytes = getTotalBytes(request);
    if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
      contentLengthValue = String(totalBytes);
    }
  }
  if (contentLengthValue) {
    headers.set("Content-Length", contentLengthValue);
  }
  if (request.referrerPolicy === "") {
    request.referrerPolicy = DEFAULT_REFERRER_POLICY;
  }
  if (request.referrer && request.referrer !== "no-referrer") {
    request[INTERNALS].referrer = determineRequestsReferrer(request);
  } else {
    request[INTERNALS].referrer = "no-referrer";
  }
  if (request[INTERNALS].referrer instanceof URL) {
    headers.set("Referer", request.referrer);
  }
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", "node-fetch");
  }
  if (request.compress && !headers.has("Accept-Encoding")) {
    headers.set("Accept-Encoding", "gzip, deflate, br");
  }
  let { agent } = request;
  if (typeof agent === "function") {
    agent = agent(parsedURL);
  }
  if (!headers.has("Connection") && !agent) {
    headers.set("Connection", "close");
  }
  const search = getSearch(parsedURL);
  const options = {
    // Overwrite search to retain trailing ? (issue #776)
    path: parsedURL.pathname + search,
    // The following options are not expressed in the URL
    method: request.method,
    headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
    insecureHTTPParser: request.insecureHTTPParser,
    agent
  };
  return {
    /** @type {URL} */
    parsedURL,
    options
  };
};
class AbortError extends FetchBaseError {
  constructor(message, type = "aborted") {
    super(message, type);
  }
}
/*! node-domexception. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
if (!globalThis.DOMException) {
  try {
    const { MessageChannel } = require("worker_threads"), port = new MessageChannel().port1, ab = new ArrayBuffer();
    port.postMessage(ab, [ab, ab]);
  } catch (err) {
    err.constructor.name === "DOMException" && (globalThis.DOMException = err.constructor);
  }
}
const supportedSchemas = /* @__PURE__ */ new Set(["data:", "http:", "https:"]);
async function fetch$2(url, options_) {
  return new Promise((resolve, reject) => {
    const request = new Request(url, options_);
    const { parsedURL, options } = getNodeRequestOptions(request);
    if (!supportedSchemas.has(parsedURL.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${parsedURL.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (parsedURL.protocol === "data:") {
      const data = dataUriToBuffer(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve(response2);
      return;
    }
    const send = (parsedURL.protocol === "https:" ? https : http).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error = new AbortError("The operation was aborted.");
      reject(error);
      if (request.body && request.body instanceof Stream.Readable) {
        request.body.destroy(error);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(parsedURL.toString(), options);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (error) => {
      reject(new FetchError$1(`request to ${request.url} failed, reason: ${error.message}`, "system", error));
      finalize();
    });
    fixResponseChunkedTransferBadEnding(request_, (error) => {
      if (response && response.body) {
        response.body.destroy(error);
      }
    });
    if (process.version < "v14") {
      request_.on("socket", (s) => {
        let endedWithEventsCount;
        s.prependListener("end", () => {
          endedWithEventsCount = s._eventsCount;
        });
        s.prependListener("close", (hadError) => {
          if (response && endedWithEventsCount < s._eventsCount && !hadError) {
            const error = new Error("Premature close");
            error.code = "ERR_STREAM_PREMATURE_CLOSE";
            response.body.emit("error", error);
          }
        });
      });
    }
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location2 = headers.get("Location");
        let locationURL = null;
        try {
          locationURL = location2 === null ? null : new URL(location2, request.url);
        } catch {
          if (request.redirect !== "manual") {
            reject(new FetchError$1(`uri requested responds with an invalid redirect URL: ${location2}`, "invalid-redirect"));
            finalize();
            return;
          }
        }
        switch (request.redirect) {
          case "error":
            reject(new FetchError$1(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError$1(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers$2(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: clone(request),
              signal: request.signal,
              size: request.size,
              referrer: request.referrer,
              referrerPolicy: request.referrerPolicy
            };
            if (!isDomainOrSubdomain(request.url, locationURL) || !isSameProtocol(request.url, locationURL)) {
              for (const name of ["authorization", "www-authenticate", "cookie", "cookie2"]) {
                requestOptions.headers.delete(name);
              }
            }
            if (response_.statusCode !== 303 && request.body && options_.body instanceof Stream.Readable) {
              reject(new FetchError$1("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            const responseReferrerPolicy = parseReferrerPolicyFromHeader(headers);
            if (responseReferrerPolicy) {
              requestOptions.referrerPolicy = responseReferrerPolicy;
            }
            resolve(fetch$2(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
          default:
            return reject(new TypeError(`Redirect option '${request.redirect}' is not a valid value of RequestRedirect`));
        }
      }
      if (signal) {
        response_.once("end", () => {
          signal.removeEventListener("abort", abortAndFinalize);
        });
      }
      let body = pipeline$1(response_, new PassThrough(), (error) => {
        if (error) {
          reject(error);
        }
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve(response);
        return;
      }
      const zlibOptions = {
        flush: zlib.Z_SYNC_FLUSH,
        finishFlush: zlib.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = pipeline$1(body, zlib.createGunzip(zlibOptions), (error) => {
          if (error) {
            reject(error);
          }
        });
        response = new Response(body, responseOptions);
        resolve(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = pipeline$1(response_, new PassThrough(), (error) => {
          if (error) {
            reject(error);
          }
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = pipeline$1(body, zlib.createInflate(), (error) => {
              if (error) {
                reject(error);
              }
            });
          } else {
            body = pipeline$1(body, zlib.createInflateRaw(), (error) => {
              if (error) {
                reject(error);
              }
            });
          }
          response = new Response(body, responseOptions);
          resolve(response);
        });
        raw.once("end", () => {
          if (!response) {
            response = new Response(body, responseOptions);
            resolve(response);
          }
        });
        return;
      }
      if (codings === "br") {
        body = pipeline$1(body, zlib.createBrotliDecompress(), (error) => {
          if (error) {
            reject(error);
          }
        });
        response = new Response(body, responseOptions);
        resolve(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve(response);
    });
    writeToStream(request_, request).catch(reject);
  });
}
function fixResponseChunkedTransferBadEnding(request, errorCallback) {
  const LAST_CHUNK = Buffer$1.from("0\r\n\r\n");
  let isChunkedTransfer = false;
  let properLastChunkReceived = false;
  let previousChunk;
  request.on("response", (response) => {
    const { headers } = response;
    isChunkedTransfer = headers["transfer-encoding"] === "chunked" && !headers["content-length"];
  });
  request.on("socket", (socket) => {
    const onSocketClose = () => {
      if (isChunkedTransfer && !properLastChunkReceived) {
        const error = new Error("Premature close");
        error.code = "ERR_STREAM_PREMATURE_CLOSE";
        errorCallback(error);
      }
    };
    const onData = (buf) => {
      properLastChunkReceived = Buffer$1.compare(buf.slice(-5), LAST_CHUNK) === 0;
      if (!properLastChunkReceived && previousChunk) {
        properLastChunkReceived = Buffer$1.compare(previousChunk.slice(-3), LAST_CHUNK.slice(0, 3)) === 0 && Buffer$1.compare(buf.slice(-2), LAST_CHUNK.slice(3)) === 0;
      }
      previousChunk = buf;
    };
    socket.prependListener("close", onSocketClose);
    socket.on("data", onData);
    request.on("close", () => {
      socket.removeListener("close", onSocketClose);
      socket.removeListener("data", onData);
    });
  });
}
const privateData = /* @__PURE__ */ new WeakMap();
const wrappers = /* @__PURE__ */ new WeakMap();
function pd(event) {
  const retv = privateData.get(event);
  console.assert(
    retv != null,
    "'this' is expected an Event object, but got",
    event
  );
  return retv;
}
function setCancelFlag(data) {
  if (data.passiveListener != null) {
    if (typeof console !== "undefined" && typeof console.error === "function") {
      console.error(
        "Unable to preventDefault inside passive event listener invocation.",
        data.passiveListener
      );
    }
    return;
  }
  if (!data.event.cancelable) {
    return;
  }
  data.canceled = true;
  if (typeof data.event.preventDefault === "function") {
    data.event.preventDefault();
  }
}
function Event(eventTarget, event) {
  privateData.set(this, {
    eventTarget,
    event,
    eventPhase: 2,
    currentTarget: eventTarget,
    canceled: false,
    stopped: false,
    immediateStopped: false,
    passiveListener: null,
    timeStamp: event.timeStamp || Date.now()
  });
  Object.defineProperty(this, "isTrusted", { value: false, enumerable: true });
  const keys = Object.keys(event);
  for (let i2 = 0; i2 < keys.length; ++i2) {
    const key = keys[i2];
    if (!(key in this)) {
      Object.defineProperty(this, key, defineRedirectDescriptor(key));
    }
  }
}
Event.prototype = {
  /**
   * The type of this event.
   * @type {string}
   */
  get type() {
    return pd(this).event.type;
  },
  /**
   * The target of this event.
   * @type {EventTarget}
   */
  get target() {
    return pd(this).eventTarget;
  },
  /**
   * The target of this event.
   * @type {EventTarget}
   */
  get currentTarget() {
    return pd(this).currentTarget;
  },
  /**
   * @returns {EventTarget[]} The composed path of this event.
   */
  composedPath() {
    const currentTarget = pd(this).currentTarget;
    if (currentTarget == null) {
      return [];
    }
    return [currentTarget];
  },
  /**
   * Constant of NONE.
   * @type {number}
   */
  get NONE() {
    return 0;
  },
  /**
   * Constant of CAPTURING_PHASE.
   * @type {number}
   */
  get CAPTURING_PHASE() {
    return 1;
  },
  /**
   * Constant of AT_TARGET.
   * @type {number}
   */
  get AT_TARGET() {
    return 2;
  },
  /**
   * Constant of BUBBLING_PHASE.
   * @type {number}
   */
  get BUBBLING_PHASE() {
    return 3;
  },
  /**
   * The target of this event.
   * @type {number}
   */
  get eventPhase() {
    return pd(this).eventPhase;
  },
  /**
   * Stop event bubbling.
   * @returns {void}
   */
  stopPropagation() {
    const data = pd(this);
    data.stopped = true;
    if (typeof data.event.stopPropagation === "function") {
      data.event.stopPropagation();
    }
  },
  /**
   * Stop event bubbling.
   * @returns {void}
   */
  stopImmediatePropagation() {
    const data = pd(this);
    data.stopped = true;
    data.immediateStopped = true;
    if (typeof data.event.stopImmediatePropagation === "function") {
      data.event.stopImmediatePropagation();
    }
  },
  /**
   * The flag to be bubbling.
   * @type {boolean}
   */
  get bubbles() {
    return Boolean(pd(this).event.bubbles);
  },
  /**
   * The flag to be cancelable.
   * @type {boolean}
   */
  get cancelable() {
    return Boolean(pd(this).event.cancelable);
  },
  /**
   * Cancel this event.
   * @returns {void}
   */
  preventDefault() {
    setCancelFlag(pd(this));
  },
  /**
   * The flag to indicate cancellation state.
   * @type {boolean}
   */
  get defaultPrevented() {
    return pd(this).canceled;
  },
  /**
   * The flag to be composed.
   * @type {boolean}
   */
  get composed() {
    return Boolean(pd(this).event.composed);
  },
  /**
   * The unix time of this event.
   * @type {number}
   */
  get timeStamp() {
    return pd(this).timeStamp;
  },
  /**
   * The target of this event.
   * @type {EventTarget}
   * @deprecated
   */
  get srcElement() {
    return pd(this).eventTarget;
  },
  /**
   * The flag to stop event bubbling.
   * @type {boolean}
   * @deprecated
   */
  get cancelBubble() {
    return pd(this).stopped;
  },
  set cancelBubble(value) {
    if (!value) {
      return;
    }
    const data = pd(this);
    data.stopped = true;
    if (typeof data.event.cancelBubble === "boolean") {
      data.event.cancelBubble = true;
    }
  },
  /**
   * The flag to indicate cancellation state.
   * @type {boolean}
   * @deprecated
   */
  get returnValue() {
    return !pd(this).canceled;
  },
  set returnValue(value) {
    if (!value) {
      setCancelFlag(pd(this));
    }
  },
  /**
   * Initialize this event object. But do nothing under event dispatching.
   * @param {string} type The event type.
   * @param {boolean} [bubbles=false] The flag to be possible to bubble up.
   * @param {boolean} [cancelable=false] The flag to be possible to cancel.
   * @deprecated
   */
  initEvent() {
  }
};
Object.defineProperty(Event.prototype, "constructor", {
  value: Event,
  configurable: true,
  writable: true
});
function defineRedirectDescriptor(key) {
  return {
    get() {
      return pd(this).event[key];
    },
    set(value) {
      pd(this).event[key] = value;
    },
    configurable: true,
    enumerable: true
  };
}
function defineCallDescriptor(key) {
  return {
    value() {
      const event = pd(this).event;
      return event[key].apply(event, arguments);
    },
    configurable: true,
    enumerable: true
  };
}
function defineWrapper(BaseEvent, proto) {
  const keys = Object.keys(proto);
  if (keys.length === 0) {
    return BaseEvent;
  }
  function CustomEvent(eventTarget, event) {
    BaseEvent.call(this, eventTarget, event);
  }
  CustomEvent.prototype = Object.create(BaseEvent.prototype, {
    constructor: { value: CustomEvent, configurable: true, writable: true }
  });
  for (let i2 = 0; i2 < keys.length; ++i2) {
    const key = keys[i2];
    if (!(key in BaseEvent.prototype)) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, key);
      const isFunc = typeof descriptor.value === "function";
      Object.defineProperty(
        CustomEvent.prototype,
        key,
        isFunc ? defineCallDescriptor(key) : defineRedirectDescriptor(key)
      );
    }
  }
  return CustomEvent;
}
function getWrapper(proto) {
  if (proto == null || proto === Object.prototype) {
    return Event;
  }
  let wrapper = wrappers.get(proto);
  if (wrapper == null) {
    wrapper = defineWrapper(getWrapper(Object.getPrototypeOf(proto)), proto);
    wrappers.set(proto, wrapper);
  }
  return wrapper;
}
function wrapEvent(eventTarget, event) {
  const Wrapper = getWrapper(Object.getPrototypeOf(event));
  return new Wrapper(eventTarget, event);
}
function isStopped(event) {
  return pd(event).immediateStopped;
}
function setEventPhase(event, eventPhase) {
  pd(event).eventPhase = eventPhase;
}
function setCurrentTarget(event, currentTarget) {
  pd(event).currentTarget = currentTarget;
}
function setPassiveListener(event, passiveListener) {
  pd(event).passiveListener = passiveListener;
}
const listenersMap = /* @__PURE__ */ new WeakMap();
const CAPTURE = 1;
const BUBBLE = 2;
const ATTRIBUTE = 3;
function isObject(x2) {
  return x2 !== null && typeof x2 === "object";
}
function getListeners(eventTarget) {
  const listeners = listenersMap.get(eventTarget);
  if (listeners == null) {
    throw new TypeError(
      "'this' is expected an EventTarget object, but got another value."
    );
  }
  return listeners;
}
function defineEventAttributeDescriptor(eventName) {
  return {
    get() {
      const listeners = getListeners(this);
      let node = listeners.get(eventName);
      while (node != null) {
        if (node.listenerType === ATTRIBUTE) {
          return node.listener;
        }
        node = node.next;
      }
      return null;
    },
    set(listener) {
      if (typeof listener !== "function" && !isObject(listener)) {
        listener = null;
      }
      const listeners = getListeners(this);
      let prev = null;
      let node = listeners.get(eventName);
      while (node != null) {
        if (node.listenerType === ATTRIBUTE) {
          if (prev !== null) {
            prev.next = node.next;
          } else if (node.next !== null) {
            listeners.set(eventName, node.next);
          } else {
            listeners.delete(eventName);
          }
        } else {
          prev = node;
        }
        node = node.next;
      }
      if (listener !== null) {
        const newNode = {
          listener,
          listenerType: ATTRIBUTE,
          passive: false,
          once: false,
          next: null
        };
        if (prev === null) {
          listeners.set(eventName, newNode);
        } else {
          prev.next = newNode;
        }
      }
    },
    configurable: true,
    enumerable: true
  };
}
function defineEventAttribute(eventTargetPrototype, eventName) {
  Object.defineProperty(
    eventTargetPrototype,
    `on${eventName}`,
    defineEventAttributeDescriptor(eventName)
  );
}
function defineCustomEventTarget(eventNames) {
  function CustomEventTarget() {
    EventTarget.call(this);
  }
  CustomEventTarget.prototype = Object.create(EventTarget.prototype, {
    constructor: {
      value: CustomEventTarget,
      configurable: true,
      writable: true
    }
  });
  for (let i2 = 0; i2 < eventNames.length; ++i2) {
    defineEventAttribute(CustomEventTarget.prototype, eventNames[i2]);
  }
  return CustomEventTarget;
}
function EventTarget() {
  if (this instanceof EventTarget) {
    listenersMap.set(this, /* @__PURE__ */ new Map());
    return;
  }
  if (arguments.length === 1 && Array.isArray(arguments[0])) {
    return defineCustomEventTarget(arguments[0]);
  }
  if (arguments.length > 0) {
    const types2 = new Array(arguments.length);
    for (let i2 = 0; i2 < arguments.length; ++i2) {
      types2[i2] = arguments[i2];
    }
    return defineCustomEventTarget(types2);
  }
  throw new TypeError("Cannot call a class as a function");
}
EventTarget.prototype = {
  /**
   * Add a given listener to this event target.
   * @param {string} eventName The event name to add.
   * @param {Function} listener The listener to add.
   * @param {boolean|{capture?:boolean,passive?:boolean,once?:boolean}} [options] The options for this listener.
   * @returns {void}
   */
  addEventListener(eventName, listener, options) {
    if (listener == null) {
      return;
    }
    if (typeof listener !== "function" && !isObject(listener)) {
      throw new TypeError("'listener' should be a function or an object.");
    }
    const listeners = getListeners(this);
    const optionsIsObj = isObject(options);
    const capture = optionsIsObj ? Boolean(options.capture) : Boolean(options);
    const listenerType = capture ? CAPTURE : BUBBLE;
    const newNode = {
      listener,
      listenerType,
      passive: optionsIsObj && Boolean(options.passive),
      once: optionsIsObj && Boolean(options.once),
      next: null
    };
    let node = listeners.get(eventName);
    if (node === void 0) {
      listeners.set(eventName, newNode);
      return;
    }
    let prev = null;
    while (node != null) {
      if (node.listener === listener && node.listenerType === listenerType) {
        return;
      }
      prev = node;
      node = node.next;
    }
    prev.next = newNode;
  },
  /**
   * Remove a given listener from this event target.
   * @param {string} eventName The event name to remove.
   * @param {Function} listener The listener to remove.
   * @param {boolean|{capture?:boolean,passive?:boolean,once?:boolean}} [options] The options for this listener.
   * @returns {void}
   */
  removeEventListener(eventName, listener, options) {
    if (listener == null) {
      return;
    }
    const listeners = getListeners(this);
    const capture = isObject(options) ? Boolean(options.capture) : Boolean(options);
    const listenerType = capture ? CAPTURE : BUBBLE;
    let prev = null;
    let node = listeners.get(eventName);
    while (node != null) {
      if (node.listener === listener && node.listenerType === listenerType) {
        if (prev !== null) {
          prev.next = node.next;
        } else if (node.next !== null) {
          listeners.set(eventName, node.next);
        } else {
          listeners.delete(eventName);
        }
        return;
      }
      prev = node;
      node = node.next;
    }
  },
  /**
   * Dispatch a given event.
   * @param {Event|{type:string}} event The event to dispatch.
   * @returns {boolean} `false` if canceled.
   */
  dispatchEvent(event) {
    if (event == null || typeof event.type !== "string") {
      throw new TypeError('"event.type" should be a string.');
    }
    const listeners = getListeners(this);
    const eventName = event.type;
    let node = listeners.get(eventName);
    if (node == null) {
      return true;
    }
    const wrappedEvent = wrapEvent(this, event);
    let prev = null;
    while (node != null) {
      if (node.once) {
        if (prev !== null) {
          prev.next = node.next;
        } else if (node.next !== null) {
          listeners.set(eventName, node.next);
        } else {
          listeners.delete(eventName);
        }
      } else {
        prev = node;
      }
      setPassiveListener(
        wrappedEvent,
        node.passive ? node.listener : null
      );
      if (typeof node.listener === "function") {
        try {
          node.listener.call(this, wrappedEvent);
        } catch (err) {
          if (typeof console !== "undefined" && typeof console.error === "function") {
            console.error(err);
          }
        }
      } else if (node.listenerType !== ATTRIBUTE && typeof node.listener.handleEvent === "function") {
        node.listener.handleEvent(wrappedEvent);
      }
      if (isStopped(wrappedEvent)) {
        break;
      }
      node = node.next;
    }
    setPassiveListener(wrappedEvent, null);
    setEventPhase(wrappedEvent, 0);
    setCurrentTarget(wrappedEvent, null);
    return !wrappedEvent.defaultPrevented;
  }
};
Object.defineProperty(EventTarget.prototype, "constructor", {
  value: EventTarget,
  configurable: true,
  writable: true
});
class AbortSignal extends EventTarget {
  /**
   * AbortSignal cannot be constructed directly.
   */
  constructor() {
    super();
    throw new TypeError("AbortSignal cannot be constructed directly");
  }
  /**
   * Returns `true` if this `AbortSignal`'s `AbortController` has signaled to abort, and `false` otherwise.
   */
  get aborted() {
    const aborted = abortedFlags.get(this);
    if (typeof aborted !== "boolean") {
      throw new TypeError(`Expected 'this' to be an 'AbortSignal' object, but got ${this === null ? "null" : typeof this}`);
    }
    return aborted;
  }
}
defineEventAttribute(AbortSignal.prototype, "abort");
const abortedFlags = /* @__PURE__ */ new WeakMap();
Object.defineProperties(AbortSignal.prototype, {
  aborted: { enumerable: true }
});
if (typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol") {
  Object.defineProperty(AbortSignal.prototype, Symbol.toStringTag, {
    configurable: true,
    value: "AbortSignal"
  });
}
const _forceNodeFetch = typeof process !== void 0 && typeof process.env !== void 0 && process.env.FORCE_NODE_FETCH;
function _getFetch() {
  if (!_forceNodeFetch && globalThis.fetch) {
    return globalThis.fetch;
  }
  return fetch$2;
}
const fetch$1 = _getFetch();
const Headers$1 = !_forceNodeFetch && globalThis.Headers || Headers$2;
const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d[\d.]{0,14}\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  const _value = value.trim();
  if (value[0] === '"' && value[value.length - 1] === '"') {
    return _value.slice(1, -1);
  }
  const _lval = _value.toLowerCase();
  if (_lval === "true") {
    return true;
  }
  if (_lval === "false") {
    return false;
  }
  if (_lval === "undefined") {
    return void 0;
  }
  if (_lval === "null") {
    return null;
  }
  if (_lval === "nan") {
    return Number.NaN;
  }
  if (_lval === "infinity") {
    return Number.POSITIVE_INFINITY;
  }
  if (_lval === "-infinity") {
    return Number.NEGATIVE_INFINITY;
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}
class FetchError2 extends Error {
  constructor() {
    super(...arguments);
    this.name = "FetchError";
  }
}
function createFetchError(request, error, response) {
  let message = "";
  if (error) {
    message = error.message;
  }
  if (request && response) {
    message = `${message} (${response.status} ${response.statusText} (${request.toString()}))`;
  } else if (request) {
    message = `${message} (${request.toString()})`;
  }
  const fetchError = new FetchError2(message);
  Object.defineProperty(fetchError, "request", {
    get() {
      return request;
    }
  });
  Object.defineProperty(fetchError, "response", {
    get() {
      return response;
    }
  });
  Object.defineProperty(fetchError, "data", {
    get() {
      return response && response._data;
    }
  });
  Object.defineProperty(fetchError, "status", {
    get() {
      return response && response.status;
    }
  });
  Object.defineProperty(fetchError, "statusText", {
    get() {
      return response && response.statusText;
    }
  });
  Object.defineProperty(fetchError, "statusCode", {
    get() {
      return response && response.status;
    }
  });
  Object.defineProperty(fetchError, "statusMessage", {
    get() {
      return response && response.statusText;
    }
  });
  return fetchError;
}
const payloadMethods = new Set(
  Object.freeze(["PATCH", "POST", "PUT", "DELETE"])
);
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(value) {
  if (value === void 0) {
    return false;
  }
  const t2 = typeof value;
  if (t2 === "string" || t2 === "number" || t2 === "boolean" || t2 === null) {
    return true;
  }
  if (t2 !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift() || "";
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
function mergeFetchOptions(input, defaults, Headers3 = globalThis.Headers) {
  const merged = {
    ...defaults,
    ...input
  };
  if ((defaults == null ? void 0 : defaults.params) && (input == null ? void 0 : input.params)) {
    merged.params = {
      ...defaults == null ? void 0 : defaults.params,
      ...input == null ? void 0 : input.params
    };
  }
  if ((defaults == null ? void 0 : defaults.query) && (input == null ? void 0 : input.query)) {
    merged.query = {
      ...defaults == null ? void 0 : defaults.query,
      ...input == null ? void 0 : input.query
    };
  }
  if ((defaults == null ? void 0 : defaults.headers) && (input == null ? void 0 : input.headers)) {
    merged.headers = new Headers3((defaults == null ? void 0 : defaults.headers) || {});
    for (const [key, value] of new Headers3((input == null ? void 0 : input.headers) || {})) {
      merged.headers.set(key, value);
    }
  }
  return merged;
}
const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  // Request Timeout
  409,
  // Conflict
  425,
  // Too Early
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  //  Gateway Timeout
]);
function createFetch(globalOptions) {
  const { fetch: fetch2, Headers: Headers3 } = globalOptions;
  function onError(context) {
    const isAbort = context.error && context.error.name === "AbortError" || false;
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }
      const responseCode = context.response && context.response.status || 500;
      if (retries > 0 && retryStatusCodes.has(responseCode)) {
        return $fetchRaw(context.request, {
          ...context.options,
          retry: retries - 1
        });
      }
    }
    const error = createFetchError(
      context.request,
      context.error,
      context.response
    );
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, $fetchRaw);
    }
    throw error;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _options = {}) {
    const context = {
      request: _request,
      options: mergeFetchOptions(_options, globalOptions.defaults, Headers3),
      response: void 0,
      error: void 0
    };
    if (context.options.onRequest) {
      await context.options.onRequest(context);
    }
    if (typeof context.request === "string") {
      if (context.options.baseURL) {
        context.request = withBase(context.request, context.options.baseURL);
      }
      if (context.options.query || context.options.params) {
        context.request = withQuery(context.request, {
          ...context.options.params,
          ...context.options.query
        });
      }
      if (context.options.body && isPayloadMethod(context.options.method) && isJSONSerializable(context.options.body)) {
        context.options.body = typeof context.options.body === "string" ? context.options.body : JSON.stringify(context.options.body);
        context.options.headers = new Headers3(context.options.headers || {});
        if (!context.options.headers.has("content-type")) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      }
    }
    try {
      context.response = await fetch2(
        context.request,
        context.options
      );
    } catch (error) {
      context.error = error;
      if (context.options.onRequestError) {
        await context.options.onRequestError(context);
      }
      return await onError(context);
    }
    const responseType = (context.options.parseResponse ? "json" : context.options.responseType) || detectResponseType(context.response.headers.get("content-type") || "");
    if (responseType === "json") {
      const data = await context.response.text();
      const parseFunction = context.options.parseResponse || destr;
      context.response._data = parseFunction(data);
    } else if (responseType === "stream") {
      context.response._data = context.response.body;
    } else {
      context.response._data = await context.response[responseType]();
    }
    if (context.options.onResponse) {
      await context.options.onResponse(context);
    }
    if (!context.options.ignoreResponseError && context.response.status >= 400 && context.response.status < 600) {
      if (context.options.onResponseError) {
        await context.options.onResponseError(context);
      }
      return await onError(context);
    }
    return context.response;
  };
  const $fetch2 = async function $fetch22(request, options) {
    const r2 = await $fetchRaw(request, options);
    return r2._data;
  };
  $fetch2.raw = $fetchRaw;
  $fetch2.native = fetch2;
  $fetch2.create = (defaultOptions = {}) => createFetch({
    ...globalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch2;
}
function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return fetch$1;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new http.Agent(agentOptions);
  const httpsAgent = new https.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init) {
    return fetch$1(input, { ...nodeFetchOptions, ...init });
  };
}
const fetch = globalThis.fetch || createNodeFetch();
const Headers2 = globalThis.Headers || Headers$1;
const ofetch = createFetch({ fetch, Headers: Headers2 });
const $fetch = ofetch;
const appConfig = useRuntimeConfig$1().app;
const baseURL = () => appConfig.baseURL;
function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
const defaultTask = { run: (function_) => function_() };
const _createTask = () => defaultTask;
const createTask = typeof console.createTask !== "undefined" ? console.createTask : _createTask;
function serialTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => task.run(() => hookFunction(...args))),
    Promise.resolve()
  );
}
function parallelTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
}
function callEachWith(callbacks, arg0) {
  for (const callback of [...callbacks]) {
    callback(arg0);
  }
}
class Hookable {
  constructor() {
    this._hooks = {};
    this._before = void 0;
    this._after = void 0;
    this._deprecatedMessages = void 0;
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, function_, options = {}) {
    if (!name || typeof function_ !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let dep;
    while (this._deprecatedHooks[name]) {
      dep = this._deprecatedHooks[name];
      name = dep.to;
    }
    if (dep && !options.allowDeprecated) {
      let message = dep.message;
      if (!message) {
        message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
      }
      if (!this._deprecatedMessages) {
        this._deprecatedMessages = /* @__PURE__ */ new Set();
      }
      if (!this._deprecatedMessages.has(message)) {
        console.warn(message);
        this._deprecatedMessages.add(message);
      }
    }
    if (!function_.name) {
      try {
        Object.defineProperty(function_, "name", {
          get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
          configurable: true
        });
      } catch {
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(function_);
    return () => {
      if (function_) {
        this.removeHook(name, function_);
        function_ = void 0;
      }
    };
  }
  hookOnce(name, function_) {
    let _unreg;
    let _function = (...arguments_) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = void 0;
      _function = void 0;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function);
    return _unreg;
  }
  removeHook(name, function_) {
    if (this._hooks[name]) {
      const index = this._hooks[name].indexOf(function_);
      if (index !== -1) {
        this._hooks[name].splice(index, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    delete this._hooks[name];
    for (const hook of _hooks) {
      this.hook(name, hook);
    }
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name]);
    }
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map(
      (key) => this.hook(key, hooks[key])
    );
    return () => {
      for (const unreg of removeFns.splice(0, removeFns.length)) {
        unreg();
      }
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  removeAllHooks() {
    for (const key in this._hooks) {
      delete this._hooks[key];
    }
  }
  callHook(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(serialTaskCaller, name, ...arguments_);
  }
  callHookParallel(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(parallelTaskCaller, name, ...arguments_);
  }
  callHookWith(caller, name, ...arguments_) {
    const event = this._before || this._after ? { name, args: arguments_, context: {} } : void 0;
    if (this._before) {
      callEachWith(this._before, event);
    }
    const result = caller(
      name in this._hooks ? [...this._hooks[name]] : [],
      arguments_
    );
    if (result instanceof Promise) {
      return result.finally(() => {
        if (this._after && event) {
          callEachWith(this._after, event);
        }
      });
    }
    if (this._after && event) {
      callEachWith(this._after, event);
    }
    return result;
  }
  beforeEach(function_) {
    this._before = this._before || [];
    this._before.push(function_);
    return () => {
      if (this._before !== void 0) {
        const index = this._before.indexOf(function_);
        if (index !== -1) {
          this._before.splice(index, 1);
        }
      }
    };
  }
  afterEach(function_) {
    this._after = this._after || [];
    this._after.push(function_);
    return () => {
      if (this._after !== void 0) {
        const index = this._after.indexOf(function_);
        if (index !== -1) {
          this._after.splice(index, 1);
        }
      }
    };
  }
}
function createHooks() {
  return new Hookable();
}
const nuxtAppCtx = /* @__PURE__ */ getContext("nuxt-app");
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  let hydratingCount = 0;
  const nuxtApp = {
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.6.1";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: reactive({
      data: {},
      state: {},
      _errors: {},
      ...{ serverRendered: true }
    }),
    static: {
      data: {}
    },
    runWithContext: (fn) => callWithNuxt(nuxtApp, fn),
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: {},
    _payloadRevivers: {},
    ...options
  };
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    async function contextCaller(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    }
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, ...args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  {
    if (nuxtApp.ssrContext) {
      nuxtApp.ssrContext.nuxt = nuxtApp;
      nuxtApp.ssrContext._payloadReducers = {};
      nuxtApp.payload.path = nuxtApp.ssrContext.url;
    }
    nuxtApp.ssrContext = nuxtApp.ssrContext || {};
    if (nuxtApp.ssrContext.payload) {
      Object.assign(nuxtApp.payload, nuxtApp.ssrContext.payload);
    }
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: options.ssrContext.runtimeConfig.public,
      app: options.ssrContext.runtimeConfig.app
    };
  }
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
async function applyPlugin(nuxtApp, plugin) {
  if (plugin.hooks) {
    nuxtApp.hooks.addHooks(plugin.hooks);
  }
  if (typeof plugin === "function") {
    const { provide: provide2 } = await nuxtApp.runWithContext(() => plugin(nuxtApp)) || {};
    if (provide2 && typeof provide2 === "object") {
      for (const key in provide2) {
        nuxtApp.provide(key, provide2[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  const parallels = [];
  const errors = [];
  for (const plugin of plugins2) {
    const promise = applyPlugin(nuxtApp, plugin);
    if (plugin.parallel) {
      parallels.push(promise.catch((e2) => errors.push(e2)));
    } else {
      await promise;
    }
  }
  await Promise.all(parallels);
  if (errors.length) {
    throw errors[0];
  }
}
/*! @__NO_SIDE_EFFECTS__ */
function defineNuxtPlugin(plugin) {
  if (typeof plugin === "function") {
    return plugin;
  }
  delete plugin.name;
  return Object.assign(plugin.setup || (() => {
  }), plugin, { [NuxtPluginIndicator]: true });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => args ? setup(...args) : setup();
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
/*! @__NO_SIDE_EFFECTS__ */
function useNuxtApp() {
  var _a2;
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = (_a2 = getCurrentInstance()) == null ? void 0 : _a2.appContext.app.$nuxt;
  }
  nuxtAppInstance = nuxtAppInstance || nuxtAppCtx.tryUse();
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
/*! @__NO_SIDE_EFFECTS__ */
function useRuntimeConfig() {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
class H3Error extends Error {
  constructor() {
    super(...arguments);
    this.statusCode = 500;
    this.fatal = false;
    this.unhandled = false;
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
}
H3Error.__h3_error__ = true;
function createError$1(input) {
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (isError(input)) {
    return input;
  }
  const err = new H3Error(
    input.message ?? input.statusMessage ?? "",
    // @ts-ignore https://v8.dev/features/error-cause
    input.cause ? { cause: input.cause } : void 0
  );
  if ("stack" in input) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function isError(input) {
  var _a2;
  return ((_a2 = input == null ? void 0 : input.constructor) == null ? void 0 : _a2.__h3_error__) === true;
}
const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}
typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
const useStateKeyPrefix = "$s";
function useState(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  const [_key, init] = args;
  if (!_key || typeof _key !== "string") {
    throw new TypeError("[nuxt] [useState] key must be a string: " + _key);
  }
  if (init !== void 0 && typeof init !== "function") {
    throw new Error("[nuxt] [useState] init must be a function: " + init);
  }
  const key = useStateKeyPrefix + _key;
  const nuxt = useNuxtApp();
  const state = toRef(nuxt.payload.state, key);
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (isRef(initialValue)) {
      nuxt.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
}
const useRouter = () => {
  var _a2;
  return (_a2 = useNuxtApp()) == null ? void 0 : _a2.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject("_route", useNuxtApp()._route);
  }
  return useNuxtApp()._route;
};
const isProcessingMiddleware = () => {
  try {
    if (useNuxtApp()._processingMiddleware) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
};
const navigateTo = (to, options) => {
  if (!to) {
    to = "/";
  }
  const toPath = typeof to === "string" ? to : withQuery(to.path || "/", to.query || {}) + (to.hash || "");
  if (options == null ? void 0 : options.open) {
    return Promise.resolve();
  }
  const isExternal = (options == null ? void 0 : options.external) || hasProtocol(toPath, { acceptRelative: true });
  if (isExternal && !(options == null ? void 0 : options.external)) {
    throw new Error("Navigating to external URL is not allowed by default. Use `navigateTo (url, { external: true })`.");
  }
  if (isExternal && parseURL(toPath).protocol === "script:") {
    throw new Error("Cannot navigate to an URL with script protocol.");
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL(useRuntimeConfig().app.baseURL, fullPath);
      async function redirect(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedLoc = location2.replace(/"/g, "%22");
        nuxtApp.ssrContext._renderResponse = {
          statusCode: sanitizeStatusCode((options == null ? void 0 : options.redirectCode) || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: location2 }
        };
        return response;
      }
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    if (options == null ? void 0 : options.replace) {
      location.replace(toPath);
    } else {
      location.href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  return (options == null ? void 0 : options.replace) ? router.replace(to) : router.push(to);
};
const useError = () => toRef(useNuxtApp().payload, "error");
const showError = (_err) => {
  const err = createError(_err);
  try {
    const nuxtApp = useNuxtApp();
    const error = useError();
    if (false)
      ;
    error.value = error.value || err;
  } catch {
    throw err;
  }
  return err;
};
const isNuxtError = (err) => !!(err && typeof err === "object" && "__nuxt_error" in err);
const createError = (err) => {
  const _err = createError$1(err);
  _err.__nuxt_error = true;
  return _err;
};
const globalMiddleware = [];
function getRouteFromPath(fullPath) {
  if (typeof fullPath === "object") {
    fullPath = stringifyParsedURL({
      pathname: fullPath.path || "",
      search: stringifyQuery(fullPath.query || {}),
      hash: fullPath.hash || ""
    });
  }
  const url = parseURL(fullPath.toString());
  return {
    path: url.pathname,
    fullPath,
    query: parseQuery(url.search),
    hash: url.hash,
    // stub properties for compat with vue-router
    params: {},
    name: void 0,
    matched: [],
    redirectedFrom: void 0,
    meta: {},
    href: fullPath
  };
}
const router_HMfTuACkZs = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  setup(nuxtApp) {
    const initialURL = nuxtApp.ssrContext.url;
    const routes = [];
    const hooks = {
      "navigate:before": [],
      "resolve:before": [],
      "navigate:after": [],
      error: []
    };
    const registerHook = (hook, guard) => {
      hooks[hook].push(guard);
      return () => hooks[hook].splice(hooks[hook].indexOf(guard), 1);
    };
    useRuntimeConfig().app.baseURL;
    const route = reactive(getRouteFromPath(initialURL));
    async function handleNavigation(url, replace) {
      try {
        const to = getRouteFromPath(url);
        for (const middleware of hooks["navigate:before"]) {
          const result = await middleware(to, route);
          if (result === false || result instanceof Error) {
            return;
          }
          if (result) {
            return handleNavigation(result, true);
          }
        }
        for (const handler of hooks["resolve:before"]) {
          await handler(to, route);
        }
        Object.assign(route, to);
        if (false)
          ;
        for (const middleware of hooks["navigate:after"]) {
          await middleware(to, route);
        }
      } catch (err) {
        for (const handler of hooks.error) {
          await handler(err);
        }
      }
    }
    const router = {
      currentRoute: route,
      isReady: () => Promise.resolve(),
      // These options provide a similar API to vue-router but have no effect
      options: {},
      install: () => Promise.resolve(),
      // Navigation
      push: (url) => handleNavigation(url),
      replace: (url) => handleNavigation(url),
      back: () => window.history.go(-1),
      go: (delta) => window.history.go(delta),
      forward: () => window.history.go(1),
      // Guards
      beforeResolve: (guard) => registerHook("resolve:before", guard),
      beforeEach: (guard) => registerHook("navigate:before", guard),
      afterEach: (guard) => registerHook("navigate:after", guard),
      onError: (handler) => registerHook("error", handler),
      // Routes
      resolve: getRouteFromPath,
      addRoute: (parentName, route2) => {
        routes.push(route2);
      },
      getRoutes: () => routes,
      hasRoute: (name) => routes.some((route2) => route2.name === name),
      removeRoute: (name) => {
        const index = routes.findIndex((route2) => route2.name === name);
        if (index !== -1) {
          routes.splice(index, 1);
        }
      }
    };
    nuxtApp.vueApp.component("RouterLink", {
      functional: true,
      props: {
        to: String,
        custom: Boolean,
        replace: Boolean,
        // Not implemented
        activeClass: String,
        exactActiveClass: String,
        ariaCurrentValue: String
      },
      setup: (props, { slots }) => {
        const navigate = () => handleNavigation(props.to, props.replace);
        return () => {
          var _a2;
          const route2 = router.resolve(props.to);
          return props.custom ? (_a2 = slots.default) == null ? void 0 : _a2.call(slots, { href: props.to, navigate, route: route2 }) : h$2("a", { href: props.to, onClick: (e2) => {
            e2.preventDefault();
            return navigate();
          } }, slots);
        };
      }
    });
    nuxtApp._route = route;
    nuxtApp._middleware = nuxtApp._middleware || {
      global: [],
      named: {}
    };
    const initialLayout = useState("_layout");
    nuxtApp.hooks.hookOnce("app:created", async () => {
      router.beforeEach(async (to, from) => {
        var _a2;
        to.meta = reactive(to.meta || {});
        if (nuxtApp.isHydrating && initialLayout.value && !isReadonly(to.meta.layout)) {
          to.meta.layout = initialLayout.value;
        }
        nuxtApp._processingMiddleware = true;
        if (!((_a2 = nuxtApp.ssrContext) == null ? void 0 : _a2.islandContext)) {
          const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
          for (const middleware of middlewareEntries) {
            const result = await nuxtApp.runWithContext(() => middleware(to, from));
            {
              if (result === false || result instanceof Error) {
                const error = result || createError$1({
                  statusCode: 404,
                  statusMessage: `Page Not Found: ${initialURL}`
                });
                delete nuxtApp._processingMiddleware;
                return nuxtApp.runWithContext(() => showError(error));
              }
            }
            if (result || result === false) {
              return result;
            }
          }
        }
      });
      router.afterEach(() => {
        delete nuxtApp._processingMiddleware;
      });
      await router.replace(initialURL);
      if (!isEqual(route.fullPath, initialURL)) {
        await nuxtApp.runWithContext(() => navigateTo(route.fullPath));
      }
    });
    return {
      provide: {
        route,
        router
      }
    };
  }
});
function asArray(value) {
  return Array.isArray(value) ? value : [value];
}
const SelfClosingTags = ["meta", "link", "base"];
const TagsWithInnerContent = ["title", "script", "style", "noscript"];
const HasElementTags = [
  "base",
  "meta",
  "link",
  "style",
  "script",
  "noscript"
];
const ValidHeadTags = [
  "title",
  "titleTemplate",
  "templateParams",
  "base",
  "htmlAttrs",
  "bodyAttrs",
  "meta",
  "link",
  "style",
  "script",
  "noscript"
];
const UniqueTags = ["base", "title", "titleTemplate", "bodyAttrs", "htmlAttrs", "templateParams"];
const TagConfigKeys = ["tagPosition", "tagPriority", "tagDuplicateStrategy", "innerHTML", "textContent"];
function defineHeadPlugin(plugin) {
  return plugin;
}
function hashCode(s) {
  let h2 = 9;
  for (let i2 = 0; i2 < s.length; )
    h2 = Math.imul(h2 ^ s.charCodeAt(i2++), 9 ** 9);
  return ((h2 ^ h2 >>> 9) + 65536).toString(16).substring(1, 8).toLowerCase();
}
function hashTag(tag) {
  return hashCode(`${tag.tag}:${tag.textContent || tag.innerHTML || ""}:${Object.entries(tag.props).map(([key, value]) => `${key}:${String(value)}`).join(",")}`);
}
function computeHashes(hashes) {
  let h2 = 9;
  for (const s of hashes) {
    for (let i2 = 0; i2 < s.length; )
      h2 = Math.imul(h2 ^ s.charCodeAt(i2++), 9 ** 9);
  }
  return ((h2 ^ h2 >>> 9) + 65536).toString(16).substring(1, 8).toLowerCase();
}
function tagDedupeKey(tag, fn) {
  const { props, tag: tagName } = tag;
  if (UniqueTags.includes(tagName))
    return tagName;
  if (tagName === "link" && props.rel === "canonical")
    return "canonical";
  if (props.charset)
    return "charset";
  const name = ["id"];
  if (tagName === "meta")
    name.push(...["name", "property", "http-equiv"]);
  for (const n of name) {
    if (typeof props[n] !== "undefined") {
      const val = String(props[n]);
      if (fn && !fn(val))
        return false;
      return `${tagName}:${n}:${val}`;
    }
  }
  return false;
}
function resolveTitleTemplate(template, title) {
  if (template == null)
    return title || null;
  if (typeof template === "function")
    return template(title);
  return template;
}
const TAG_WEIGHTS = {
  // tags
  base: -1,
  title: 1
};
const TAG_ALIASES = {
  // relative scores to their default values
  critical: -8,
  high: -1,
  low: 2
};
function tagWeight(tag) {
  let weight = 10;
  const priority = tag.tagPriority;
  if (typeof priority === "number")
    return priority;
  if (tag.tag === "meta") {
    if (tag.props.charset)
      weight = -2;
    if (tag.props["http-equiv"] === "content-security-policy")
      weight = 0;
  } else if (tag.tag in TAG_WEIGHTS) {
    weight = TAG_WEIGHTS[tag.tag];
  }
  if (typeof priority === "string" && priority in TAG_ALIASES) {
    return weight + TAG_ALIASES[priority];
  }
  return weight;
}
const SortModifiers = [{ prefix: "before:", offset: -1 }, { prefix: "after:", offset: 1 }];
function SortTagsPlugin() {
  return defineHeadPlugin({
    hooks: {
      "tags:resolve": (ctx) => {
        const tagPositionForKey = (key) => {
          var _a2;
          return (_a2 = ctx.tags.find((tag) => tag._d === key)) == null ? void 0 : _a2._p;
        };
        for (const { prefix, offset } of SortModifiers) {
          for (const tag of ctx.tags.filter((tag2) => typeof tag2.tagPriority === "string" && tag2.tagPriority.startsWith(prefix))) {
            const position = tagPositionForKey(
              tag.tagPriority.replace(prefix, "")
            );
            if (typeof position !== "undefined")
              tag._p = position + offset;
          }
        }
        ctx.tags.sort((a, b) => a._p - b._p).sort((a, b) => tagWeight(a) - tagWeight(b));
      }
    }
  });
}
function TitleTemplatePlugin() {
  return defineHeadPlugin({
    hooks: {
      "tags:resolve": (ctx) => {
        const { tags } = ctx;
        let titleTemplateIdx = tags.findIndex((i2) => i2.tag === "titleTemplate");
        const titleIdx = tags.findIndex((i2) => i2.tag === "title");
        if (titleIdx !== -1 && titleTemplateIdx !== -1) {
          const newTitle = resolveTitleTemplate(
            tags[titleTemplateIdx].textContent,
            tags[titleIdx].textContent
          );
          if (newTitle !== null) {
            tags[titleIdx].textContent = newTitle || tags[titleIdx].textContent;
          } else {
            delete tags[titleIdx];
          }
        } else if (titleTemplateIdx !== -1) {
          const newTitle = resolveTitleTemplate(
            tags[titleTemplateIdx].textContent
          );
          if (newTitle !== null) {
            tags[titleTemplateIdx].textContent = newTitle;
            tags[titleTemplateIdx].tag = "title";
            titleTemplateIdx = -1;
          }
        }
        if (titleTemplateIdx !== -1) {
          delete tags[titleTemplateIdx];
        }
        ctx.tags = tags.filter(Boolean);
      }
    }
  });
}
function DeprecatedTagAttrPlugin() {
  return defineHeadPlugin({
    hooks: {
      "tag:normalise": function({ tag }) {
        if (typeof tag.props.body !== "undefined") {
          tag.tagPosition = "bodyClose";
          delete tag.props.body;
        }
      }
    }
  });
}
const DupeableTags = ["link", "style", "script", "noscript"];
function ProvideTagHashPlugin() {
  return defineHeadPlugin({
    hooks: {
      "tag:normalise": ({ tag, resolvedOptions }) => {
        if (resolvedOptions.experimentalHashHydration === true) {
          tag._h = hashTag(tag);
        }
        if (tag.key && DupeableTags.includes(tag.tag)) {
          tag._h = hashCode(tag.key);
          tag.props[`data-h-${tag._h}`] = "";
        }
      }
    }
  });
}
const ValidEventTags = ["script", "link", "bodyAttrs"];
function EventHandlersPlugin() {
  const stripEventHandlers = (mode, tag) => {
    const props = {};
    const eventHandlers = {};
    Object.entries(tag.props).forEach(([key, value]) => {
      if (key.startsWith("on") && typeof value === "function")
        eventHandlers[key] = value;
      else
        props[key] = value;
    });
    let delayedSrc;
    if (mode === "dom" && tag.tag === "script" && typeof props.src === "string" && typeof eventHandlers.onload !== "undefined") {
      delayedSrc = props.src;
      delete props.src;
    }
    return { props, eventHandlers, delayedSrc };
  };
  return defineHeadPlugin({
    hooks: {
      "ssr:render": function(ctx) {
        ctx.tags = ctx.tags.map((tag) => {
          if (!ValidEventTags.includes(tag.tag))
            return tag;
          if (!Object.entries(tag.props).find(([key, value]) => key.startsWith("on") && typeof value === "function"))
            return tag;
          tag.props = stripEventHandlers("ssr", tag).props;
          return tag;
        });
      },
      "dom:beforeRenderTag": function(ctx) {
        if (!ValidEventTags.includes(ctx.tag.tag))
          return;
        if (!Object.entries(ctx.tag.props).find(([key, value]) => key.startsWith("on") && typeof value === "function"))
          return;
        const { props, eventHandlers, delayedSrc } = stripEventHandlers("dom", ctx.tag);
        if (!Object.keys(eventHandlers).length)
          return;
        ctx.tag.props = props;
        ctx.tag._eventHandlers = eventHandlers;
        ctx.tag._delayedSrc = delayedSrc;
      },
      "dom:renderTag": function(ctx) {
        const $el = ctx.$el;
        if (!ctx.tag._eventHandlers || !$el)
          return;
        const $eventListenerTarget = ctx.tag.tag === "bodyAttrs" && false ? window : $el;
        Object.entries(ctx.tag._eventHandlers).forEach(([k, value]) => {
          const sdeKey = `${ctx.tag._d || ctx.tag._p}:${k}`;
          const eventName = k.slice(2).toLowerCase();
          const eventDedupeKey = `data-h-${eventName}`;
          ctx.markSideEffect(sdeKey, () => {
          });
          if ($el.hasAttribute(eventDedupeKey))
            return;
          const handler = value;
          $el.setAttribute(eventDedupeKey, "");
          $eventListenerTarget.addEventListener(eventName, handler);
          if (ctx.entry) {
            ctx.entry._sde[sdeKey] = () => {
              $eventListenerTarget.removeEventListener(eventName, handler);
              $el.removeAttribute(eventDedupeKey);
            };
          }
        });
        if (ctx.tag._delayedSrc) {
          $el.setAttribute("src", ctx.tag._delayedSrc);
        }
      }
    }
  });
}
const UsesMergeStrategy = ["templateParams", "htmlAttrs", "bodyAttrs"];
function DedupesTagsPlugin() {
  return defineHeadPlugin({
    hooks: {
      "tag:normalise": function({ tag }) {
        ["hid", "vmid", "key"].forEach((key) => {
          if (tag.props[key]) {
            tag.key = tag.props[key];
            delete tag.props[key];
          }
        });
        const generatedKey = tagDedupeKey(tag);
        const dedupe = generatedKey || (tag.key ? `${tag.tag}:${tag.key}` : false);
        if (dedupe)
          tag._d = dedupe;
      },
      "tags:resolve": function(ctx) {
        const deduping = {};
        ctx.tags.forEach((tag) => {
          const dedupeKey = (tag.key ? `${tag.tag}:${tag.key}` : tag._d) || tag._p;
          const dupedTag = deduping[dedupeKey];
          if (dupedTag) {
            let strategy = tag == null ? void 0 : tag.tagDuplicateStrategy;
            if (!strategy && UsesMergeStrategy.includes(tag.tag))
              strategy = "merge";
            if (strategy === "merge") {
              const oldProps = dupedTag.props;
              ["class", "style"].forEach((key) => {
                if (tag.props[key] && oldProps[key]) {
                  if (key === "style" && !oldProps[key].endsWith(";"))
                    oldProps[key] += ";";
                  tag.props[key] = `${oldProps[key]} ${tag.props[key]}`;
                }
              });
              deduping[dedupeKey].props = {
                ...oldProps,
                ...tag.props
              };
              return;
            } else if (tag._e === dupedTag._e) {
              dupedTag._duped = dupedTag._duped || [];
              tag._d = `${dupedTag._d}:${dupedTag._duped.length + 1}`;
              dupedTag._duped.push(tag);
              return;
            } else if (tagWeight(tag) > tagWeight(dupedTag)) {
              return;
            }
          }
          const propCount = Object.keys(tag.props).length + (tag.innerHTML ? 1 : 0) + (tag.textContent ? 1 : 0);
          if (HasElementTags.includes(tag.tag) && propCount === 0) {
            delete deduping[dedupeKey];
            return;
          }
          deduping[dedupeKey] = tag;
        });
        const newTags = [];
        Object.values(deduping).forEach((tag) => {
          const dupes = tag._duped;
          delete tag._duped;
          newTags.push(tag);
          if (dupes)
            newTags.push(...dupes);
        });
        ctx.tags = newTags;
      }
    }
  });
}
function processTemplateParams(s, config) {
  function sub(token) {
    if (["s", "pageTitle"].includes(token))
      return config.pageTitle;
    let val;
    if (token.includes(".")) {
      val = token.split(".").reduce((acc, key) => acc ? acc[key] || void 0 : void 0, config);
    } else {
      val = config[token];
    }
    return typeof val !== "undefined" ? val || "" : false;
  }
  let decoded = s;
  try {
    decoded = decodeURI(s);
  } catch {
  }
  const tokens = (decoded.match(/%(\w+\.+\w+)|%(\w+)/g) || []).sort().reverse();
  tokens.forEach((token) => {
    const re2 = sub(token.slice(1));
    if (typeof re2 === "string") {
      s = s.replace(new RegExp(`\\${token}(\\W|$)`, "g"), `${re2}$1`).trim();
    }
  });
  if (config.separator) {
    if (s.endsWith(config.separator))
      s = s.slice(0, -config.separator.length).trim();
    if (s.startsWith(config.separator))
      s = s.slice(config.separator.length).trim();
    s = s.replace(new RegExp(`\\${config.separator}\\s*\\${config.separator}`, "g"), config.separator);
  }
  return s;
}
function TemplateParamsPlugin() {
  return defineHeadPlugin({
    hooks: {
      "tags:resolve": (ctx) => {
        var _a2;
        const { tags } = ctx;
        const title = (_a2 = tags.find((tag) => tag.tag === "title")) == null ? void 0 : _a2.textContent;
        const idx = tags.findIndex((tag) => tag.tag === "templateParams");
        const params = idx !== -1 ? tags[idx].props : {};
        params.pageTitle = params.pageTitle || title || "";
        for (const tag of tags) {
          if (["titleTemplate", "title"].includes(tag.tag) && typeof tag.textContent === "string") {
            tag.textContent = processTemplateParams(tag.textContent, params);
          } else if (tag.tag === "meta" && typeof tag.props.content === "string") {
            tag.props.content = processTemplateParams(tag.props.content, params);
          } else if (tag.tag === "link" && typeof tag.props.href === "string") {
            tag.props.href = processTemplateParams(tag.props.href, params);
          } else if (tag.tag === "script" && ["application/json", "application/ld+json"].includes(tag.props.type) && typeof tag.innerHTML === "string") {
            try {
              tag.innerHTML = JSON.stringify(JSON.parse(tag.innerHTML), (key, val) => {
                if (typeof val === "string")
                  return processTemplateParams(val, params);
                return val;
              });
            } catch {
            }
          }
        }
        ctx.tags = tags.filter((tag) => tag.tag !== "templateParams");
      }
    }
  });
}
let activeHead;
function setActiveHead(head) {
  return activeHead = head;
}
function getActiveHead() {
  return activeHead;
}
async function normaliseTag(tagName, input) {
  const tag = { tag: tagName, props: {} };
  if (input instanceof Promise)
    input = await input;
  if (tagName === "templateParams") {
    tag.props = input;
    return tag;
  }
  if (["title", "titleTemplate"].includes(tagName)) {
    if (input && typeof input === "object") {
      tag.textContent = input.textContent;
      if (input.tagPriority)
        tag.tagPriority = input.tagPriority;
    } else {
      tag.textContent = input;
    }
    return tag;
  }
  if (typeof input === "string") {
    if (!["script", "noscript", "style"].includes(tagName))
      return false;
    if (tagName === "script" && (/^(https?:)?\/\//.test(input) || input.startsWith("/")))
      tag.props.src = input;
    else
      tag.innerHTML = input;
    return tag;
  }
  tag.props = await normaliseProps(tagName, { ...input });
  if (tag.props.children) {
    tag.props.innerHTML = tag.props.children;
  }
  delete tag.props.children;
  Object.keys(tag.props).filter((k) => TagConfigKeys.includes(k)).forEach((k) => {
    if (!["innerHTML", "textContent"].includes(k) || TagsWithInnerContent.includes(tag.tag)) {
      tag[k] = tag.props[k];
    }
    delete tag.props[k];
  });
  ["innerHTML", "textContent"].forEach((k) => {
    if (tag.tag === "script" && typeof tag[k] === "string" && ["application/ld+json", "application/json"].includes(tag.props.type)) {
      try {
        tag[k] = JSON.parse(tag[k]);
      } catch (e2) {
        tag[k] = "";
      }
    }
    if (typeof tag[k] === "object")
      tag[k] = JSON.stringify(tag[k]);
  });
  if (tag.props.class)
    tag.props.class = normaliseClassProp(tag.props.class);
  if (tag.props.content && Array.isArray(tag.props.content))
    return tag.props.content.map((v2) => ({ ...tag, props: { ...tag.props, content: v2 } }));
  return tag;
}
function normaliseClassProp(v2) {
  if (typeof v2 === "object" && !Array.isArray(v2)) {
    v2 = Object.keys(v2).filter((k) => v2[k]);
  }
  return (Array.isArray(v2) ? v2.join(" ") : v2).split(" ").filter((c) => c.trim()).filter(Boolean).join(" ");
}
async function normaliseProps(tagName, props) {
  for (const k of Object.keys(props)) {
    const isDataKey = k.startsWith("data-");
    if (props[k] instanceof Promise) {
      props[k] = await props[k];
    }
    if (String(props[k]) === "true") {
      props[k] = isDataKey ? "true" : "";
    } else if (String(props[k]) === "false") {
      if (isDataKey) {
        props[k] = "false";
      } else {
        delete props[k];
      }
    }
  }
  return props;
}
const TagEntityBits = 10;
async function normaliseEntryTags(e2) {
  const tagPromises = [];
  Object.entries(e2.resolvedInput).filter(([k, v2]) => typeof v2 !== "undefined" && ValidHeadTags.includes(k)).forEach(([k, value]) => {
    const v2 = asArray(value);
    tagPromises.push(...v2.map((props) => normaliseTag(k, props)).flat());
  });
  return (await Promise.all(tagPromises)).flat().filter(Boolean).map((t2, i2) => {
    t2._e = e2._i;
    t2._p = (e2._i << TagEntityBits) + i2;
    return t2;
  });
}
function CorePlugins() {
  return [
    // dedupe needs to come first
    DedupesTagsPlugin(),
    SortTagsPlugin(),
    TemplateParamsPlugin(),
    TitleTemplatePlugin(),
    ProvideTagHashPlugin(),
    EventHandlersPlugin(),
    DeprecatedTagAttrPlugin()
  ];
}
function createServerHead$1(options = {}) {
  const head = createHeadCore(options);
  setActiveHead(head);
  return head;
}
function createHeadCore(options = {}) {
  let entries = [];
  let _sde = {};
  let _eid = 0;
  const hooks = createHooks();
  if (options == null ? void 0 : options.hooks)
    hooks.addHooks(options.hooks);
  options.plugins = [
    ...CorePlugins(),
    ...(options == null ? void 0 : options.plugins) || []
  ];
  options.plugins.forEach((p2) => p2.hooks && hooks.addHooks(p2.hooks));
  options.document = options.document || void 0;
  const updated = () => hooks.callHook("entries:updated", head);
  const head = {
    resolvedOptions: options,
    headEntries() {
      return entries;
    },
    get hooks() {
      return hooks;
    },
    use(plugin) {
      if (plugin.hooks)
        hooks.addHooks(plugin.hooks);
    },
    push(input, options2) {
      const activeEntry = {
        _i: _eid++,
        input,
        _sde: {}
      };
      if (options2 == null ? void 0 : options2.mode)
        activeEntry._m = options2 == null ? void 0 : options2.mode;
      if (options2 == null ? void 0 : options2.transform) {
        activeEntry._t = options2 == null ? void 0 : options2.transform;
      }
      entries.push(activeEntry);
      updated();
      return {
        dispose() {
          entries = entries.filter((e2) => {
            if (e2._i !== activeEntry._i)
              return true;
            _sde = { ..._sde, ...e2._sde || {} };
            e2._sde = {};
            updated();
            return false;
          });
        },
        // a patch is the same as creating a new entry, just a nice DX
        patch(input2) {
          entries = entries.map((e2) => {
            if (e2._i === activeEntry._i) {
              activeEntry.input = e2.input = input2;
              updated();
            }
            return e2;
          });
        }
      };
    },
    async resolveTags() {
      const resolveCtx = { tags: [], entries: [...entries] };
      await hooks.callHook("entries:resolve", resolveCtx);
      for (const entry2 of resolveCtx.entries) {
        const transformer = entry2._t || ((i2) => i2);
        entry2.resolvedInput = transformer(entry2.resolvedInput || entry2.input);
        if (entry2.resolvedInput) {
          for (const tag of await normaliseEntryTags(entry2)) {
            const tagCtx = { tag, entry: entry2, resolvedOptions: head.resolvedOptions };
            await hooks.callHook("tag:normalise", tagCtx);
            resolveCtx.tags.push(tagCtx.tag);
          }
        }
      }
      await hooks.callHook("tags:resolve", resolveCtx);
      return resolveCtx.tags;
    },
    _popSideEffectQueue() {
      const sde = { ..._sde };
      _sde = {};
      return sde;
    },
    _elMap: {}
  };
  head.hooks.callHook("init", head);
  return head;
}
function resolveUnref(r2) {
  return typeof r2 === "function" ? r2() : unref(r2);
}
function resolveUnrefHeadInput(ref2, lastKey = "") {
  if (ref2 instanceof Promise)
    return ref2;
  const root = resolveUnref(ref2);
  if (!ref2 || !root)
    return root;
  if (Array.isArray(root))
    return root.map((r2) => resolveUnrefHeadInput(r2, lastKey));
  if (typeof root === "object") {
    return Object.fromEntries(
      Object.entries(root).map(([k, v2]) => {
        if (k === "titleTemplate" || k.startsWith("on"))
          return [k, unref(v2)];
        return [k, resolveUnrefHeadInput(v2, k)];
      })
    );
  }
  return root;
}
const Vue3 = version.startsWith("3");
const headSymbol = "usehead";
function injectHead() {
  return getCurrentInstance() && inject(headSymbol) || getActiveHead();
}
function vueInstall(head) {
  const plugin = {
    install(app) {
      if (Vue3) {
        app.config.globalProperties.$unhead = head;
        app.config.globalProperties.$head = head;
        app.provide(headSymbol, head);
      }
    }
  };
  return plugin.install;
}
function createServerHead(options = {}) {
  const head = createServerHead$1({
    ...options,
    plugins: [
      VueReactiveUseHeadPlugin(),
      ...(options == null ? void 0 : options.plugins) || []
    ]
  });
  head.install = vueInstall(head);
  return head;
}
function VueReactiveUseHeadPlugin() {
  return defineHeadPlugin({
    hooks: {
      "entries:resolve": function(ctx) {
        for (const entry2 of ctx.entries)
          entry2.resolvedInput = resolveUnrefHeadInput(entry2.input);
      }
    }
  });
}
function clientUseHead(input, options = {}) {
  const head = injectHead();
  const deactivated = ref(false);
  const resolvedInput = ref({});
  watchEffect(() => {
    resolvedInput.value = deactivated.value ? {} : resolveUnrefHeadInput(input);
  });
  const entry2 = head.push(resolvedInput.value, options);
  watch(resolvedInput, (e2) => {
    entry2.patch(e2);
  });
  getCurrentInstance();
  return entry2;
}
function serverUseHead(input, options = {}) {
  const head = injectHead();
  return head.push(input, options);
}
function useHead(input, options = {}) {
  var _a2;
  const head = injectHead();
  if (head) {
    const isBrowser = !!((_a2 = head.resolvedOptions) == null ? void 0 : _a2.document);
    if (options.mode === "server" && isBrowser || options.mode === "client" && !isBrowser)
      return;
    return isBrowser ? clientUseHead(input, options) : serverUseHead(input, options);
  }
}
const appHead = { "meta": [{ "name": "viewport", "content": "width=device-width, initial-scale=1" }, { "charset": "utf-8" }], "link": [], "style": [], "script": [], "noscript": [] };
function definePayloadReducer(name, reduce) {
  {
    useNuxtApp().ssrContext._payloadReducers[name] = reduce;
  }
}
const reducers = {
  NuxtError: (data) => isNuxtError(data) && data.toJSON(),
  EmptyShallowRef: (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_"),
  EmptyRef: (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_"),
  ShallowRef: (data) => isRef(data) && isShallow(data) && data.value,
  ShallowReactive: (data) => isReactive(data) && isShallow(data) && toRaw(data),
  Ref: (data) => isRef(data) && data.value,
  Reactive: (data) => isReactive(data) && toRaw(data)
};
const revive_payload_server_a1IRQ0BZYW = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const reducer in reducers) {
      definePayloadReducer(reducer, reducers[reducer]);
    }
  }
});
const components_plugin_KR1HBZs4kY = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:global-components"
});
function propsToString(props) {
  const handledAttributes = [];
  for (const [key, value] of Object.entries(props)) {
    if (value === false || value == null)
      continue;
    let attribute = key;
    if (value !== true)
      attribute += `="${String(value).replace(/"/g, "&quot;")}"`;
    handledAttributes.push(attribute);
  }
  return handledAttributes.length > 0 ? ` ${handledAttributes.join(" ")}` : "";
}
function encodeInnerHtml(str) {
  return str.replace(/[&<>"'/]/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#x27;";
      case "/":
        return "&#x2F;";
      default:
        return char;
    }
  });
}
function tagToString(tag) {
  const attrs = propsToString(tag.props);
  const openTag = `<${tag.tag}${attrs}>`;
  if (!TagsWithInnerContent.includes(tag.tag))
    return SelfClosingTags.includes(tag.tag) ? openTag : `${openTag}</${tag.tag}>`;
  let content = String(tag.innerHTML || "");
  if (tag.textContent)
    content = encodeInnerHtml(String(tag.textContent));
  return SelfClosingTags.includes(tag.tag) ? openTag : `${openTag}${content}</${tag.tag}>`;
}
function ssrRenderTags(tags) {
  const schema = { htmlAttrs: {}, bodyAttrs: {}, tags: { head: [], bodyClose: [], bodyOpen: [] } };
  for (const tag of tags) {
    if (tag.tag === "htmlAttrs" || tag.tag === "bodyAttrs") {
      schema[tag.tag] = { ...schema[tag.tag], ...tag.props };
      continue;
    }
    schema.tags[tag.tagPosition || "head"].push(tagToString(tag));
  }
  return {
    headTags: schema.tags.head.join("\n"),
    bodyTags: schema.tags.bodyClose.join("\n"),
    bodyTagsOpen: schema.tags.bodyOpen.join("\n"),
    htmlAttrs: propsToString(schema.htmlAttrs),
    bodyAttrs: propsToString(schema.bodyAttrs)
  };
}
async function renderSSRHead(head) {
  const beforeRenderCtx = { shouldRender: true };
  await head.hooks.callHook("ssr:beforeRender", beforeRenderCtx);
  if (!beforeRenderCtx.shouldRender) {
    return {
      headTags: "",
      bodyTags: "",
      bodyTagsOpen: "",
      htmlAttrs: "",
      bodyAttrs: ""
    };
  }
  const ctx = { tags: await head.resolveTags() };
  if (head.resolvedOptions.experimentalHashHydration) {
    ctx.tags.push({
      tag: "meta",
      props: {
        name: "unhead:ssr",
        content: computeHashes(
          ctx.tags.filter((t2) => {
            const entry2 = head.headEntries().find((entry22) => entry22._i === t2._e);
            return (entry2 == null ? void 0 : entry2._m) !== "server";
          }).map((tag) => tag._h)
        )
      }
    });
  }
  await head.hooks.callHook("ssr:render", ctx);
  const html = ssrRenderTags(ctx.tags);
  const renderCtx = { tags: ctx.tags, html };
  await head.hooks.callHook("ssr:rendered", renderCtx);
  return renderCtx.html;
}
const unhead_o7fDbVBwXy = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:head",
  setup(nuxtApp) {
    const createHead = createServerHead;
    const head = createHead();
    head.push(appHead);
    nuxtApp.vueApp.use(head);
    {
      nuxtApp.ssrContext.renderMeta = async () => {
        const meta = await renderSSRHead(head);
        return {
          ...meta,
          bodyScriptsPrepend: meta.bodyTagsOpen,
          // resolves naming difference with NuxtMeta and Unhead
          bodyScripts: meta.bodyTags
        };
      };
    }
  }
});
const plugins = [
  router_HMfTuACkZs,
  revive_payload_server_a1IRQ0BZYW,
  components_plugin_KR1HBZs4kY,
  unhead_o7fDbVBwXy
];
const __nuxt_component_0 = /* @__PURE__ */ defineComponent({
  name: "ClientOnly",
  inheritAttrs: false,
  // eslint-disable-next-line vue/require-prop-types
  props: ["fallback", "placeholder", "placeholderTag", "fallbackTag"],
  setup(_2, { slots, attrs }) {
    const mounted = ref(false);
    return (props) => {
      var _a2;
      if (mounted.value) {
        return (_a2 = slots.default) == null ? void 0 : _a2.call(slots);
      }
      const slot = slots.fallback || slots.placeholder;
      if (slot) {
        return slot();
      }
      const fallbackStr = props.fallback || props.placeholder || "";
      const fallbackTag = props.fallbackTag || props.placeholderTag || "span";
      return createElementBlock(fallbackTag, attrs, fallbackStr);
    };
  }
});
var Zn = {
  "application/andrew-inset": {
    source: "iana",
    extensions: ["ez"],
    compressible: null
  },
  "application/applixware": {
    source: "apache",
    extensions: ["aw"],
    compressible: null
  },
  "application/atom+xml": {
    source: "iana",
    compressible: true,
    extensions: ["atom"]
  },
  "application/atomcat+xml": {
    source: "iana",
    compressible: true,
    extensions: ["atomcat"]
  },
  "application/atomdeleted+xml": {
    source: "iana",
    compressible: true,
    extensions: ["atomdeleted"]
  },
  "application/atomsvc+xml": {
    source: "iana",
    compressible: true,
    extensions: ["atomsvc"]
  },
  "application/atsc-dwd+xml": {
    source: "iana",
    compressible: true,
    extensions: ["dwd"]
  },
  "application/atsc-held+xml": {
    source: "iana",
    compressible: true,
    extensions: ["held"]
  },
  "application/atsc-rsat+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rsat"]
  },
  "application/calendar+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xcs"]
  },
  "application/ccxml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["ccxml"]
  },
  "application/cdfx+xml": {
    source: "iana",
    compressible: true,
    extensions: ["cdfx"]
  },
  "application/cdmi-capability": {
    source: "iana",
    extensions: ["cdmia"],
    compressible: null
  },
  "application/cdmi-container": {
    source: "iana",
    extensions: ["cdmic"],
    compressible: null
  },
  "application/cdmi-domain": {
    source: "iana",
    extensions: ["cdmid"],
    compressible: null
  },
  "application/cdmi-object": {
    source: "iana",
    extensions: ["cdmio"],
    compressible: null
  },
  "application/cdmi-queue": {
    source: "iana",
    extensions: ["cdmiq"],
    compressible: null
  },
  "application/cpl+xml": {
    source: "iana",
    compressible: true,
    extensions: ["cpl"]
  },
  "application/cu-seeme": {
    source: "apache",
    extensions: ["cu"],
    compressible: null
  },
  "application/dash+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mpd"]
  },
  "application/dash-patch+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mpp"]
  },
  "application/davmount+xml": {
    source: "iana",
    compressible: true,
    extensions: ["davmount"]
  },
  "application/docbook+xml": {
    source: "apache",
    compressible: true,
    extensions: ["dbk"]
  },
  "application/dssc+der": {
    source: "iana",
    extensions: ["dssc"],
    compressible: null
  },
  "application/dssc+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xdssc"]
  },
  "application/ecmascript": {
    source: "iana",
    compressible: true,
    extensions: ["es", "ecma"]
  },
  "application/emma+xml": {
    source: "iana",
    compressible: true,
    extensions: ["emma"]
  },
  "application/emotionml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["emotionml"]
  },
  "application/epub+zip": {
    source: "iana",
    compressible: false,
    extensions: ["epub"]
  },
  "application/exi": {
    source: "iana",
    extensions: ["exi"],
    compressible: null
  },
  "application/express": {
    source: "iana",
    extensions: ["exp"],
    compressible: null
  },
  "application/fdt+xml": {
    source: "iana",
    compressible: true,
    extensions: ["fdt"]
  },
  "application/font-tdpfr": {
    source: "iana",
    extensions: ["pfr"],
    compressible: null
  },
  "application/geo+json": {
    source: "iana",
    compressible: true,
    extensions: ["geojson"]
  },
  "application/gml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["gml"]
  },
  "application/gpx+xml": {
    source: "apache",
    compressible: true,
    extensions: ["gpx"]
  },
  "application/gxf": {
    source: "apache",
    extensions: ["gxf"],
    compressible: null
  },
  "application/gzip": {
    source: "iana",
    compressible: false,
    extensions: ["gz"]
  },
  "application/hyperstudio": {
    source: "iana",
    extensions: ["stk"],
    compressible: null
  },
  "application/inkml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["ink", "inkml"]
  },
  "application/ipfix": {
    source: "iana",
    extensions: ["ipfix"],
    compressible: null
  },
  "application/its+xml": {
    source: "iana",
    compressible: true,
    extensions: ["its"]
  },
  "application/java-archive": {
    source: "apache",
    compressible: false,
    extensions: ["jar", "war", "ear"]
  },
  "application/java-serialized-object": {
    source: "apache",
    compressible: false,
    extensions: ["ser"]
  },
  "application/java-vm": {
    source: "apache",
    compressible: false,
    extensions: ["class"]
  },
  "application/javascript": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["js", "mjs"]
  },
  "application/json": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["json", "map"]
  },
  "application/jsonml+json": {
    source: "apache",
    compressible: true,
    extensions: ["jsonml"]
  },
  "application/ld+json": {
    source: "iana",
    compressible: true,
    extensions: ["jsonld"]
  },
  "application/lgr+xml": {
    source: "iana",
    compressible: true,
    extensions: ["lgr"]
  },
  "application/lost+xml": {
    source: "iana",
    compressible: true,
    extensions: ["lostxml"]
  },
  "application/mac-binhex40": {
    source: "iana",
    extensions: ["hqx"],
    compressible: null
  },
  "application/mac-compactpro": {
    source: "apache",
    extensions: ["cpt"],
    compressible: null
  },
  "application/mads+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mads"]
  },
  "application/manifest+json": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["webmanifest"]
  },
  "application/marc": {
    source: "iana",
    extensions: ["mrc"],
    compressible: null
  },
  "application/marcxml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mrcx"]
  },
  "application/mathematica": {
    source: "iana",
    extensions: ["ma", "nb", "mb"],
    compressible: null
  },
  "application/mathml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mathml"]
  },
  "application/mbox": {
    source: "iana",
    extensions: ["mbox"],
    compressible: null
  },
  "application/media-policy-dataset+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mpf"]
  },
  "application/mediaservercontrol+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mscml"]
  },
  "application/metalink+xml": {
    source: "apache",
    compressible: true,
    extensions: ["metalink"]
  },
  "application/metalink4+xml": {
    source: "iana",
    compressible: true,
    extensions: ["meta4"]
  },
  "application/mets+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mets"]
  },
  "application/mmt-aei+xml": {
    source: "iana",
    compressible: true,
    extensions: ["maei"]
  },
  "application/mmt-usd+xml": {
    source: "iana",
    compressible: true,
    extensions: ["musd"]
  },
  "application/mods+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mods"]
  },
  "application/mp21": {
    source: "iana",
    extensions: ["m21", "mp21"],
    compressible: null
  },
  "application/mp4": {
    source: "iana",
    extensions: ["mp4s", "m4p"],
    compressible: null
  },
  "application/msword": {
    source: "iana",
    compressible: false,
    extensions: ["doc", "dot"]
  },
  "application/mxf": {
    source: "iana",
    extensions: ["mxf"],
    compressible: null
  },
  "application/n-quads": {
    source: "iana",
    extensions: ["nq"],
    compressible: null
  },
  "application/n-triples": {
    source: "iana",
    extensions: ["nt"],
    compressible: null
  },
  "application/node": {
    source: "iana",
    extensions: ["cjs"],
    compressible: null
  },
  "application/octet-stream": {
    source: "iana",
    compressible: false,
    extensions: [
      "bin",
      "dms",
      "lrf",
      "mar",
      "so",
      "dist",
      "distz",
      "pkg",
      "bpk",
      "dump",
      "elc",
      "deploy",
      "exe",
      "dll",
      "deb",
      "dmg",
      "iso",
      "img",
      "msi",
      "msp",
      "msm",
      "buffer"
    ]
  },
  "application/oda": {
    source: "iana",
    extensions: ["oda"],
    compressible: null
  },
  "application/oebps-package+xml": {
    source: "iana",
    compressible: true,
    extensions: ["opf"]
  },
  "application/ogg": {
    source: "iana",
    compressible: false,
    extensions: ["ogx"]
  },
  "application/omdoc+xml": {
    source: "apache",
    compressible: true,
    extensions: ["omdoc"]
  },
  "application/onenote": {
    source: "apache",
    extensions: ["onetoc", "onetoc2", "onetmp", "onepkg"],
    compressible: null
  },
  "application/oxps": {
    source: "iana",
    extensions: ["oxps"],
    compressible: null
  },
  "application/p2p-overlay+xml": {
    source: "iana",
    compressible: true,
    extensions: ["relo"]
  },
  "application/patch-ops-error+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xer"]
  },
  "application/pdf": {
    source: "iana",
    compressible: false,
    extensions: ["pdf"]
  },
  "application/pgp-encrypted": {
    source: "iana",
    compressible: false,
    extensions: ["pgp"]
  },
  "application/pgp-keys": {
    source: "iana",
    extensions: ["asc"],
    compressible: null
  },
  "application/pgp-signature": {
    source: "iana",
    extensions: ["asc", "sig"],
    compressible: null
  },
  "application/pics-rules": {
    source: "apache",
    extensions: ["prf"],
    compressible: null
  },
  "application/pkcs10": {
    source: "iana",
    extensions: ["p10"],
    compressible: null
  },
  "application/pkcs7-mime": {
    source: "iana",
    extensions: ["p7m", "p7c"],
    compressible: null
  },
  "application/pkcs7-signature": {
    source: "iana",
    extensions: ["p7s"],
    compressible: null
  },
  "application/pkcs8": {
    source: "iana",
    extensions: ["p8"],
    compressible: null
  },
  "application/pkix-attr-cert": {
    source: "iana",
    extensions: ["ac"],
    compressible: null
  },
  "application/pkix-cert": {
    source: "iana",
    extensions: ["cer"],
    compressible: null
  },
  "application/pkix-crl": {
    source: "iana",
    extensions: ["crl"],
    compressible: null
  },
  "application/pkix-pkipath": {
    source: "iana",
    extensions: ["pkipath"],
    compressible: null
  },
  "application/pkixcmp": {
    source: "iana",
    extensions: ["pki"],
    compressible: null
  },
  "application/pls+xml": {
    source: "iana",
    compressible: true,
    extensions: ["pls"]
  },
  "application/postscript": {
    source: "iana",
    compressible: true,
    extensions: ["ai", "eps", "ps"]
  },
  "application/provenance+xml": {
    source: "iana",
    compressible: true,
    extensions: ["provx"]
  },
  "application/prs.cww": {
    source: "iana",
    extensions: ["cww"],
    compressible: null
  },
  "application/pskc+xml": {
    source: "iana",
    compressible: true,
    extensions: ["pskcxml"]
  },
  "application/rdf+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rdf", "owl"]
  },
  "application/reginfo+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rif"]
  },
  "application/relax-ng-compact-syntax": {
    source: "iana",
    extensions: ["rnc"],
    compressible: null
  },
  "application/resource-lists+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rl"]
  },
  "application/resource-lists-diff+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rld"]
  },
  "application/rls-services+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rs"]
  },
  "application/route-apd+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rapd"]
  },
  "application/route-s-tsid+xml": {
    source: "iana",
    compressible: true,
    extensions: ["sls"]
  },
  "application/route-usd+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rusd"]
  },
  "application/rpki-ghostbusters": {
    source: "iana",
    extensions: ["gbr"],
    compressible: null
  },
  "application/rpki-manifest": {
    source: "iana",
    extensions: ["mft"],
    compressible: null
  },
  "application/rpki-roa": {
    source: "iana",
    extensions: ["roa"],
    compressible: null
  },
  "application/rsd+xml": {
    source: "apache",
    compressible: true,
    extensions: ["rsd"]
  },
  "application/rss+xml": {
    source: "apache",
    compressible: true,
    extensions: ["rss"]
  },
  "application/rtf": {
    source: "iana",
    compressible: true,
    extensions: ["rtf"]
  },
  "application/sbml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["sbml"]
  },
  "application/scvp-cv-request": {
    source: "iana",
    extensions: ["scq"],
    compressible: null
  },
  "application/scvp-cv-response": {
    source: "iana",
    extensions: ["scs"],
    compressible: null
  },
  "application/scvp-vp-request": {
    source: "iana",
    extensions: ["spq"],
    compressible: null
  },
  "application/scvp-vp-response": {
    source: "iana",
    extensions: ["spp"],
    compressible: null
  },
  "application/sdp": {
    source: "iana",
    extensions: ["sdp"],
    compressible: null
  },
  "application/senml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["senmlx"]
  },
  "application/sensml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["sensmlx"]
  },
  "application/set-payment-initiation": {
    source: "iana",
    extensions: ["setpay"],
    compressible: null
  },
  "application/set-registration-initiation": {
    source: "iana",
    extensions: ["setreg"],
    compressible: null
  },
  "application/shf+xml": {
    source: "iana",
    compressible: true,
    extensions: ["shf"]
  },
  "application/sieve": {
    source: "iana",
    extensions: ["siv", "sieve"],
    compressible: null
  },
  "application/smil+xml": {
    source: "iana",
    compressible: true,
    extensions: ["smi", "smil"]
  },
  "application/sparql-query": {
    source: "iana",
    extensions: ["rq"],
    compressible: null
  },
  "application/sparql-results+xml": {
    source: "iana",
    compressible: true,
    extensions: ["srx"]
  },
  "application/srgs": {
    source: "iana",
    extensions: ["gram"],
    compressible: null
  },
  "application/srgs+xml": {
    source: "iana",
    compressible: true,
    extensions: ["grxml"]
  },
  "application/sru+xml": {
    source: "iana",
    compressible: true,
    extensions: ["sru"]
  },
  "application/ssdl+xml": {
    source: "apache",
    compressible: true,
    extensions: ["ssdl"]
  },
  "application/ssml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["ssml"]
  },
  "application/swid+xml": {
    source: "iana",
    compressible: true,
    extensions: ["swidtag"]
  },
  "application/tei+xml": {
    source: "iana",
    compressible: true,
    extensions: ["tei", "teicorpus"]
  },
  "application/thraud+xml": {
    source: "iana",
    compressible: true,
    extensions: ["tfi"]
  },
  "application/timestamped-data": {
    source: "iana",
    extensions: ["tsd"],
    compressible: null
  },
  "application/trig": {
    source: "iana",
    extensions: ["trig"],
    compressible: null
  },
  "application/ttml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["ttml"]
  },
  "application/urc-ressheet+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rsheet"]
  },
  "application/urc-targetdesc+xml": {
    source: "iana",
    compressible: true,
    extensions: ["td"]
  },
  "application/vnd.1000minds.decision-model+xml": {
    source: "iana",
    compressible: true,
    extensions: ["1km"]
  },
  "application/vnd.3gpp.pic-bw-large": {
    source: "iana",
    extensions: ["plb"],
    compressible: null
  },
  "application/vnd.3gpp.pic-bw-small": {
    source: "iana",
    extensions: ["psb"],
    compressible: null
  },
  "application/vnd.3gpp.pic-bw-var": {
    source: "iana",
    extensions: ["pvb"],
    compressible: null
  },
  "application/vnd.3gpp2.tcap": {
    source: "iana",
    extensions: ["tcap"],
    compressible: null
  },
  "application/vnd.3m.post-it-notes": {
    source: "iana",
    extensions: ["pwn"],
    compressible: null
  },
  "application/vnd.accpac.simply.aso": {
    source: "iana",
    extensions: ["aso"],
    compressible: null
  },
  "application/vnd.accpac.simply.imp": {
    source: "iana",
    extensions: ["imp"],
    compressible: null
  },
  "application/vnd.acucobol": {
    source: "iana",
    extensions: ["acu"],
    compressible: null
  },
  "application/vnd.acucorp": {
    source: "iana",
    extensions: ["atc", "acutc"],
    compressible: null
  },
  "application/vnd.adobe.air-application-installer-package+zip": {
    source: "apache",
    compressible: false,
    extensions: ["air"]
  },
  "application/vnd.adobe.formscentral.fcdt": {
    source: "iana",
    extensions: ["fcdt"],
    compressible: null
  },
  "application/vnd.adobe.fxp": {
    source: "iana",
    extensions: ["fxp", "fxpl"],
    compressible: null
  },
  "application/vnd.adobe.xdp+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xdp"]
  },
  "application/vnd.adobe.xfdf": {
    source: "iana",
    extensions: ["xfdf"],
    compressible: null
  },
  "application/vnd.age": {
    source: "iana",
    extensions: ["age"],
    compressible: null
  },
  "application/vnd.ahead.space": {
    source: "iana",
    extensions: ["ahead"],
    compressible: null
  },
  "application/vnd.airzip.filesecure.azf": {
    source: "iana",
    extensions: ["azf"],
    compressible: null
  },
  "application/vnd.airzip.filesecure.azs": {
    source: "iana",
    extensions: ["azs"],
    compressible: null
  },
  "application/vnd.amazon.ebook": {
    source: "apache",
    extensions: ["azw"],
    compressible: null
  },
  "application/vnd.americandynamics.acc": {
    source: "iana",
    extensions: ["acc"],
    compressible: null
  },
  "application/vnd.amiga.ami": {
    source: "iana",
    extensions: ["ami"],
    compressible: null
  },
  "application/vnd.android.package-archive": {
    source: "apache",
    compressible: false,
    extensions: ["apk"]
  },
  "application/vnd.anser-web-certificate-issue-initiation": {
    source: "iana",
    extensions: ["cii"],
    compressible: null
  },
  "application/vnd.anser-web-funds-transfer-initiation": {
    source: "apache",
    extensions: ["fti"],
    compressible: null
  },
  "application/vnd.antix.game-component": {
    source: "iana",
    extensions: ["atx"],
    compressible: null
  },
  "application/vnd.apple.installer+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mpkg"]
  },
  "application/vnd.apple.keynote": {
    source: "iana",
    extensions: ["key"],
    compressible: null
  },
  "application/vnd.apple.mpegurl": {
    source: "iana",
    extensions: ["m3u8"],
    compressible: null
  },
  "application/vnd.apple.numbers": {
    source: "iana",
    extensions: ["numbers"],
    compressible: null
  },
  "application/vnd.apple.pages": {
    source: "iana",
    extensions: ["pages"],
    compressible: null
  },
  "application/vnd.aristanetworks.swi": {
    source: "iana",
    extensions: ["swi"],
    compressible: null
  },
  "application/vnd.astraea-software.iota": {
    source: "iana",
    extensions: ["iota"],
    compressible: null
  },
  "application/vnd.audiograph": {
    source: "iana",
    extensions: ["aep"],
    compressible: null
  },
  "application/vnd.balsamiq.bmml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["bmml"]
  },
  "application/vnd.blueice.multipass": {
    source: "iana",
    extensions: ["mpm"],
    compressible: null
  },
  "application/vnd.bmi": {
    source: "iana",
    extensions: ["bmi"],
    compressible: null
  },
  "application/vnd.businessobjects": {
    source: "iana",
    extensions: ["rep"],
    compressible: null
  },
  "application/vnd.chemdraw+xml": {
    source: "iana",
    compressible: true,
    extensions: ["cdxml"]
  },
  "application/vnd.chipnuts.karaoke-mmd": {
    source: "iana",
    extensions: ["mmd"],
    compressible: null
  },
  "application/vnd.cinderella": {
    source: "iana",
    extensions: ["cdy"],
    compressible: null
  },
  "application/vnd.citationstyles.style+xml": {
    source: "iana",
    compressible: true,
    extensions: ["csl"]
  },
  "application/vnd.claymore": {
    source: "iana",
    extensions: ["cla"],
    compressible: null
  },
  "application/vnd.cloanto.rp9": {
    source: "iana",
    extensions: ["rp9"],
    compressible: null
  },
  "application/vnd.clonk.c4group": {
    source: "iana",
    extensions: ["c4g", "c4d", "c4f", "c4p", "c4u"],
    compressible: null
  },
  "application/vnd.cluetrust.cartomobile-config": {
    source: "iana",
    extensions: ["c11amc"],
    compressible: null
  },
  "application/vnd.cluetrust.cartomobile-config-pkg": {
    source: "iana",
    extensions: ["c11amz"],
    compressible: null
  },
  "application/vnd.commonspace": {
    source: "iana",
    extensions: ["csp"],
    compressible: null
  },
  "application/vnd.contact.cmsg": {
    source: "iana",
    extensions: ["cdbcmsg"],
    compressible: null
  },
  "application/vnd.cosmocaller": {
    source: "iana",
    extensions: ["cmc"],
    compressible: null
  },
  "application/vnd.crick.clicker": {
    source: "iana",
    extensions: ["clkx"],
    compressible: null
  },
  "application/vnd.crick.clicker.keyboard": {
    source: "iana",
    extensions: ["clkk"],
    compressible: null
  },
  "application/vnd.crick.clicker.palette": {
    source: "iana",
    extensions: ["clkp"],
    compressible: null
  },
  "application/vnd.crick.clicker.template": {
    source: "iana",
    extensions: ["clkt"],
    compressible: null
  },
  "application/vnd.crick.clicker.wordbank": {
    source: "iana",
    extensions: ["clkw"],
    compressible: null
  },
  "application/vnd.criticaltools.wbs+xml": {
    source: "iana",
    compressible: true,
    extensions: ["wbs"]
  },
  "application/vnd.ctc-posml": {
    source: "iana",
    extensions: ["pml"],
    compressible: null
  },
  "application/vnd.cups-ppd": {
    source: "iana",
    extensions: ["ppd"],
    compressible: null
  },
  "application/vnd.curl.car": {
    source: "apache",
    extensions: ["car"],
    compressible: null
  },
  "application/vnd.curl.pcurl": {
    source: "apache",
    extensions: ["pcurl"],
    compressible: null
  },
  "application/vnd.dart": {
    source: "iana",
    compressible: true,
    extensions: ["dart"]
  },
  "application/vnd.data-vision.rdz": {
    source: "iana",
    extensions: ["rdz"],
    compressible: null
  },
  "application/vnd.dbf": {
    source: "iana",
    extensions: ["dbf"],
    compressible: null
  },
  "application/vnd.dece.data": {
    source: "iana",
    extensions: ["uvf", "uvvf", "uvd", "uvvd"],
    compressible: null
  },
  "application/vnd.dece.ttml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["uvt", "uvvt"]
  },
  "application/vnd.dece.unspecified": {
    source: "iana",
    extensions: ["uvx", "uvvx"],
    compressible: null
  },
  "application/vnd.dece.zip": {
    source: "iana",
    extensions: ["uvz", "uvvz"],
    compressible: null
  },
  "application/vnd.denovo.fcselayout-link": {
    source: "iana",
    extensions: ["fe_launch"],
    compressible: null
  },
  "application/vnd.dna": {
    source: "iana",
    extensions: ["dna"],
    compressible: null
  },
  "application/vnd.dolby.mlp": {
    source: "apache",
    extensions: ["mlp"],
    compressible: null
  },
  "application/vnd.dpgraph": {
    source: "iana",
    extensions: ["dpg"],
    compressible: null
  },
  "application/vnd.dreamfactory": {
    source: "iana",
    extensions: ["dfac"],
    compressible: null
  },
  "application/vnd.ds-keypoint": {
    source: "apache",
    extensions: ["kpxx"],
    compressible: null
  },
  "application/vnd.dvb.ait": {
    source: "iana",
    extensions: ["ait"],
    compressible: null
  },
  "application/vnd.dvb.service": {
    source: "iana",
    extensions: ["svc"],
    compressible: null
  },
  "application/vnd.dynageo": {
    source: "iana",
    extensions: ["geo"],
    compressible: null
  },
  "application/vnd.ecowin.chart": {
    source: "iana",
    extensions: ["mag"],
    compressible: null
  },
  "application/vnd.enliven": {
    source: "iana",
    extensions: ["nml"],
    compressible: null
  },
  "application/vnd.epson.esf": {
    source: "iana",
    extensions: ["esf"],
    compressible: null
  },
  "application/vnd.epson.msf": {
    source: "iana",
    extensions: ["msf"],
    compressible: null
  },
  "application/vnd.epson.quickanime": {
    source: "iana",
    extensions: ["qam"],
    compressible: null
  },
  "application/vnd.epson.salt": {
    source: "iana",
    extensions: ["slt"],
    compressible: null
  },
  "application/vnd.epson.ssf": {
    source: "iana",
    extensions: ["ssf"],
    compressible: null
  },
  "application/vnd.eszigno3+xml": {
    source: "iana",
    compressible: true,
    extensions: ["es3", "et3"]
  },
  "application/vnd.ezpix-album": {
    source: "iana",
    extensions: ["ez2"],
    compressible: null
  },
  "application/vnd.ezpix-package": {
    source: "iana",
    extensions: ["ez3"],
    compressible: null
  },
  "application/vnd.fdf": {
    source: "iana",
    extensions: ["fdf"],
    compressible: null
  },
  "application/vnd.fdsn.mseed": {
    source: "iana",
    extensions: ["mseed"],
    compressible: null
  },
  "application/vnd.fdsn.seed": {
    source: "iana",
    extensions: ["seed", "dataless"],
    compressible: null
  },
  "application/vnd.flographit": {
    source: "iana",
    extensions: ["gph"],
    compressible: null
  },
  "application/vnd.fluxtime.clip": {
    source: "iana",
    extensions: ["ftc"],
    compressible: null
  },
  "application/vnd.framemaker": {
    source: "iana",
    extensions: ["fm", "frame", "maker", "book"],
    compressible: null
  },
  "application/vnd.frogans.fnc": {
    source: "iana",
    extensions: ["fnc"],
    compressible: null
  },
  "application/vnd.frogans.ltf": {
    source: "iana",
    extensions: ["ltf"],
    compressible: null
  },
  "application/vnd.fsc.weblaunch": {
    source: "iana",
    extensions: ["fsc"],
    compressible: null
  },
  "application/vnd.fujitsu.oasys": {
    source: "iana",
    extensions: ["oas"],
    compressible: null
  },
  "application/vnd.fujitsu.oasys2": {
    source: "iana",
    extensions: ["oa2"],
    compressible: null
  },
  "application/vnd.fujitsu.oasys3": {
    source: "iana",
    extensions: ["oa3"],
    compressible: null
  },
  "application/vnd.fujitsu.oasysgp": {
    source: "iana",
    extensions: ["fg5"],
    compressible: null
  },
  "application/vnd.fujitsu.oasysprs": {
    source: "iana",
    extensions: ["bh2"],
    compressible: null
  },
  "application/vnd.fujixerox.ddd": {
    source: "iana",
    extensions: ["ddd"],
    compressible: null
  },
  "application/vnd.fujixerox.docuworks": {
    source: "iana",
    extensions: ["xdw"],
    compressible: null
  },
  "application/vnd.fujixerox.docuworks.binder": {
    source: "iana",
    extensions: ["xbd"],
    compressible: null
  },
  "application/vnd.fuzzysheet": {
    source: "iana",
    extensions: ["fzs"],
    compressible: null
  },
  "application/vnd.genomatix.tuxedo": {
    source: "iana",
    extensions: ["txd"],
    compressible: null
  },
  "application/vnd.geogebra.file": {
    source: "iana",
    extensions: ["ggb"],
    compressible: null
  },
  "application/vnd.geogebra.tool": {
    source: "iana",
    extensions: ["ggt"],
    compressible: null
  },
  "application/vnd.geometry-explorer": {
    source: "iana",
    extensions: ["gex", "gre"],
    compressible: null
  },
  "application/vnd.geonext": {
    source: "iana",
    extensions: ["gxt"],
    compressible: null
  },
  "application/vnd.geoplan": {
    source: "iana",
    extensions: ["g2w"],
    compressible: null
  },
  "application/vnd.geospace": {
    source: "iana",
    extensions: ["g3w"],
    compressible: null
  },
  "application/vnd.gmx": {
    source: "iana",
    extensions: ["gmx"],
    compressible: null
  },
  "application/vnd.google-earth.kml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["kml"]
  },
  "application/vnd.google-earth.kmz": {
    source: "iana",
    compressible: false,
    extensions: ["kmz"]
  },
  "application/vnd.grafeq": {
    source: "iana",
    extensions: ["gqf", "gqs"],
    compressible: null
  },
  "application/vnd.groove-account": {
    source: "iana",
    extensions: ["gac"],
    compressible: null
  },
  "application/vnd.groove-help": {
    source: "iana",
    extensions: ["ghf"],
    compressible: null
  },
  "application/vnd.groove-identity-message": {
    source: "iana",
    extensions: ["gim"],
    compressible: null
  },
  "application/vnd.groove-injector": {
    source: "iana",
    extensions: ["grv"],
    compressible: null
  },
  "application/vnd.groove-tool-message": {
    source: "iana",
    extensions: ["gtm"],
    compressible: null
  },
  "application/vnd.groove-tool-template": {
    source: "iana",
    extensions: ["tpl"],
    compressible: null
  },
  "application/vnd.groove-vcard": {
    source: "iana",
    extensions: ["vcg"],
    compressible: null
  },
  "application/vnd.hal+xml": {
    source: "iana",
    compressible: true,
    extensions: ["hal"]
  },
  "application/vnd.handheld-entertainment+xml": {
    source: "iana",
    compressible: true,
    extensions: ["zmm"]
  },
  "application/vnd.hbci": {
    source: "iana",
    extensions: ["hbci"],
    compressible: null
  },
  "application/vnd.hhe.lesson-player": {
    source: "iana",
    extensions: ["les"],
    compressible: null
  },
  "application/vnd.hp-hpgl": {
    source: "iana",
    extensions: ["hpgl"],
    compressible: null
  },
  "application/vnd.hp-hpid": {
    source: "iana",
    extensions: ["hpid"],
    compressible: null
  },
  "application/vnd.hp-hps": {
    source: "iana",
    extensions: ["hps"],
    compressible: null
  },
  "application/vnd.hp-jlyt": {
    source: "iana",
    extensions: ["jlt"],
    compressible: null
  },
  "application/vnd.hp-pcl": {
    source: "iana",
    extensions: ["pcl"],
    compressible: null
  },
  "application/vnd.hp-pclxl": {
    source: "iana",
    extensions: ["pclxl"],
    compressible: null
  },
  "application/vnd.hydrostatix.sof-data": {
    source: "iana",
    extensions: ["sfd-hdstx"],
    compressible: null
  },
  "application/vnd.ibm.minipay": {
    source: "iana",
    extensions: ["mpy"],
    compressible: null
  },
  "application/vnd.ibm.modcap": {
    source: "iana",
    extensions: ["afp", "listafp", "list3820"],
    compressible: null
  },
  "application/vnd.ibm.rights-management": {
    source: "iana",
    extensions: ["irm"],
    compressible: null
  },
  "application/vnd.ibm.secure-container": {
    source: "iana",
    extensions: ["sc"],
    compressible: null
  },
  "application/vnd.iccprofile": {
    source: "iana",
    extensions: ["icc", "icm"],
    compressible: null
  },
  "application/vnd.igloader": {
    source: "iana",
    extensions: ["igl"],
    compressible: null
  },
  "application/vnd.immervision-ivp": {
    source: "iana",
    extensions: ["ivp"],
    compressible: null
  },
  "application/vnd.immervision-ivu": {
    source: "iana",
    extensions: ["ivu"],
    compressible: null
  },
  "application/vnd.insors.igm": {
    source: "iana",
    extensions: ["igm"],
    compressible: null
  },
  "application/vnd.intercon.formnet": {
    source: "iana",
    extensions: ["xpw", "xpx"],
    compressible: null
  },
  "application/vnd.intergeo": {
    source: "iana",
    extensions: ["i2g"],
    compressible: null
  },
  "application/vnd.intu.qbo": {
    source: "iana",
    extensions: ["qbo"],
    compressible: null
  },
  "application/vnd.intu.qfx": {
    source: "iana",
    extensions: ["qfx"],
    compressible: null
  },
  "application/vnd.ipunplugged.rcprofile": {
    source: "iana",
    extensions: ["rcprofile"],
    compressible: null
  },
  "application/vnd.irepository.package+xml": {
    source: "iana",
    compressible: true,
    extensions: ["irp"]
  },
  "application/vnd.is-xpr": {
    source: "iana",
    extensions: ["xpr"],
    compressible: null
  },
  "application/vnd.isac.fcs": {
    source: "iana",
    extensions: ["fcs"],
    compressible: null
  },
  "application/vnd.jam": {
    source: "iana",
    extensions: ["jam"],
    compressible: null
  },
  "application/vnd.jcp.javame.midlet-rms": {
    source: "iana",
    extensions: ["rms"],
    compressible: null
  },
  "application/vnd.jisp": {
    source: "iana",
    extensions: ["jisp"],
    compressible: null
  },
  "application/vnd.joost.joda-archive": {
    source: "iana",
    extensions: ["joda"],
    compressible: null
  },
  "application/vnd.kahootz": {
    source: "iana",
    extensions: ["ktz", "ktr"],
    compressible: null
  },
  "application/vnd.kde.karbon": {
    source: "iana",
    extensions: ["karbon"],
    compressible: null
  },
  "application/vnd.kde.kchart": {
    source: "iana",
    extensions: ["chrt"],
    compressible: null
  },
  "application/vnd.kde.kformula": {
    source: "iana",
    extensions: ["kfo"],
    compressible: null
  },
  "application/vnd.kde.kivio": {
    source: "iana",
    extensions: ["flw"],
    compressible: null
  },
  "application/vnd.kde.kontour": {
    source: "iana",
    extensions: ["kon"],
    compressible: null
  },
  "application/vnd.kde.kpresenter": {
    source: "iana",
    extensions: ["kpr", "kpt"],
    compressible: null
  },
  "application/vnd.kde.kspread": {
    source: "iana",
    extensions: ["ksp"],
    compressible: null
  },
  "application/vnd.kde.kword": {
    source: "iana",
    extensions: ["kwd", "kwt"],
    compressible: null
  },
  "application/vnd.kenameaapp": {
    source: "iana",
    extensions: ["htke"],
    compressible: null
  },
  "application/vnd.kidspiration": {
    source: "iana",
    extensions: ["kia"],
    compressible: null
  },
  "application/vnd.kinar": {
    source: "iana",
    extensions: ["kne", "knp"],
    compressible: null
  },
  "application/vnd.koan": {
    source: "iana",
    extensions: ["skp", "skd", "skt", "skm"],
    compressible: null
  },
  "application/vnd.kodak-descriptor": {
    source: "iana",
    extensions: ["sse"],
    compressible: null
  },
  "application/vnd.las.las+xml": {
    source: "iana",
    compressible: true,
    extensions: ["lasxml"]
  },
  "application/vnd.llamagraphics.life-balance.desktop": {
    source: "iana",
    extensions: ["lbd"],
    compressible: null
  },
  "application/vnd.llamagraphics.life-balance.exchange+xml": {
    source: "iana",
    compressible: true,
    extensions: ["lbe"]
  },
  "application/vnd.lotus-1-2-3": {
    source: "iana",
    extensions: ["123"],
    compressible: null
  },
  "application/vnd.lotus-approach": {
    source: "iana",
    extensions: ["apr"],
    compressible: null
  },
  "application/vnd.lotus-freelance": {
    source: "iana",
    extensions: ["pre"],
    compressible: null
  },
  "application/vnd.lotus-notes": {
    source: "iana",
    extensions: ["nsf"],
    compressible: null
  },
  "application/vnd.lotus-organizer": {
    source: "iana",
    extensions: ["org"],
    compressible: null
  },
  "application/vnd.lotus-screencam": {
    source: "iana",
    extensions: ["scm"],
    compressible: null
  },
  "application/vnd.lotus-wordpro": {
    source: "iana",
    extensions: ["lwp"],
    compressible: null
  },
  "application/vnd.macports.portpkg": {
    source: "iana",
    extensions: ["portpkg"],
    compressible: null
  },
  "application/vnd.mapbox-vector-tile": {
    source: "iana",
    extensions: ["mvt"],
    compressible: null
  },
  "application/vnd.mcd": {
    source: "iana",
    extensions: ["mcd"],
    compressible: null
  },
  "application/vnd.medcalcdata": {
    source: "iana",
    extensions: ["mc1"],
    compressible: null
  },
  "application/vnd.mediastation.cdkey": {
    source: "iana",
    extensions: ["cdkey"],
    compressible: null
  },
  "application/vnd.mfer": {
    source: "iana",
    extensions: ["mwf"],
    compressible: null
  },
  "application/vnd.mfmp": {
    source: "iana",
    extensions: ["mfm"],
    compressible: null
  },
  "application/vnd.micrografx.flo": {
    source: "iana",
    extensions: ["flo"],
    compressible: null
  },
  "application/vnd.micrografx.igx": {
    source: "iana",
    extensions: ["igx"],
    compressible: null
  },
  "application/vnd.mif": {
    source: "iana",
    extensions: ["mif"],
    compressible: null
  },
  "application/vnd.mobius.daf": {
    source: "iana",
    extensions: ["daf"],
    compressible: null
  },
  "application/vnd.mobius.dis": {
    source: "iana",
    extensions: ["dis"],
    compressible: null
  },
  "application/vnd.mobius.mbk": {
    source: "iana",
    extensions: ["mbk"],
    compressible: null
  },
  "application/vnd.mobius.mqy": {
    source: "iana",
    extensions: ["mqy"],
    compressible: null
  },
  "application/vnd.mobius.msl": {
    source: "iana",
    extensions: ["msl"],
    compressible: null
  },
  "application/vnd.mobius.plc": {
    source: "iana",
    extensions: ["plc"],
    compressible: null
  },
  "application/vnd.mobius.txf": {
    source: "iana",
    extensions: ["txf"],
    compressible: null
  },
  "application/vnd.mophun.application": {
    source: "iana",
    extensions: ["mpn"],
    compressible: null
  },
  "application/vnd.mophun.certificate": {
    source: "iana",
    extensions: ["mpc"],
    compressible: null
  },
  "application/vnd.mozilla.xul+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xul"]
  },
  "application/vnd.ms-artgalry": {
    source: "iana",
    extensions: ["cil"],
    compressible: null
  },
  "application/vnd.ms-cab-compressed": {
    source: "iana",
    extensions: ["cab"],
    compressible: null
  },
  "application/vnd.ms-excel": {
    source: "iana",
    compressible: false,
    extensions: ["xls", "xlm", "xla", "xlc", "xlt", "xlw"]
  },
  "application/vnd.ms-excel.addin.macroenabled.12": {
    source: "iana",
    extensions: ["xlam"],
    compressible: null
  },
  "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
    source: "iana",
    extensions: ["xlsb"],
    compressible: null
  },
  "application/vnd.ms-excel.sheet.macroenabled.12": {
    source: "iana",
    extensions: ["xlsm"],
    compressible: null
  },
  "application/vnd.ms-excel.template.macroenabled.12": {
    source: "iana",
    extensions: ["xltm"],
    compressible: null
  },
  "application/vnd.ms-fontobject": {
    source: "iana",
    compressible: true,
    extensions: ["eot"]
  },
  "application/vnd.ms-htmlhelp": {
    source: "iana",
    extensions: ["chm"],
    compressible: null
  },
  "application/vnd.ms-ims": {
    source: "iana",
    extensions: ["ims"],
    compressible: null
  },
  "application/vnd.ms-lrm": {
    source: "iana",
    extensions: ["lrm"],
    compressible: null
  },
  "application/vnd.ms-officetheme": {
    source: "iana",
    extensions: ["thmx"],
    compressible: null
  },
  "application/vnd.ms-pki.seccat": {
    source: "apache",
    extensions: ["cat"],
    compressible: null
  },
  "application/vnd.ms-pki.stl": {
    source: "apache",
    extensions: ["stl"],
    compressible: null
  },
  "application/vnd.ms-powerpoint": {
    source: "iana",
    compressible: false,
    extensions: ["ppt", "pps", "pot"]
  },
  "application/vnd.ms-powerpoint.addin.macroenabled.12": {
    source: "iana",
    extensions: ["ppam"],
    compressible: null
  },
  "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
    source: "iana",
    extensions: ["pptm"],
    compressible: null
  },
  "application/vnd.ms-powerpoint.slide.macroenabled.12": {
    source: "iana",
    extensions: ["sldm"],
    compressible: null
  },
  "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
    source: "iana",
    extensions: ["ppsm"],
    compressible: null
  },
  "application/vnd.ms-powerpoint.template.macroenabled.12": {
    source: "iana",
    extensions: ["potm"],
    compressible: null
  },
  "application/vnd.ms-project": {
    source: "iana",
    extensions: ["mpp", "mpt"],
    compressible: null
  },
  "application/vnd.ms-word.document.macroenabled.12": {
    source: "iana",
    extensions: ["docm"],
    compressible: null
  },
  "application/vnd.ms-word.template.macroenabled.12": {
    source: "iana",
    extensions: ["dotm"],
    compressible: null
  },
  "application/vnd.ms-works": {
    source: "iana",
    extensions: ["wps", "wks", "wcm", "wdb"],
    compressible: null
  },
  "application/vnd.ms-wpl": {
    source: "iana",
    extensions: ["wpl"],
    compressible: null
  },
  "application/vnd.ms-xpsdocument": {
    source: "iana",
    compressible: false,
    extensions: ["xps"]
  },
  "application/vnd.mseq": {
    source: "iana",
    extensions: ["mseq"],
    compressible: null
  },
  "application/vnd.musician": {
    source: "iana",
    extensions: ["mus"],
    compressible: null
  },
  "application/vnd.muvee.style": {
    source: "iana",
    extensions: ["msty"],
    compressible: null
  },
  "application/vnd.mynfc": {
    source: "iana",
    extensions: ["taglet"],
    compressible: null
  },
  "application/vnd.neurolanguage.nlu": {
    source: "iana",
    extensions: ["nlu"],
    compressible: null
  },
  "application/vnd.nitf": {
    source: "iana",
    extensions: ["ntf", "nitf"],
    compressible: null
  },
  "application/vnd.noblenet-directory": {
    source: "iana",
    extensions: ["nnd"],
    compressible: null
  },
  "application/vnd.noblenet-sealer": {
    source: "iana",
    extensions: ["nns"],
    compressible: null
  },
  "application/vnd.noblenet-web": {
    source: "iana",
    extensions: ["nnw"],
    compressible: null
  },
  "application/vnd.nokia.n-gage.ac+xml": {
    source: "iana",
    compressible: true,
    extensions: ["ac"]
  },
  "application/vnd.nokia.n-gage.data": {
    source: "iana",
    extensions: ["ngdat"],
    compressible: null
  },
  "application/vnd.nokia.n-gage.symbian.install": {
    source: "iana",
    extensions: ["n-gage"],
    compressible: null
  },
  "application/vnd.nokia.radio-preset": {
    source: "iana",
    extensions: ["rpst"],
    compressible: null
  },
  "application/vnd.nokia.radio-presets": {
    source: "iana",
    extensions: ["rpss"],
    compressible: null
  },
  "application/vnd.novadigm.edm": {
    source: "iana",
    extensions: ["edm"],
    compressible: null
  },
  "application/vnd.novadigm.edx": {
    source: "iana",
    extensions: ["edx"],
    compressible: null
  },
  "application/vnd.novadigm.ext": {
    source: "iana",
    extensions: ["ext"],
    compressible: null
  },
  "application/vnd.oasis.opendocument.chart": {
    source: "iana",
    extensions: ["odc"],
    compressible: null
  },
  "application/vnd.oasis.opendocument.chart-template": {
    source: "iana",
    extensions: ["otc"],
    compressible: null
  },
  "application/vnd.oasis.opendocument.database": {
    source: "iana",
    extensions: ["odb"],
    compressible: null
  },
  "application/vnd.oasis.opendocument.formula": {
    source: "iana",
    extensions: ["odf"],
    compressible: null
  },
  "application/vnd.oasis.opendocument.formula-template": {
    source: "iana",
    extensions: ["odft"],
    compressible: null
  },
  "application/vnd.oasis.opendocument.graphics": {
    source: "iana",
    compressible: false,
    extensions: ["odg"]
  },
  "application/vnd.oasis.opendocument.graphics-template": {
    source: "iana",
    extensions: ["otg"],
    compressible: null
  },
  "application/vnd.oasis.opendocument.image": {
    source: "iana",
    extensions: ["odi"],
    compressible: null
  },
  "application/vnd.oasis.opendocument.image-template": {
    source: "iana",
    extensions: ["oti"],
    compressible: null
  },
  "application/vnd.oasis.opendocument.presentation": {
    source: "iana",
    compressible: false,
    extensions: ["odp"]
  },
  "application/vnd.oasis.opendocument.presentation-template": {
    source: "iana",
    extensions: ["otp"],
    compressible: null
  },
  "application/vnd.oasis.opendocument.spreadsheet": {
    source: "iana",
    compressible: false,
    extensions: ["ods"]
  },
  "application/vnd.oasis.opendocument.spreadsheet-template": {
    source: "iana",
    extensions: ["ots"],
    compressible: null
  },
  "application/vnd.oasis.opendocument.text": {
    source: "iana",
    compressible: false,
    extensions: ["odt"]
  },
  "application/vnd.oasis.opendocument.text-master": {
    source: "iana",
    extensions: ["odm"],
    compressible: null
  },
  "application/vnd.oasis.opendocument.text-template": {
    source: "iana",
    extensions: ["ott"],
    compressible: null
  },
  "application/vnd.oasis.opendocument.text-web": {
    source: "iana",
    extensions: ["oth"],
    compressible: null
  },
  "application/vnd.olpc-sugar": {
    source: "iana",
    extensions: ["xo"],
    compressible: null
  },
  "application/vnd.oma.dd2+xml": {
    source: "iana",
    compressible: true,
    extensions: ["dd2"]
  },
  "application/vnd.openblox.game+xml": {
    source: "iana",
    compressible: true,
    extensions: ["obgx"]
  },
  "application/vnd.openofficeorg.extension": {
    source: "apache",
    extensions: ["oxt"],
    compressible: null
  },
  "application/vnd.openstreetmap.data+xml": {
    source: "iana",
    compressible: true,
    extensions: ["osm"]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    source: "iana",
    compressible: false,
    extensions: ["pptx"]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slide": {
    source: "iana",
    extensions: ["sldx"],
    compressible: null
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
    source: "iana",
    extensions: ["ppsx"],
    compressible: null
  },
  "application/vnd.openxmlformats-officedocument.presentationml.template": {
    source: "iana",
    extensions: ["potx"],
    compressible: null
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    source: "iana",
    compressible: false,
    extensions: ["xlsx"]
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
    source: "iana",
    extensions: ["xltx"],
    compressible: null
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    source: "iana",
    compressible: false,
    extensions: ["docx"]
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
    source: "iana",
    extensions: ["dotx"],
    compressible: null
  },
  "application/vnd.osgeo.mapguide.package": {
    source: "iana",
    extensions: ["mgp"],
    compressible: null
  },
  "application/vnd.osgi.dp": {
    source: "iana",
    extensions: ["dp"],
    compressible: null
  },
  "application/vnd.osgi.subsystem": {
    source: "iana",
    extensions: ["esa"],
    compressible: null
  },
  "application/vnd.palm": {
    source: "iana",
    extensions: ["pdb", "pqa", "oprc"],
    compressible: null
  },
  "application/vnd.pawaafile": {
    source: "iana",
    extensions: ["paw"],
    compressible: null
  },
  "application/vnd.pg.format": {
    source: "iana",
    extensions: ["str"],
    compressible: null
  },
  "application/vnd.pg.osasli": {
    source: "iana",
    extensions: ["ei6"],
    compressible: null
  },
  "application/vnd.picsel": {
    source: "iana",
    extensions: ["efif"],
    compressible: null
  },
  "application/vnd.pmi.widget": {
    source: "iana",
    extensions: ["wg"],
    compressible: null
  },
  "application/vnd.pocketlearn": {
    source: "iana",
    extensions: ["plf"],
    compressible: null
  },
  "application/vnd.powerbuilder6": {
    source: "iana",
    extensions: ["pbd"],
    compressible: null
  },
  "application/vnd.previewsystems.box": {
    source: "iana",
    extensions: ["box"],
    compressible: null
  },
  "application/vnd.proteus.magazine": {
    source: "iana",
    extensions: ["mgz"],
    compressible: null
  },
  "application/vnd.publishare-delta-tree": {
    source: "iana",
    extensions: ["qps"],
    compressible: null
  },
  "application/vnd.pvi.ptid1": {
    source: "iana",
    extensions: ["ptid"],
    compressible: null
  },
  "application/vnd.quark.quarkxpress": {
    source: "iana",
    extensions: ["qxd", "qxt", "qwd", "qwt", "qxl", "qxb"],
    compressible: null
  },
  "application/vnd.rar": {
    source: "iana",
    extensions: ["rar"],
    compressible: null
  },
  "application/vnd.realvnc.bed": {
    source: "iana",
    extensions: ["bed"],
    compressible: null
  },
  "application/vnd.recordare.musicxml": {
    source: "iana",
    extensions: ["mxl"],
    compressible: null
  },
  "application/vnd.recordare.musicxml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["musicxml"]
  },
  "application/vnd.rig.cryptonote": {
    source: "iana",
    extensions: ["cryptonote"],
    compressible: null
  },
  "application/vnd.rim.cod": {
    source: "apache",
    extensions: ["cod"],
    compressible: null
  },
  "application/vnd.rn-realmedia": {
    source: "apache",
    extensions: ["rm"],
    compressible: null
  },
  "application/vnd.rn-realmedia-vbr": {
    source: "apache",
    extensions: ["rmvb"],
    compressible: null
  },
  "application/vnd.route66.link66+xml": {
    source: "iana",
    compressible: true,
    extensions: ["link66"]
  },
  "application/vnd.sailingtracker.track": {
    source: "iana",
    extensions: ["st"],
    compressible: null
  },
  "application/vnd.seemail": {
    source: "iana",
    extensions: ["see"],
    compressible: null
  },
  "application/vnd.sema": {
    source: "iana",
    extensions: ["sema"],
    compressible: null
  },
  "application/vnd.semd": {
    source: "iana",
    extensions: ["semd"],
    compressible: null
  },
  "application/vnd.semf": {
    source: "iana",
    extensions: ["semf"],
    compressible: null
  },
  "application/vnd.shana.informed.formdata": {
    source: "iana",
    extensions: ["ifm"],
    compressible: null
  },
  "application/vnd.shana.informed.formtemplate": {
    source: "iana",
    extensions: ["itp"],
    compressible: null
  },
  "application/vnd.shana.informed.interchange": {
    source: "iana",
    extensions: ["iif"],
    compressible: null
  },
  "application/vnd.shana.informed.package": {
    source: "iana",
    extensions: ["ipk"],
    compressible: null
  },
  "application/vnd.simtech-mindmapper": {
    source: "iana",
    extensions: ["twd", "twds"],
    compressible: null
  },
  "application/vnd.smaf": {
    source: "iana",
    extensions: ["mmf"],
    compressible: null
  },
  "application/vnd.smart.teacher": {
    source: "iana",
    extensions: ["teacher"],
    compressible: null
  },
  "application/vnd.software602.filler.form+xml": {
    source: "iana",
    compressible: true,
    extensions: ["fo"]
  },
  "application/vnd.solent.sdkm+xml": {
    source: "iana",
    compressible: true,
    extensions: ["sdkm", "sdkd"]
  },
  "application/vnd.spotfire.dxp": {
    source: "iana",
    extensions: ["dxp"],
    compressible: null
  },
  "application/vnd.spotfire.sfs": {
    source: "iana",
    extensions: ["sfs"],
    compressible: null
  },
  "application/vnd.stardivision.calc": {
    source: "apache",
    extensions: ["sdc"],
    compressible: null
  },
  "application/vnd.stardivision.draw": {
    source: "apache",
    extensions: ["sda"],
    compressible: null
  },
  "application/vnd.stardivision.impress": {
    source: "apache",
    extensions: ["sdd"],
    compressible: null
  },
  "application/vnd.stardivision.math": {
    source: "apache",
    extensions: ["smf"],
    compressible: null
  },
  "application/vnd.stardivision.writer": {
    source: "apache",
    extensions: ["sdw", "vor"],
    compressible: null
  },
  "application/vnd.stardivision.writer-global": {
    source: "apache",
    extensions: ["sgl"],
    compressible: null
  },
  "application/vnd.stepmania.package": {
    source: "iana",
    extensions: ["smzip"],
    compressible: null
  },
  "application/vnd.stepmania.stepchart": {
    source: "iana",
    extensions: ["sm"],
    compressible: null
  },
  "application/vnd.sun.wadl+xml": {
    source: "iana",
    compressible: true,
    extensions: ["wadl"]
  },
  "application/vnd.sun.xml.calc": {
    source: "apache",
    extensions: ["sxc"],
    compressible: null
  },
  "application/vnd.sun.xml.calc.template": {
    source: "apache",
    extensions: ["stc"],
    compressible: null
  },
  "application/vnd.sun.xml.draw": {
    source: "apache",
    extensions: ["sxd"],
    compressible: null
  },
  "application/vnd.sun.xml.draw.template": {
    source: "apache",
    extensions: ["std"],
    compressible: null
  },
  "application/vnd.sun.xml.impress": {
    source: "apache",
    extensions: ["sxi"],
    compressible: null
  },
  "application/vnd.sun.xml.impress.template": {
    source: "apache",
    extensions: ["sti"],
    compressible: null
  },
  "application/vnd.sun.xml.math": {
    source: "apache",
    extensions: ["sxm"],
    compressible: null
  },
  "application/vnd.sun.xml.writer": {
    source: "apache",
    extensions: ["sxw"],
    compressible: null
  },
  "application/vnd.sun.xml.writer.global": {
    source: "apache",
    extensions: ["sxg"],
    compressible: null
  },
  "application/vnd.sun.xml.writer.template": {
    source: "apache",
    extensions: ["stw"],
    compressible: null
  },
  "application/vnd.sus-calendar": {
    source: "iana",
    extensions: ["sus", "susp"],
    compressible: null
  },
  "application/vnd.svd": {
    source: "iana",
    extensions: ["svd"],
    compressible: null
  },
  "application/vnd.symbian.install": {
    source: "apache",
    extensions: ["sis", "sisx"],
    compressible: null
  },
  "application/vnd.syncml+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["xsm"]
  },
  "application/vnd.syncml.dm+wbxml": {
    source: "iana",
    charset: "UTF-8",
    extensions: ["bdm"],
    compressible: null
  },
  "application/vnd.syncml.dm+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["xdm"]
  },
  "application/vnd.syncml.dmddf+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["ddf"]
  },
  "application/vnd.tao.intent-module-archive": {
    source: "iana",
    extensions: ["tao"],
    compressible: null
  },
  "application/vnd.tcpdump.pcap": {
    source: "iana",
    extensions: ["pcap", "cap", "dmp"],
    compressible: null
  },
  "application/vnd.tmobile-livetv": {
    source: "iana",
    extensions: ["tmo"],
    compressible: null
  },
  "application/vnd.trid.tpt": {
    source: "iana",
    extensions: ["tpt"],
    compressible: null
  },
  "application/vnd.triscape.mxs": {
    source: "iana",
    extensions: ["mxs"],
    compressible: null
  },
  "application/vnd.trueapp": {
    source: "iana",
    extensions: ["tra"],
    compressible: null
  },
  "application/vnd.ufdl": {
    source: "iana",
    extensions: ["ufd", "ufdl"],
    compressible: null
  },
  "application/vnd.uiq.theme": {
    source: "iana",
    extensions: ["utz"],
    compressible: null
  },
  "application/vnd.umajin": {
    source: "iana",
    extensions: ["umj"],
    compressible: null
  },
  "application/vnd.unity": {
    source: "iana",
    extensions: ["unityweb"],
    compressible: null
  },
  "application/vnd.uoml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["uoml"]
  },
  "application/vnd.vcx": {
    source: "iana",
    extensions: ["vcx"],
    compressible: null
  },
  "application/vnd.visio": {
    source: "iana",
    extensions: ["vsd", "vst", "vss", "vsw"],
    compressible: null
  },
  "application/vnd.visionary": {
    source: "iana",
    extensions: ["vis"],
    compressible: null
  },
  "application/vnd.vsf": {
    source: "iana",
    extensions: ["vsf"],
    compressible: null
  },
  "application/vnd.wap.wbxml": {
    source: "iana",
    charset: "UTF-8",
    extensions: ["wbxml"],
    compressible: null
  },
  "application/vnd.wap.wmlc": {
    source: "iana",
    extensions: ["wmlc"],
    compressible: null
  },
  "application/vnd.wap.wmlscriptc": {
    source: "iana",
    extensions: ["wmlsc"],
    compressible: null
  },
  "application/vnd.webturbo": {
    source: "iana",
    extensions: ["wtb"],
    compressible: null
  },
  "application/vnd.wolfram.player": {
    source: "iana",
    extensions: ["nbp"],
    compressible: null
  },
  "application/vnd.wordperfect": {
    source: "iana",
    extensions: ["wpd"],
    compressible: null
  },
  "application/vnd.wqd": {
    source: "iana",
    extensions: ["wqd"],
    compressible: null
  },
  "application/vnd.wt.stf": {
    source: "iana",
    extensions: ["stf"],
    compressible: null
  },
  "application/vnd.xara": {
    source: "iana",
    extensions: ["xar"],
    compressible: null
  },
  "application/vnd.xfdl": {
    source: "iana",
    extensions: ["xfdl"],
    compressible: null
  },
  "application/vnd.yamaha.hv-dic": {
    source: "iana",
    extensions: ["hvd"],
    compressible: null
  },
  "application/vnd.yamaha.hv-script": {
    source: "iana",
    extensions: ["hvs"],
    compressible: null
  },
  "application/vnd.yamaha.hv-voice": {
    source: "iana",
    extensions: ["hvp"],
    compressible: null
  },
  "application/vnd.yamaha.openscoreformat": {
    source: "iana",
    extensions: ["osf"],
    compressible: null
  },
  "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
    source: "iana",
    compressible: true,
    extensions: ["osfpvg"]
  },
  "application/vnd.yamaha.smaf-audio": {
    source: "iana",
    extensions: ["saf"],
    compressible: null
  },
  "application/vnd.yamaha.smaf-phrase": {
    source: "iana",
    extensions: ["spf"],
    compressible: null
  },
  "application/vnd.yellowriver-custom-menu": {
    source: "iana",
    extensions: ["cmp"],
    compressible: null
  },
  "application/vnd.zul": {
    source: "iana",
    extensions: ["zir", "zirz"],
    compressible: null
  },
  "application/vnd.zzazz.deck+xml": {
    source: "iana",
    compressible: true,
    extensions: ["zaz"]
  },
  "application/voicexml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["vxml"]
  },
  "application/wasm": {
    source: "iana",
    compressible: true,
    extensions: ["wasm"]
  },
  "application/watcherinfo+xml": {
    source: "iana",
    compressible: true,
    extensions: ["wif"]
  },
  "application/widget": {
    source: "iana",
    extensions: ["wgt"],
    compressible: null
  },
  "application/winhlp": {
    source: "apache",
    extensions: ["hlp"],
    compressible: null
  },
  "application/wsdl+xml": {
    source: "iana",
    compressible: true,
    extensions: ["wsdl"]
  },
  "application/wspolicy+xml": {
    source: "iana",
    compressible: true,
    extensions: ["wspolicy"]
  },
  "application/x-7z-compressed": {
    source: "apache",
    compressible: false,
    extensions: ["7z"]
  },
  "application/x-abiword": {
    source: "apache",
    extensions: ["abw"],
    compressible: null
  },
  "application/x-ace-compressed": {
    source: "apache",
    extensions: ["ace"],
    compressible: null
  },
  "application/x-apple-diskimage": {
    source: "apache",
    extensions: ["dmg"],
    compressible: null
  },
  "application/x-authorware-bin": {
    source: "apache",
    extensions: ["aab", "x32", "u32", "vox"],
    compressible: null
  },
  "application/x-authorware-map": {
    source: "apache",
    extensions: ["aam"],
    compressible: null
  },
  "application/x-authorware-seg": {
    source: "apache",
    extensions: ["aas"],
    compressible: null
  },
  "application/x-bcpio": {
    source: "apache",
    extensions: ["bcpio"],
    compressible: null
  },
  "application/x-bittorrent": {
    source: "apache",
    extensions: ["torrent"],
    compressible: null
  },
  "application/x-blorb": {
    source: "apache",
    extensions: ["blb", "blorb"],
    compressible: null
  },
  "application/x-bzip": {
    source: "apache",
    compressible: false,
    extensions: ["bz"]
  },
  "application/x-bzip2": {
    source: "apache",
    compressible: false,
    extensions: ["bz2", "boz"]
  },
  "application/x-cbr": {
    source: "apache",
    extensions: ["cbr", "cba", "cbt", "cbz", "cb7"],
    compressible: null
  },
  "application/x-cdlink": {
    source: "apache",
    extensions: ["vcd"],
    compressible: null
  },
  "application/x-cfs-compressed": {
    source: "apache",
    extensions: ["cfs"],
    compressible: null
  },
  "application/x-chat": {
    source: "apache",
    extensions: ["chat"],
    compressible: null
  },
  "application/x-chess-pgn": {
    source: "apache",
    extensions: ["pgn"],
    compressible: null
  },
  "application/x-cocoa": {
    source: "nginx",
    extensions: ["cco"],
    compressible: null
  },
  "application/x-conference": {
    source: "apache",
    extensions: ["nsc"],
    compressible: null
  },
  "application/x-cpio": {
    source: "apache",
    extensions: ["cpio"],
    compressible: null
  },
  "application/x-csh": {
    source: "apache",
    extensions: ["csh"],
    compressible: null
  },
  "application/x-debian-package": {
    source: "apache",
    extensions: ["deb", "udeb"],
    compressible: null
  },
  "application/x-dgc-compressed": {
    source: "apache",
    extensions: ["dgc"],
    compressible: null
  },
  "application/x-director": {
    source: "apache",
    extensions: ["dir", "dcr", "dxr", "cst", "cct", "cxt", "w3d", "fgd", "swa"],
    compressible: null
  },
  "application/x-doom": {
    source: "apache",
    extensions: ["wad"],
    compressible: null
  },
  "application/x-dtbncx+xml": {
    source: "apache",
    compressible: true,
    extensions: ["ncx"]
  },
  "application/x-dtbook+xml": {
    source: "apache",
    compressible: true,
    extensions: ["dtb"]
  },
  "application/x-dtbresource+xml": {
    source: "apache",
    compressible: true,
    extensions: ["res"]
  },
  "application/x-dvi": {
    source: "apache",
    compressible: false,
    extensions: ["dvi"]
  },
  "application/x-envoy": {
    source: "apache",
    extensions: ["evy"],
    compressible: null
  },
  "application/x-eva": {
    source: "apache",
    extensions: ["eva"],
    compressible: null
  },
  "application/x-font-bdf": {
    source: "apache",
    extensions: ["bdf"],
    compressible: null
  },
  "application/x-font-ghostscript": {
    source: "apache",
    extensions: ["gsf"],
    compressible: null
  },
  "application/x-font-linux-psf": {
    source: "apache",
    extensions: ["psf"],
    compressible: null
  },
  "application/x-font-pcf": {
    source: "apache",
    extensions: ["pcf"],
    compressible: null
  },
  "application/x-font-snf": {
    source: "apache",
    extensions: ["snf"],
    compressible: null
  },
  "application/x-font-type1": {
    source: "apache",
    extensions: ["pfa", "pfb", "pfm", "afm"],
    compressible: null
  },
  "application/x-freearc": {
    source: "apache",
    extensions: ["arc"],
    compressible: null
  },
  "application/x-futuresplash": {
    source: "apache",
    extensions: ["spl"],
    compressible: null
  },
  "application/x-gca-compressed": {
    source: "apache",
    extensions: ["gca"],
    compressible: null
  },
  "application/x-glulx": {
    source: "apache",
    extensions: ["ulx"],
    compressible: null
  },
  "application/x-gnumeric": {
    source: "apache",
    extensions: ["gnumeric"],
    compressible: null
  },
  "application/x-gramps-xml": {
    source: "apache",
    extensions: ["gramps"],
    compressible: null
  },
  "application/x-gtar": {
    source: "apache",
    extensions: ["gtar"],
    compressible: null
  },
  "application/x-hdf": {
    source: "apache",
    extensions: ["hdf"],
    compressible: null
  },
  "application/x-install-instructions": {
    source: "apache",
    extensions: ["install"],
    compressible: null
  },
  "application/x-iso9660-image": {
    source: "apache",
    extensions: ["iso"],
    compressible: null
  },
  "application/x-java-archive-diff": {
    source: "nginx",
    extensions: ["jardiff"],
    compressible: null
  },
  "application/x-java-jnlp-file": {
    source: "apache",
    compressible: false,
    extensions: ["jnlp"]
  },
  "application/x-latex": {
    source: "apache",
    compressible: false,
    extensions: ["latex"]
  },
  "application/x-lzh-compressed": {
    source: "apache",
    extensions: ["lzh", "lha"],
    compressible: null
  },
  "application/x-makeself": {
    source: "nginx",
    extensions: ["run"],
    compressible: null
  },
  "application/x-mie": {
    source: "apache",
    extensions: ["mie"],
    compressible: null
  },
  "application/x-mobipocket-ebook": {
    source: "apache",
    extensions: ["prc", "mobi"],
    compressible: null
  },
  "application/x-ms-application": {
    source: "apache",
    extensions: ["application"],
    compressible: null
  },
  "application/x-ms-shortcut": {
    source: "apache",
    extensions: ["lnk"],
    compressible: null
  },
  "application/x-ms-wmd": {
    source: "apache",
    extensions: ["wmd"],
    compressible: null
  },
  "application/x-ms-wmz": {
    source: "apache",
    extensions: ["wmz"],
    compressible: null
  },
  "application/x-ms-xbap": {
    source: "apache",
    extensions: ["xbap"],
    compressible: null
  },
  "application/x-msaccess": {
    source: "apache",
    extensions: ["mdb"],
    compressible: null
  },
  "application/x-msbinder": {
    source: "apache",
    extensions: ["obd"],
    compressible: null
  },
  "application/x-mscardfile": {
    source: "apache",
    extensions: ["crd"],
    compressible: null
  },
  "application/x-msclip": {
    source: "apache",
    extensions: ["clp"],
    compressible: null
  },
  "application/x-msdownload": {
    source: "apache",
    extensions: ["exe", "dll", "com", "bat", "msi"],
    compressible: null
  },
  "application/x-msmediaview": {
    source: "apache",
    extensions: ["mvb", "m13", "m14"],
    compressible: null
  },
  "application/x-msmetafile": {
    source: "apache",
    extensions: ["wmf", "wmz", "emf", "emz"],
    compressible: null
  },
  "application/x-msmoney": {
    source: "apache",
    extensions: ["mny"],
    compressible: null
  },
  "application/x-mspublisher": {
    source: "apache",
    extensions: ["pub"],
    compressible: null
  },
  "application/x-msschedule": {
    source: "apache",
    extensions: ["scd"],
    compressible: null
  },
  "application/x-msterminal": {
    source: "apache",
    extensions: ["trm"],
    compressible: null
  },
  "application/x-mswrite": {
    source: "apache",
    extensions: ["wri"],
    compressible: null
  },
  "application/x-netcdf": {
    source: "apache",
    extensions: ["nc", "cdf"],
    compressible: null
  },
  "application/x-nzb": {
    source: "apache",
    extensions: ["nzb"],
    compressible: null
  },
  "application/x-perl": {
    source: "nginx",
    extensions: ["pl", "pm"],
    compressible: null
  },
  "application/x-pilot": {
    source: "nginx",
    extensions: ["prc", "pdb"],
    compressible: null
  },
  "application/x-pkcs12": {
    source: "apache",
    compressible: false,
    extensions: ["p12", "pfx"]
  },
  "application/x-pkcs7-certificates": {
    source: "apache",
    extensions: ["p7b", "spc"],
    compressible: null
  },
  "application/x-pkcs7-certreqresp": {
    source: "apache",
    extensions: ["p7r"],
    compressible: null
  },
  "application/x-rar-compressed": {
    source: "apache",
    compressible: false,
    extensions: ["rar"]
  },
  "application/x-redhat-package-manager": {
    source: "nginx",
    extensions: ["rpm"],
    compressible: null
  },
  "application/x-research-info-systems": {
    source: "apache",
    extensions: ["ris"],
    compressible: null
  },
  "application/x-sea": {
    source: "nginx",
    extensions: ["sea"],
    compressible: null
  },
  "application/x-sh": {
    source: "apache",
    compressible: true,
    extensions: ["sh"]
  },
  "application/x-shar": {
    source: "apache",
    extensions: ["shar"],
    compressible: null
  },
  "application/x-shockwave-flash": {
    source: "apache",
    compressible: false,
    extensions: ["swf"]
  },
  "application/x-silverlight-app": {
    source: "apache",
    extensions: ["xap"],
    compressible: null
  },
  "application/x-sql": {
    source: "apache",
    extensions: ["sql"],
    compressible: null
  },
  "application/x-stuffit": {
    source: "apache",
    compressible: false,
    extensions: ["sit"]
  },
  "application/x-stuffitx": {
    source: "apache",
    extensions: ["sitx"],
    compressible: null
  },
  "application/x-subrip": {
    source: "apache",
    extensions: ["srt"],
    compressible: null
  },
  "application/x-sv4cpio": {
    source: "apache",
    extensions: ["sv4cpio"],
    compressible: null
  },
  "application/x-sv4crc": {
    source: "apache",
    extensions: ["sv4crc"],
    compressible: null
  },
  "application/x-t3vm-image": {
    source: "apache",
    extensions: ["t3"],
    compressible: null
  },
  "application/x-tads": {
    source: "apache",
    extensions: ["gam"],
    compressible: null
  },
  "application/x-tar": {
    source: "apache",
    compressible: true,
    extensions: ["tar"]
  },
  "application/x-tcl": {
    source: "apache",
    extensions: ["tcl", "tk"],
    compressible: null
  },
  "application/x-tex": {
    source: "apache",
    extensions: ["tex"],
    compressible: null
  },
  "application/x-tex-tfm": {
    source: "apache",
    extensions: ["tfm"],
    compressible: null
  },
  "application/x-texinfo": {
    source: "apache",
    extensions: ["texinfo", "texi"],
    compressible: null
  },
  "application/x-tgif": {
    source: "apache",
    extensions: ["obj"],
    compressible: null
  },
  "application/x-ustar": {
    source: "apache",
    extensions: ["ustar"],
    compressible: null
  },
  "application/x-wais-source": {
    source: "apache",
    extensions: ["src"],
    compressible: null
  },
  "application/x-x509-ca-cert": {
    source: "iana",
    extensions: ["der", "crt", "pem"],
    compressible: null
  },
  "application/x-xfig": {
    source: "apache",
    extensions: ["fig"],
    compressible: null
  },
  "application/x-xliff+xml": {
    source: "apache",
    compressible: true,
    extensions: ["xlf"]
  },
  "application/x-xpinstall": {
    source: "apache",
    compressible: false,
    extensions: ["xpi"]
  },
  "application/x-xz": {
    source: "apache",
    extensions: ["xz"],
    compressible: null
  },
  "application/x-zmachine": {
    source: "apache",
    extensions: ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8"],
    compressible: null
  },
  "application/xaml+xml": {
    source: "apache",
    compressible: true,
    extensions: ["xaml"]
  },
  "application/xcap-att+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xav"]
  },
  "application/xcap-caps+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xca"]
  },
  "application/xcap-diff+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xdf"]
  },
  "application/xcap-el+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xel"]
  },
  "application/xcap-ns+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xns"]
  },
  "application/xenc+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xenc"]
  },
  "application/xhtml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xhtml", "xht"]
  },
  "application/xliff+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xlf"]
  },
  "application/xml": {
    source: "iana",
    compressible: true,
    extensions: ["xml", "xsl", "xsd", "rng"]
  },
  "application/xml-dtd": {
    source: "iana",
    compressible: true,
    extensions: ["dtd"]
  },
  "application/xop+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xop"]
  },
  "application/xproc+xml": {
    source: "apache",
    compressible: true,
    extensions: ["xpl"]
  },
  "application/xslt+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xsl", "xslt"]
  },
  "application/xspf+xml": {
    source: "apache",
    compressible: true,
    extensions: ["xspf"]
  },
  "application/xv+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mxml", "xhvml", "xvml", "xvm"]
  },
  "application/yang": {
    source: "iana",
    extensions: ["yang"],
    compressible: null
  },
  "application/yin+xml": {
    source: "iana",
    compressible: true,
    extensions: ["yin"]
  },
  "application/zip": {
    source: "iana",
    compressible: false,
    extensions: ["zip"]
  },
  "audio/3gpp": {
    source: "iana",
    compressible: false,
    extensions: ["3gpp"]
  },
  "audio/adpcm": {
    source: "apache",
    extensions: ["adp"],
    compressible: null
  },
  "audio/amr": {
    source: "iana",
    extensions: ["amr"],
    compressible: null
  },
  "audio/basic": {
    source: "iana",
    compressible: false,
    extensions: ["au", "snd"]
  },
  "audio/midi": {
    source: "apache",
    extensions: ["mid", "midi", "kar", "rmi"],
    compressible: null
  },
  "audio/mobile-xmf": {
    source: "iana",
    extensions: ["mxmf"],
    compressible: null
  },
  "audio/mp4": {
    source: "iana",
    compressible: false,
    extensions: ["m4a", "mp4a"]
  },
  "audio/mpeg": {
    source: "iana",
    compressible: false,
    extensions: ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"]
  },
  "audio/ogg": {
    source: "iana",
    compressible: false,
    extensions: ["oga", "ogg", "spx", "opus"]
  },
  "audio/s3m": {
    source: "apache",
    extensions: ["s3m"],
    compressible: null
  },
  "audio/silk": {
    source: "apache",
    extensions: ["sil"],
    compressible: null
  },
  "audio/vnd.dece.audio": {
    source: "iana",
    extensions: ["uva", "uvva"],
    compressible: null
  },
  "audio/vnd.digital-winds": {
    source: "iana",
    extensions: ["eol"],
    compressible: null
  },
  "audio/vnd.dra": {
    source: "iana",
    extensions: ["dra"],
    compressible: null
  },
  "audio/vnd.dts": {
    source: "iana",
    extensions: ["dts"],
    compressible: null
  },
  "audio/vnd.dts.hd": {
    source: "iana",
    extensions: ["dtshd"],
    compressible: null
  },
  "audio/vnd.lucent.voice": {
    source: "iana",
    extensions: ["lvp"],
    compressible: null
  },
  "audio/vnd.ms-playready.media.pya": {
    source: "iana",
    extensions: ["pya"],
    compressible: null
  },
  "audio/vnd.nuera.ecelp4800": {
    source: "iana",
    extensions: ["ecelp4800"],
    compressible: null
  },
  "audio/vnd.nuera.ecelp7470": {
    source: "iana",
    extensions: ["ecelp7470"],
    compressible: null
  },
  "audio/vnd.nuera.ecelp9600": {
    source: "iana",
    extensions: ["ecelp9600"],
    compressible: null
  },
  "audio/vnd.rip": {
    source: "iana",
    extensions: ["rip"],
    compressible: null
  },
  "audio/webm": {
    source: "apache",
    compressible: false,
    extensions: ["weba"]
  },
  "audio/x-aac": {
    source: "apache",
    compressible: false,
    extensions: ["aac"]
  },
  "audio/x-aiff": {
    source: "apache",
    extensions: ["aif", "aiff", "aifc"],
    compressible: null
  },
  "audio/x-caf": {
    source: "apache",
    compressible: false,
    extensions: ["caf"]
  },
  "audio/x-flac": {
    source: "apache",
    extensions: ["flac"],
    compressible: null
  },
  "audio/x-m4a": {
    source: "nginx",
    extensions: ["m4a"],
    compressible: null
  },
  "audio/x-matroska": {
    source: "apache",
    extensions: ["mka"],
    compressible: null
  },
  "audio/x-mpegurl": {
    source: "apache",
    extensions: ["m3u"],
    compressible: null
  },
  "audio/x-ms-wax": {
    source: "apache",
    extensions: ["wax"],
    compressible: null
  },
  "audio/x-ms-wma": {
    source: "apache",
    extensions: ["wma"],
    compressible: null
  },
  "audio/x-pn-realaudio": {
    source: "apache",
    extensions: ["ram", "ra"],
    compressible: null
  },
  "audio/x-pn-realaudio-plugin": {
    source: "apache",
    extensions: ["rmp"],
    compressible: null
  },
  "audio/x-realaudio": {
    source: "nginx",
    extensions: ["ra"],
    compressible: null
  },
  "audio/x-wav": {
    source: "apache",
    extensions: ["wav"],
    compressible: null
  },
  "audio/xm": {
    source: "apache",
    extensions: ["xm"],
    compressible: null
  },
  "chemical/x-cdx": {
    source: "apache",
    extensions: ["cdx"],
    compressible: null
  },
  "chemical/x-cif": {
    source: "apache",
    extensions: ["cif"],
    compressible: null
  },
  "chemical/x-cmdf": {
    source: "apache",
    extensions: ["cmdf"],
    compressible: null
  },
  "chemical/x-cml": {
    source: "apache",
    extensions: ["cml"],
    compressible: null
  },
  "chemical/x-csml": {
    source: "apache",
    extensions: ["csml"],
    compressible: null
  },
  "chemical/x-xyz": {
    source: "apache",
    extensions: ["xyz"],
    compressible: null
  },
  "font/collection": {
    source: "iana",
    extensions: ["ttc"],
    compressible: null
  },
  "font/otf": {
    source: "iana",
    compressible: true,
    extensions: ["otf"]
  },
  "font/ttf": {
    source: "iana",
    compressible: true,
    extensions: ["ttf"]
  },
  "font/woff": {
    source: "iana",
    extensions: ["woff"],
    compressible: null
  },
  "font/woff2": {
    source: "iana",
    extensions: ["woff2"],
    compressible: null
  },
  "image/aces": {
    source: "iana",
    extensions: ["exr"],
    compressible: null
  },
  "image/avci": {
    source: "iana",
    extensions: ["avci"],
    compressible: null
  },
  "image/avcs": {
    source: "iana",
    extensions: ["avcs"],
    compressible: null
  },
  "image/avif": {
    source: "iana",
    compressible: false,
    extensions: ["avif"]
  },
  "image/bmp": {
    source: "iana",
    compressible: true,
    extensions: ["bmp"]
  },
  "image/cgm": {
    source: "iana",
    extensions: ["cgm"],
    compressible: null
  },
  "image/dicom-rle": {
    source: "iana",
    extensions: ["drle"],
    compressible: null
  },
  "image/emf": {
    source: "iana",
    extensions: ["emf"],
    compressible: null
  },
  "image/fits": {
    source: "iana",
    extensions: ["fits"],
    compressible: null
  },
  "image/g3fax": {
    source: "iana",
    extensions: ["g3"],
    compressible: null
  },
  "image/gif": {
    source: "iana",
    compressible: false,
    extensions: ["gif"]
  },
  "image/heic": {
    source: "iana",
    extensions: ["heic"],
    compressible: null
  },
  "image/heic-sequence": {
    source: "iana",
    extensions: ["heics"],
    compressible: null
  },
  "image/heif": {
    source: "iana",
    extensions: ["heif"],
    compressible: null
  },
  "image/heif-sequence": {
    source: "iana",
    extensions: ["heifs"],
    compressible: null
  },
  "image/hej2k": {
    source: "iana",
    extensions: ["hej2"],
    compressible: null
  },
  "image/hsj2": {
    source: "iana",
    extensions: ["hsj2"],
    compressible: null
  },
  "image/ief": {
    source: "iana",
    extensions: ["ief"],
    compressible: null
  },
  "image/jls": {
    source: "iana",
    extensions: ["jls"],
    compressible: null
  },
  "image/jp2": {
    source: "iana",
    compressible: false,
    extensions: ["jp2", "jpg2"]
  },
  "image/jpeg": {
    source: "iana",
    compressible: false,
    extensions: ["jpeg", "jpg", "jpe"]
  },
  "image/jph": {
    source: "iana",
    extensions: ["jph"],
    compressible: null
  },
  "image/jphc": {
    source: "iana",
    extensions: ["jhc"],
    compressible: null
  },
  "image/jpm": {
    source: "iana",
    compressible: false,
    extensions: ["jpm"]
  },
  "image/jpx": {
    source: "iana",
    compressible: false,
    extensions: ["jpx", "jpf"]
  },
  "image/jxr": {
    source: "iana",
    extensions: ["jxr"],
    compressible: null
  },
  "image/jxra": {
    source: "iana",
    extensions: ["jxra"],
    compressible: null
  },
  "image/jxrs": {
    source: "iana",
    extensions: ["jxrs"],
    compressible: null
  },
  "image/jxs": {
    source: "iana",
    extensions: ["jxs"],
    compressible: null
  },
  "image/jxsc": {
    source: "iana",
    extensions: ["jxsc"],
    compressible: null
  },
  "image/jxsi": {
    source: "iana",
    extensions: ["jxsi"],
    compressible: null
  },
  "image/jxss": {
    source: "iana",
    extensions: ["jxss"],
    compressible: null
  },
  "image/ktx": {
    source: "iana",
    extensions: ["ktx"],
    compressible: null
  },
  "image/ktx2": {
    source: "iana",
    extensions: ["ktx2"],
    compressible: null
  },
  "image/png": {
    source: "iana",
    compressible: false,
    extensions: ["png"]
  },
  "image/prs.btif": {
    source: "iana",
    extensions: ["btif"],
    compressible: null
  },
  "image/prs.pti": {
    source: "iana",
    extensions: ["pti"],
    compressible: null
  },
  "image/sgi": {
    source: "apache",
    extensions: ["sgi"],
    compressible: null
  },
  "image/svg+xml": {
    source: "iana",
    compressible: true,
    extensions: ["svg", "svgz"]
  },
  "image/t38": {
    source: "iana",
    extensions: ["t38"],
    compressible: null
  },
  "image/tiff": {
    source: "iana",
    compressible: false,
    extensions: ["tif", "tiff"]
  },
  "image/tiff-fx": {
    source: "iana",
    extensions: ["tfx"],
    compressible: null
  },
  "image/vnd.adobe.photoshop": {
    source: "iana",
    compressible: true,
    extensions: ["psd"]
  },
  "image/vnd.airzip.accelerator.azv": {
    source: "iana",
    extensions: ["azv"],
    compressible: null
  },
  "image/vnd.dece.graphic": {
    source: "iana",
    extensions: ["uvi", "uvvi", "uvg", "uvvg"],
    compressible: null
  },
  "image/vnd.djvu": {
    source: "iana",
    extensions: ["djvu", "djv"],
    compressible: null
  },
  "image/vnd.dvb.subtitle": {
    source: "iana",
    extensions: ["sub"],
    compressible: null
  },
  "image/vnd.dwg": {
    source: "iana",
    extensions: ["dwg"],
    compressible: null
  },
  "image/vnd.dxf": {
    source: "iana",
    extensions: ["dxf"],
    compressible: null
  },
  "image/vnd.fastbidsheet": {
    source: "iana",
    extensions: ["fbs"],
    compressible: null
  },
  "image/vnd.fpx": {
    source: "iana",
    extensions: ["fpx"],
    compressible: null
  },
  "image/vnd.fst": {
    source: "iana",
    extensions: ["fst"],
    compressible: null
  },
  "image/vnd.fujixerox.edmics-mmr": {
    source: "iana",
    extensions: ["mmr"],
    compressible: null
  },
  "image/vnd.fujixerox.edmics-rlc": {
    source: "iana",
    extensions: ["rlc"],
    compressible: null
  },
  "image/vnd.microsoft.icon": {
    source: "iana",
    compressible: true,
    extensions: ["ico"]
  },
  "image/vnd.ms-modi": {
    source: "iana",
    extensions: ["mdi"],
    compressible: null
  },
  "image/vnd.ms-photo": {
    source: "apache",
    extensions: ["wdp"],
    compressible: null
  },
  "image/vnd.net-fpx": {
    source: "iana",
    extensions: ["npx"],
    compressible: null
  },
  "image/vnd.pco.b16": {
    source: "iana",
    extensions: ["b16"],
    compressible: null
  },
  "image/vnd.tencent.tap": {
    source: "iana",
    extensions: ["tap"],
    compressible: null
  },
  "image/vnd.valve.source.texture": {
    source: "iana",
    extensions: ["vtf"],
    compressible: null
  },
  "image/vnd.wap.wbmp": {
    source: "iana",
    extensions: ["wbmp"],
    compressible: null
  },
  "image/vnd.xiff": {
    source: "iana",
    extensions: ["xif"],
    compressible: null
  },
  "image/vnd.zbrush.pcx": {
    source: "iana",
    extensions: ["pcx"],
    compressible: null
  },
  "image/webp": {
    source: "apache",
    extensions: ["webp"],
    compressible: null
  },
  "image/wmf": {
    source: "iana",
    extensions: ["wmf"],
    compressible: null
  },
  "image/x-3ds": {
    source: "apache",
    extensions: ["3ds"],
    compressible: null
  },
  "image/x-cmu-raster": {
    source: "apache",
    extensions: ["ras"],
    compressible: null
  },
  "image/x-cmx": {
    source: "apache",
    extensions: ["cmx"],
    compressible: null
  },
  "image/x-freehand": {
    source: "apache",
    extensions: ["fh", "fhc", "fh4", "fh5", "fh7"],
    compressible: null
  },
  "image/x-icon": {
    source: "apache",
    compressible: true,
    extensions: ["ico"]
  },
  "image/x-jng": {
    source: "nginx",
    extensions: ["jng"],
    compressible: null
  },
  "image/x-mrsid-image": {
    source: "apache",
    extensions: ["sid"],
    compressible: null
  },
  "image/x-ms-bmp": {
    source: "nginx",
    compressible: true,
    extensions: ["bmp"]
  },
  "image/x-pcx": {
    source: "apache",
    extensions: ["pcx"],
    compressible: null
  },
  "image/x-pict": {
    source: "apache",
    extensions: ["pic", "pct"],
    compressible: null
  },
  "image/x-portable-anymap": {
    source: "apache",
    extensions: ["pnm"],
    compressible: null
  },
  "image/x-portable-bitmap": {
    source: "apache",
    extensions: ["pbm"],
    compressible: null
  },
  "image/x-portable-graymap": {
    source: "apache",
    extensions: ["pgm"],
    compressible: null
  },
  "image/x-portable-pixmap": {
    source: "apache",
    extensions: ["ppm"],
    compressible: null
  },
  "image/x-rgb": {
    source: "apache",
    extensions: ["rgb"],
    compressible: null
  },
  "image/x-tga": {
    source: "apache",
    extensions: ["tga"],
    compressible: null
  },
  "image/x-xbitmap": {
    source: "apache",
    extensions: ["xbm"],
    compressible: null
  },
  "image/x-xpixmap": {
    source: "apache",
    extensions: ["xpm"],
    compressible: null
  },
  "image/x-xwindowdump": {
    source: "apache",
    extensions: ["xwd"],
    compressible: null
  },
  "message/disposition-notification": {
    source: "iana",
    extensions: ["disposition-notification"],
    compressible: null
  },
  "message/global": {
    source: "iana",
    extensions: ["u8msg"],
    compressible: null
  },
  "message/global-delivery-status": {
    source: "iana",
    extensions: ["u8dsn"],
    compressible: null
  },
  "message/global-disposition-notification": {
    source: "iana",
    extensions: ["u8mdn"],
    compressible: null
  },
  "message/global-headers": {
    source: "iana",
    extensions: ["u8hdr"],
    compressible: null
  },
  "message/rfc822": {
    source: "iana",
    compressible: true,
    extensions: ["eml", "mime"]
  },
  "message/vnd.wfa.wsc": {
    source: "iana",
    extensions: ["wsc"],
    compressible: null
  },
  "model/3mf": {
    source: "iana",
    extensions: ["3mf"],
    compressible: null
  },
  "model/gltf+json": {
    source: "iana",
    compressible: true,
    extensions: ["gltf"]
  },
  "model/gltf-binary": {
    source: "iana",
    compressible: true,
    extensions: ["glb"]
  },
  "model/iges": {
    source: "iana",
    compressible: false,
    extensions: ["igs", "iges"]
  },
  "model/mesh": {
    source: "iana",
    compressible: false,
    extensions: ["msh", "mesh", "silo"]
  },
  "model/mtl": {
    source: "iana",
    extensions: ["mtl"],
    compressible: null
  },
  "model/obj": {
    source: "iana",
    extensions: ["obj"],
    compressible: null
  },
  "model/step+xml": {
    source: "iana",
    compressible: true,
    extensions: ["stpx"]
  },
  "model/step+zip": {
    source: "iana",
    compressible: false,
    extensions: ["stpz"]
  },
  "model/step-xml+zip": {
    source: "iana",
    compressible: false,
    extensions: ["stpxz"]
  },
  "model/stl": {
    source: "iana",
    extensions: ["stl"],
    compressible: null
  },
  "model/vnd.collada+xml": {
    source: "iana",
    compressible: true,
    extensions: ["dae"]
  },
  "model/vnd.dwf": {
    source: "iana",
    extensions: ["dwf"],
    compressible: null
  },
  "model/vnd.gdl": {
    source: "iana",
    extensions: ["gdl"],
    compressible: null
  },
  "model/vnd.gtw": {
    source: "iana",
    extensions: ["gtw"],
    compressible: null
  },
  "model/vnd.mts": {
    source: "iana",
    extensions: ["mts"],
    compressible: null
  },
  "model/vnd.opengex": {
    source: "iana",
    extensions: ["ogex"],
    compressible: null
  },
  "model/vnd.parasolid.transmit.binary": {
    source: "iana",
    extensions: ["x_b"],
    compressible: null
  },
  "model/vnd.parasolid.transmit.text": {
    source: "iana",
    extensions: ["x_t"],
    compressible: null
  },
  "model/vnd.sap.vds": {
    source: "iana",
    extensions: ["vds"],
    compressible: null
  },
  "model/vnd.usdz+zip": {
    source: "iana",
    compressible: false,
    extensions: ["usdz"]
  },
  "model/vnd.valve.source.compiled-map": {
    source: "iana",
    extensions: ["bsp"],
    compressible: null
  },
  "model/vnd.vtu": {
    source: "iana",
    extensions: ["vtu"],
    compressible: null
  },
  "model/vrml": {
    source: "iana",
    compressible: false,
    extensions: ["wrl", "vrml"]
  },
  "model/x3d+binary": {
    source: "apache",
    compressible: false,
    extensions: ["x3db", "x3dbz"]
  },
  "model/x3d+fastinfoset": {
    source: "iana",
    extensions: ["x3db"],
    compressible: null
  },
  "model/x3d+vrml": {
    source: "apache",
    compressible: false,
    extensions: ["x3dv", "x3dvz"]
  },
  "model/x3d+xml": {
    source: "iana",
    compressible: true,
    extensions: ["x3d", "x3dz"]
  },
  "model/x3d-vrml": {
    source: "iana",
    extensions: ["x3dv"],
    compressible: null
  },
  "text/cache-manifest": {
    source: "iana",
    compressible: true,
    extensions: ["appcache", "manifest"]
  },
  "text/calendar": {
    source: "iana",
    extensions: ["ics", "ifb"],
    compressible: null
  },
  "text/css": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["css"]
  },
  "text/csv": {
    source: "iana",
    compressible: true,
    extensions: ["csv"]
  },
  "text/html": {
    source: "iana",
    compressible: true,
    extensions: ["html", "htm", "shtml"]
  },
  "text/markdown": {
    source: "iana",
    compressible: true,
    extensions: ["markdown", "md"]
  },
  "text/mathml": {
    source: "nginx",
    extensions: ["mml"],
    compressible: null
  },
  "text/n3": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["n3"]
  },
  "text/plain": {
    source: "iana",
    compressible: true,
    extensions: ["txt", "text", "conf", "def", "list", "log", "in", "ini"]
  },
  "text/prs.lines.tag": {
    source: "iana",
    extensions: ["dsc"],
    compressible: null
  },
  "text/richtext": {
    source: "iana",
    compressible: true,
    extensions: ["rtx"]
  },
  "text/rtf": {
    source: "iana",
    compressible: true,
    extensions: ["rtf"]
  },
  "text/sgml": {
    source: "iana",
    extensions: ["sgml", "sgm"],
    compressible: null
  },
  "text/shex": {
    source: "iana",
    extensions: ["shex"],
    compressible: null
  },
  "text/spdx": {
    source: "iana",
    extensions: ["spdx"],
    compressible: null
  },
  "text/tab-separated-values": {
    source: "iana",
    compressible: true,
    extensions: ["tsv"]
  },
  "text/troff": {
    source: "iana",
    extensions: ["t", "tr", "roff", "man", "me", "ms"],
    compressible: null
  },
  "text/turtle": {
    source: "iana",
    charset: "UTF-8",
    extensions: ["ttl"],
    compressible: null
  },
  "text/uri-list": {
    source: "iana",
    compressible: true,
    extensions: ["uri", "uris", "urls"]
  },
  "text/vcard": {
    source: "iana",
    compressible: true,
    extensions: ["vcard"]
  },
  "text/vnd.curl": {
    source: "iana",
    extensions: ["curl"],
    compressible: null
  },
  "text/vnd.curl.dcurl": {
    source: "apache",
    extensions: ["dcurl"],
    compressible: null
  },
  "text/vnd.curl.mcurl": {
    source: "apache",
    extensions: ["mcurl"],
    compressible: null
  },
  "text/vnd.curl.scurl": {
    source: "apache",
    extensions: ["scurl"],
    compressible: null
  },
  "text/vnd.dvb.subtitle": {
    source: "iana",
    extensions: ["sub"],
    compressible: null
  },
  "text/vnd.familysearch.gedcom": {
    source: "iana",
    extensions: ["ged"],
    compressible: null
  },
  "text/vnd.fly": {
    source: "iana",
    extensions: ["fly"],
    compressible: null
  },
  "text/vnd.fmi.flexstor": {
    source: "iana",
    extensions: ["flx"],
    compressible: null
  },
  "text/vnd.graphviz": {
    source: "iana",
    extensions: ["gv"],
    compressible: null
  },
  "text/vnd.in3d.3dml": {
    source: "iana",
    extensions: ["3dml"],
    compressible: null
  },
  "text/vnd.in3d.spot": {
    source: "iana",
    extensions: ["spot"],
    compressible: null
  },
  "text/vnd.sun.j2me.app-descriptor": {
    source: "iana",
    charset: "UTF-8",
    extensions: ["jad"],
    compressible: null
  },
  "text/vnd.wap.wml": {
    source: "iana",
    extensions: ["wml"],
    compressible: null
  },
  "text/vnd.wap.wmlscript": {
    source: "iana",
    extensions: ["wmls"],
    compressible: null
  },
  "text/vtt": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["vtt"]
  },
  "text/x-asm": {
    source: "apache",
    extensions: ["s", "asm"],
    compressible: null
  },
  "text/x-c": {
    source: "apache",
    extensions: ["c", "cc", "cxx", "cpp", "h", "hh", "dic"],
    compressible: null
  },
  "text/x-component": {
    source: "nginx",
    extensions: ["htc"],
    compressible: null
  },
  "text/x-fortran": {
    source: "apache",
    extensions: ["f", "for", "f77", "f90"],
    compressible: null
  },
  "text/x-java-source": {
    source: "apache",
    extensions: ["java"],
    compressible: null
  },
  "text/x-nfo": {
    source: "apache",
    extensions: ["nfo"],
    compressible: null
  },
  "text/x-opml": {
    source: "apache",
    extensions: ["opml"],
    compressible: null
  },
  "text/x-pascal": {
    source: "apache",
    extensions: ["p", "pas"],
    compressible: null
  },
  "text/x-setext": {
    source: "apache",
    extensions: ["etx"],
    compressible: null
  },
  "text/x-sfv": {
    source: "apache",
    extensions: ["sfv"],
    compressible: null
  },
  "text/x-uuencode": {
    source: "apache",
    extensions: ["uu"],
    compressible: null
  },
  "text/x-vcalendar": {
    source: "apache",
    extensions: ["vcs"],
    compressible: null
  },
  "text/x-vcard": {
    source: "apache",
    extensions: ["vcf"],
    compressible: null
  },
  "text/xml": {
    source: "iana",
    compressible: true,
    extensions: ["xml"]
  },
  "video/3gpp": {
    source: "iana",
    extensions: ["3gp", "3gpp"],
    compressible: null
  },
  "video/3gpp2": {
    source: "iana",
    extensions: ["3g2"],
    compressible: null
  },
  "video/h261": {
    source: "iana",
    extensions: ["h261"],
    compressible: null
  },
  "video/h263": {
    source: "iana",
    extensions: ["h263"],
    compressible: null
  },
  "video/h264": {
    source: "iana",
    extensions: ["h264"],
    compressible: null
  },
  "video/iso.segment": {
    source: "iana",
    extensions: ["m4s"],
    compressible: null
  },
  "video/jpeg": {
    source: "iana",
    extensions: ["jpgv"],
    compressible: null
  },
  "video/jpm": {
    source: "apache",
    extensions: ["jpm", "jpgm"],
    compressible: null
  },
  "video/mj2": {
    source: "iana",
    extensions: ["mj2", "mjp2"],
    compressible: null
  },
  "video/mp2t": {
    source: "iana",
    extensions: ["ts"],
    compressible: null
  },
  "video/mp4": {
    source: "iana",
    compressible: false,
    extensions: ["mp4", "mp4v", "mpg4"]
  },
  "video/mpeg": {
    source: "iana",
    compressible: false,
    extensions: ["mpeg", "mpg", "mpe", "m1v", "m2v"]
  },
  "video/ogg": {
    source: "iana",
    compressible: false,
    extensions: ["ogv"]
  },
  "video/quicktime": {
    source: "iana",
    compressible: false,
    extensions: ["qt", "mov"]
  },
  "video/vnd.dece.hd": {
    source: "iana",
    extensions: ["uvh", "uvvh"],
    compressible: null
  },
  "video/vnd.dece.mobile": {
    source: "iana",
    extensions: ["uvm", "uvvm"],
    compressible: null
  },
  "video/vnd.dece.pd": {
    source: "iana",
    extensions: ["uvp", "uvvp"],
    compressible: null
  },
  "video/vnd.dece.sd": {
    source: "iana",
    extensions: ["uvs", "uvvs"],
    compressible: null
  },
  "video/vnd.dece.video": {
    source: "iana",
    extensions: ["uvv", "uvvv"],
    compressible: null
  },
  "video/vnd.dvb.file": {
    source: "iana",
    extensions: ["dvb"],
    compressible: null
  },
  "video/vnd.fvt": {
    source: "iana",
    extensions: ["fvt"],
    compressible: null
  },
  "video/vnd.mpegurl": {
    source: "iana",
    extensions: ["mxu", "m4u"],
    compressible: null
  },
  "video/vnd.ms-playready.media.pyv": {
    source: "iana",
    extensions: ["pyv"],
    compressible: null
  },
  "video/vnd.uvvu.mp4": {
    source: "iana",
    extensions: ["uvu", "uvvu"],
    compressible: null
  },
  "video/vnd.vivo": {
    source: "iana",
    extensions: ["viv"],
    compressible: null
  },
  "video/webm": {
    source: "apache",
    compressible: false,
    extensions: ["webm"]
  },
  "video/x-f4v": {
    source: "apache",
    extensions: ["f4v"],
    compressible: null
  },
  "video/x-fli": {
    source: "apache",
    extensions: ["fli"],
    compressible: null
  },
  "video/x-flv": {
    source: "apache",
    compressible: false,
    extensions: ["flv"]
  },
  "video/x-m4v": {
    source: "apache",
    extensions: ["m4v"],
    compressible: null
  },
  "video/x-matroska": {
    source: "apache",
    compressible: false,
    extensions: ["mkv", "mk3d", "mks"]
  },
  "video/x-mng": {
    source: "apache",
    extensions: ["mng"],
    compressible: null
  },
  "video/x-ms-asf": {
    source: "apache",
    extensions: ["asf", "asx"],
    compressible: null
  },
  "video/x-ms-vob": {
    source: "apache",
    extensions: ["vob"],
    compressible: null
  },
  "video/x-ms-wm": {
    source: "apache",
    extensions: ["wm"],
    compressible: null
  },
  "video/x-ms-wmv": {
    source: "apache",
    compressible: false,
    extensions: ["wmv"]
  },
  "video/x-ms-wmx": {
    source: "apache",
    extensions: ["wmx"],
    compressible: null
  },
  "video/x-ms-wvx": {
    source: "apache",
    extensions: ["wvx"],
    compressible: null
  },
  "video/x-msvideo": {
    source: "apache",
    extensions: ["avi"],
    compressible: null
  },
  "video/x-sgi-movie": {
    source: "apache",
    extensions: ["movie"],
    compressible: null
  },
  "video/x-smv": {
    source: "apache",
    extensions: ["smv"],
    compressible: null
  },
  "x-conference/x-cooltalk": {
    source: "apache",
    extensions: ["ice"],
    compressible: null
  }
}, De = Zn, Fn = {}, $n = {};
Mn(Fn, $n);
function Mn(n, e2) {
  const s = ["nginx", "apache", void 0, "iana"];
  Object.keys(De).forEach((i2) => {
    const a = De[i2], t2 = a.extensions;
    if (!(!t2 || !t2.length)) {
      n[i2] = t2;
      for (let o = 0; o < t2.length; o++) {
        const r2 = t2[o];
        if (e2[r2]) {
          const c = s.indexOf(De[e2[r2]].source), l = s.indexOf(a.source);
          if (e2[r2] !== "application/octet-stream" && (c > l || c === l && e2[r2].substring(0, 12) === "application/"))
            continue;
        }
        e2[r2] = i2;
      }
    }
  });
}
/*!
 * mime-types
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
var j;
(function(n) {
  n.assertEqual = (a) => a;
  function e2(a) {
  }
  n.assertIs = e2;
  function s(a) {
    throw new Error();
  }
  n.assertNever = s, n.arrayToEnum = (a) => {
    const t2 = {};
    for (const o of a)
      t2[o] = o;
    return t2;
  }, n.getValidEnumValues = (a) => {
    const t2 = n.objectKeys(a).filter((r2) => typeof a[a[r2]] != "number"), o = {};
    for (const r2 of t2)
      o[r2] = a[r2];
    return n.objectValues(o);
  }, n.objectValues = (a) => n.objectKeys(a).map(function(t2) {
    return a[t2];
  }), n.objectKeys = typeof Object.keys == "function" ? (a) => Object.keys(a) : (a) => {
    const t2 = [];
    for (const o in a)
      Object.prototype.hasOwnProperty.call(a, o) && t2.push(o);
    return t2;
  }, n.find = (a, t2) => {
    for (const o of a)
      if (t2(o))
        return o;
  }, n.isInteger = typeof Number.isInteger == "function" ? (a) => Number.isInteger(a) : (a) => typeof a == "number" && isFinite(a) && Math.floor(a) === a;
  function i2(a, t2 = " | ") {
    return a.map((o) => typeof o == "string" ? `'${o}'` : o).join(t2);
  }
  n.joinValues = i2, n.jsonStringifyReplacer = (a, t2) => typeof t2 == "bigint" ? t2.toString() : t2;
})(j || (j = {}));
var js;
(function(n) {
  n.mergeShapes = (e2, s) => ({
    ...e2,
    ...s
    // second overwrites first
  });
})(js || (js = {}));
const d = j.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]), ce = (n) => {
  switch (typeof n) {
    case "undefined":
      return d.undefined;
    case "string":
      return d.string;
    case "number":
      return isNaN(n) ? d.nan : d.number;
    case "boolean":
      return d.boolean;
    case "function":
      return d.function;
    case "bigint":
      return d.bigint;
    case "symbol":
      return d.symbol;
    case "object":
      return Array.isArray(n) ? d.array : n === null ? d.null : n.then && typeof n.then == "function" && n.catch && typeof n.catch == "function" ? d.promise : typeof Map < "u" && n instanceof Map ? d.map : typeof Set < "u" && n instanceof Set ? d.set : typeof Date < "u" && n instanceof Date ? d.date : d.object;
    default:
      return d.unknown;
  }
}, p = j.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
class K extends Error {
  constructor(e2) {
    super(), this.issues = [], this.addIssue = (i2) => {
      this.issues = [...this.issues, i2];
    }, this.addIssues = (i2 = []) => {
      this.issues = [...this.issues, ...i2];
    };
    const s = new.target.prototype;
    Object.setPrototypeOf ? Object.setPrototypeOf(this, s) : this.__proto__ = s, this.name = "ZodError", this.issues = e2;
  }
  get errors() {
    return this.issues;
  }
  format(e2) {
    const s = e2 || function(t2) {
      return t2.message;
    }, i2 = { _errors: [] }, a = (t2) => {
      for (const o of t2.issues)
        if (o.code === "invalid_union")
          o.unionErrors.map(a);
        else if (o.code === "invalid_return_type")
          a(o.returnTypeError);
        else if (o.code === "invalid_arguments")
          a(o.argumentsError);
        else if (o.path.length === 0)
          i2._errors.push(s(o));
        else {
          let r2 = i2, c = 0;
          for (; c < o.path.length; ) {
            const l = o.path[c];
            c === o.path.length - 1 ? (r2[l] = r2[l] || { _errors: [] }, r2[l]._errors.push(s(o))) : r2[l] = r2[l] || { _errors: [] }, r2 = r2[l], c++;
          }
        }
    };
    return a(this), i2;
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, j.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(e2 = (s) => s.message) {
    const s = {}, i2 = [];
    for (const a of this.issues)
      a.path.length > 0 ? (s[a.path[0]] = s[a.path[0]] || [], s[a.path[0]].push(e2(a))) : i2.push(e2(a));
    return { formErrors: i2, fieldErrors: s };
  }
  get formErrors() {
    return this.flatten();
  }
}
K.create = (n) => new K(n);
const Ze = (n, e2) => {
  let s;
  switch (n.code) {
    case p.invalid_type:
      n.received === d.undefined ? s = "Required" : s = `Expected ${n.expected}, received ${n.received}`;
      break;
    case p.invalid_literal:
      s = `Invalid literal value, expected ${JSON.stringify(n.expected, j.jsonStringifyReplacer)}`;
      break;
    case p.unrecognized_keys:
      s = `Unrecognized key(s) in object: ${j.joinValues(n.keys, ", ")}`;
      break;
    case p.invalid_union:
      s = "Invalid input";
      break;
    case p.invalid_union_discriminator:
      s = `Invalid discriminator value. Expected ${j.joinValues(n.options)}`;
      break;
    case p.invalid_enum_value:
      s = `Invalid enum value. Expected ${j.joinValues(n.options)}, received '${n.received}'`;
      break;
    case p.invalid_arguments:
      s = "Invalid function arguments";
      break;
    case p.invalid_return_type:
      s = "Invalid function return type";
      break;
    case p.invalid_date:
      s = "Invalid date";
      break;
    case p.invalid_string:
      typeof n.validation == "object" ? "includes" in n.validation ? (s = `Invalid input: must include "${n.validation.includes}"`, typeof n.validation.position == "number" && (s = `${s} at one or more positions greater than or equal to ${n.validation.position}`)) : "startsWith" in n.validation ? s = `Invalid input: must start with "${n.validation.startsWith}"` : "endsWith" in n.validation ? s = `Invalid input: must end with "${n.validation.endsWith}"` : j.assertNever(n.validation) : n.validation !== "regex" ? s = `Invalid ${n.validation}` : s = "Invalid";
      break;
    case p.too_small:
      n.type === "array" ? s = `Array must contain ${n.exact ? "exactly" : n.inclusive ? "at least" : "more than"} ${n.minimum} element(s)` : n.type === "string" ? s = `String must contain ${n.exact ? "exactly" : n.inclusive ? "at least" : "over"} ${n.minimum} character(s)` : n.type === "number" ? s = `Number must be ${n.exact ? "exactly equal to " : n.inclusive ? "greater than or equal to " : "greater than "}${n.minimum}` : n.type === "date" ? s = `Date must be ${n.exact ? "exactly equal to " : n.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(n.minimum))}` : s = "Invalid input";
      break;
    case p.too_big:
      n.type === "array" ? s = `Array must contain ${n.exact ? "exactly" : n.inclusive ? "at most" : "less than"} ${n.maximum} element(s)` : n.type === "string" ? s = `String must contain ${n.exact ? "exactly" : n.inclusive ? "at most" : "under"} ${n.maximum} character(s)` : n.type === "number" ? s = `Number must be ${n.exact ? "exactly" : n.inclusive ? "less than or equal to" : "less than"} ${n.maximum}` : n.type === "bigint" ? s = `BigInt must be ${n.exact ? "exactly" : n.inclusive ? "less than or equal to" : "less than"} ${n.maximum}` : n.type === "date" ? s = `Date must be ${n.exact ? "exactly" : n.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(n.maximum))}` : s = "Invalid input";
      break;
    case p.custom:
      s = "Invalid input";
      break;
    case p.invalid_intersection_types:
      s = "Intersection results could not be merged";
      break;
    case p.not_multiple_of:
      s = `Number must be a multiple of ${n.multipleOf}`;
      break;
    case p.not_finite:
      s = "Number must be finite";
      break;
    default:
      s = e2.defaultError, j.assertNever(n);
  }
  return { message: s };
};
let Ln = Ze;
function es() {
  return Ln;
}
const ss = (n) => {
  const { data: e2, path: s, errorMaps: i2, issueData: a } = n, t2 = [...s, ...a.path || []], o = {
    ...a,
    path: t2
  };
  let r2 = "";
  const c = i2.filter((l) => !!l).slice().reverse();
  for (const l of c)
    r2 = l(o, { data: e2, defaultError: r2 }).message;
  return {
    ...a,
    path: t2,
    message: a.message || r2
  };
};
function x(n, e2) {
  const s = ss({
    issueData: e2,
    data: n.data,
    path: n.path,
    errorMaps: [
      n.common.contextualErrorMap,
      n.schemaErrorMap,
      es(),
      Ze
      // then global default map
    ].filter((i2) => !!i2)
  });
  n.common.issues.push(s);
}
class $ {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    this.value === "valid" && (this.value = "dirty");
  }
  abort() {
    this.value !== "aborted" && (this.value = "aborted");
  }
  static mergeArray(e2, s) {
    const i2 = [];
    for (const a of s) {
      if (a.status === "aborted")
        return g;
      a.status === "dirty" && e2.dirty(), i2.push(a.value);
    }
    return { status: e2.value, value: i2 };
  }
  static async mergeObjectAsync(e2, s) {
    const i2 = [];
    for (const a of s)
      i2.push({
        key: await a.key,
        value: await a.value
      });
    return $.mergeObjectSync(e2, i2);
  }
  static mergeObjectSync(e2, s) {
    const i2 = {};
    for (const a of s) {
      const { key: t2, value: o } = a;
      if (t2.status === "aborted" || o.status === "aborted")
        return g;
      t2.status === "dirty" && e2.dirty(), o.status === "dirty" && e2.dirty(), (typeof o.value < "u" || a.alwaysSet) && (i2[t2.value] = o.value);
    }
    return { status: e2.value, value: i2 };
  }
}
const g = Object.freeze({
  status: "aborted"
}), qn = (n) => ({ status: "dirty", value: n }), q = (n) => ({ status: "valid", value: n }), Ts = (n) => n.status === "aborted", Cs = (n) => n.status === "dirty", ns = (n) => n.status === "valid", is = (n) => typeof Promise < "u" && n instanceof Promise;
var h;
(function(n) {
  n.errToObj = (e2) => typeof e2 == "string" ? { message: e2 } : e2 || {}, n.toString = (e2) => typeof e2 == "string" ? e2 : e2 == null ? void 0 : e2.message;
})(h || (h = {}));
class Y {
  constructor(e2, s, i2, a) {
    this._cachedPath = [], this.parent = e2, this.data = s, this._path = i2, this._key = a;
  }
  get path() {
    return this._cachedPath.length || (this._key instanceof Array ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const zs = (n, e2) => {
  if (ns(e2))
    return { success: true, data: e2.value };
  if (!n.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: false,
    get error() {
      if (this._error)
        return this._error;
      const s = new K(n.common.issues);
      return this._error = s, this._error;
    }
  };
};
function y(n) {
  if (!n)
    return {};
  const { errorMap: e2, invalid_type_error: s, required_error: i2, description: a } = n;
  if (e2 && (s || i2))
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  return e2 ? { errorMap: e2, description: a } : { errorMap: (o, r2) => o.code !== "invalid_type" ? { message: r2.defaultError } : typeof r2.data > "u" ? { message: i2 ?? r2.defaultError } : { message: s ?? r2.defaultError }, description: a };
}
class _ {
  constructor(e2) {
    this.spa = this.safeParseAsync, this._def = e2, this.parse = this.parse.bind(this), this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), this.array = this.array.bind(this), this.promise = this.promise.bind(this), this.or = this.or.bind(this), this.and = this.and.bind(this), this.transform = this.transform.bind(this), this.brand = this.brand.bind(this), this.default = this.default.bind(this), this.catch = this.catch.bind(this), this.describe = this.describe.bind(this), this.pipe = this.pipe.bind(this), this.isNullable = this.isNullable.bind(this), this.isOptional = this.isOptional.bind(this);
  }
  get description() {
    return this._def.description;
  }
  _getType(e2) {
    return ce(e2.data);
  }
  _getOrReturnCtx(e2, s) {
    return s || {
      common: e2.parent.common,
      data: e2.data,
      parsedType: ce(e2.data),
      schemaErrorMap: this._def.errorMap,
      path: e2.path,
      parent: e2.parent
    };
  }
  _processInputParams(e2) {
    return {
      status: new $(),
      ctx: {
        common: e2.parent.common,
        data: e2.data,
        parsedType: ce(e2.data),
        schemaErrorMap: this._def.errorMap,
        path: e2.path,
        parent: e2.parent
      }
    };
  }
  _parseSync(e2) {
    const s = this._parse(e2);
    if (is(s))
      throw new Error("Synchronous parse encountered promise.");
    return s;
  }
  _parseAsync(e2) {
    const s = this._parse(e2);
    return Promise.resolve(s);
  }
  parse(e2, s) {
    const i2 = this.safeParse(e2, s);
    if (i2.success)
      return i2.data;
    throw i2.error;
  }
  safeParse(e2, s) {
    var i2;
    const a = {
      common: {
        issues: [],
        async: (i2 = s == null ? void 0 : s.async) !== null && i2 !== void 0 ? i2 : false,
        contextualErrorMap: s == null ? void 0 : s.errorMap
      },
      path: (s == null ? void 0 : s.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e2,
      parsedType: ce(e2)
    }, t2 = this._parseSync({ data: e2, path: a.path, parent: a });
    return zs(a, t2);
  }
  async parseAsync(e2, s) {
    const i2 = await this.safeParseAsync(e2, s);
    if (i2.success)
      return i2.data;
    throw i2.error;
  }
  async safeParseAsync(e2, s) {
    const i2 = {
      common: {
        issues: [],
        contextualErrorMap: s == null ? void 0 : s.errorMap,
        async: true
      },
      path: (s == null ? void 0 : s.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e2,
      parsedType: ce(e2)
    }, a = this._parse({ data: e2, path: i2.path, parent: i2 }), t2 = await (is(a) ? a : Promise.resolve(a));
    return zs(i2, t2);
  }
  refine(e2, s) {
    const i2 = (a) => typeof s == "string" || typeof s > "u" ? { message: s } : typeof s == "function" ? s(a) : s;
    return this._refinement((a, t2) => {
      const o = e2(a), r2 = () => t2.addIssue({
        code: p.custom,
        ...i2(a)
      });
      return typeof Promise < "u" && o instanceof Promise ? o.then((c) => c ? true : (r2(), false)) : o ? true : (r2(), false);
    });
  }
  refinement(e2, s) {
    return this._refinement((i2, a) => e2(i2) ? true : (a.addIssue(typeof s == "function" ? s(i2, a) : s), false));
  }
  _refinement(e2) {
    return new te({
      schema: this,
      typeName: v.ZodEffects,
      effect: { type: "refinement", refinement: e2 }
    });
  }
  superRefine(e2) {
    return this._refinement(e2);
  }
  optional() {
    return oe.create(this, this._def);
  }
  nullable() {
    return ye.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return J.create(this, this._def);
  }
  promise() {
    return Se.create(this, this._def);
  }
  or(e2) {
    return Me.create([this, e2], this._def);
  }
  and(e2) {
    return Le.create(this, e2, this._def);
  }
  transform(e2) {
    return new te({
      ...y(this._def),
      schema: this,
      typeName: v.ZodEffects,
      effect: { type: "transform", transform: e2 }
    });
  }
  default(e2) {
    const s = typeof e2 == "function" ? e2 : () => e2;
    return new He({
      ...y(this._def),
      innerType: this,
      defaultValue: s,
      typeName: v.ZodDefault
    });
  }
  brand() {
    return new si({
      typeName: v.ZodBranded,
      type: this,
      ...y(this._def)
    });
  }
  catch(e2) {
    const s = typeof e2 == "function" ? e2 : () => e2;
    return new ps({
      ...y(this._def),
      innerType: this,
      catchValue: s,
      typeName: v.ZodCatch
    });
  }
  describe(e2) {
    const s = this.constructor;
    return new s({
      ...this._def,
      description: e2
    });
  }
  pipe(e2) {
    return Ge.create(this, e2);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const Vn = /^c[^\s-]{8,}$/i, Bn = /^[a-z][a-z0-9]*$/, Wn = /[0-9A-HJKMNP-TV-Z]{26}/, Hn = /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i, Gn = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\])|(\[IPv6:(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))\])|([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])*(\.[A-Za-z]{2,})+))$/, Kn = /^(\p{Extended_Pictographic}|\p{Emoji_Component})+$/u, Jn = /^(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))$/, Yn = /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/, Xn = (n) => n.precision ? n.offset ? new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{${n.precision}}(([+-]\\d{2}(:?\\d{2})?)|Z)$`) : new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{${n.precision}}Z$`) : n.precision === 0 ? n.offset ? new RegExp("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(([+-]\\d{2}(:?\\d{2})?)|Z)$") : new RegExp("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$") : n.offset ? new RegExp("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(([+-]\\d{2}(:?\\d{2})?)|Z)$") : new RegExp("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$");
function Qn(n, e2) {
  return !!((e2 === "v4" || !e2) && Jn.test(n) || (e2 === "v6" || !e2) && Yn.test(n));
}
class ie extends _ {
  constructor() {
    super(...arguments), this._regex = (e2, s, i2) => this.refinement((a) => e2.test(a), {
      validation: s,
      code: p.invalid_string,
      ...h.errToObj(i2)
    }), this.nonempty = (e2) => this.min(1, h.errToObj(e2)), this.trim = () => new ie({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    }), this.toLowerCase = () => new ie({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    }), this.toUpperCase = () => new ie({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  _parse(e2) {
    if (this._def.coerce && (e2.data = String(e2.data)), this._getType(e2) !== d.string) {
      const t2 = this._getOrReturnCtx(e2);
      return x(
        t2,
        {
          code: p.invalid_type,
          expected: d.string,
          received: t2.parsedType
        }
        //
      ), g;
    }
    const i2 = new $();
    let a;
    for (const t2 of this._def.checks)
      if (t2.kind === "min")
        e2.data.length < t2.value && (a = this._getOrReturnCtx(e2, a), x(a, {
          code: p.too_small,
          minimum: t2.value,
          type: "string",
          inclusive: true,
          exact: false,
          message: t2.message
        }), i2.dirty());
      else if (t2.kind === "max")
        e2.data.length > t2.value && (a = this._getOrReturnCtx(e2, a), x(a, {
          code: p.too_big,
          maximum: t2.value,
          type: "string",
          inclusive: true,
          exact: false,
          message: t2.message
        }), i2.dirty());
      else if (t2.kind === "length") {
        const o = e2.data.length > t2.value, r2 = e2.data.length < t2.value;
        (o || r2) && (a = this._getOrReturnCtx(e2, a), o ? x(a, {
          code: p.too_big,
          maximum: t2.value,
          type: "string",
          inclusive: true,
          exact: true,
          message: t2.message
        }) : r2 && x(a, {
          code: p.too_small,
          minimum: t2.value,
          type: "string",
          inclusive: true,
          exact: true,
          message: t2.message
        }), i2.dirty());
      } else if (t2.kind === "email")
        Gn.test(e2.data) || (a = this._getOrReturnCtx(e2, a), x(a, {
          validation: "email",
          code: p.invalid_string,
          message: t2.message
        }), i2.dirty());
      else if (t2.kind === "emoji")
        Kn.test(e2.data) || (a = this._getOrReturnCtx(e2, a), x(a, {
          validation: "emoji",
          code: p.invalid_string,
          message: t2.message
        }), i2.dirty());
      else if (t2.kind === "uuid")
        Hn.test(e2.data) || (a = this._getOrReturnCtx(e2, a), x(a, {
          validation: "uuid",
          code: p.invalid_string,
          message: t2.message
        }), i2.dirty());
      else if (t2.kind === "cuid")
        Vn.test(e2.data) || (a = this._getOrReturnCtx(e2, a), x(a, {
          validation: "cuid",
          code: p.invalid_string,
          message: t2.message
        }), i2.dirty());
      else if (t2.kind === "cuid2")
        Bn.test(e2.data) || (a = this._getOrReturnCtx(e2, a), x(a, {
          validation: "cuid2",
          code: p.invalid_string,
          message: t2.message
        }), i2.dirty());
      else if (t2.kind === "ulid")
        Wn.test(e2.data) || (a = this._getOrReturnCtx(e2, a), x(a, {
          validation: "ulid",
          code: p.invalid_string,
          message: t2.message
        }), i2.dirty());
      else if (t2.kind === "url")
        try {
          new URL(e2.data);
        } catch {
          a = this._getOrReturnCtx(e2, a), x(a, {
            validation: "url",
            code: p.invalid_string,
            message: t2.message
          }), i2.dirty();
        }
      else
        t2.kind === "regex" ? (t2.regex.lastIndex = 0, t2.regex.test(e2.data) || (a = this._getOrReturnCtx(e2, a), x(a, {
          validation: "regex",
          code: p.invalid_string,
          message: t2.message
        }), i2.dirty())) : t2.kind === "trim" ? e2.data = e2.data.trim() : t2.kind === "includes" ? e2.data.includes(t2.value, t2.position) || (a = this._getOrReturnCtx(e2, a), x(a, {
          code: p.invalid_string,
          validation: { includes: t2.value, position: t2.position },
          message: t2.message
        }), i2.dirty()) : t2.kind === "toLowerCase" ? e2.data = e2.data.toLowerCase() : t2.kind === "toUpperCase" ? e2.data = e2.data.toUpperCase() : t2.kind === "startsWith" ? e2.data.startsWith(t2.value) || (a = this._getOrReturnCtx(e2, a), x(a, {
          code: p.invalid_string,
          validation: { startsWith: t2.value },
          message: t2.message
        }), i2.dirty()) : t2.kind === "endsWith" ? e2.data.endsWith(t2.value) || (a = this._getOrReturnCtx(e2, a), x(a, {
          code: p.invalid_string,
          validation: { endsWith: t2.value },
          message: t2.message
        }), i2.dirty()) : t2.kind === "datetime" ? Xn(t2).test(e2.data) || (a = this._getOrReturnCtx(e2, a), x(a, {
          code: p.invalid_string,
          validation: "datetime",
          message: t2.message
        }), i2.dirty()) : t2.kind === "ip" ? Qn(e2.data, t2.version) || (a = this._getOrReturnCtx(e2, a), x(a, {
          validation: "ip",
          code: p.invalid_string,
          message: t2.message
        }), i2.dirty()) : j.assertNever(t2);
    return { status: i2.value, value: e2.data };
  }
  _addCheck(e2) {
    return new ie({
      ...this._def,
      checks: [...this._def.checks, e2]
    });
  }
  email(e2) {
    return this._addCheck({ kind: "email", ...h.errToObj(e2) });
  }
  url(e2) {
    return this._addCheck({ kind: "url", ...h.errToObj(e2) });
  }
  emoji(e2) {
    return this._addCheck({ kind: "emoji", ...h.errToObj(e2) });
  }
  uuid(e2) {
    return this._addCheck({ kind: "uuid", ...h.errToObj(e2) });
  }
  cuid(e2) {
    return this._addCheck({ kind: "cuid", ...h.errToObj(e2) });
  }
  cuid2(e2) {
    return this._addCheck({ kind: "cuid2", ...h.errToObj(e2) });
  }
  ulid(e2) {
    return this._addCheck({ kind: "ulid", ...h.errToObj(e2) });
  }
  ip(e2) {
    return this._addCheck({ kind: "ip", ...h.errToObj(e2) });
  }
  datetime(e2) {
    var s;
    return typeof e2 == "string" ? this._addCheck({
      kind: "datetime",
      precision: null,
      offset: false,
      message: e2
    }) : this._addCheck({
      kind: "datetime",
      precision: typeof (e2 == null ? void 0 : e2.precision) > "u" ? null : e2 == null ? void 0 : e2.precision,
      offset: (s = e2 == null ? void 0 : e2.offset) !== null && s !== void 0 ? s : false,
      ...h.errToObj(e2 == null ? void 0 : e2.message)
    });
  }
  regex(e2, s) {
    return this._addCheck({
      kind: "regex",
      regex: e2,
      ...h.errToObj(s)
    });
  }
  includes(e2, s) {
    return this._addCheck({
      kind: "includes",
      value: e2,
      position: s == null ? void 0 : s.position,
      ...h.errToObj(s == null ? void 0 : s.message)
    });
  }
  startsWith(e2, s) {
    return this._addCheck({
      kind: "startsWith",
      value: e2,
      ...h.errToObj(s)
    });
  }
  endsWith(e2, s) {
    return this._addCheck({
      kind: "endsWith",
      value: e2,
      ...h.errToObj(s)
    });
  }
  min(e2, s) {
    return this._addCheck({
      kind: "min",
      value: e2,
      ...h.errToObj(s)
    });
  }
  max(e2, s) {
    return this._addCheck({
      kind: "max",
      value: e2,
      ...h.errToObj(s)
    });
  }
  length(e2, s) {
    return this._addCheck({
      kind: "length",
      value: e2,
      ...h.errToObj(s)
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((e2) => e2.kind === "datetime");
  }
  get isEmail() {
    return !!this._def.checks.find((e2) => e2.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((e2) => e2.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((e2) => e2.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((e2) => e2.kind === "uuid");
  }
  get isCUID() {
    return !!this._def.checks.find((e2) => e2.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((e2) => e2.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((e2) => e2.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((e2) => e2.kind === "ip");
  }
  get minLength() {
    let e2 = null;
    for (const s of this._def.checks)
      s.kind === "min" && (e2 === null || s.value > e2) && (e2 = s.value);
    return e2;
  }
  get maxLength() {
    let e2 = null;
    for (const s of this._def.checks)
      s.kind === "max" && (e2 === null || s.value < e2) && (e2 = s.value);
    return e2;
  }
}
ie.create = (n) => {
  var e2;
  return new ie({
    checks: [],
    typeName: v.ZodString,
    coerce: (e2 = n == null ? void 0 : n.coerce) !== null && e2 !== void 0 ? e2 : false,
    ...y(n)
  });
};
function ei(n, e2) {
  const s = (n.toString().split(".")[1] || "").length, i2 = (e2.toString().split(".")[1] || "").length, a = s > i2 ? s : i2, t2 = parseInt(n.toFixed(a).replace(".", "")), o = parseInt(e2.toFixed(a).replace(".", ""));
  return t2 % o / Math.pow(10, a);
}
class ve extends _ {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(e2) {
    if (this._def.coerce && (e2.data = Number(e2.data)), this._getType(e2) !== d.number) {
      const t2 = this._getOrReturnCtx(e2);
      return x(t2, {
        code: p.invalid_type,
        expected: d.number,
        received: t2.parsedType
      }), g;
    }
    let i2;
    const a = new $();
    for (const t2 of this._def.checks)
      t2.kind === "int" ? j.isInteger(e2.data) || (i2 = this._getOrReturnCtx(e2, i2), x(i2, {
        code: p.invalid_type,
        expected: "integer",
        received: "float",
        message: t2.message
      }), a.dirty()) : t2.kind === "min" ? (t2.inclusive ? e2.data < t2.value : e2.data <= t2.value) && (i2 = this._getOrReturnCtx(e2, i2), x(i2, {
        code: p.too_small,
        minimum: t2.value,
        type: "number",
        inclusive: t2.inclusive,
        exact: false,
        message: t2.message
      }), a.dirty()) : t2.kind === "max" ? (t2.inclusive ? e2.data > t2.value : e2.data >= t2.value) && (i2 = this._getOrReturnCtx(e2, i2), x(i2, {
        code: p.too_big,
        maximum: t2.value,
        type: "number",
        inclusive: t2.inclusive,
        exact: false,
        message: t2.message
      }), a.dirty()) : t2.kind === "multipleOf" ? ei(e2.data, t2.value) !== 0 && (i2 = this._getOrReturnCtx(e2, i2), x(i2, {
        code: p.not_multiple_of,
        multipleOf: t2.value,
        message: t2.message
      }), a.dirty()) : t2.kind === "finite" ? Number.isFinite(e2.data) || (i2 = this._getOrReturnCtx(e2, i2), x(i2, {
        code: p.not_finite,
        message: t2.message
      }), a.dirty()) : j.assertNever(t2);
    return { status: a.value, value: e2.data };
  }
  gte(e2, s) {
    return this.setLimit("min", e2, true, h.toString(s));
  }
  gt(e2, s) {
    return this.setLimit("min", e2, false, h.toString(s));
  }
  lte(e2, s) {
    return this.setLimit("max", e2, true, h.toString(s));
  }
  lt(e2, s) {
    return this.setLimit("max", e2, false, h.toString(s));
  }
  setLimit(e2, s, i2, a) {
    return new ve({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e2,
          value: s,
          inclusive: i2,
          message: h.toString(a)
        }
      ]
    });
  }
  _addCheck(e2) {
    return new ve({
      ...this._def,
      checks: [...this._def.checks, e2]
    });
  }
  int(e2) {
    return this._addCheck({
      kind: "int",
      message: h.toString(e2)
    });
  }
  positive(e2) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: h.toString(e2)
    });
  }
  negative(e2) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: h.toString(e2)
    });
  }
  nonpositive(e2) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: h.toString(e2)
    });
  }
  nonnegative(e2) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: h.toString(e2)
    });
  }
  multipleOf(e2, s) {
    return this._addCheck({
      kind: "multipleOf",
      value: e2,
      message: h.toString(s)
    });
  }
  finite(e2) {
    return this._addCheck({
      kind: "finite",
      message: h.toString(e2)
    });
  }
  safe(e2) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: h.toString(e2)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: h.toString(e2)
    });
  }
  get minValue() {
    let e2 = null;
    for (const s of this._def.checks)
      s.kind === "min" && (e2 === null || s.value > e2) && (e2 = s.value);
    return e2;
  }
  get maxValue() {
    let e2 = null;
    for (const s of this._def.checks)
      s.kind === "max" && (e2 === null || s.value < e2) && (e2 = s.value);
    return e2;
  }
  get isInt() {
    return !!this._def.checks.find((e2) => e2.kind === "int" || e2.kind === "multipleOf" && j.isInteger(e2.value));
  }
  get isFinite() {
    let e2 = null, s = null;
    for (const i2 of this._def.checks) {
      if (i2.kind === "finite" || i2.kind === "int" || i2.kind === "multipleOf")
        return true;
      i2.kind === "min" ? (s === null || i2.value > s) && (s = i2.value) : i2.kind === "max" && (e2 === null || i2.value < e2) && (e2 = i2.value);
    }
    return Number.isFinite(s) && Number.isFinite(e2);
  }
}
ve.create = (n) => new ve({
  checks: [],
  typeName: v.ZodNumber,
  coerce: (n == null ? void 0 : n.coerce) || false,
  ...y(n)
});
class be extends _ {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte;
  }
  _parse(e2) {
    if (this._def.coerce && (e2.data = BigInt(e2.data)), this._getType(e2) !== d.bigint) {
      const t2 = this._getOrReturnCtx(e2);
      return x(t2, {
        code: p.invalid_type,
        expected: d.bigint,
        received: t2.parsedType
      }), g;
    }
    let i2;
    const a = new $();
    for (const t2 of this._def.checks)
      t2.kind === "min" ? (t2.inclusive ? e2.data < t2.value : e2.data <= t2.value) && (i2 = this._getOrReturnCtx(e2, i2), x(i2, {
        code: p.too_small,
        type: "bigint",
        minimum: t2.value,
        inclusive: t2.inclusive,
        message: t2.message
      }), a.dirty()) : t2.kind === "max" ? (t2.inclusive ? e2.data > t2.value : e2.data >= t2.value) && (i2 = this._getOrReturnCtx(e2, i2), x(i2, {
        code: p.too_big,
        type: "bigint",
        maximum: t2.value,
        inclusive: t2.inclusive,
        message: t2.message
      }), a.dirty()) : t2.kind === "multipleOf" ? e2.data % t2.value !== BigInt(0) && (i2 = this._getOrReturnCtx(e2, i2), x(i2, {
        code: p.not_multiple_of,
        multipleOf: t2.value,
        message: t2.message
      }), a.dirty()) : j.assertNever(t2);
    return { status: a.value, value: e2.data };
  }
  gte(e2, s) {
    return this.setLimit("min", e2, true, h.toString(s));
  }
  gt(e2, s) {
    return this.setLimit("min", e2, false, h.toString(s));
  }
  lte(e2, s) {
    return this.setLimit("max", e2, true, h.toString(s));
  }
  lt(e2, s) {
    return this.setLimit("max", e2, false, h.toString(s));
  }
  setLimit(e2, s, i2, a) {
    return new be({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e2,
          value: s,
          inclusive: i2,
          message: h.toString(a)
        }
      ]
    });
  }
  _addCheck(e2) {
    return new be({
      ...this._def,
      checks: [...this._def.checks, e2]
    });
  }
  positive(e2) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: h.toString(e2)
    });
  }
  negative(e2) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: h.toString(e2)
    });
  }
  nonpositive(e2) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: h.toString(e2)
    });
  }
  nonnegative(e2) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: h.toString(e2)
    });
  }
  multipleOf(e2, s) {
    return this._addCheck({
      kind: "multipleOf",
      value: e2,
      message: h.toString(s)
    });
  }
  get minValue() {
    let e2 = null;
    for (const s of this._def.checks)
      s.kind === "min" && (e2 === null || s.value > e2) && (e2 = s.value);
    return e2;
  }
  get maxValue() {
    let e2 = null;
    for (const s of this._def.checks)
      s.kind === "max" && (e2 === null || s.value < e2) && (e2 = s.value);
    return e2;
  }
}
be.create = (n) => {
  var e2;
  return new be({
    checks: [],
    typeName: v.ZodBigInt,
    coerce: (e2 = n == null ? void 0 : n.coerce) !== null && e2 !== void 0 ? e2 : false,
    ...y(n)
  });
};
class as extends _ {
  _parse(e2) {
    if (this._def.coerce && (e2.data = !!e2.data), this._getType(e2) !== d.boolean) {
      const i2 = this._getOrReturnCtx(e2);
      return x(i2, {
        code: p.invalid_type,
        expected: d.boolean,
        received: i2.parsedType
      }), g;
    }
    return q(e2.data);
  }
}
as.create = (n) => new as({
  typeName: v.ZodBoolean,
  coerce: (n == null ? void 0 : n.coerce) || false,
  ...y(n)
});
class Ee extends _ {
  _parse(e2) {
    if (this._def.coerce && (e2.data = new Date(e2.data)), this._getType(e2) !== d.date) {
      const t2 = this._getOrReturnCtx(e2);
      return x(t2, {
        code: p.invalid_type,
        expected: d.date,
        received: t2.parsedType
      }), g;
    }
    if (isNaN(e2.data.getTime())) {
      const t2 = this._getOrReturnCtx(e2);
      return x(t2, {
        code: p.invalid_date
      }), g;
    }
    const i2 = new $();
    let a;
    for (const t2 of this._def.checks)
      t2.kind === "min" ? e2.data.getTime() < t2.value && (a = this._getOrReturnCtx(e2, a), x(a, {
        code: p.too_small,
        message: t2.message,
        inclusive: true,
        exact: false,
        minimum: t2.value,
        type: "date"
      }), i2.dirty()) : t2.kind === "max" ? e2.data.getTime() > t2.value && (a = this._getOrReturnCtx(e2, a), x(a, {
        code: p.too_big,
        message: t2.message,
        inclusive: true,
        exact: false,
        maximum: t2.value,
        type: "date"
      }), i2.dirty()) : j.assertNever(t2);
    return {
      status: i2.value,
      value: new Date(e2.data.getTime())
    };
  }
  _addCheck(e2) {
    return new Ee({
      ...this._def,
      checks: [...this._def.checks, e2]
    });
  }
  min(e2, s) {
    return this._addCheck({
      kind: "min",
      value: e2.getTime(),
      message: h.toString(s)
    });
  }
  max(e2, s) {
    return this._addCheck({
      kind: "max",
      value: e2.getTime(),
      message: h.toString(s)
    });
  }
  get minDate() {
    let e2 = null;
    for (const s of this._def.checks)
      s.kind === "min" && (e2 === null || s.value > e2) && (e2 = s.value);
    return e2 != null ? new Date(e2) : null;
  }
  get maxDate() {
    let e2 = null;
    for (const s of this._def.checks)
      s.kind === "max" && (e2 === null || s.value < e2) && (e2 = s.value);
    return e2 != null ? new Date(e2) : null;
  }
}
Ee.create = (n) => new Ee({
  checks: [],
  coerce: (n == null ? void 0 : n.coerce) || false,
  typeName: v.ZodDate,
  ...y(n)
});
class ts extends _ {
  _parse(e2) {
    if (this._getType(e2) !== d.symbol) {
      const i2 = this._getOrReturnCtx(e2);
      return x(i2, {
        code: p.invalid_type,
        expected: d.symbol,
        received: i2.parsedType
      }), g;
    }
    return q(e2.data);
  }
}
ts.create = (n) => new ts({
  typeName: v.ZodSymbol,
  ...y(n)
});
class Fe extends _ {
  _parse(e2) {
    if (this._getType(e2) !== d.undefined) {
      const i2 = this._getOrReturnCtx(e2);
      return x(i2, {
        code: p.invalid_type,
        expected: d.undefined,
        received: i2.parsedType
      }), g;
    }
    return q(e2.data);
  }
}
Fe.create = (n) => new Fe({
  typeName: v.ZodUndefined,
  ...y(n)
});
class $e extends _ {
  _parse(e2) {
    if (this._getType(e2) !== d.null) {
      const i2 = this._getOrReturnCtx(e2);
      return x(i2, {
        code: p.invalid_type,
        expected: d.null,
        received: i2.parsedType
      }), g;
    }
    return q(e2.data);
  }
}
$e.create = (n) => new $e({
  typeName: v.ZodNull,
  ...y(n)
});
class os extends _ {
  constructor() {
    super(...arguments), this._any = true;
  }
  _parse(e2) {
    return q(e2.data);
  }
}
os.create = (n) => new os({
  typeName: v.ZodAny,
  ...y(n)
});
class he extends _ {
  constructor() {
    super(...arguments), this._unknown = true;
  }
  _parse(e2) {
    return q(e2.data);
  }
}
he.create = (n) => new he({
  typeName: v.ZodUnknown,
  ...y(n)
});
class re extends _ {
  _parse(e2) {
    const s = this._getOrReturnCtx(e2);
    return x(s, {
      code: p.invalid_type,
      expected: d.never,
      received: s.parsedType
    }), g;
  }
}
re.create = (n) => new re({
  typeName: v.ZodNever,
  ...y(n)
});
class rs extends _ {
  _parse(e2) {
    if (this._getType(e2) !== d.undefined) {
      const i2 = this._getOrReturnCtx(e2);
      return x(i2, {
        code: p.invalid_type,
        expected: d.void,
        received: i2.parsedType
      }), g;
    }
    return q(e2.data);
  }
}
rs.create = (n) => new rs({
  typeName: v.ZodVoid,
  ...y(n)
});
class J extends _ {
  _parse(e2) {
    const { ctx: s, status: i2 } = this._processInputParams(e2), a = this._def;
    if (s.parsedType !== d.array)
      return x(s, {
        code: p.invalid_type,
        expected: d.array,
        received: s.parsedType
      }), g;
    if (a.exactLength !== null) {
      const o = s.data.length > a.exactLength.value, r2 = s.data.length < a.exactLength.value;
      (o || r2) && (x(s, {
        code: o ? p.too_big : p.too_small,
        minimum: r2 ? a.exactLength.value : void 0,
        maximum: o ? a.exactLength.value : void 0,
        type: "array",
        inclusive: true,
        exact: true,
        message: a.exactLength.message
      }), i2.dirty());
    }
    if (a.minLength !== null && s.data.length < a.minLength.value && (x(s, {
      code: p.too_small,
      minimum: a.minLength.value,
      type: "array",
      inclusive: true,
      exact: false,
      message: a.minLength.message
    }), i2.dirty()), a.maxLength !== null && s.data.length > a.maxLength.value && (x(s, {
      code: p.too_big,
      maximum: a.maxLength.value,
      type: "array",
      inclusive: true,
      exact: false,
      message: a.maxLength.message
    }), i2.dirty()), s.common.async)
      return Promise.all([...s.data].map((o, r2) => a.type._parseAsync(new Y(s, o, s.path, r2)))).then((o) => $.mergeArray(i2, o));
    const t2 = [...s.data].map((o, r2) => a.type._parseSync(new Y(s, o, s.path, r2)));
    return $.mergeArray(i2, t2);
  }
  get element() {
    return this._def.type;
  }
  min(e2, s) {
    return new J({
      ...this._def,
      minLength: { value: e2, message: h.toString(s) }
    });
  }
  max(e2, s) {
    return new J({
      ...this._def,
      maxLength: { value: e2, message: h.toString(s) }
    });
  }
  length(e2, s) {
    return new J({
      ...this._def,
      exactLength: { value: e2, message: h.toString(s) }
    });
  }
  nonempty(e2) {
    return this.min(1, e2);
  }
}
J.create = (n, e2) => new J({
  type: n,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: v.ZodArray,
  ...y(e2)
});
function fe(n) {
  if (n instanceof N) {
    const e2 = {};
    for (const s in n.shape) {
      const i2 = n.shape[s];
      e2[s] = oe.create(fe(i2));
    }
    return new N({
      ...n._def,
      shape: () => e2
    });
  } else
    return n instanceof J ? new J({
      ...n._def,
      type: fe(n.element)
    }) : n instanceof oe ? oe.create(fe(n.unwrap())) : n instanceof ye ? ye.create(fe(n.unwrap())) : n instanceof ae ? ae.create(n.items.map((e2) => fe(e2))) : n;
}
class N extends _ {
  constructor() {
    super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const e2 = this._def.shape(), s = j.objectKeys(e2);
    return this._cached = { shape: e2, keys: s };
  }
  _parse(e2) {
    if (this._getType(e2) !== d.object) {
      const l = this._getOrReturnCtx(e2);
      return x(l, {
        code: p.invalid_type,
        expected: d.object,
        received: l.parsedType
      }), g;
    }
    const { status: i2, ctx: a } = this._processInputParams(e2), { shape: t2, keys: o } = this._getCached(), r2 = [];
    if (!(this._def.catchall instanceof re && this._def.unknownKeys === "strip"))
      for (const l in a.data)
        o.includes(l) || r2.push(l);
    const c = [];
    for (const l of o) {
      const u = t2[l], f2 = a.data[l];
      c.push({
        key: { status: "valid", value: l },
        value: u._parse(new Y(a, f2, a.path, l)),
        alwaysSet: l in a.data
      });
    }
    if (this._def.catchall instanceof re) {
      const l = this._def.unknownKeys;
      if (l === "passthrough")
        for (const u of r2)
          c.push({
            key: { status: "valid", value: u },
            value: { status: "valid", value: a.data[u] }
          });
      else if (l === "strict")
        r2.length > 0 && (x(a, {
          code: p.unrecognized_keys,
          keys: r2
        }), i2.dirty());
      else if (l !== "strip")
        throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      const l = this._def.catchall;
      for (const u of r2) {
        const f2 = a.data[u];
        c.push({
          key: { status: "valid", value: u },
          value: l._parse(
            new Y(a, f2, a.path, u)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: u in a.data
        });
      }
    }
    return a.common.async ? Promise.resolve().then(async () => {
      const l = [];
      for (const u of c) {
        const f2 = await u.key;
        l.push({
          key: f2,
          value: await u.value,
          alwaysSet: u.alwaysSet
        });
      }
      return l;
    }).then((l) => $.mergeObjectSync(i2, l)) : $.mergeObjectSync(i2, c);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e2) {
    return h.errToObj, new N({
      ...this._def,
      unknownKeys: "strict",
      ...e2 !== void 0 ? {
        errorMap: (s, i2) => {
          var a, t2, o, r2;
          const c = (o = (t2 = (a = this._def).errorMap) === null || t2 === void 0 ? void 0 : t2.call(a, s, i2).message) !== null && o !== void 0 ? o : i2.defaultError;
          return s.code === "unrecognized_keys" ? {
            message: (r2 = h.errToObj(e2).message) !== null && r2 !== void 0 ? r2 : c
          } : {
            message: c
          };
        }
      } : {}
    });
  }
  strip() {
    return new N({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new N({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(e2) {
    return new N({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...e2
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(e2) {
    return new N({
      unknownKeys: e2._def.unknownKeys,
      catchall: e2._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...e2._def.shape()
      }),
      typeName: v.ZodObject
    });
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(e2, s) {
    return this.augment({ [e2]: s });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(e2) {
    return new N({
      ...this._def,
      catchall: e2
    });
  }
  pick(e2) {
    const s = {};
    return j.objectKeys(e2).forEach((i2) => {
      e2[i2] && this.shape[i2] && (s[i2] = this.shape[i2]);
    }), new N({
      ...this._def,
      shape: () => s
    });
  }
  omit(e2) {
    const s = {};
    return j.objectKeys(this.shape).forEach((i2) => {
      e2[i2] || (s[i2] = this.shape[i2]);
    }), new N({
      ...this._def,
      shape: () => s
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return fe(this);
  }
  partial(e2) {
    const s = {};
    return j.objectKeys(this.shape).forEach((i2) => {
      const a = this.shape[i2];
      e2 && !e2[i2] ? s[i2] = a : s[i2] = a.optional();
    }), new N({
      ...this._def,
      shape: () => s
    });
  }
  required(e2) {
    const s = {};
    return j.objectKeys(this.shape).forEach((i2) => {
      if (e2 && !e2[i2])
        s[i2] = this.shape[i2];
      else {
        let t2 = this.shape[i2];
        for (; t2 instanceof oe; )
          t2 = t2._def.innerType;
        s[i2] = t2;
      }
    }), new N({
      ...this._def,
      shape: () => s
    });
  }
  keyof() {
    return $s(j.objectKeys(this.shape));
  }
}
N.create = (n, e2) => new N({
  shape: () => n,
  unknownKeys: "strip",
  catchall: re.create(),
  typeName: v.ZodObject,
  ...y(e2)
});
N.strictCreate = (n, e2) => new N({
  shape: () => n,
  unknownKeys: "strict",
  catchall: re.create(),
  typeName: v.ZodObject,
  ...y(e2)
});
N.lazycreate = (n, e2) => new N({
  shape: n,
  unknownKeys: "strip",
  catchall: re.create(),
  typeName: v.ZodObject,
  ...y(e2)
});
class Me extends _ {
  _parse(e2) {
    const { ctx: s } = this._processInputParams(e2), i2 = this._def.options;
    function a(t2) {
      for (const r2 of t2)
        if (r2.result.status === "valid")
          return r2.result;
      for (const r2 of t2)
        if (r2.result.status === "dirty")
          return s.common.issues.push(...r2.ctx.common.issues), r2.result;
      const o = t2.map((r2) => new K(r2.ctx.common.issues));
      return x(s, {
        code: p.invalid_union,
        unionErrors: o
      }), g;
    }
    if (s.common.async)
      return Promise.all(i2.map(async (t2) => {
        const o = {
          ...s,
          common: {
            ...s.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await t2._parseAsync({
            data: s.data,
            path: s.path,
            parent: o
          }),
          ctx: o
        };
      })).then(a);
    {
      let t2;
      const o = [];
      for (const c of i2) {
        const l = {
          ...s,
          common: {
            ...s.common,
            issues: []
          },
          parent: null
        }, u = c._parseSync({
          data: s.data,
          path: s.path,
          parent: l
        });
        if (u.status === "valid")
          return u;
        u.status === "dirty" && !t2 && (t2 = { result: u, ctx: l }), l.common.issues.length && o.push(l.common.issues);
      }
      if (t2)
        return s.common.issues.push(...t2.ctx.common.issues), t2.result;
      const r2 = o.map((c) => new K(c));
      return x(s, {
        code: p.invalid_union,
        unionErrors: r2
      }), g;
    }
  }
  get options() {
    return this._def.options;
  }
}
Me.create = (n, e2) => new Me({
  options: n,
  typeName: v.ZodUnion,
  ...y(e2)
});
function ls(n, e2) {
  const s = ce(n), i2 = ce(e2);
  if (n === e2)
    return { valid: true, data: n };
  if (s === d.object && i2 === d.object) {
    const a = j.objectKeys(e2), t2 = j.objectKeys(n).filter((r2) => a.indexOf(r2) !== -1), o = { ...n, ...e2 };
    for (const r2 of t2) {
      const c = ls(n[r2], e2[r2]);
      if (!c.valid)
        return { valid: false };
      o[r2] = c.data;
    }
    return { valid: true, data: o };
  } else if (s === d.array && i2 === d.array) {
    if (n.length !== e2.length)
      return { valid: false };
    const a = [];
    for (let t2 = 0; t2 < n.length; t2++) {
      const o = n[t2], r2 = e2[t2], c = ls(o, r2);
      if (!c.valid)
        return { valid: false };
      a.push(c.data);
    }
    return { valid: true, data: a };
  } else
    return s === d.date && i2 === d.date && +n == +e2 ? { valid: true, data: n } : { valid: false };
}
class Le extends _ {
  _parse(e2) {
    const { status: s, ctx: i2 } = this._processInputParams(e2), a = (t2, o) => {
      if (Ts(t2) || Ts(o))
        return g;
      const r2 = ls(t2.value, o.value);
      return r2.valid ? ((Cs(t2) || Cs(o)) && s.dirty(), { status: s.value, value: r2.data }) : (x(i2, {
        code: p.invalid_intersection_types
      }), g);
    };
    return i2.common.async ? Promise.all([
      this._def.left._parseAsync({
        data: i2.data,
        path: i2.path,
        parent: i2
      }),
      this._def.right._parseAsync({
        data: i2.data,
        path: i2.path,
        parent: i2
      })
    ]).then(([t2, o]) => a(t2, o)) : a(this._def.left._parseSync({
      data: i2.data,
      path: i2.path,
      parent: i2
    }), this._def.right._parseSync({
      data: i2.data,
      path: i2.path,
      parent: i2
    }));
  }
}
Le.create = (n, e2, s) => new Le({
  left: n,
  right: e2,
  typeName: v.ZodIntersection,
  ...y(s)
});
class ae extends _ {
  _parse(e2) {
    const { status: s, ctx: i2 } = this._processInputParams(e2);
    if (i2.parsedType !== d.array)
      return x(i2, {
        code: p.invalid_type,
        expected: d.array,
        received: i2.parsedType
      }), g;
    if (i2.data.length < this._def.items.length)
      return x(i2, {
        code: p.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      }), g;
    !this._def.rest && i2.data.length > this._def.items.length && (x(i2, {
      code: p.too_big,
      maximum: this._def.items.length,
      inclusive: true,
      exact: false,
      type: "array"
    }), s.dirty());
    const t2 = [...i2.data].map((o, r2) => {
      const c = this._def.items[r2] || this._def.rest;
      return c ? c._parse(new Y(i2, o, i2.path, r2)) : null;
    }).filter((o) => !!o);
    return i2.common.async ? Promise.all(t2).then((o) => $.mergeArray(s, o)) : $.mergeArray(s, t2);
  }
  get items() {
    return this._def.items;
  }
  rest(e2) {
    return new ae({
      ...this._def,
      rest: e2
    });
  }
}
ae.create = (n, e2) => {
  if (!Array.isArray(n))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new ae({
    items: n,
    typeName: v.ZodTuple,
    rest: null,
    ...y(e2)
  });
};
class cs extends _ {
  _parse(e2) {
    const { status: s, ctx: i2 } = this._processInputParams(e2);
    if (i2.parsedType !== d.map)
      return x(i2, {
        code: p.invalid_type,
        expected: d.map,
        received: i2.parsedType
      }), g;
    const a = this._def.keyType, t2 = this._def.valueType, o = [...i2.data.entries()].map(([r2, c], l) => ({
      key: a._parse(new Y(i2, r2, i2.path, [l, "key"])),
      value: t2._parse(new Y(i2, c, i2.path, [l, "value"]))
    }));
    if (i2.common.async) {
      const r2 = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const c of o) {
          const l = await c.key, u = await c.value;
          if (l.status === "aborted" || u.status === "aborted")
            return g;
          (l.status === "dirty" || u.status === "dirty") && s.dirty(), r2.set(l.value, u.value);
        }
        return { status: s.value, value: r2 };
      });
    } else {
      const r2 = /* @__PURE__ */ new Map();
      for (const c of o) {
        const l = c.key, u = c.value;
        if (l.status === "aborted" || u.status === "aborted")
          return g;
        (l.status === "dirty" || u.status === "dirty") && s.dirty(), r2.set(l.value, u.value);
      }
      return { status: s.value, value: r2 };
    }
  }
}
cs.create = (n, e2, s) => new cs({
  valueType: e2,
  keyType: n,
  typeName: v.ZodMap,
  ...y(s)
});
class ge extends _ {
  _parse(e2) {
    const { status: s, ctx: i2 } = this._processInputParams(e2);
    if (i2.parsedType !== d.set)
      return x(i2, {
        code: p.invalid_type,
        expected: d.set,
        received: i2.parsedType
      }), g;
    const a = this._def;
    a.minSize !== null && i2.data.size < a.minSize.value && (x(i2, {
      code: p.too_small,
      minimum: a.minSize.value,
      type: "set",
      inclusive: true,
      exact: false,
      message: a.minSize.message
    }), s.dirty()), a.maxSize !== null && i2.data.size > a.maxSize.value && (x(i2, {
      code: p.too_big,
      maximum: a.maxSize.value,
      type: "set",
      inclusive: true,
      exact: false,
      message: a.maxSize.message
    }), s.dirty());
    const t2 = this._def.valueType;
    function o(c) {
      const l = /* @__PURE__ */ new Set();
      for (const u of c) {
        if (u.status === "aborted")
          return g;
        u.status === "dirty" && s.dirty(), l.add(u.value);
      }
      return { status: s.value, value: l };
    }
    const r2 = [...i2.data.values()].map((c, l) => t2._parse(new Y(i2, c, i2.path, l)));
    return i2.common.async ? Promise.all(r2).then((c) => o(c)) : o(r2);
  }
  min(e2, s) {
    return new ge({
      ...this._def,
      minSize: { value: e2, message: h.toString(s) }
    });
  }
  max(e2, s) {
    return new ge({
      ...this._def,
      maxSize: { value: e2, message: h.toString(s) }
    });
  }
  size(e2, s) {
    return this.min(e2, s).max(e2, s);
  }
  nonempty(e2) {
    return this.min(1, e2);
  }
}
ge.create = (n, e2) => new ge({
  valueType: n,
  minSize: null,
  maxSize: null,
  typeName: v.ZodSet,
  ...y(e2)
});
class Ve extends _ {
  get schema() {
    return this._def.getter();
  }
  _parse(e2) {
    const { ctx: s } = this._processInputParams(e2);
    return this._def.getter()._parse({ data: s.data, path: s.path, parent: s });
  }
}
Ve.create = (n, e2) => new Ve({
  getter: n,
  typeName: v.ZodLazy,
  ...y(e2)
});
class Be extends _ {
  _parse(e2) {
    if (e2.data !== this._def.value) {
      const s = this._getOrReturnCtx(e2);
      return x(s, {
        received: s.data,
        code: p.invalid_literal,
        expected: this._def.value
      }), g;
    }
    return { status: "valid", value: e2.data };
  }
  get value() {
    return this._def.value;
  }
}
Be.create = (n, e2) => new Be({
  value: n,
  typeName: v.ZodLiteral,
  ...y(e2)
});
function $s(n, e2) {
  return new ue({
    values: n,
    typeName: v.ZodEnum,
    ...y(e2)
  });
}
class ue extends _ {
  _parse(e2) {
    if (typeof e2.data != "string") {
      const s = this._getOrReturnCtx(e2), i2 = this._def.values;
      return x(s, {
        expected: j.joinValues(i2),
        received: s.parsedType,
        code: p.invalid_type
      }), g;
    }
    if (this._def.values.indexOf(e2.data) === -1) {
      const s = this._getOrReturnCtx(e2), i2 = this._def.values;
      return x(s, {
        received: s.data,
        code: p.invalid_enum_value,
        options: i2
      }), g;
    }
    return q(e2.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const e2 = {};
    for (const s of this._def.values)
      e2[s] = s;
    return e2;
  }
  get Values() {
    const e2 = {};
    for (const s of this._def.values)
      e2[s] = s;
    return e2;
  }
  get Enum() {
    const e2 = {};
    for (const s of this._def.values)
      e2[s] = s;
    return e2;
  }
  extract(e2) {
    return ue.create(e2);
  }
  exclude(e2) {
    return ue.create(this.options.filter((s) => !e2.includes(s)));
  }
}
ue.create = $s;
class We extends _ {
  _parse(e2) {
    const s = j.getValidEnumValues(this._def.values), i2 = this._getOrReturnCtx(e2);
    if (i2.parsedType !== d.string && i2.parsedType !== d.number) {
      const a = j.objectValues(s);
      return x(i2, {
        expected: j.joinValues(a),
        received: i2.parsedType,
        code: p.invalid_type
      }), g;
    }
    if (s.indexOf(e2.data) === -1) {
      const a = j.objectValues(s);
      return x(i2, {
        received: i2.data,
        code: p.invalid_enum_value,
        options: a
      }), g;
    }
    return q(e2.data);
  }
  get enum() {
    return this._def.values;
  }
}
We.create = (n, e2) => new We({
  values: n,
  typeName: v.ZodNativeEnum,
  ...y(e2)
});
class Se extends _ {
  unwrap() {
    return this._def.type;
  }
  _parse(e2) {
    const { ctx: s } = this._processInputParams(e2);
    if (s.parsedType !== d.promise && s.common.async === false)
      return x(s, {
        code: p.invalid_type,
        expected: d.promise,
        received: s.parsedType
      }), g;
    const i2 = s.parsedType === d.promise ? s.data : Promise.resolve(s.data);
    return q(i2.then((a) => this._def.type.parseAsync(a, {
      path: s.path,
      errorMap: s.common.contextualErrorMap
    })));
  }
}
Se.create = (n, e2) => new Se({
  type: n,
  typeName: v.ZodPromise,
  ...y(e2)
});
class te extends _ {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === v.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(e2) {
    const { status: s, ctx: i2 } = this._processInputParams(e2), a = this._def.effect || null;
    if (a.type === "preprocess") {
      const o = a.transform(i2.data);
      return i2.common.async ? Promise.resolve(o).then((r2) => this._def.schema._parseAsync({
        data: r2,
        path: i2.path,
        parent: i2
      })) : this._def.schema._parseSync({
        data: o,
        path: i2.path,
        parent: i2
      });
    }
    const t2 = {
      addIssue: (o) => {
        x(i2, o), o.fatal ? s.abort() : s.dirty();
      },
      get path() {
        return i2.path;
      }
    };
    if (t2.addIssue = t2.addIssue.bind(t2), a.type === "refinement") {
      const o = (r2) => {
        const c = a.refinement(r2, t2);
        if (i2.common.async)
          return Promise.resolve(c);
        if (c instanceof Promise)
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        return r2;
      };
      if (i2.common.async === false) {
        const r2 = this._def.schema._parseSync({
          data: i2.data,
          path: i2.path,
          parent: i2
        });
        return r2.status === "aborted" ? g : (r2.status === "dirty" && s.dirty(), o(r2.value), { status: s.value, value: r2.value });
      } else
        return this._def.schema._parseAsync({ data: i2.data, path: i2.path, parent: i2 }).then((r2) => r2.status === "aborted" ? g : (r2.status === "dirty" && s.dirty(), o(r2.value).then(() => ({ status: s.value, value: r2.value }))));
    }
    if (a.type === "transform")
      if (i2.common.async === false) {
        const o = this._def.schema._parseSync({
          data: i2.data,
          path: i2.path,
          parent: i2
        });
        if (!ns(o))
          return o;
        const r2 = a.transform(o.value, t2);
        if (r2 instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: s.value, value: r2 };
      } else
        return this._def.schema._parseAsync({ data: i2.data, path: i2.path, parent: i2 }).then((o) => ns(o) ? Promise.resolve(a.transform(o.value, t2)).then((r2) => ({ status: s.value, value: r2 })) : o);
    j.assertNever(a);
  }
}
te.create = (n, e2, s) => new te({
  schema: n,
  typeName: v.ZodEffects,
  effect: e2,
  ...y(s)
});
te.createWithPreprocess = (n, e2, s) => new te({
  schema: e2,
  effect: { type: "preprocess", transform: n },
  typeName: v.ZodEffects,
  ...y(s)
});
class oe extends _ {
  _parse(e2) {
    return this._getType(e2) === d.undefined ? q(void 0) : this._def.innerType._parse(e2);
  }
  unwrap() {
    return this._def.innerType;
  }
}
oe.create = (n, e2) => new oe({
  innerType: n,
  typeName: v.ZodOptional,
  ...y(e2)
});
class ye extends _ {
  _parse(e2) {
    return this._getType(e2) === d.null ? q(null) : this._def.innerType._parse(e2);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ye.create = (n, e2) => new ye({
  innerType: n,
  typeName: v.ZodNullable,
  ...y(e2)
});
class He extends _ {
  _parse(e2) {
    const { ctx: s } = this._processInputParams(e2);
    let i2 = s.data;
    return s.parsedType === d.undefined && (i2 = this._def.defaultValue()), this._def.innerType._parse({
      data: i2,
      path: s.path,
      parent: s
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
He.create = (n, e2) => new He({
  innerType: n,
  typeName: v.ZodDefault,
  defaultValue: typeof e2.default == "function" ? e2.default : () => e2.default,
  ...y(e2)
});
class ps extends _ {
  _parse(e2) {
    const { ctx: s } = this._processInputParams(e2), i2 = {
      ...s,
      common: {
        ...s.common,
        issues: []
      }
    }, a = this._def.innerType._parse({
      data: i2.data,
      path: i2.path,
      parent: {
        ...i2
      }
    });
    return is(a) ? a.then((t2) => ({
      status: "valid",
      value: t2.status === "valid" ? t2.value : this._def.catchValue({
        get error() {
          return new K(i2.common.issues);
        },
        input: i2.data
      })
    })) : {
      status: "valid",
      value: a.status === "valid" ? a.value : this._def.catchValue({
        get error() {
          return new K(i2.common.issues);
        },
        input: i2.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
ps.create = (n, e2) => new ps({
  innerType: n,
  typeName: v.ZodCatch,
  catchValue: typeof e2.catch == "function" ? e2.catch : () => e2.catch,
  ...y(e2)
});
class us extends _ {
  _parse(e2) {
    if (this._getType(e2) !== d.nan) {
      const i2 = this._getOrReturnCtx(e2);
      return x(i2, {
        code: p.invalid_type,
        expected: d.nan,
        received: i2.parsedType
      }), g;
    }
    return { status: "valid", value: e2.data };
  }
}
us.create = (n) => new us({
  typeName: v.ZodNaN,
  ...y(n)
});
class si extends _ {
  _parse(e2) {
    const { ctx: s } = this._processInputParams(e2), i2 = s.data;
    return this._def.type._parse({
      data: i2,
      path: s.path,
      parent: s
    });
  }
  unwrap() {
    return this._def.type;
  }
}
class Ge extends _ {
  _parse(e2) {
    const { status: s, ctx: i2 } = this._processInputParams(e2);
    if (i2.common.async)
      return (async () => {
        const t2 = await this._def.in._parseAsync({
          data: i2.data,
          path: i2.path,
          parent: i2
        });
        return t2.status === "aborted" ? g : t2.status === "dirty" ? (s.dirty(), qn(t2.value)) : this._def.out._parseAsync({
          data: t2.value,
          path: i2.path,
          parent: i2
        });
      })();
    {
      const a = this._def.in._parseSync({
        data: i2.data,
        path: i2.path,
        parent: i2
      });
      return a.status === "aborted" ? g : a.status === "dirty" ? (s.dirty(), {
        status: "dirty",
        value: a.value
      }) : this._def.out._parseSync({
        data: a.value,
        path: i2.path,
        parent: i2
      });
    }
  }
  static create(e2, s) {
    return new Ge({
      in: e2,
      out: s,
      typeName: v.ZodPipeline
    });
  }
}
N.lazycreate;
var v;
(function(n) {
  n.ZodString = "ZodString", n.ZodNumber = "ZodNumber", n.ZodNaN = "ZodNaN", n.ZodBigInt = "ZodBigInt", n.ZodBoolean = "ZodBoolean", n.ZodDate = "ZodDate", n.ZodSymbol = "ZodSymbol", n.ZodUndefined = "ZodUndefined", n.ZodNull = "ZodNull", n.ZodAny = "ZodAny", n.ZodUnknown = "ZodUnknown", n.ZodNever = "ZodNever", n.ZodVoid = "ZodVoid", n.ZodArray = "ZodArray", n.ZodObject = "ZodObject", n.ZodUnion = "ZodUnion", n.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", n.ZodIntersection = "ZodIntersection", n.ZodTuple = "ZodTuple", n.ZodRecord = "ZodRecord", n.ZodMap = "ZodMap", n.ZodSet = "ZodSet", n.ZodFunction = "ZodFunction", n.ZodLazy = "ZodLazy", n.ZodLiteral = "ZodLiteral", n.ZodEnum = "ZodEnum", n.ZodEffects = "ZodEffects", n.ZodNativeEnum = "ZodNativeEnum", n.ZodOptional = "ZodOptional", n.ZodNullable = "ZodNullable", n.ZodDefault = "ZodDefault", n.ZodCatch = "ZodCatch", n.ZodPromise = "ZodPromise", n.ZodBranded = "ZodBranded", n.ZodPipeline = "ZodPipeline";
})(v || (v = {}));
re.create;
J.create;
N.create;
N.strictCreate;
const ni = Me.create;
Le.create;
ae.create;
const Ms = ue.create;
Se.create;
oe.create;
ye.create;
var oi = [
  "image",
  "video",
  "audio",
  "pdf",
  "text",
  "blob"
];
function ri(n) {
  const [e2, ...s] = Object.keys(n);
  return Ms([e2, ...s]);
}
var li = ri(De), ci = Ms(oi), pi = li;
ni([
  ci,
  pi
]);
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "Home",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_0;
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "flex min-h-screen flex-col items-center justify-center gap-16 p-24" }, _attrs))}><div class="flex flex-col items-center justify-center gap-4"><span class="text-center text-4xl font-bold"> Upload a file using a button: </span>`);
      _push(ssrRenderComponent(_component_ClientOnly, {
        "fallback-tag": "div",
        fallback: "Loading..."
      }, {}, _parent));
      _push(`</div><div className="flex flex-col items-center justify-center gap-4"><span className="text-center text-4xl font-bold"> ...or using a dropzone: </span>`);
      _push(ssrRenderComponent(_component_ClientOnly, {
        "fallback-tag": "div",
        fallback: "Loading..."
      }, {}, _parent));
      _push(`</div></main>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Home.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$2 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_Home = _sfc_main$3;
  _push(`<div${ssrRenderAttrs(_attrs)}>`);
  _push(ssrRenderComponent(_component_Home, null, null, _parent));
  _push(`</div>`);
}
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const AppComponent = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["ssrRender", _sfc_ssrRender]]);
const _sfc_main$1 = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    const props = __props;
    const _error = props.error;
    (_error.stack || "").split("\n").splice(1).map((line) => {
      const text = line.replace("webpack:/", "").replace(".vue", ".js").trim();
      return {
        text,
        internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
      };
    }).map((i2) => `<span class="stack${i2.internal ? " internal" : ""}">${i2.text}</span>`).join("\n");
    const statusCode = Number(_error.statusCode || 500);
    const is404 = statusCode === 404;
    const statusMessage = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
    const description = _error.message || _error.toString();
    const stack = void 0;
    const _Error404 = /* @__PURE__ */ defineAsyncComponent(() => import('./_nuxt/error-404-9b1a5784.mjs').then((r2) => r2.default || r2));
    const _Error = /* @__PURE__ */ defineAsyncComponent(() => import('./_nuxt/error-500-ff2fe444.mjs').then((r2) => r2.default || r2));
    const ErrorTemplate = is404 ? _Error404 : _Error;
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(ErrorTemplate), mergeProps({ statusCode: unref(statusCode), statusMessage: unref(statusMessage), description: unref(description), stack: unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../../node_modules/.pnpm/nuxt@3.6.1_@types+node@18.16.0_eslint@8.42.0_typescript@5.1.3/node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const ErrorComponent = _sfc_main$1;
const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = /* @__PURE__ */ defineAsyncComponent(() => import('./_nuxt/island-renderer-43819378.mjs').then((r2) => r2.default || r2));
    const nuxtApp = useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide("_route", useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p2 = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p2);
        return false;
      }
    });
    const { islandContext } = nuxtApp.ssrContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(error)) {
            _push(ssrRenderComponent(unref(ErrorComponent), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(AppComponent), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../../node_modules/.pnpm/nuxt@3.6.1_@types+node@18.16.0_eslint@8.42.0_typescript@5.1.3/node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const RootComponent = _sfc_main;
if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch.create({
    baseURL: baseURL()
  });
}
let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(RootComponent);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (err) {
      await nuxt.hooks.callHook("app:error", err);
      nuxt.payload.error = nuxt.payload.error || err;
    }
    if (ssrContext == null ? void 0 : ssrContext._renderResponse) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry$1 = (ctx) => entry(ctx);

export { FormData as F, _export_sfc as _, useHead as a, File$1 as b, createError as c, entry$1 as default, navigateTo as n, useRouter as u };
//# sourceMappingURL=server.mjs.map
