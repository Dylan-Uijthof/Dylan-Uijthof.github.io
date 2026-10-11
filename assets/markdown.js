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

  /* ---------------------------------------------------- syntax highlighting */
  // A tiny, dependency-free highlighter — good enough for the snippets on a
  // portfolio, not a compiler. Unknown languages fall back to plain text.

  function words(str) {
    var out = {};
    String(str).split(/\s+/).forEach(function (w) { if (w) out[w] = true; });
    return out;
  }

  var LANGS = {};
  function defLang(names, cfg) {
    names.split(/\s+/).forEach(function (n) { LANGS[n] = cfg; });
  }

  var C_KEYWORDS = 'alignas alignof asm auto bool break case catch char class const constexpr const_cast continue decltype default delete do double dynamic_cast else enum explicit export extern false float for friend goto if inline int long mutable namespace new noexcept nullptr operator private protected public register reinterpret_cast return short signed sizeof static static_assert static_cast struct switch template this thread_local throw true try typedef typeid typename union unsigned using virtual void volatile wchar_t while';
  var C_TYPES = 'size_t ssize_t int8_t int16_t int32_t int64_t uint8_t uint16_t uint32_t uint64_t intptr_t uintptr_t FILE std string vector map set pair list deque array unique_ptr shared_ptr weak_ptr optional variant string_view';
  var RUST_KEYWORDS = 'as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self static struct super trait true type unsafe use where while';
  var RUST_TYPES = 'i8 i16 i32 i64 i128 isize u8 u16 u32 u64 u128 usize f32 f64 bool char str String Vec Option Result Box Rc Arc RefCell Cell HashMap HashSet BTreeMap BTreeSet Path PathBuf OsStr OsString CString Cow Some None Ok Err Ordering Duration Instant';
  var JS_KEYWORDS = 'var let const function return if else for while do switch case break continue new delete typeof instanceof in of class extends super this try catch finally throw async await yield import export from default as static get set void with debugger';
  var JS_TYPES = 'string number boolean any void never unknown object symbol bigint interface type enum namespace declare implements readonly public private protected abstract keyof infer satisfies override';
  var JS_BUILTINS = 'console window document globalThis Math JSON Object Array String Number Boolean Promise Map Set WeakMap WeakSet Date RegExp Error Symbol BigInt Infinity NaN undefined null true false this';
  var SH_KEYWORDS = 'if then else elif fi for while until do done case esac function in select return break continue local export readonly declare';
  var SH_BUILTINS = 'echo cd ls pwd cat mkdir rm cp mv touch grep sed awk printf read source alias unset exit set test';
  var SQL_KEYWORDS = 'select from where insert into values update delete set join left right inner outer full on group by order limit offset as and or not null is in like between distinct having union all create table primary key foreign references index unique drop alter add column default returning with asc desc case when then else end count sum avg min max cast coalesce';
  var PY_KEYWORDS = 'def class return if elif else for while break continue pass import from as try except finally raise with yield lambda global nonlocal assert del in is not and or None True False async await';
  var PY_BUILTINS = 'print len range str int float list dict set tuple bool open enumerate zip map filter sum min max sorted type isinstance super self';
  var JAVA_KEYWORDS = 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public record return sealed short static strictfp super switch synchronized this throw throws transient try var void volatile while permits yield true false null';
  var JAVA_TYPES = 'String Integer Long Double Float Boolean Character Byte Short Object Number List Map Set Collection ArrayList LinkedList HashMap TreeMap LinkedHashMap HashSet TreeSet Optional Stream Iterable Iterator Comparable Comparator Exception RuntimeException IllegalArgumentException IllegalStateException StringBuilder InputStream OutputStream File Files Path Paths Arrays Collections LocalDate LocalDateTime Instant Duration BigDecimal BigInteger HttpStatus ResponseEntity MultipartFile JsonNode ObjectMapper';
  var CS_KEYWORDS = 'abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach get goto if implicit in init int interface internal is lock long namespace new null object operator out override params private protected public readonly record ref return sbyte sealed set short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using var virtual void volatile when where while yield async await dynamic nameof global';
  var CS_TYPES = 'String Int32 Int64 Double Single Boolean Char Byte Decimal Object Array List Dictionary HashSet IEnumerable IEnumerator ICollection IList IDictionary Task ValueTask Exception ArgumentException InvalidOperationException NullReferenceException Console Math DateTime TimeSpan Guid StringBuilder StringReader TextWriter Stream MemoryStream FileStream File Path Linq Enumerable Queryable HttpClient JsonSerializer JsonDocument JsonElement JsonNode ObservableCollection KeyValuePair Nullable Tuple';

  defLang('c h', {
    line: ['//'], block: ['/*', '*/'], strings: ['"', "'"],
    keywords: words(C_KEYWORDS), types: words(C_TYPES), preproc: '#', classes: true
  });
  defLang('cpp cc cxx c++ hpp hxx', {
    line: ['//'], block: ['/*', '*/'], strings: ['"', "'"],
    keywords: words(C_KEYWORDS), types: words(C_TYPES), preproc: '#', classes: true
  });
  defLang('rust rs', {
    line: ['//'], block: ['/*', '*/'], strings: ['"'],
    keywords: words(RUST_KEYWORDS), types: words(RUST_TYPES), classes: true, macro: true
  });
  defLang('js javascript jsx mjs cjs ts typescript tsx', {
    line: ['//'], block: ['/*', '*/'], strings: ['"', "'", '`'],
    keywords: words(JS_KEYWORDS), types: words(JS_TYPES), builtins: words(JS_BUILTINS), classes: true
  });
  defLang('json', {
    line: [], block: null, strings: ['"'], keywords: words('true false null')
  });
  defLang('sh bash zsh shell', {
    line: ['#'], block: null, strings: ['"', "'"],
    keywords: words(SH_KEYWORDS), builtins: words(SH_BUILTINS)
  });
  defLang('sql', {
    line: ['--'], block: ['/*', '*/'], strings: ["'", '"'],
    keywords: words(SQL_KEYWORDS.toUpperCase()), ci: true
  });
  defLang('yaml yml', {
    line: ['#'], block: null, strings: ['"', "'"]
  });
  defLang('css scss less', {
    line: [], block: ['/*', '*/'], strings: ['"', "'"]
  });
  defLang('py python', {
    line: ['#'], block: null, strings: ['"', "'"],
    keywords: words(PY_KEYWORDS), builtins: words(PY_BUILTINS)
  });
  defLang('java', {
    line: ['//'], block: ['/*', '*/'], strings: ['"', "'"],
    keywords: words(JAVA_KEYWORDS), types: words(JAVA_TYPES), classes: true, annotations: true
  });
  defLang('cs csharp c#', {
    line: ['//'], block: ['/*', '*/'], strings: ['"', "'"],
    keywords: words(CS_KEYWORDS), types: words(CS_TYPES), preproc: '#', classes: true
  });

  function resolveLang(lang) {
    var key = String(lang || '').toLowerCase()
      .replace(/^language-/, '')
      .replace(/[^a-z+#]/g, '');
    return LANGS[key] || null;
  }

  function highlight(code, lang) {
    var cfg = typeof lang === 'object' && lang ? lang : resolveLang(lang);
    if (!cfg) return escapeHtml(code);

    var out = '';
    var i = 0;
    var n = code.length;
    var lineStart = true;

    function isDigit(ch) { return ch >= '0' && ch <= '9'; }
    function isIdentStart(ch) { return /[A-Za-z_$]/.test(ch); }
    function isIdent(ch) { return /[A-Za-z0-9_$]/.test(ch); }
    function span(cls, text) { out += '<span class="' + cls + '">' + escapeHtml(text) + '</span>'; }

    while (i < n) {
      var c = code[i];

      // Preprocessor directive (C/C++): "#include ..." up to the end of the line.
      if (cfg.preproc && c === cfg.preproc && lineStart) {
        var eol = code.indexOf('\n', i);
        var pstop = eol === -1 ? n : eol;
        span('tok-meta', code.slice(i, pstop));
        i = pstop;
        continue;
      }

      // Block comment.
      if (cfg.block && code.substr(i, cfg.block[0].length) === cfg.block[0]) {
        var bend = code.indexOf(cfg.block[1], i + cfg.block[0].length);
        var bstop = bend === -1 ? n : bend + cfg.block[1].length;
        span('tok-com', code.slice(i, bstop));
        i = bstop;
        lineStart = false;
        continue;
      }

      // Line comment.
      if (cfg.line && cfg.line.length) {
        var hit = false;
        for (var li = 0; li < cfg.line.length; li++) {
          if (code.substr(i, cfg.line[li].length) === cfg.line[li]) {
            var lend = code.indexOf('\n', i);
            var lstop = lend === -1 ? n : lend;
            span('tok-com', code.slice(i, lstop));
            i = lstop;
            hit = true;
            break;
          }
        }
        if (hit) continue;
      }

      // Strings.
      if (cfg.strings && cfg.strings.indexOf(c) !== -1) {
        var q = c, j = i + 1, s = c;
        while (j < n) {
          if (code[j] === '\\') { s += code.substr(j, 2); j += 2; continue; }
          if (code[j] === q) { s += q; j++; break; }
          if (q !== '`' && code[j] === '\n') break;
          s += code[j];
          j++;
        }
        span('tok-str', s);
        i = j;
        lineStart = false;
        continue;
      }

      // Numbers.
      if (isDigit(c) || (c === '.' && isDigit(code[i + 1]))) {
        var m = code.slice(i).match(/^(0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)/);
        var num = m ? m[0] : c;
        span('tok-num', num);
        i += num.length;
        lineStart = false;
        continue;
      }

      // Identifiers, keywords, types and calls.
      if (isIdentStart(c)) {
        var k = i;
        while (k < n && isIdent(code[k])) k++;
        var word = code.slice(i, k);
        var kw = cfg.keywords && cfg.keywords[cfg.ci ? word.toUpperCase() : word];
        var ty = cfg.types && cfg.types[word];
        var bi = cfg.builtins && cfg.builtins[word];
        var after = k;
        while (after < n && (code[after] === ' ' || code[after] === '\t')) after++;
        var isCall = code[after] === '(' || (cfg.macro && code[after] === '!');
        if (kw) span('tok-kw', word);
        else if (ty) span('tok-typ', word);
        else if (bi) span('tok-bi', word);
        else if (isCall) span('tok-fn', word);
        else if (cfg.classes && /^[A-Z][A-Za-z0-9_]*$/.test(word)) span('tok-typ', word);
        else out += escapeHtml(word);
        i = k;
        lineStart = false;
        continue;
      }

      // Annotations (@Override, @PostMapping, ...).
      if (cfg.annotations && c === '@' && isIdentStart(code[i + 1] || '')) {
        var ak = i + 1;
        while (ak < n && isIdent(code[ak])) ak++;
        span('tok-anno', code.slice(i, ak));
        i = ak;
        lineStart = false;
        continue;
      }

      // Operators and punctuation.
      if ('{}()[];,.:?!+-*/%=<>&|^~@'.indexOf(c) !== -1) {
        var op = i;
        while (op < n && '{}()[];,.:?!+-*/%=<>&|^~@'.indexOf(code[op]) !== -1) op++;
        span('tok-op', code.slice(i, op));
        i = op;
        lineStart = false;
        continue;
      }

      // Whitespace and anything else.
      out += escapeHtml(c);
      if (c === '\n') lineStart = true;
      else if (c !== ' ' && c !== '\t' && c !== '\r') lineStart = false;
      i++;
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
    lang = lang.replace(/^language-/, '');
    var body = highlight(code.replace(/\n+$/, ''), lang);
    return '<div class="code-block"><pre><code' +
      (lang ? ' class="language-' + attr(escapeHtml(lang)) + '"' : '') +
      '>' + body + '</code></pre></div>';
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
          ' aria-label="' + (checked ? 'gedaan' : 'te doen') + '"> <span>' +
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

    // A leading level-1/2 heading is the page title, not a section. Pull it out
    // so the page can render it once, above the body (no duplicate title).
    var lead = md.match(/^[ \t]*(#{1,2})[ \t]+(.+?)[ \t]*#*[ \t]*(?:\n|$)/);
    if (lead) {
      var leadTitle = lead[2].replace(/[`*_~\[\]]/g, '').trim();
      if (leadTitle && !meta.title) meta.title = leadTitle;
      md = md.slice(lead[0].length);
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
    highlight: highlight,
    languages: LANGS,
    slugify: slugify,
    escapeHtml: escapeHtml
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
