"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { DocKey } from "./page";

// Componente de ícone hamburguer
function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="w-6 h-6 flex flex-col justify-center space-y-1">
      <span className={`block h-0.5 bg-current transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
      <span className={`block h-0.5 bg-current transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
      <span className={`block h-0.5 bg-current transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
    </div>
  );
}

// Componente Sidebar separado para melhor organização
function Sidebar({ 
  docKey, 
  isMobileOpen, 
  onMobileClose, 
  docs 
}: { 
  docKey: DocKey; 
  isMobileOpen: boolean; 
  onMobileClose: () => void;
  docs: Record<string, { title: string; file: string; }>;
}) {
  useEffect(() => {
    // Collapse animation + state persistence script
    const script = document.createElement('script');
    script.innerHTML = `
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

      if (willOpen && !beforeOpen) details.setAttribute('open', '');
      const startHeight = willOpen ? 0 : content.getBoundingClientRect().height;
      const endHeight = willOpen ? content.getBoundingClientRect().height : 0;

      content.style.overflow = 'hidden';

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

    const saved = getState();
    document.querySelectorAll('details[data-collapse]').forEach((d) => {
      const id = d.id;
      if (id && typeof saved[id] === 'boolean') {
        if (saved[id]) d.setAttribute('open',''); else d.removeAttribute('open');
      }
    });

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

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      document.querySelectorAll('details[data-collapse]').forEach((d) => {
        d.addEventListener('click', () => { /* no-op: instant toggle */ });
      });
    }
  });
})();`;
    
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Labels e chaves por grupo
  const getLabel = (key: DocKey) =>
    ({
      helmet: "Helmet",
      database: "Database",
      adminRoutesTs: "Admin Routes",
      adminRoutes: "Routes",
      env: "Env",

      // Middleware
      authMiddleware: "Auth Middleware",
      errorHandler: "Error Handler",
      roleMiddleware: "Role Middleware",

      // Integrations
      actionVoice: "ActionVoice",
      awsPinpoint: "AWS Pinpoint",
      awsS3: "AWS S3",
    } as Partial<Record<DocKey, string>>)[key] || docs[key]?.title || key;

  const configKeys = (["helmet", "database", "env", "adminRoutes", "adminRoutesTs"] as DocKey[])
    .filter((k) => docs[k]);
  const middlewareKeys = (["authMiddleware", "errorHandler", "roleMiddleware"] as DocKey[])
    .filter((k) => docs[k]);

  // Integrations com subgrupos
  const integrationsActionVoiceKeys = (["actionVoice"] as DocKey[]).filter((k) => docs[k]);
  const integrationsAwsKeys = (["awsPinpoint", "awsS3"] as DocKey[]).filter((k) => docs[k]);

  return (
    <>
      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 h-screen overflow-y-auto z-50 lg:z-auto
        w-72 lg:w-80 bg-background border-r border-black/10 dark:border-white/10
        transition-transform duration-300 ease-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="px-4 py-5">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Link 
                href="/" 
                className="block text-lg font-semibold tracking-tight transition-colors hover:text-foreground/80"
                onClick={onMobileClose}
              >
                Nexus Docs
              </Link>
              <p className="text-xs text-foreground/60">Documentação da Plataforma Nexus</p>
            </div>
            
            {/* Botão fechar no mobile */}
            <button
              onClick={onMobileClose}
              className="lg:hidden p-2 hover:bg-foreground/5 rounded-md transition-colors"
              aria-label="Fechar menu"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 text-sm">
            <details className="group" data-collapse id="platform" open>
              <summary className="cursor-pointer flex items-center justify-between rounded-md px-2 py-2 text-xs uppercase tracking-widest text-foreground/70 hover:bg-foreground/5 transition-colors">
                <span>Plataforma Nexus</span>
                <span className="transition-transform duration-300 group-open:rotate-90">›</span>
              </summary>

              <div data-collapse-content>
                {/* Backend  */}
                <details className="group" data-collapse id="backend" open>
                  <summary className="cursor-pointer flex items-center justify-between rounded-md px-2 py-2 pl-6 text-xs uppercase tracking-widest text-foreground/70 hover:bg-foreground/5 transition-colors">
                    <span>Backend</span>
                    <span className="transition-transform duration-300 group-open:rotate-90">›</span>
                  </summary>

                  <div data-collapse-content>
                    {/* Config */}
                    <details className="group" data-collapse id="config" open>
                      <summary className="cursor-pointer flex items-center justify-between rounded-md px-2 py-1.5 pl-8 text-[11px] uppercase tracking-wide text-foreground/60 hover:bg-foreground/5 transition-colors">
                        <span>Config</span>
                        <span className="transition-transform duration-300 group-open:rotate-90">›</span>
                      </summary>

                      <div data-collapse-content>
                        <ul className="mt-1 space-y-1 pl-8">
                          {configKeys.map((key) => {
                            const active = key === docKey;
                            return (
                              <li key={key}>
                                <Link
                                  href={`/?doc=${key}`}
                                  onClick={onMobileClose}
                                  className={[
                                    "block rounded-md px-3 py-2 transition-all",
                                    active
                                      ? "bg-foreground/10 text-foreground"
                                      : "hover:bg-foreground/5 text-foreground/80 hover:translate-x-0.5",
                                  ].join(" ")}
                                >
                                  {getLabel(key)}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </details>

                    {/* Middleware */}
                    <details className="group" data-collapse id="middleware" open>
                      <summary className="cursor-pointer flex items-center justify-between rounded-md px-2 py-1.5 pl-8 text-[11px] uppercase tracking-wide text-foreground/60 hover:bg-foreground/5 transition-colors">
                        <span>Middleware</span>
                        <span className="transition-transform duration-300 group-open:rotate-90">›</span>
                      </summary>

                      <div data-collapse-content>
                        <ul className="mt-1 space-y-1 pl-8">
                          {middlewareKeys.map((key) => {
                            const active = key === docKey;
                            return (
                              <li key={key}>
                                <Link
                                  href={`/?doc=${key}`}
                                  onClick={onMobileClose}
                                  className={[
                                    "block rounded-md px-3 py-2 transition-all",
                                    active
                                      ? "bg-foreground/10 text-foreground"
                                      : "hover:bg-foreground/5 text-foreground/80 hover:translate-x-0.5",
                                  ].join(" ")}
                                >
                                  {getLabel(key)}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </details>

                    {/* Integrations */}
                    <details className="group" data-collapse id="integrations" open>
                      <summary className="cursor-pointer flex items-center justify-between rounded-md px-2 py-1.5 pl-8 text-[11px] uppercase tracking-wide text-foreground/60 hover:bg-foreground/5 transition-colors">
                        <span>Integrations</span>
                        <span className="transition-transform duration-300 group-open:rotate-90">›</span>
                      </summary>

                      <div data-collapse-content>
                        {/* Action Voice */}
                        <details className="group" data-collapse id="integrations-actionvoice" open>
                          <summary className="cursor-pointer flex items-center justify-between rounded-md px-2 py-1.5 pl-10 text-[11px] uppercase tracking-wide text-foreground/60 hover:bg-foreground/5 transition-colors">
                            <span>Action Voice</span>
                            <span className="transition-transform duration-300 group-open:rotate-90">›</span>
                          </summary>
                          <div data-collapse-content>
                            <ul className="mt-1 space-y-1 pl-10">
                              {integrationsActionVoiceKeys.map((key) => {
                                const active = key === docKey;
                                return (
                                  <li key={key}>
                                    <Link
                                      href={`/?doc=${key}`}
                                      onClick={onMobileClose}
                                      className={[
                                        "block rounded-md px-3 py-2 transition-all",
                                        active
                                          ? "bg-foreground/10 text-foreground"
                                          : "hover:bg-foreground/5 text-foreground/80 hover:translate-x-0.5",
                                      ].join(" ")}
                                    >
                                      {getLabel(key)}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </details>

                        {/* AWS */}
                        <details className="group" data-collapse id="integrations-aws" open>
                          <summary className="cursor-pointer flex items-center justify-between rounded-md px-2 py-1.5 pl-10 text-[11px] uppercase tracking-wide text-foreground/60 hover:bg-foreground/5 transition-colors">
                            <span>AWS</span>
                            <span className="transition-transform duration-300 group-open:rotate-90">›</span>
                          </summary>
                          <div data-collapse-content>
                            <ul className="mt-1 space-y-1 pl-10">
                              {integrationsAwsKeys.map((key) => {
                                const active = key === docKey;
                                return (
                                  <li key={key}>
                                    <Link
                                      href={`/?doc=${key}`}
                                      onClick={onMobileClose}
                                      className={[
                                        "block rounded-md px-3 py-2 transition-all",
                                        active
                                          ? "bg-foreground/10 text-foreground"
                                          : "hover:bg-foreground/5 text-foreground/80 hover:translate-x-0.5",
                                      ].join(" ")}
                                    >
                                      {getLabel(key)}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </details>
                      </div>
                    </details>
                  </div>
                </details>
              </div>
            </details>
          </nav>
        </div>
      </aside>
    </>
  );
}

// Componente principal com hooks do cliente
export default function ClientPage({ 
  html, 
  docKey, 
  current, 
  docs 
}: { 
  html: string; 
  docKey: DocKey; 
  current: { title: string; file: string; };
  docs: Record<string, { title: string; file: string; }>;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fechar menu quando redimensionar para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevenir scroll do body quando menu mobile está aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="lg:grid lg:grid-cols-[320px_1fr] min-h-screen">
        <Sidebar 
          docKey={docKey} 
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
          docs={docs}
        />

        {/* Content */}
        <main className="lg:overflow-auto">
          {/* Header mobile com menu hamburguer */}
          <header className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-black/10 dark:border-white/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 hover:bg-foreground/5 rounded-md transition-colors"
                  aria-label="Abrir menu"
                >
                  <HamburgerIcon isOpen={false} />
                </button>
                <div>
                  <h1 className="text-sm font-semibold">Nexus Docs</h1>
                  <p className="text-xs text-foreground/60 truncate max-w-[200px]">
                    {current.title}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-4xl">
              {/* Breadcrumb - escondido no mobile para economizar espaço */}
              <div className="hidden sm:block mb-4 text-xs text-foreground/60 article-animate">
                <span className="hover:text-foreground transition-colors">Backend</span>
                <span className="mx-2">/</span>
                <span className="hover:text-foreground transition-colors">Config</span>
                <span className="mx-2">/</span>
                <span className="text-foreground">Docs</span>
              </div>

              {/* Title - responsivo */}
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight mb-2 article-animate">
                {current.title}
              </h1>
              <p className="text-sm text-foreground/60 mb-4 sm:mb-6 article-animate">
                Selecione outros documentos nas abas ou no menu lateral.
              </p>

              {/* Tabs - scroll horizontal no mobile */}
              <div className="mb-4 article-animate">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {(Object.keys(docs) as DocKey[]).map((key) => {
                    const active = key === docKey;
                    return (
                      <Link
                        key={key}
                        href={`/?doc=${key}`}
                        className={[
                          "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-all duration-200 flex-shrink-0",
                          active
                            ? "border-foreground/20 bg-foreground/10 text-foreground shadow-sm"
                            : "border-foreground/10 hover:bg-foreground/5 text-foreground/70 hover:border-foreground/20",
                        ].join(" ")}
                      >
                        {docs[key]?.title.split("/").pop()}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Viewer - com overflow adequado */}
              <section className="rounded-lg border border-foreground/10 bg-background shadow-sm transition-all overflow-hidden">
                <article className="prose-style article-animate">
                  <div dangerouslySetInnerHTML={{ __html: html }} />
                </article>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
