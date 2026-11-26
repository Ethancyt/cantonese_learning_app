import mammoth from "mammoth";
import JSZip from "jszip";
import { Source } from "../schema";
import { extractPdfText, pdfPageLimit } from "../pdf-text";
import {
  studioTextLimit,
  studioUploadLimitBytes,
  studioUploadSizeError,
} from "../studio-upload";
export async function extract(file: File, userId: string): Promise<Source> {
  if (file.size > studioUploadLimitBytes)
    throw new Error(studioUploadSizeError);
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["txt", "md", "pdf", "docx", "pptx"].includes(ext || ""))
    throw new Error("Use PDF, PPTX, DOCX, TXT, or Markdown.");
  const bytes = await file.arrayBuffer();
  if (ext === "pdf")
    return sourceFromPdfPages(file.name, await extractPdfText(bytes), userId);
  const buffer = Buffer.from(bytes);
  let text = "",
    pages: { text: string; page?: number }[] = [];
  if (ext === "docx" || ext === "pptx") {
    if (buffer.subarray(0, 2).toString() !== "PK")
      throw new Error("Invalid document archive.");
    const zip = await JSZip.loadAsync(buffer);
    let expanded = 0;
    for (const entry of Object.values(zip.files)) {
      expanded +=
        (entry as unknown as { _data?: { uncompressedSize: number } })._data
          ?.uncompressedSize || 0;
      if (expanded > 25 * 1024 * 1024)
        throw new Error("Document expands beyond the safe size limit.");
    }
    if (ext === "docx") {
      text = (await mammoth.extractRawText({ buffer })).value;
      pages = [{ text }];
    } else {
      const slides = Object.keys(zip.files)
        .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
        .sort(
          (a, b) =>
            Number(a.match(/slide(\d+)/)?.[1]) -
            Number(b.match(/slide(\d+)/)?.[1]),
        );
      for (const [i, name] of slides.slice(0, 100).entries()) {
        const xml = await zip.files[name].async("string");
        const slide = [...xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)]
          .map((m) =>
            m[1]
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&amp;/g, "&")
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'"),
          )
          .join("\n");
        pages.push({ page: i + 1, text: slide });
      }
      text = pages.map((p) => p.text).join("\n");
    }
  } else {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    pages = [{ text }];
  }
  return sourceFromExtractedText(file.name, text, userId, pages);
}

export function sourceFromPdfPages(
  filename: string,
  pageTexts: string[],
  createdBy: string,
): Source {
  if (pageTexts.length > pdfPageLimit)
    throw new Error(`Please split PDFs longer than ${pdfPageLimit} pages.`);
  return sourceFromExtractedText(
    filename,
    pageTexts.join("\n"),
    createdBy,
    pageTexts.map((text, index) => ({ text, page: index + 1 })),
  );
}

function sourceFromExtractedText(
  filename: string,
  text: string,
  createdBy: string,
  pages: { text: string; page?: number }[],
): Source {
  if (!text.trim())
    throw new Error(
      "No readable text found. Scanned PDFs need text recognition first.",
    );
  if (text.length > studioTextLimit)
    throw new Error(
      "Please split the workshop into smaller documents (60,000 characters maximum).",
    );
  return sourceFromText(filename, text, createdBy, pages);
}
export function sourceFromText(
  filename: string,
  text: string,
  createdBy: string,
  pages: { text: string; page?: number }[] = [{ text }],
): Source {
  if (!text.trim() || text.length > studioTextLimit)
    throw new Error("Provide 1–60,000 characters of workshop text.");
  const chunks: Source["chunks"] = [];
  for (const page of pages)
    for (let i = 0; i < page.text.length; i += 1350)
      chunks.push({
        index: chunks.length,
        page: page.page,
        text: page.text.slice(i, i + 1500),
      });
  return {
    id: crypto.randomUUID(),
    filename: filename.slice(0, 200),
    text,
    chunks,
    createdBy,
    createdAt: new Date().toISOString(),
  };
}
