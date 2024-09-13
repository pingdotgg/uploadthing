import { z } from "zod";

type Primitives = string | number | boolean | null;
type JsonValue = Primitives | JsonValue[] | { [key: string]: JsonValue };

const jsonStr = z.string().transform((str, ctx) => {
  try {
    return JSON.parse(str) as JsonValue;
  } catch (error) {
    ctx.addIssue({ code: "custom", message: "Needs to be JSON" });
  }
});

export function zodParams<TType>(schema: z.ZodType<TType>) {
  const querySchema = z.object({
    input: jsonStr.pipe(schema),
  });
  return {
    decodeRequest: (req: Request) => {
      const url = new URL(req.url);
      const obj = Object.fromEntries(url.searchParams.entries());

      return querySchema.safeParse(obj);
    },
    toSearchString: (obj: (typeof schema)["_input"]) => {
      schema.parse(obj);
      return `input=${encodeURIComponent(JSON.stringify(obj))}`;
    },
  };
}

function truncateWordsFn(str: string, maxCharacters: number) {
  if (str.length <= maxCharacters) {
    return str;
  }
  // break at closest word
  const truncated = str.slice(0, maxCharacters);
  const lastSpace = truncated.lastIndexOf(" ");
  return truncated.slice(0, lastSpace) + " …";
}
function truncatedWordSchema(opts: { maxCharacters: number }) {
  return z
    .string()
    .transform((str) => truncateWordsFn(str, opts.maxCharacters));
}

export const docsParams = zodParams(
  z.object({
    title: z.string(),
    category: z.string(),
    description: truncatedWordSchema({ maxCharacters: 215 }),
  }),
);

export const blogParams = zodParams(
  z.object({
    authors: z.array(
      z.object({ name: z.string(), role: z.string(), src: z.string() }),
    ),
    title: z.string(),
  }),
);

export const getFont = async <const TWeights extends readonly number[]>({
  family,
  weights,
  text,
}: {
  family: string;
  weights: TWeights;
  text?: string;
}) => {
  const sorted = [...weights].sort();
  const API = `https://fonts.googleapis.com/css2?family=${family}:wght@${sorted.join(
    ";",
  )}${text ? `&text=${encodeURIComponent(text)}` : ""}`;

  const css = (await (
    await fetch(API, {
      headers: {
        // Make sure it returns TTF.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    })
  ).text()) as string;

  const fonts = css
    .split("@font-face {")
    .splice(1)
    .map((font) => {
      const u = font.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);
      const w = font.match(/font-weight: (\d+)/);
      return u?.[1] && w?.[1] ? { url: u[1], weight: parseInt(w[1]) } : null;
    })
    .filter(
      (font): font is { url: string; weight: TWeights[number] } => !!font,
    );

  const promises = fonts.map(async (font) => {
    const res = await fetch(font.url);
    return [font.weight, await res.arrayBuffer()];
  });

  return Object.fromEntries(await Promise.all(promises)) as Record<
    TWeights[number],
    ArrayBuffer
  >;
};
