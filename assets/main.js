/* ==========================================================================
   main.js — site chrome + project loading. No dependencies.

   ┌──────────────────────────────────────────────────────────────────────┐
   │  EDIT ME: everything personal lives in the CONFIG block below.       │
   └──────────────────────────────────────────────────────────────────────┘
   ========================================================================== */
(function () {
  'use strict';

  /* ========================================================================
     CONFIG
     ======================================================================== */
  var CONFIG = {
    name: 'Dylan Uijthof',
    brand: 'Dylan Uijthof',
    role: 'Full-stack developer',
    email: 'dylanuijthof07@gmail.com',
    github: 'https://github.com/Dylan-Uijthof',
    linkedin: 'https://www.linkedin.com/in/your-handle',

    // The project manifest. Add/remove entries here (or just edit the JSON).
    manifestUrl: 'projects/projects.json',

    // Where the Markdown files live, relative to the site root.
    projectsDir: 'projects/',

    // How many projects to feature on the home page.
    featuredCount: 3
  };
  window.SITE = CONFIG;

  var THEME_KEY = 'du-theme';
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  /* ========================================================================
     Theme
     ======================================================================== */
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    var btn = $('#themeToggle');
    if (btn) btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  function initTheme() {
    setTheme(currentTheme());
    var btn = $('#themeToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      setTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
    });
  }

  /* ========================================================================
     Navigation
     ======================================================================== */
  function initNav() {
    var page = document.body.getAttribute('data-page');
    if (page) {
      var active = $('.site-nav a[data-nav="' + page + '"]');
      if (active) active.classList.add('is-active');
    }

    var toggle = $('#navToggle');
    var nav = $('#siteNav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initFooter() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ========================================================================
     Helpers
     ======================================================================== */
  var MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
    'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

  function formatDate(value) {
    if (!value) return '';
    var m = String(value).match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
    if (!m) return String(value);
    var month = m[2] ? MONTHS[Math.max(0, Math.min(11, parseInt(m[2], 10) - 1))] + ' ' : '';
    return month + m[1];
  }

  function readingTime(html) {
    var text = String(html).replace(/<[^>]*>/g, ' ');
    var words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200)) + ' min leestijd';
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function normalizeProject(p) {
    return {
      slug: String(p.slug || '').trim(),
      file: String(p.file || (String(p.slug || '').trim() + '.md')),
      title: String(p.title || p.slug || 'Zonder titel'),
      summary: String(p.summary || p.description || ''),
      date: String(p.date || ''),
      tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
      featured: p.featured === true,
      url: p.url ? String(p.url) : ''
    };
  }

  /* ========================================================================
     Project manifest + cards
     ======================================================================== */
  function loadManifest() {
    return fetch(CONFIG.manifestUrl, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Kan ' + CONFIG.manifestUrl + ' niet laden (' + res.status + ')');
        return res.json();
      })
      .then(function (data) {
        var list = Array.isArray(data) ? data : (data && data.projects) || [];
        return list.map(normalizeProject).filter(function (p) { return p.slug; });
      });
  }

  function projectHref(slug) {
    return 'project.html?p=' + encodeURIComponent(slug);
  }

  function renderCard(project) {
    var li = el('li', 'card');

    var top = el('div', 'card-top');
    var h3 = el('h3');
    var link = el('a', null, project.title);
    link.href = projectHref(project.slug);
    h3.appendChild(link);
    top.appendChild(h3);
    if (project.date) {
      var time = el('time', null, formatDate(project.date));
      time.dateTime = project.date;
      top.appendChild(time);
    }
    li.appendChild(top);

    if (project.summary) li.appendChild(el('p', null, project.summary));

    if (project.tags.length) {
      var tags = el('ul', 'tags');
      project.tags.forEach(function (tag) {
        tags.appendChild(el('li', 'tag', tag));
      });
      li.appendChild(tags);
    }
    return li;
  }

  function renderCards(container, projects) {
    container.innerHTML = '';
    projects.forEach(function (project) { container.appendChild(renderCard(project)); });
  }

  function showEmpty(container, message) {
    var box = el('li', 'empty-state', message);
    container.innerHTML = '';
    container.appendChild(box);
  }

  function initFeatured() {
    var container = $('#featured-projects');
    if (!container) return;
    loadManifest().then(function (projects) {
      var featured = projects.filter(function (p) { return p.featured; });
      if (!featured.length) featured = projects;
      featured = featured.slice(0, CONFIG.featuredCount);
      if (!featured.length) return showEmpty(container, 'Nog geen projecten — voeg een Markdown-bestand toe aan projects/.');
      renderCards(container, featured);
    }).catch(function (err) {
      showEmpty(container, err.message);
    });
  }

  function initProjectsIndex() {
    var container = $('#project-list');
    if (!container) return;
    var filters = $('#filters');

    loadManifest().then(function (projects) {
      if (!projects.length) return showEmpty(container, 'Nog geen projecten — voeg een Markdown-bestand toe aan projects/ en zet het in projects.json.');

      if (filters) {
        var allTags = {};
        projects.forEach(function (p) { p.tags.forEach(function (t) { allTags[t] = true; }); });
        var tags = Object.keys(allTags).sort();

        if (tags.length) {
          var makeBtn = function (label, value) {
            var btn = el('button', 'filter-btn' + (value === '' ? ' is-active' : ''), label);
            btn.type = 'button';
            btn.setAttribute('aria-pressed', value === '' ? 'true' : 'false');
            btn.addEventListener('click', function () {
              $$('.filter-btn', filters).forEach(function (b) {
                b.classList.remove('is-active');
                b.setAttribute('aria-pressed', 'false');
              });
              btn.classList.add('is-active');
              btn.setAttribute('aria-pressed', 'true');
              var filtered = value === '' ? projects : projects.filter(function (p) {
                return p.tags.indexOf(value) !== -1;
              });
              if (!filtered.length) showEmpty(container, 'Nog niets met de tag "' + value + '".');
              else renderCards(container, filtered);
            });
            return btn;
          };
          filters.appendChild(makeBtn('Alle', ''));
          tags.forEach(function (tag) { filters.appendChild(makeBtn(tag, tag)); });
        }
      }

      renderCards(container, projects);
    }).catch(function (err) {
      showEmpty(container, err.message);
    });
  }

  /* ========================================================================
     Single project page (project.html?p=slug)
     ======================================================================== */
  function addCopyButtons(scope) {
    $$('.code-block', scope).forEach(function (block) {
      var code = $('code', block);
      if (!code) return;
      var btn = el('button', 'copy-btn', 'Kopieer');
      btn.type = 'button';
      btn.addEventListener('click', function () {
        var text = code.innerText;
        var done = function (label) {
          btn.textContent = label;
          setTimeout(function () { btn.textContent = 'Kopieer'; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { done('Gekopieerd'); }, function () { done('Mislukt'); });
        } else {
          done('Mislukt');
        }
      });
      block.appendChild(btn);
    });
  }

  function renderArticle(scope, data) {
    var entry = data.entry || {};
    var meta = data.meta || {};
    var title = meta.title || entry.title || data.slug;
    var date = meta.date || entry.date || '';
    var summary = meta.summary || entry.summary || '';
    var tags = Array.isArray(meta.tags) && meta.tags.length ? meta.tags
      : (Array.isArray(entry.tags) ? entry.tags : []);

    document.title = title + ' — ' + CONFIG.name;

    var crumb = $('#crumb-current');
    if (crumb) crumb.textContent = title;

    var head = $('#article-head', scope);
    if (head) {
      head.innerHTML = '';
      head.appendChild(el('h1', null, title));

      var metaLine = el('div', 'article-meta');
      if (date) {
        var time = el('time', null, formatDate(date));
        time.dateTime = date;
        metaLine.appendChild(time);
        metaLine.appendChild(el('span', 'dot'));
      }
      metaLine.appendChild(el('span', null, readingTime(data.html)));
      head.appendChild(metaLine);

      if (summary) head.appendChild(el('p', 'article-summary', summary));

      if (tags.length) {
        var tagList = el('ul', 'tags article-tags');
        tags.forEach(function (tag) { tagList.appendChild(el('li', 'tag', tag)); });
        head.appendChild(tagList);
      }
    }

    var body = $('#article-body', scope);
    if (body) {
      body.innerHTML = data.html;
      addCopyButtons(body);
    }

    // Prev / next navigation using manifest order.
    var pager = $('#pager', scope);
    if (pager && data.projects && data.projects.length > 1) {
      var index = data.projects.findIndex(function (p) { return p.slug === data.slug; });
      if (index === -1) index = 0;
      var prev = data.projects[index - 1];
      var next = data.projects[index + 1];
      pager.innerHTML = '';
      pager.appendChild(pagerLink('prev', 'Vorige', prev));
      pager.appendChild(pagerLink('next', 'Volgende', next));
    }
  }

  function pagerLink(dir, label, project) {
    var a = el('a', dir + (project ? '' : ' empty'));
    if (project) {
      a.href = projectHref(project.slug);
      a.appendChild(el('span', 'dir', label));
      a.appendChild(el('span', 'name', project.title));
    } else {
      a.setAttribute('aria-hidden', 'true');
      a.setAttribute('tabindex', '-1');
    }
    return a;
  }

  function showArticleError(scope, message) {
    var head = $('#article-head', scope);
    if (head) head.innerHTML = '';
    var body = $('#article-body', scope);
    if (!body) return;
    body.innerHTML = '';
    var box = el('div', 'error-box');
    box.appendChild(el('h2', null, 'Project niet gevonden'));
    box.appendChild(el('p', null, message));

    var hint = el('p');
    hint.innerHTML = 'Als je dit bestand rechtstreeks vanaf schijf hebt geopend, start dan eerst een ' +
      'lokale server (browsers blokkeren <code>fetch()</code> op <code>file://</code>), bijvoorbeeld: ' +
      '<code>python3 -m http.server</code>.';
    box.appendChild(hint);

    var back = el('a', 'btn btn-ghost btn-sm', '← Terug naar projecten');
    back.href = 'projects.html';
    box.appendChild(back);
    body.appendChild(box);
  }

  function initProjectPage() {
    var scope = $('#project');
    if (!scope) return;

    var slug = new URLSearchParams(window.location.search).get('p') ||
      new URLSearchParams(window.location.search).get('project') || '';
    var safe = /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(slug) ? slug : '';

    if (!safe) {
      showArticleError(scope, 'Er is geen project opgegeven in de URL.');
      return;
    }

    loadManifest().then(function (projects) {
      var entry = projects.filter(function (p) { return p.slug === safe; })[0] || null;
      var file = entry && entry.file ? entry.file : (safe + '.md');

      // Keep the manifest accessible to the renderer without another request.
      return fetch(CONFIG.projectsDir + file, { cache: 'no-store' })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status === 404 ? 'Er is geen bestand voor dit project.' : 'Verzoek mislukt (' + res.status + ').');
          return res.text();
        })
        .then(function (md) {
          var parsed = window.Markdown.parseWithMeta(md);
          renderArticle(scope, {
            slug: safe,
            entry: entry || {},
            meta: parsed.meta,
            html: parsed.html,
            projects: projects
          });
        });
    }).catch(function (err) {
      showArticleError(scope, err && err.message ? err.message : 'Er ging iets mis bij het laden van dit project.');
    });
  }

  /* ========================================================================
     Contact helpers
     ======================================================================== */
  function initCopyTargets() {
    $$('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var value = btn.getAttribute('data-copy') || '';
        var label = btn.getAttribute('data-copy-label') || 'Gekopieerd';
        var original = btn.textContent;
        var done = function () {
          btn.textContent = label;
          setTimeout(function () { btn.textContent = original; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(value).then(done, done);
        } else {
          done();
        }
      });
    });
  }

  /* ========================================================================
     Boot
     ======================================================================== */
  function boot() {
    initTheme();
    initNav();
    initFooter();
    initCopyTargets();
    initFeatured();
    initProjectsIndex();
    initProjectPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
