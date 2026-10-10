/* ==========================================================================
   markdown.js — a tiny, dependency-free Markdown → HTML renderer.
   Drop this anywhere and use window.Markdown.parse(text).

   Supported syntax:
     • # headings 1-6 (with auto slug ids + anchor links)
     • paragraphs, hard line breaks (two spaces or trailing backslash)
     • **bold**, *italic*, __bold__, _italic_, ~~strikethrough~~, `code`
     • [links](url), ![images](src "title"), autolinked bare URLs
     • fenced code blocks ```lang … ``` (and ~~~)
     • > blockquotes (nested)
     • ordered, unordered and nested lists, plus - [ ] task lists
     • tables with :--- alignment
     • horizontal rules
     • YAML-ish front matter (title, date, tags, summary, …)
   ========================================================================== */
(function (root) {
  'use strict';

  /* ---------------------------------------------------------------- utils */

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Attribute values arrive already HTML-escaped (except for quotes).
  function attr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  function slugify(s) {
    return String(s)
      .toLowerCase()
      .replace(/<[^>]*>/g, '')
      .replace(/&[a-z]+;/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80) || 'section';
  }

  var PH = '\u0001'; // placeholder sentinel for stashed inline HTML

  /* --------------------------------------------------------------- inline */

  function inline(text) {
    var store = [];
    function stash(html) {
      store.push(html);
      return PH + (store.length - 1) + PH;
    }

    // 1. Inline code first, so its contents are never interpreted.
    text = text.replace(/(`+)([\s\S]*?)\1/g, function (m, ticks, code) {
      return stash('<code>' + escapeHtml(code.replace(/^\s+|\s+$/g, '')) + '</code>');
    });

    // 2. Escape everything else.
    text = escapeHtml(text);

    // 3. Images.
    text = text.replace(/!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)/g,
      function (m, alt, src, title) {
        return stash('<img src="' + attr(src) + '" alt="' + attr(alt) + '"' +
          (title ? ' title="' + attr(title) + '"' : '') + ' loading="lazy">');
      });

    // 4. Links.
    text = text.replace(/\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)/g,
      function (m, label, href, title) {
        var external = /^https?:\/\//i.test(href);
        return stash('<a href="' + attr(href) + '"' +
          (title ? ' title="' + attr(title) + '"' : '') +
          (external ? ' target="_blank" rel="noopener noreferrer"' : '') +
          '>' + label + '</a>');
      });

    // 5. Autolink bare URLs (skip if the engine lacks look-behind support).
    try {
      text = text.replace(/(^|[\s(])(https?:\/\/[^\s<>()"\u0001]+)/g, function (m, pre, url) {
        return pre + stash('<a href="' + attr(url) + '" target="_blank" rel="noopener noreferrer">' + url + '</a>');
      });
    } catch (e) { /* look-behind unsupported – ignore */ }

    // 6. Emphasis.
    text = text.replace(/\*\*\*(?=\S)([\s\S]*?\S)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(?=\S)([\s\S]*?\S)__/g, '<strong>$1</strong>');
    text = text.replace(/\*(?=\S)([\s\S]*?\S)\*/g, '<em>$1</em>');
    text = text.replace(/(^|[\s(])_(?=\S)([\s\S]*?\S)_(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>');
    text = text.replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');

    // 7. Restore stashed HTML (loop handles code inside link labels, etc.).
    for (var pass = 0; pass < 6 && text.indexOf(PH) !== -1; pass++) {
      text = text.replace(new RegExp(PH + '(\\d+)' + PH, 'g'), function (m, n) {
        return store[+n] !== undefined ? store[+n] : '';
      });
    }
    return text;
  }

  // Render a run of lines as one paragraph, honouring hard line breaks.
  function inlineLines(lines) {
    var out = '';
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var br = /( {2,}|\\)$/.test(line);
      line = line.replace(/( {2,}|\\)$/, '');
      out += inline(line);
      if (i < lines.length - 1) out += br ? '<br>\n' : ' ';
    }
    return out;
  }

  /* ---------------------------------------------------------------- blocks */

  function renderHeading(level, text) {
    var id = slugify(text);
    return '<h' + level + ' id="' + id + '">' + inline(text) +
      '<a class="heading-anchor" href="#' + id + '" aria-hidden="true" tabindex="-1">#</a>' +
      '</h' + level + '>';
  }

  function renderCode(code, info) {
    var lang = String(info || '').trim().replace(/^\{|\}$/g, '').split(/[\s,]+/)[0] || '';
    return '<div class="code-block"><pre><code' +
      (lang ? ' class="language-' + attr(escapeHtml(lang)) + '"' : '') +
      '>' + escapeHtml(code.replace(/\n+$/, '')) + '</code></pre></div>';
  }

  function fence(line) {
    var m = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
    return m ? { char: m[1][0], len: m[1].length, info: m[2] } : null;
  }

  function isHr(line) {
    return /^\s{0,3}([-*_])[ \t]*(?:\1[ \t]*){2,}$/.test(line);
  }

  function headingMatch(line) {
    return line.match(/^\s{0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/);
  }

  function isQuote(line) { return /^\s{0,3}>/.test(line); }

  function listMatch(line) {
    return line.match(/^([ \t]*)([-*+]|\d+[.)])[ \t]+(.*)$/);
  }

  function isSepRow(line) {
    return /^[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(\|[ \t]*:?-{2,}:?[ \t]*)*\|?[ \t]*$/.test(line);
  }

  function isTableStart(lines, i) {
    return i + 1 < lines.length &&
      lines[i].indexOf('|') !== -1 &&
      isSepRow(lines[i + 1]);
  }

  function startsBlock(lines, i) {
    var l = lines[i];
    if (fence(l)) return true;
    if (isHr(l)) return true;
    if (headingMatch(l)) return true;
    if (isQuote(l)) return true;
    if (listMatch(l)) return true;
    if (isTableStart(lines, i)) return true;
    return false;
  }

  function splitRow(row) {
    row = row.trim().replace(/^\|/, '').replace(/\|$/, '');
    var cells = [], cur = '', escape = false;
    for (var i = 0; i < row.length; i++) {
      var ch = row[i];
      if (escape) { cur += ch; escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '|') { cells.push(cur); cur = ''; continue; }
      cur += ch;
    }
    cells.push(cur);
    return cells.map(function (c) { return c.trim(); });
  }

  function renderTable(lines, i) {
    var head = splitRow(lines[i]);
    var aligns = splitRow(lines[i + 1]).map(function (c) {
      if (/^:.*:$/.test(c)) return 'center';
      if (/:$/.test(c)) return 'right';
      if (/^:/.test(c)) return 'left';
      return '';
    });
    i += 2;

    var rows = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && lines[i].indexOf('|') !== -1) {
      rows.push(splitRow(lines[i]));
      i++;
    }

    function cell(tag, content, k) {
      var style = aligns[k] ? ' style="text-align:' + aligns[k] + '"' : '';
      return '<' + tag + style + '>' + inline(content || '') + '</' + tag + '>';
    }

    var html = '<div class="table-wrap"><table><thead><tr>';
    head.forEach(function (c, k) { html += cell('th', c, k); });
    html += '</tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr>';
      for (var k = 0; k < head.length; k++) html += cell('td', r[k], k);
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    return { html: html, i: i };
  }

  function renderList(lines, start, indent) {
    var ordered = /^\s*\d+[.)][ \t]+/.test(lines[start]);
    var out = ordered ? '<ol>' : '<ul>';
    var i = start;

    while (i < lines.length) {
      // Skip blank lines that separate items of the same list (loose lists).
      if (/^\s*$/.test(lines[i])) {
        var j = i;
        while (j < lines.length && /^\s*$/.test(lines[j])) j++;
        var nextItem = j < lines.length && listMatch(lines[j]);
        if (nextItem && nextItem[1].replace(/\t/g, '    ').length >= indent) { i = j; continue; }
        break;
      }

      var m = listMatch(lines[i]);
      if (!m) break;
      var ind = m[1].replace(/\t/g, '    ').length;
      if (ind < indent) break;

      // Nested list: attach it to the <li> we just closed.
      if (ind > indent) {
        var nested = renderList(lines, i, ind);
        if (/<\/li>\s*$/.test(out)) out = out.replace(/<\/li>\s*$/, nested.html + '</li>');
        else out += nested.html;
        i = nested.i;
        continue;
      }

      var isOrdered = /^\d/.test(m[2]);
      if (isOrdered !== ordered) break;

      var content = m[3];
      i++;

      // Continuation lines (indented, non-list) belong to this item.
      var extra = [];
      while (i < lines.length && !/^\s*$/.test(lines[i])) {
        if (listMatch(lines[i])) break;
        var lead = lines[i].match(/^[ \t]*/)[0].replace(/\t/g, '    ').length;
        if (lead > indent) { extra.push(lines[i].trim()); i++; continue; }
        break;
      }

      var task = content.match(/^\[([ xX])\][ \t]+(.*)$/);
      if (task) {
        var checked = task[1].toLowerCase() === 'x';
        out += '<li class="task"><input type="checkbox" disabled' + (checked ? ' checked' : '') +
          ' aria-label="' + (checked ? 'done' : 'todo') + '"> <span>' +
          inlineLines([task[2]].concat(extra)) + '</span></li>';
      } else {
        out += '<li>' + inlineLines([content].concat(extra)) + '</li>';
      }
    }

    return { html: out + (ordered ? '</ol>' : '</ul>'), i: i };
  }

  function renderBlocks(lines) {
    var out = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (/^\s*$/.test(line)) { i++; continue; }

      // Fenced code block
      var f = fence(line);
      if (f) {
        var closing = new RegExp('^\\s{0,3}' + f.char + '{' + f.len + ',}\\s*$');
        i++;
        var buf = [];
        while (i < lines.length && !closing.test(lines[i])) { buf.push(lines[i]); i++; }
        if (i < lines.length) i++; // consume the closing fence
        out.push(renderCode(buf.join('\n'), f.info));
        continue;
      }

      // Horizontal rule
      if (isHr(line)) { out.push('<hr>'); i++; continue; }

      // ATX heading
      var h = headingMatch(line);
      if (h) { out.push(renderHeading(h[1].length, h[2])); i++; continue; }

      // Blockquote
      if (isQuote(line)) {
        var q = [];
        while (i < lines.length && isQuote(lines[i])) {
          q.push(lines[i].replace(/^\s{0,3}>[ \t]?/, ''));
          i++;
        }
        out.push('<blockquote>\n' + renderBlocks(q).join('\n') + '\n</blockquote>');
        continue;
      }

      // Table
      if (isTableStart(lines, i)) {
        var t = renderTable(lines, i);
        out.push(t.html);
        i = t.i;
        continue;
      }

      // List
      if (listMatch(line)) {
        var l = renderList(lines, i, 0);
        out.push(l.html);
        i = l.i;
        continue;
      }

      // Paragraph
      var para = [line];
      i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !startsBlock(lines, i)) {
        para.push(lines[i]);
        i++;
      }
      out.push('<p>' + inlineLines(para) + '</p>');
    }

    return out;
  }

  /* ----------------------------------------------------------- front matter */

  function cleanValue(s) {
    return String(s).replace(/^["']|["']$/g, '').trim();
  }

  function parseFrontMatter(text) {
    var meta = {};
    text.split('\n').forEach(function (line) {
      var m = line.match(/^([A-Za-z0-9_-]+)[ \t]*:[ \t]*(.*)$/);
      if (!m) return;
      var key = m[1].toLowerCase();
      var raw = m[2].trim();
      if (/^\[.*\]$/.test(raw)) {
        meta[key] = raw.slice(1, -1).split(',')
          .map(cleanValue)
          .filter(function (v) { return v.length; });
      } else {
        meta[key] = cleanValue(raw);
      }
    });
    return meta;
  }

  /* ----------------------------------------------------------------- public */

  function parse(md) {
    md = String(md == null ? '' : md)
      .replace(/^\uFEFF/, '')
      .replace(/\r\n?/g, '\n');

    var meta = {};
    var fm = md.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
    if (fm) {
      meta = parseFrontMatter(fm[1]);
      md = md.slice(fm[0].length);
    }

    return { html: renderBlocks(md.split('\n')).join('\n'), meta: meta };
  }

  // Extract a table of contents from headings.
  function toc(md) {
    var items = [];
    String(md == null ? '' : md).replace(
      /^\s{0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/gm,
      function (m, hashes, text) {
        items.push({
          level: hashes.length,
          text: text.replace(/[`*_~\[\]()]/g, ''),
          id: slugify(text)
        });
        return m;
      }
    );
    return items;
  }

  root.Markdown = {
    parse: function (md) { return parse(md).html; },
    parseWithMeta: parse,
    toc: toc,
    slugify: slugify,
    escapeHtml: escapeHtml
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
