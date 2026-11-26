export const pdfPageLimit = 100;

export async function extractPdfText(bytes: ArrayBuffer): Promise<string[]> {
  if (
    new TextDecoder().decode(new Uint8Array(bytes).subarray(0, 5)) !== "%PDF-"
  )
    throw new Error("Invalid PDF file.");

  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(bytes), {
    disableFontFace: true,
    useSystemFonts: false,
  });
  try {
    if (pdf.numPages > pdfPageLimit)
      throw new Error(`Please split PDFs longer than ${pdfPageLimit} pages.`);
    return (await extractText(pdf, { mergePages: false })).text;
  } finally {
    await pdf.loadingTask.destroy();
  }
}
