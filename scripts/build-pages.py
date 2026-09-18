#!/usr/bin/env python3
# 從 index.html 產生單一功能頁（例如 fonts/index.html）。
# 每一頁都是完整的翠排版尺，只換標題、搜尋說明、頁首文字、常見問題，並多一個該功能的區塊。
# 改了 index.html 之後重跑：python3 scripts/build-pages.py
import json, os, re

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
    "tool_links": '<p class="tool-links">完整排版工具：<a href="../">翠排版尺（換行、空白行、置中、顏文字）</a></p>',
  },
}


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
  s = swap(s, r'(\n  </div>\n\n)(  <details class="about">)', lambda m: m.group(1) + p["section"] + "\n" + m.group(2))

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
