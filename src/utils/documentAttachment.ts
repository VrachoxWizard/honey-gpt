export const MAX_DOCUMENT_ATTACHMENT_CHARS = 6_000;

export function truncateDocumentContent(
  content: string,
  maxChars = MAX_DOCUMENT_ATTACHMENT_CHARS
): string {
  if (content.length <= maxChars) return content;
  return `${content.slice(0, maxChars)}\n\n[... dokument skraćen zbog ograničenja duljine ...]`;
}

export function buildMessageWithDocument(
  draft: string,
  document: { name: string; content: string },
  maxDocumentChars = MAX_DOCUMENT_ATTACHMENT_CHARS
): string {
  const trimmedDraft = draft.trim();
  const truncatedContent = truncateDocumentContent(document.content, maxDocumentChars);
  const documentBlock = `--- Priloženi dokument: ${document.name} ---\n${truncatedContent}`;

  return trimmedDraft ? `${trimmedDraft}\n\n${documentBlock}` : documentBlock;
}
