const header = document.querySelector('[data-header]');
const reveals = document.querySelectorAll('.reveal');

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 18);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px' });
  reveals.forEach((element) => observer.observe(element));
} else {
  reveals.forEach((element) => element.classList.add('visible'));
}

document.querySelector('[data-copy-config]')?.addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const config = document.querySelector('[data-config]')?.textContent?.trim();
  if (!config) return;
  try {
    await navigator.clipboard.writeText(config);
    const label = button.querySelector('span');
    if (label) label.textContent = 'Copied';
    window.setTimeout(() => { if (label) label.textContent = 'Copy configuration'; }, 1800);
  } catch {
    const code = document.querySelector('[data-config]');
    if (code) window.getSelection()?.selectAllChildren(code);
  }
});

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

const consolePanel = document.querySelector('#console-panel');
const consoleTabs = [...document.querySelectorAll('[data-console-view]')];
const consoleViews = {
  ranking: {
    prompt: 'Which models lead the intelligence ranking?',
    tool: 'get_intelligence_ranking',
    response: `{
  "source": "Artificial Analysis Intelligence Index",
  "ranking": [
    { "rank": 1, "name": "…", "vendor": "…", "score": 0, "url": "…" },
    { "rank": 2, "name": "…", "vendor": "…", "score": 0, "url": "…" }
  ]
}`,
  },
  news: {
    prompt: 'What changed in Brazilian AI today?',
    tool: 'search_news',
    response: `[
  {
    "title": "…", "summary": "…",
    "publishedAt": "…", "url": "https://swen.ia.br/noticia/…"
  }
]`,
  },
  tools: {
    prompt: 'Find tools with an API for my workflow.',
    tool: 'search_tools',
    response: `[
  {
    "name": "…", "category": "…", "pricingModel": "…",
    "hasApi": true, "url": "https://swen.ia.br/ferramentas/…"
  }
]`,
  },
};

const setConsoleView = (name, focus = false) => {
  const view = consoleViews[name];
  if (!consolePanel || !view) return;
  consolePanel.querySelector('[data-console-prompt]').textContent = view.prompt;
  consolePanel.querySelector('[data-console-tool]').textContent = view.tool;
  consolePanel.querySelector('[data-console-response]').textContent = view.response;
  consoleTabs.forEach((tab) => {
    const active = tab.dataset.consoleView === name;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active) {
      consolePanel.setAttribute('aria-labelledby', tab.id);
      if (focus) tab.focus();
    }
  });
};

consoleTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => setConsoleView(tab.dataset.consoleView));
  tab.addEventListener('keydown', (event) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % consoleTabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + consoleTabs.length) % consoleTabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = consoleTabs.length - 1;
    else return;
    event.preventDefault();
    setConsoleView(consoleTabs[next].dataset.consoleView, true);
  });
});

setConsoleView('ranking');
