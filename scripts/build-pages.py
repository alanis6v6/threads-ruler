#!/usr/bin/env python3
# 從 index.html 產生單一功能頁（例如 fonts/index.html）。
# 每一頁都是完整的翠排版尺，只換標題、搜尋說明、頁首文字、常見問題，並多一個該功能的區塊。
# 改了 index.html 之後重跑：python3 scripts/build-pages.py
import json, os, re, subprocess

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SITE = "https://alanis6v6.github.io/threads-ruler/"

PAGES = {
  "fonts": {
    "title": "Threads 英文特殊字體轉換｜粗體、草寫、哥德、空心字｜翠排版尺",
    "description": "輸入英文，一次列出粗體、斜體、草寫、哥德、空心、打字機、圓圈等 14 種特殊字體，點一下複製貼到翠（Threads）。也能直接在翠排版尺裡邊排版邊換字體。免費、免登入。",
    "og_title": "Threads 英文特殊字體轉換｜翠排版尺",
    "og_description": "輸入英文，一次列出 14 種特殊字體，點一下複製貼到翠。免費、免登入。",
    "app_name": "翠排版尺：Threads 英文特殊字體轉換",
    "tagline": '照翠實際的寬度排版，也能<a class="jump" href="#fontGen">直接轉換英文特殊字體</a>。',
    "section": '''  <section class="gen web-only" id="fontGen" aria-labelledby="fontGenTitle">
    <h2 id="fontGenTitle">英文特殊字體轉換</h2>
    <p class="gen-note">輸入英文或數字，下面同時列出 14 種字體，點「複製」就能貼到翠。想跟排版一起做，在上面的預覽裡選取英文，也會跳出同一組字體。</p>
    <input class="gen-input" id="fontGenInput" type="text" placeholder="Threads Ruler 2026" aria-label="要轉換的英文" autocomplete="off" spellcheck="false">
    <ul class="gen-list" id="fontGenList"></ul>
  </section>
''',
    "guide_title": "翠（Threads）英文特殊字體",
    "guide_lead": "翠的貼文沒有字體選單，大家看到的粗體、草寫、花體英文，其實是長得像字母的 Unicode 符號。這一頁把常用的 14 種一次列出來，輸入英文就能挑喜歡的複製；要連同換行、空白、置中一起排，就用上面的翠排版尺，選取英文換字體，排好一次複製整篇。",
    "faq": [
      ("翠（Threads）可以用粗體或花體字嗎？",
       "翠沒有內建字體設定，但可以貼上長得像粗體、斜體、草寫、哥德體的 Unicode 符號。這些符號在電腦和手機的翠都看得到，排出來就像換了字體。"),
      ("有哪些字體可以選？",
       "粗體、黑體、斜體、粗斜體、草寫、細草寫、哥德、粗哥德、空心、打字機、全形、小型大寫、圓圈、方塊，共 14 種。粗體、黑體、空心、打字機、全形、圓圈連數字也會換。"),
      ("中文也能換字體嗎？",
       "不行。這些特殊字體只有英文字母和部分數字的版本，中文和標點會保持原樣，所以中英混打也不會壞掉。"),
      ("換了字體之後，搜尋還找得到嗎？",
       "找不到。特殊字體在系統眼裡是符號，不是字母，搜尋和 hashtag 都比對不到，螢幕報讀器也唸不出來。關鍵字和 hashtag 建議保持一般字，只把標題或想強調的詞換成特殊字體。"),
      ("排好的字體可以再換回一般字嗎？",
       "可以。在翠排版尺的預覽裡選取已經換過字體的英文，選「一般」就會換回來，也可以直接換成另一種字體，不用重打。"),
    ],
    "tool_links": '<p class="tool-links">更多工具：<a href="../">翠排版尺（換行、空白行、置中）</a>・<a href="../kaomoji/">顏文字大全</a></p>',
  },
  "kaomoji": {
    "title": "顏文字大全｜可愛顏文字、大型顏文字一鍵複製｜Threads 排版｜翠排版尺",
    "description": "分類好的可愛顏文字：開心、害羞、哭哭、生氣、無言、驚訝、貓貓狗狗熊熊兔兔，點一下就複製。還有舉牌、飛踢、小魔法等大型顏文字，牌子上的字可以自己改，放進翠排版尺預覽確認貼到翠（Threads）不會歪。免費、免登入。",
    "og_title": "顏文字大全｜翠排版尺",
    "og_description": "分類好的可愛顏文字與大型顏文字，點一下複製；大型顏文字可以先預覽貼到翠會不會歪。",
    "app_name": "翠排版尺：顏文字大全",
    "tagline": '照翠實際的寬度排版，也能<a class="jump" href="#kaoGen">挑顏文字</a>、<a class="jump" href="#bigGen">大型顏文字</a>。',
    "section": "KAOMOJI_SECTION",
    "scripts": ["kaomoji.js"],
    "guide_title": "翠（Threads）顏文字大全",
    "guide_lead": "顏文字依心情和動物分好類，點一下就複製，貼到翠、IG、LINE 都能用。大型顏文字是好幾行拼成的圖，翠用的不是等寬字型，照抄常常會歪；這裡每一個都可以按「放進排版」，在上面的翠排版尺用翠實際的寬度預覽，確認電腦和手機都排得好再複製。",
    "faq": [
      ("顏文字要怎麼複製？",
       "點一下顏文字就會複製到剪貼簿，回翠或其他 App 貼上就好。大型顏文字按卡片上的「複製」，會一併把空白整理成翠不會吃掉的樣子。"),
      ("大型顏文字貼到翠為什麼會歪？",
       "翠的字型不是等寬的，英文、符號和中文寬度不一樣，行首的半形空白也會被吃掉。這裡的大型顏文字都用全形空白對齊，複製時會把會被吃掉的空白轉成全形；按「放進排版」可以先在預覽裡看電腦和手機的樣子。"),
      ("舉牌顏文字的字可以改嗎？",
       "可以。在卡片的輸入框打字，牌子會跟著變；字比較多時邊框會自動加長，字比較少會用全形空白補齊置中。"),
      ("手機上大型顏文字會不會換行？",
       "翠 App 的串文一行大約 21 個中文字寬，太寬的圖在手機上會自動換行。放進排版後切到「手機」預覽就看得到，太寬的話可以刪掉左邊多餘的空白。"),
      ("排版時怎麼換顏文字的表情？",
       "在翠排版尺的預覽裡點有粉紅虛線的顏文字，就能單獨換臉或換手勢，懶得挑就按骰子隨機。"),
    ],
    "tool_links": '<p class="tool-links">更多工具：<a href="../">翠排版尺（換行、空白行、置中）</a>・<a href="../fonts/">英文特殊字體轉換</a></p>',
  },
}


