import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";

type SearchParams = { [key: string]: string | string[] | undefined };

const DOCS = {
  helmet: {
    title: "src/config/helmet.ts",
    file: "src/docs/backend/config/src_config_helmet.html",
  },
  auth: {
    title: "Middleware/authMiddleware",
    file: "src/docs/backend/config/Middleware_authMiddleware.html",
  },
  database: {
    title: "src/config/database.ts",
    file: "src/docs/backend/config/src_config_database.html",
  },
  adminRoutesTs: {
    title: "src/config/admin-routes.ts (admin)",
    file: "src/docs/backend/config/src_config_admin_routes.ts.html",
  },
  adminRoutes: {
    title: "src/config/admin-routes.ts (app)",
    file: "src/docs/backend/config/src_config_admin_routes.html",
  },
  env: {
    title: "src/config/env.ts",
    file: "src/docs/backend/config/src_config_env.html",
  },
} as const;

type DocKey = keyof typeof DOCS;

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
    // Mensagem em pt-BR
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid grid-cols-[280px_1fr] min-h-screen">
        {/* Sidebar */}
        <aside className="border-r border-black/10 dark:border-white/10 bg-background/60 backdrop-blur-sm sticky top-0 h-screen overflow-y-auto">
          <div className="px-4 py-5">
            <div className="mb-6">
              <Link href="/" className="block text-lg font-semibold tracking-tight transition-colors hover:text-foreground/80">
                Nexus Docs
              </Link>
              <p className="text-xs text-foreground/60">Documentação da Plataforma Nexus</p>
            </div>

            {/* Navegação colapsável com JS */}
            <nav className="space-y-2 text-sm">
              <details className="group" data-collapse id="backend" open>
                <summary className="cursor-pointer flex items-center justify-between rounded-md px-2 py-2 text-xs uppercase tracking-widest text-foreground/70 hover:bg-foreground/5 transition-colors">
                  <span>Backend</span>
                  <span className="transition-transform duration-300 group-open:rotate-90">›</span>
                </summary>

                <div data-collapse-content>
                  <details className="group" data-collapse id="config" open>
                    <summary className="cursor-pointer flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] uppercase tracking-wide text-foreground/60 hover:bg-foreground/5 transition-colors">
                      <span>Config</span>
                      <span className="transition-transform duration-300 group-open:rotate-90">›</span>
                    </summary>

                    <div data-collapse-content>
                      <ul className="mt-1 space-y-1">
                        {(Object.keys(DOCS) as DocKey[]).map((key) => {
                          const active = key === docKey;
                          return (
                            <li key={key}>
                              <Link
                                href={`/?doc=${key}`}
                                className={[
                                  "block rounded-md px-3 py-2 transition-all",
                                  active
                                    ? "bg-foreground/10 text-foreground"
                                    : "hover:bg-foreground/5 text-foreground/80 hover:translate-x-0.5",
                                ].join(" ")}
                              >
                                {
                                  {
                                    helmet: "Helmet (segurança)",
                                    auth: "Auth Middleware",
                                    database: "Database",
                                    adminRoutesTs: "Admin Routes (admin)",
                                    adminRoutes: "Admin Routes (app)",
                                    env: "Env",
                                  }[key]
                                }
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </details>
                </div>
              </details>
            </nav>
          </div>

          {/* Collapse animation + state persistence (comments in English) */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
(function initSidebar(){
  const onReady = (cb) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', cb, { once: true }) : cb());
  onReady(() => {
    const STORAGE_KEY = 'nexus-docs-sidebar';
    const getState = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } };
    const setState = (s) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

    const animateDetails = (details, willOpen) => {
      const content = details.querySelector('[data-collapse-content]');
      if (!content) return;
      const beforeOpen = details.hasAttribute('open');

      // Prepare measurements
      if (willOpen && !beforeOpen) details.setAttribute('open', '');
      const startHeight = willOpen ? 0 : content.getBoundingClientRect().height;
      const endHeight = willOpen ? content.getBoundingClientRect().height : 0;

      // Ensure overflow is hidden during animation
      content.style.overflow = 'hidden';

      // Animate height and opacity
      const anim = content.animate(
        [{ height: startHeight + 'px', opacity: willOpen ? 0.6 : 1 }, { height: endHeight + 'px', opacity: willOpen ? 1 : 0.6 }],
        { duration: 260, easing: willOpen ? 'ease-out' : 'ease-in' }
      );

      anim.onfinish = () => {
        if (!willOpen) details.removeAttribute('open');
        content.style.height = '';
        content.style.overflow = '';
      };
    };

    // Restore saved state (no animation)
    const saved = getState();
    document.querySelectorAll('details[data-collapse]').forEach((d) => {
      const id = d.id;
      if (id && typeof saved[id] === 'boolean') {
        if (saved[id]) d.setAttribute('open',''); else d.removeAttribute('open');
      }
    });

    // Toggle with animation + persistence
    document.querySelectorAll('details[data-collapse]').forEach((details) => {
      const summary = details.querySelector('summary');
      if (!summary) return;
      summary.addEventListener('click', (e) => {
        e.preventDefault();
        const willOpen = !details.hasAttribute('open');
        animateDetails(details, willOpen);
        const id = details.id;
        if (id) {
          const state = getState();
          state[id] = willOpen;
          setState(state);
        }
      });
    });

    // Honor reduced motion
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      document.querySelectorAll('details[data-collapse]').forEach((d) => {
        d.addEventListener('click', () => { /* no-op: instant toggle */ });
      });
    }
  });
})();`,
            }}
          />
        </aside>

        {/* Conteúdo */}
        <main className="p-6 sm:p-8">
          <div className="mx-auto w-full max-w-4xl">
            {/* Breadcrumb */}
            <div className="mb-4 text-xs text-foreground/60 article-animate">
              <span className="hover:text-foreground transition-colors">Backend</span>
              <span className="mx-2">/</span>
              <span className="hover:text-foreground transition-colors">Config</span>
              <span className="mx-2">/</span>
              <span className="text-foreground">Docs</span>
            </div>

            {/* Título */}
            <h1 className="text-2xl font-semibold tracking-tight mb-2 article-animate">{current.title}</h1>
            <p className="text-sm text-foreground/60 mb-6 article-animate">
              Selecione outros documentos nas abas ou no menu lateral.
            </p>

            {/* Abas */}
            <div className="mb-4 overflow-x-auto article-animate">
              <div className="flex gap-2">
                {(Object.keys(DOCS) as DocKey[]).map((key) => {
                  const active = key === docKey;
                  return (
                    <Link
                      key={key}
                      href={`/?doc=${key}`}
                      className={[
                        "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-all duration-200",
                        active
                          ? "border-foreground/20 bg-foreground/10 text-foreground shadow-sm"
                          : "border-foreground/10 hover:bg-foreground/5 text-foreground/70 hover:border-foreground/20",
                      ].join(" ")}
                    >
                      {DOCS[key].title.split("/").pop()}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Viewer */}
            <section className="rounded-lg border border-foreground/10 bg-background shadow-sm transition-all">
              <article className="prose-style article-animate">
                <div dangerouslySetInnerHTML={{ __html: html }} />
              </article>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
