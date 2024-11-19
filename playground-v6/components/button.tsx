import cx from "clsx";

const colors = {
  blue: "bg-blue-600 hover:bg-blue-700 text-blue-50",
  red: "bg-red-600 hover:bg-red-700 text-red-50",
  lightgray: "bg-gray-300 hover:bg-gray-400 text-gray-950",
  outline: "bg-transparent border hover:bg-gray-100",
};
type Color = keyof typeof colors;

export function Button(
  props: React.ComponentProps<"button"> & {
    color?: Color;
  },
) {
  return (
    <button
      {...props}
      className={cx(
        props.className,
        "rounded px-2 py-1 text-sm/6 disabled:pointer-events-none",
        colors[props.color ?? "blue"],
      )}
    />
  );
}
