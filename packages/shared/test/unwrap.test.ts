import { describe, expect, expectTypeOf, it } from "vitest";

import { unwrap } from "../src/utils";

describe("unwrap", () => {
  it("value", () => {
    const value = unwrap(1);
    expectTypeOf<number>(value);
    expect(value).toBe(1);
  });

  it("function w/ no args", () => {
    const getter = () => 1;
    const value = unwrap(getter);
    expectTypeOf<number>(value);
    expect(value).toBe(1);
  });

  it("function w/ 1 arg", () => {
    const getter = (x: number) => x;
    const value = unwrap(getter, 1);
    expectTypeOf<number>(value);
    expect(value).toBe(1);

    {
      // @ts-expect-error - missing args
      unwrap(getter);
      // @ts-expect-error - invalid args
      unwrap(getter, 1, 2);
      // @ts-expect-error - invalid args
      unwrap(getter, "1");
    }
  });

  it("function w/ 2 args", () => {
    const getter = (x: number, y: number) => x + y;
    const value = unwrap(getter, 1, 2);
    expectTypeOf<number>(value);
    expect(value).toBe(3);
  });

  it("function w/ many different args", () => {
    const getter = (x: number, s: string, opts?: { y: number }) => {
      return x + s.length + (opts?.y ?? 0);
    };
    {
      const value = unwrap(getter, 1, "foo", { y: 2 });
      expectTypeOf<number>(value);
      expect(value).toBe(6);
    }
    {
      const value = unwrap(getter, 1, "foo");
      expectTypeOf<number>(value);
      expect(value).toBe(4);
    }
  });
});
