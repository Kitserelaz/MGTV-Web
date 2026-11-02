export const removeNewsFooter = (content: string) => content.split('\n').filter((line) =>
	!/^[\s*\\>]*(?:For you who are reading this outside the server|For you who are not subscribed and reading this|Servers that support (?:MGTV(?:24)?|DLTV)\s*NEWS media on discord)\b/i.test(line)
).join('\n');
