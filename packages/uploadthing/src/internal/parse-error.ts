export const maybeParseResponseXML = (maybeXml: string) => {
  const codeMatch = maybeXml.match(/<Code>(.*?)<\/Code>/s);
  const messageMatch = maybeXml.match(/<Message>(.*?)<\/Message>/s);

  const code = codeMatch?.[1];
  const message = messageMatch?.[1];

  if (!code || !message) return null;

  return { code, message };
};
