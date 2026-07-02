import { truncateDocumentContent } from '../../../utils/documentAttachment';

export type AttachedDocument = {
  name: string;
  content: string;
};

export function isSupportedAttachment(file: File): 'image' | 'document' | 'unsupported' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.name.endsWith('.pdf') || file.name.endsWith('.txt')) return 'document';
  return 'unsupported';
}

export async function parseDocumentFile(file: File): Promise<AttachedDocument> {
  const { parseFileContent } = await import('../../../utils/fileParser');
  const content = truncateDocumentContent(await parseFileContent(file));
  return { name: file.name, content };
}
