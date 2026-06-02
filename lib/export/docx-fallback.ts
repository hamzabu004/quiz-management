import html2canvas from "html2canvas";
import katex from "katex";
import { Document, ImageRun, Packer, Paragraph } from "docx";

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const [, base64] = dataUrl.split(",");
  const binary = atob(base64 ?? "");
  const len = binary.length;
  const buffer = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const htmlLines: string[] = [];
  let inList = false;

  const inlineMath = (text: string) =>
    text.replace(/\$(.+?)\$/g, (_, expr) => {
      try {
        return katex.renderToString(expr, {
          throwOnError: false,
          output: "html",
        });
      } catch {
        return `$${expr}$`;
      }
    });

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      htmlLines.push(`<h2>${inlineMath(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        htmlLines.push("<ul>");
        inList = true;
      }
      htmlLines.push(`<li>${inlineMath(line.slice(2))}</li>`);
      continue;
    }

    if (!line.trim()) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      continue;
    }

    const withInline = inlineMath(line)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");
    htmlLines.push(`<p>${withInline}</p>`);
  }

  if (inList) {
    htmlLines.push("</ul>");
  }

  return htmlLines.join("");
}

export async function buildDocxFallback(markdown: string): Promise<Blob> {
  const sections = markdown.split(/\n---\n/);
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-10000px";
  container.style.left = "0";
  container.style.width = "800px";
  container.style.padding = "24px";
  container.style.background = "#ffffff";
  container.style.color = "#111827";
  container.style.fontFamily = "Arial, sans-serif";
  document.body.appendChild(container);

  const paragraphs: Paragraph[] = [];

  for (const section of sections) {
    container.innerHTML = markdownToHtml(section.trim());
    const canvas = await html2canvas(container, {
      backgroundColor: "#ffffff",
      scale: 2,
    });
    const dataUrl = canvas.toDataURL("image/png");
    const imageData = dataUrlToUint8Array(dataUrl);

    paragraphs.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: imageData,
            type: "png",
            transformation: {
              width: Math.min(720, canvas.width / 2),
              height: Math.min(1000, canvas.height / 2),
            },
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  document.body.removeChild(container);

  const doc = new Document({
    sections: [
      {
        children: paragraphs,
      },
    ],
  });

  return Packer.toBlob(doc);
}