def load_kaomoji():
  js = ("const w={};new Function('window',require('fs').readFileSync(process.argv[1],'utf8'))(w);"
        "const K=w.TRKaomoji;process.stdout.write(JSON.stringify({faces:K.faces,"
        "big:K.big.map(b=>({name:b.name,text:b.text==null?null:b.text,art:K.fill(b)}))}))")
  out = subprocess.run(["node", "-e", js, os.path.join(ROOT, "kaomoji.js")], check=True, capture_output=True, text=True).stdout
  return json.loads(out)


def kaomoji_section():
  k = load_kaomoji()
  h = ['  <section class="gen web-only" id="kaoGen" aria-labelledby="kaoGenTitle">',
       '    <h2 id="kaoGenTitle">顏文字大全</h2>',
       '    <p class="gen-note">點一下就複製，回翠貼上。想邊排版邊換表情，在上面的預覽裡點顏文字就能換臉、換手勢。</p>',
       '    <nav class="kao-jump" aria-label="顏文字分類">']
  h += ['      <a href="#kao-%d">%s</a>' % (i, esc(c)) for i, (c, _) in enumerate(k["faces"])]
  h += ['    </nav>']
  for i, (c, items) in enumerate(k["faces"]):
    h += ['    <div class="kao-group" id="kao-%d">' % i, '      <h3>%s</h3>' % esc(c),
          '      <div class="kao-grid">' + "".join('<button class="kao-btn" type="button">%s</button>' % esc(f) for f in items) + '</div>',
          '    </div>']
  h += ['  </section>', '',
        '  <section class="gen web-only" id="bigGen" aria-labelledby="bigGenTitle">',
        '    <h2 id="bigGenTitle">大型顏文字</h2>',
        '    <p class="gen-note">翠不是等寬字型，大型顏文字照抄常常會歪。按「放進排版」會變成上面的一則串文，用翠實際的寬度預覽，切到「手機」看會不會換行；確認好再複製。</p>',
        '    <div class="big-list">']
  for i, b in enumerate(k["big"]):
    h.append('      <article class="big-card" data-i="%d">' % i)
    h.append('        <h3>%s</h3>' % esc(b["name"]))
    if b["text"] is not None:
      h.append('        <input class="gen-input big-input" type="text" value="%s" aria-label="%s的字" autocomplete="off">' % (esc(b["text"]), esc(b["name"])))
    h.append('        <pre class="big-art">%s</pre>' % esc(b["art"]))
    h.append('        <div class="big-actions"><button class="gen-copy big-copy" type="button">複製</button><button class="gen-copy big-use" type="button">放進排版</button></div>')
    h.append('      </article>')
  h += ['    </div>', '  </section>', '']
  return "\n".join(h)


