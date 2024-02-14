type IncomingMessageLike = {
  method?: string | undefined;
  headers?: Record<string, string | string[] | undefined>;
  body?: any;
};

export function toWebRequest(req: IncomingMessageLike, url: URL, body?: any) {
  body ??= req.body;
  const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
  const method = req.method ?? "GET";
  const allowsBody = ["POST", "PUT", "PATCH"].includes(method);
  return new Request(url, {
    method,
    headers: req.headers as HeadersInit,
    ...(allowsBody ? { body: bodyStr } : {}),
  });
}
