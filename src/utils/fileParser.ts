import * as pdfjsLib from 'pdfjs-dist';

// Postavljanje Workera za PDF.js unutar Vite okruženja
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Čita sadržaj odabrane datoteke.
 * Podržava .txt i .pdf
 */
export async function parseFileContent(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'txt') {
    return parseTxt(file);
  } else if (extension === 'pdf') {
    return parsePdf(file);
  } else {
    throw new Error('Nepodržan format datoteke. Dopušteni su samo .txt i .pdf.');
  }
}

async function parseTxt(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

async function parsePdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let text = '';

  // Čitaj stranicu po stranicu
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: unknown) => {
      if (
        item &&
        typeof item === 'object' &&
        'str' in item &&
        typeof (item as { str: unknown }).str === 'string'
      ) {
        return (item as { str: string }).str;
      }
      return '';
    });
    text += strings.join(' ') + '\n';
  }

  return text;
}