def esc(t):
  return t.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")


def swap(s, pattern, repl, flags=0):
  out, n = re.subn(pattern, repl, s, count=1, flags=flags)
  assert n == 1, "index.html 裡找不到：" + pattern
  return out


def build(slug, p, src):
  url = SITE + slug + "/"
  s = src
  s = swap(s, r'<html lang="zh-Hant">', '<html lang="zh-Hant" data-base="../" data-page="%s">' % slug)
  s = swap(s, r"<title>.*?</title>", lambda m: "<title>%s</title>" % esc(p["title"]))
  s = swap(s, r'<meta name="description" content="[^"]*">', lambda m: '<meta name="description" content="%s">' % esc(p["description"]))
  s = swap(s, r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="%s">' % url)
  s = swap(s, r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="%s">' % url)
  s = swap(s, r'<meta property="og:title" content="[^"]*">', lambda m: '<meta property="og:title" content="%s">' % esc(p["og_title"]))
  s = swap(s, r'<meta property="og:description" content="[^"]*">', lambda m: '<meta property="og:description" content="%s">' % esc(p["og_description"]))
  s = swap(s, r'<meta name="twitter:title" content="[^"]*">', lambda m: '<meta name="twitter:title" content="%s">' % esc(p["og_title"]))
  s = swap(s, r'<meta name="twitter:description" content="[^"]*">', lambda m: '<meta name="twitter:description" content="%s">' % esc(p["og_description"]))

  # 結構化資料：應用程式名稱／網址／說明，常見問題換成這一頁看得到的內容
  s = swap(s, r'"name": "翠排版尺",\n  "alternateName"', lambda m: '"name": %s,\n  "alternateName"' % json.dumps(p["app_name"], ensure_ascii=False))
  s = swap(s, r'"url": "%s",\n  "description": "[^"]*"' % re.escape(SITE),
           lambda m: '"url": "%s",\n  "description": %s' % (url, json.dumps(p["description"], ensure_ascii=False)))
  faq = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
    {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in p["faq"]]}
  s = swap(s, r'<script type="application/ld\+json">\n\{\n  "@context": "https://schema.org",\n  "@type": "FAQPage".*?</script>',
           lambda m: '<script type="application/ld+json">\n' + json.dumps(faq, ensure_ascii=False, indent=2) + "\n</script>", re.S)

  # 相對路徑往上一層（共用 index.html 的 css／js／圖示）
  s = re.sub(r'(href|src)="(?!https?:|#|mailto:|/|data:|\.\./)([^"]+)"', r'\1="../\2"', s)

  s = swap(s, r'(<header class="top">.*?)<p>.*?</p>', lambda m: m.group(1) + "<p>" + p["tagline"] + "</p>", re.S)
  section = kaomoji_section() if p["section"] == "KAOMOJI_SECTION" else p["section"]
  s = swap(s, r'(\n  </div>\n\n)(  <details class="about">)', lambda m: m.group(1) + section + "\n" + m.group(2))
  for js in p.get("scripts", []):
    s = swap(s, r'<script src="\.\./app\.js"></script>', lambda m: '<script src="../%s"></script>\n' % js + m.group(0))

  qas = "".join('      <div class="qa">\n        <h3>%s</h3>\n        <p>%s</p>\n      </div>\n' % (q, a) for q, a in p["faq"])
  guide = ('  <section class="guide web-only" aria-labelledby="guideTitle">\n'
           '    <h2 id="guideTitle">%s</h2>\n    <p class="lead">%s</p>\n    <div class="qas">\n%s    </div>\n    %s\n  </section>'
           % (p["guide_title"], p["guide_lead"], qas, p["tool_links"]))
  s = swap(s, r'  <section class="guide web-only".*?</section>', lambda m: guide, re.S)

  os.makedirs(os.path.join(ROOT, slug), exist_ok=True)
  with open(os.path.join(ROOT, slug, "index.html"), "w") as f:
    note = "<!-- 這個檔案由 scripts/build-pages.py 從 index.html 產生，請改 index.html 或腳本後重跑 -->\n"
    f.write(s.replace("\n", "\n" + note, 1))  # 註解放在 doctype 後面，doctype 要在第一行
  print(slug + "/index.html")


if __name__ == "__main__":
  with open(os.path.join(ROOT, "index.html")) as f:
    src = f.read()
  for slug, p in PAGES.items():
    build(slug, p, src)
