import { promises as fs } from "fs";
import path from "path";
import ClientPage from "./client-page";
type SearchParams = { [key: string]: string | string[] | undefined };

const DOCS = {
  helmet: {
    title: "src/config/helmet.ts",
    file: "src/docs/backend/config/src_config_helmet.html",
  },
  database: {
    title: "src/config/database.ts",
    file: "src/docs/backend/config/src_config_database.html",
  },
  adminRoutesTs: {
    title: "src/config/admin-routes.ts",
    file: "src/docs/backend/config/src_config_admin_routes.ts.html",
  },
  adminRoutes: {
    title: "src/config/routes.ts",
    file: "src/docs/backend/config/src_config_routes.html",
  },
  env: {
    title: "src/config/env.ts",
    file: "src/docs/backend/config/src_config_env.html",
  },

  // Middleware
  errorHandler: {
    title: "Middleware/errorHandler.ts",
    file: "src/docs/backend/middleware/middleware_error_Handler.html",
  },
  roleMiddleware: {
    title: "Middleware/roleMiddleware.ts",
    file: "src/docs/backend/middleware/middleware_role_Middleware.html",
  },
  authMiddleware: {
    title: "Middleware/authMiddleware.ts",
    file: "src/docs/backend/middleware/middleware_auth_Middleware.html",
  },

  // Integrations
  actionVoice: {
    title: "integrations/actionvoice",
    file: "src/docs/backend/integrations/action_voice/integrations_actionvoice_index.html",
  },
  awsPinpoint: {
    title: "integrations/aws/pinpoint",
    file: "src/docs/backend/integrations/aws/pinpoint/integrations_aws_pinpoint_index.html",
  },
  awsS3: {
    title: "integrations/aws/s3",
    file: "src/docs/backend/integrations/aws/s3/integrations_aws_s3_index.html",
  },
} as const;

export type DocKey = keyof typeof DOCS;

function getDocKey(param: string | string[] | undefined): DocKey {
  const key = Array.isArray(param) ? param[0] : param;
  if (key && key in DOCS) return key as DocKey;
  return "helmet";
}

async function loadHtml(fileRelativePath: string) {
  const fullPath = path.join(process.cwd(), fileRelativePath);
  try {
    const buf = await fs.readFile(fullPath);
    return buf.toString("utf-8");
  } catch {
    return `<!doctype html><html><body><p style="font-family:Arial, sans-serif">Documento não encontrado ou erro ao carregar.</p></body></html>`;
  }
}

// Convert <p> with <br> lines into <pre><code>, stripping inner spans and &nbsp;
function convertParagraphsWithBreaksToCode(html: string) {
  return html.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (full, inner) => {
    // Consider as code block only when explicit line breaks exist
    if (!/<br\s*\/?>/i.test(inner)) return full;

    // Avoid converting paragraphs that mainly contain anchors or tables
    if (/<a\s|<table|<\/?tr|<\/?td|<\/?th/i.test(inner)) return full;

    // Strip spans, turn <br> into newlines and normalize &nbsp;
    let text = inner
      .replace(/<\/?span[^>]*>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/&nbsp;/g, " ")
      .trim();

    // Remove common leftover wrappers
    text = text.replace(/<\/?(div|em|strong|u)>/gi, "");

    // Keep HTML entities intact
    return `<pre><code>${text}</code></pre>`;
  });
}

// Merge consecutive <pre><code> blocks into a single one
function mergeAdjacentCodeBlocks(html: string) {
  let out = html;
  const re = /<pre><code>([\s\S]*?)<\/code><\/pre>\s*<pre><code>([\s\S]*?)<\/code><\/pre>/g;
  while (re.test(out)) {
    out = out.replace(re, (_m, a, b) => `<pre><code>${a}\n${b}</code></pre>`);
  }
  return out;
}

// Sanitize source HTML: remove <style>, <script>, class/style/id attrs and extract only <body>
function sanitizeAndExtract(html: string) {
  // Extract body content when present
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let content = bodyMatch ? bodyMatch[1] : html;

  // Remove embedded styles, scripts and link tags
  content = content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<link[^>]*>/gi, "");

  // Remove class, style, id attributes (keep href, colspan, rowspan etc.)
  content = content.replace(/\s(?:class|style|id)=(".*?"|'.*?')/gi, "");

  // Remove data-* and similar noisy attributes
  content = content.replace(/\sdata-[a-z-]+=(".*?"|'.*?')/gi, "");

  // Strip numeric entities within Private Use Areas (BMP + planes 15/16)
  content = content.replace(/&#(\d+);/g, (_m, dec) => {
    const n = Number(dec);
    if ((n >= 57344 && n <= 63743) || (n >= 983040 && n <= 1048573) || (n >= 1048576 && n <= 1108981)) {
      return "";
    }
    return `&#${dec};`;
  });

  // Strip hex entities within Private Use Areas
  content = content.replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => {
    const n = parseInt(hex, 16);
    if ((n >= 0xe000 && n <= 0xf8ff) || (n >= 0xf0000 && n <= 0xffffd) || (n >= 0x100000 && n <= 0x10fffd)) {
      return "";
    }
    return `&#x${hex};`;
  });

  // Strip already-decoded PUA characters (e.g. '')
  content = content.replace(/[\uE000-\uF8FF]/g, "");

  // Convert paragraphs with <br> into code blocks
  content = convertParagraphsWithBreaksToCode(content);

  // Merge adjacent code blocks
  content = mergeAdjacentCodeBlocks(content);

  return content.trim();
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const docKey = getDocKey(params?.doc);
  const current = DOCS[docKey];
  const htmlRaw = await loadHtml(current.file);
  const html = sanitizeAndExtract(htmlRaw);

  return <ClientPage html={html} docKey={docKey} current={current} docs={DOCS} />;
}