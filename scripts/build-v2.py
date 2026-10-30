#!/usr/bin/env python3
# 翠排版尺 v2（手機版改版，redesign-2026 分支）：產生 v2/ 底下的工具頁。
# 顏文字直接寫進 HTML（不是等 JS 畫出來），搜尋跟 AI 摘要讀得到每一個；說明跟常見問題沿用 build-pages.py 的文字。
# 改了資料或這支腳本之後重跑：python3 scripts/build-v2.py
import html, json, os, re, subprocess, urllib.parse

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SITE = "https://spacegrapefruit.com/threads-ruler/"


def load_pages():
    src = open(os.path.join(ROOT, "scripts", "build-pages.py"), encoding="utf-8").read()
    ns = {"__file__": os.path.join(ROOT, "scripts", "build-pages.py")}
    exec(src.split("\ndef ")[0], ns)
    return ns["PAGES"]


def kaomoji_data():
    js = "global.window={};require('./core.js');require('./kaomoji.js');process.stdout.write(JSON.stringify(window.TRKaomoji.faces))"
    return json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT))


# 分頁列：路徑都從 /threads-ruler/ 算起；None 表示還沒做好
TABS = [
    ("edit", "排版", "", '<path d="M4 6h16M4 12h10M4 18h13"/>'),
    ("kaomoji", "顏文字", "kaomoji/", '<circle cx="12" cy="12" r="8.5"/><path d="M8.6 10.2h.01M15.4 10.2h.01M9 14.2c1.6 1.4 4.4 1.4 6 0"/>'),
    ("emoji", "emoji", "emoji/", '<path d="M12 20.5c-4.8-3.2-8.5-6.4-8.5-10.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 8.5 2.3c0 3.8-3.7 7-8.5 10.2z"/>'),
    ("symbols", "符號", "symbols/", '<path d="M12 3.5l2.4 5.6 6 .5-4.6 4 1.4 5.9L12 16.4 6.8 19.5l1.4-5.9-4.6-4 6-.5z"/>'),
    ("fonts", "字體", "fonts/", '<path d="M5 19 10.5 5h1L17 19M7.4 13.5h7.2"/>'),
    ("dividers", "分隔線", "dividers/", '<path d="M3 12h4M10 12h4M17 12h4M12 7v.01M12 17v.01"/>'),
]


def _i18n_table():
    """i18n.js 的 T 表：{原文: [英, 日, 韓]}。"""
    src = open(os.path.join(ROOT, "i18n.js"), encoding="utf-8").read()
    out = {}
    for m in re.finditer(r'^\s*("(?:[^"\\]|\\.)*"):\s*(\[.*\]),?\s*$', src, re.M):
        try: out[json.loads(m.group(1))] = json.loads(m.group(2))
        except ValueError: pass
    return out

def _dynamic_serif():
    """會在宋體位置換上去的字：設定句裡的選項、導覽標題。"""
    sh = open(os.path.join(ROOT, "v2", "shell.js"), encoding="utf-8").read()
    ed = open(os.path.join(ROOT, "v2", "edit.js"), encoding="utf-8").read()
    slots = sh[sh.index("var SLOTS"):sh.index("function label")]
    words = re.findall(r'"([^"]+)"', slots) + ["0123456789"]
    steps = ed[ed.index("var STEPS"):ed.index("];", ed.index("var STEPS"))]
    words += [json.loads(x) for x in re.findall(r'"(?:[^"\\]|\\.)*"', steps)]   # 導覽：標題跟內文整段收（選擇器裡有跳脫引號，不好只挑標題）
    return words

def serif_font_url(body):
    """宋體只跟 Google 要這頁會用到的字（text=），一個檔一次到齊。日文介面的「顔」「絵」「区」思源宋體繁中版沒有，補日文版。
    整套切片檔是一個字一包、到的時間不一樣，標題會一字粗一字細（「顏文字」的顏比較細就是這樣）。"""
    pieces = ["翠排版尺"] + _dynamic_serif()
    for tag in re.findall(r'<h1>.*?</h1>|<p class="sent">.*?</p>|<div class="gtitle"><h2>.*?</h2>|<h3>.*?</h3>', body, re.S):
        pieces += [html.unescape(x).strip() for x in re.split(r"<[^>]+>", tag) if x.strip()]
    T = _i18n_table()
    text = "".join(pieces)
    for x in pieces:
        for tr in T.get(x) or []:
            if tr: text += re.sub(r"\{\w+\}", "", tr)
    chars = " " + "".join(sorted(set(c for c in text if not c.isspace())))
    return ("https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;600;900&family=Noto+Serif+JP:wght@500;600;900&display=swap&text="
            + urllib.parse.quote(chars, safe=""))


def shell(page, path, title, desc, body, css, js, index=True, tab_over=None, extra_head="", canonical=None, body_class="", pre_js=(), strip=True):
    """path：這頁從 /threads-ruler/ 算起的位置（例如 "emoji/"）。index=False 是還在試用、不給搜尋收錄的頁。
    tab_over：{分頁 key: 路徑}，試用頁可以把某個分頁指到試用版。"""
    R = "../" * path.count("/")
    hrefs = dict((k, h) for k, _, h, _ in TABS)
    hrefs.update(tab_over or {})
    tabs = "".join(
        ('<a href="%s"%s><svg viewBox="0 0 24 24" aria-hidden="true">%s</svg>%s</a>'
         % (R + hrefs[key] if hrefs[key] else R, ' aria-current="page"' if key == page else "", icon, name))
        for key, name, _, icon in TABS
    )
    strip_html = f'<div class="strip"><span class="t" id="stripText"></span><span class="n" id="stripCount">草稿</span><a class="o" href="{R + (hrefs["edit"] or "")}">去排版</a></div>' if strip else ""
    pre = "".join(f'<script src="{R}{j}.js"></script>\n' for j in pre_js)
    robots = "" if index else '<!-- 改版試用中：先不給搜尋收錄，正式上線時換掉舊頁再拿掉這行 -->\n<meta name="robots" content="noindex">\n'
    canonical = canonical or SITE + path
    links = "".join(f'<link rel="stylesheet" href="{R}v2/{c}.css">\n' for c in css)
    scripts = "".join(f'<script src="{R}v2/{j}.js"></script>\n' for j in js)
    return f'''<!doctype html>
<!-- 這個檔案由 scripts/build-v2.py 產生，請改腳本或資料後重跑 -->
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<script>if(location.hostname==="alanis6v6.github.io")location.replace("https://spacegrapefruit.com"+location.pathname+location.search+(location.search?"&":"?")+"from=gh"+location.hash);else if(/[?&]from=gh(&|$)/.test(location.search))document.write('<script src="{R}intro.js"><\\/script>');</script>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
{robots}<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="翠排版尺">
<meta property="og:locale" content="zh_TW">
<meta property="og:url" content="{canonical}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:image" content="{SITE}pwa/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="翠排版尺：照脆實際的寬度，排好再貼上">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{html.escape(title)}">
<meta name="twitter:description" content="{html.escape(desc)}">
<meta name="twitter:image" content="{SITE}pwa/og.png">
<meta name="google-site-verification" content="ghoEwvY5nRQOTAAiX5Edc9oke00j4FwY9tMJfZ7Bkaw">
<link rel="icon" type="image/png" sizes="48x48" href="{R}extension/icons/icon48.png">
<link rel="manifest" href="{R}site.webmanifest">
<link rel="apple-touch-icon" href="{R}pwa/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="翠排版尺">
<meta name="theme-color" content="#fbf3ee">
{extra_head}<script>document.documentElement.className += " js";
// 宋體是 Google Fonts 的切片檔，一個字一包、到的時間不一樣，先到的粗、還沒到的先用系統細宋體，標題會一字粗一字細。
// 這頁用到的宋體字全部到了才一起露出來；最多等 2.5 秒，網路太慢就先照原樣顯示。
(function(d){{
  var h = d.documentElement;
  try{{ if(localStorage.getItem("threads-ruler-set-open") === "0") h.className += " set-shut"; }}catch(e){{}}   // 排版設定上次收起來：先收好再畫
  if(!d.fonts || !d.fonts.load) return;
  h.className += " fw";
  var show = function(){{ h.classList.remove("fw"); }}, fam = '"Noto Serif TC"';
  try{{ if(localStorage.getItem("threads-ruler-lang") === "ja") fam += ', "Noto Serif JP"'; }}catch(e){{}}   // 日文才要等日文版（顔、絵、区），中文頁不多抓一個檔
  setTimeout(show, 2500);
  d.addEventListener("DOMContentLoaded", function(){{
    var t = "";
    d.querySelectorAll(".head h1, .sent, .gtitle h2, .guide h3, .tour b").forEach(function(e){{ t += e.textContent; }});
    Promise.all(["500", "600", "900"].map(function(w){{ return d.fonts.load(w + " 1em " + fam, t); }})).then(show, show);
  }});
}})(document);</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,600&display=swap">
<link rel="stylesheet" href="{html.escape(serif_font_url(body))}">
<link rel="stylesheet" href="{R}v2/shell.css">
{links}</head>
<body{f' class="{body_class}"' if body_class else ""}>
<header class="top">
  <div class="brand"><a class="b-tool" href="{R or './'}"><img src="{R}pwa/icon-192.png" width="22" height="22" alt="">翠排版尺</a><a class="b-by" href="https://spacegrapefruit.com/">by space.grapefruit</a></div>
  <nav class="top-acts"><a href="#guide">說明</a><button type="button" id="tourBtn">導覽</button></nav>
</header>
{body}
<p class="toast" id="toast" role="status" aria-live="polite"></p>
{strip_html}
<nav class="tabbar" aria-label="工具">{tabs}</nav>
<script src="{R}core.js"></script>
<script src="{R}i18n.js"></script>
{pre}
<script src="{R}v2/shell.js"></script>
{scripts}<script>if(location.protocol === "https:"){{ var ga = document.createElement("script"); ga.src = "{R}analytics.js"; document.head.appendChild(ga); if("serviceWorker" in navigator) navigator.serviceWorker.register("{R}sw.js").catch(function(){{}}); }}</script>
</body>
</html>
'''


def settings_block(R):
    w = lambda key: f'<button type="button" class="w" data-set="{key}"></button>'
    return f'''<section class="settings" id="settings" aria-label="排版設定">
  <button type="button" class="lab" id="setToggle" aria-expanded="true" aria-controls="setBody"><span>layout settings</span><i class="tri" aria-hidden="true"></i></button>
  <div class="set-body" id="setBody">
  <p class="sent">預覽寬度是{w("width")}，顯示{w("view")}。<br>空白行{w("blank")}；<br>半形空白轉全形{w("spaces")}。<br>置中依照{w("center")}，複製後{w("open")}。<br>介面語言{w("lang")}。</p>
  <div class="sent-tail"><button type="button" class="chip" id="tidyClip">整理剪貼簿</button><button type="button" class="chip go" id="clearDraft">清空草稿</button></div>
  </div>
</section>'''


def guide(p, R):
    # 收在 <details> 裡：畫面上先摺起來，字還是在 HTML 裡，搜尋跟 AI 摘要讀得到
    faq = "".join(f"<h3>{html.escape(q)}</h3><p>{html.escape(a)}</p>" for q, a in p["faq"])
    return f'''<div class="gtitle"><h2>{html.escape(p["guide_title"])}</h2>
  <button type="button" class="chip" id="homeBtn" aria-expanded="false" aria-controls="homeHow" hidden>加到主畫面</button>
  <p class="home-how" id="homeHow" hidden></p>
</div>
<details class="guide" id="guide">
  <summary><span>說明與常見問題</span></summary>
  <p class="lead">{html.escape(p["guide_lead"])}</p>
  <div class="qas">{faq}</div>
</details>
<p class="foot">原作者：<a href="https://www.threads.com/@space.grapefruit_" rel="noopener">space.grapefruit_</a>（<a href="https://github.com/alanis6v6/threads-ruler/blob/main/LICENSE" rel="noopener">授權條款</a>）<br><a href="{R}feedback/">回報問題或許願</a>・<a href="https://alanis6v6.github.io/#katsuji">iOS App 即將上架</a>・<a href="https://buymeacoffee.com/space.grapefruit_" rel="noopener">請 Lia 喝一杯咖啡</a>・<a href="{R}privacy.html">隱私權</a></p>'''


def build_kaomoji(pages):
    p = dict(pages["kaomoji"])
    # 舊頁的說明講的是「放進排版」跟大型顏文字，v2 這頁還沒有，換成這頁真的做得到的事
    p["description"] = "免費線上顏文字大全：開心、害羞、哭哭、生氣到貓貓狗狗熊熊兔兔都分好類。點一個就能換臉、換動作，點兩下複製，或加進草稿一起排版，脆（Threads）、LINE、IG 都能貼。"
    p["guide_lead"] = "顏文字依心情和動物分好類。點一個，上面的小卡就換成它：可以換臉（手勢留著、只換中間的表情）、換動作，喜歡就加進草稿，回到排版頁照脆實際的寬度排好再複製；只想要這一個，點兩下就直接複製。"
    keep = ("顏文字要怎麼複製？", "排版時怎麼換顏文字的表情？")
    p["faq"] = [("顏文字要怎麼複製？", "點兩下顏文字就會複製到剪貼簿，回脆或其他 App 貼上就好；也可以先點一下，再點上面小卡裡的大顏文字複製。")] + [qa for qa in p["faq"] if qa[0] in keep[1:]] + [
        ("換臉會不會把手勢弄掉？", "不會。換臉只換括號裡的表情，括號外的手、桌子、音符都留著；括號裡貼著括號的手（像翻桌的 ╯）也算手勢的一部分，換動作時才會一起換掉。")]
    faces = kaomoji_data()
    total = sum(len(f[1]) for f in faces)
    start = 0
    cats = '<button type="button" class="chip" data-cat="kfav" aria-pressed="false">我的最愛</button>' + "".join(
        f'<button type="button" class="chip" data-cat="k{i}" aria-pressed="{"true" if i == start else "false"}">{html.escape(name)}</button>'
        for i, (name, _) in enumerate(faces)
    )
    groups = "".join(
        f'<div class="kao-group{" on" if i == start else ""}" id="k{i}" role="group" aria-label="{html.escape(name)}">'
        f'<h2 class="vh">{html.escape(name)}的顏文字</h2>'
        + "".join(f'<button type="button">{html.escape(k)}</button>' for k in items)
        + "</div>"
        for i, (name, items) in enumerate(faces)
    )
    EN = html.escape(p["en"])
    first = faces[start][1][0]
    bigc, nbig = big_cards("big")
    cats += '<button type="button" class="chip" data-cat="kbig" aria-pressed="false">大型顏文字</button>'
    body = f'''<main>
<div class="head">
  <h1>顏文字<i lang="en">kaomoji</i></h1>
  <p class="ans" id="ans"><b>顏文字換臉</b>是保留手勢、只換中間表情：點一個顏文字，就能換臉、換動作，再加進草稿或直接複製到脆（Threads）、IG、LINE。共 {total} 個、{len(faces)} 類，免費、免登入。</p>
  <p class="en-lead ans-en" lang="en">{EN}</p>
  <button type="button" class="more" data-more="ans" aria-expanded="false">看完整說明</button>
</div>
{settings_block("../")}
<div class="cats" role="group" aria-label="顏文字分類">{cats}</div>
<div class="kao-card" id="kaoCard">
  <button type="button" class="kao-now" id="kaoNow" lang="und" aria-label="複製這個顏文字">{html.escape(first)}</button>
  <div class="acts"><button type="button" class="chip" id="swapFace">換臉</button><button type="button" class="chip" id="swapBody">換動作</button><button type="button" class="chip" id="kaoFav" aria-pressed="false">收藏</button><button type="button" class="chip go" id="addKao">加進草稿</button></div>
</div>
<div class="kao-list" lang="und"><div class="kao-group" id="kfav" role="group" aria-label="我的最愛"></div>{groups}<section class="kao-group cards" id="kbig" aria-label="大型顏文字"><h2 class="vh">大型顏文字</h2>{bigc}</section></div>
{guide(p, "../")}
</main>'''
    out = shell("kaomoji", "kaomoji/", p["title"], p["description"], body, ["kaomoji", "cards"], ["kaomoji", "cards"],
                pre_js=["kaomoji"], extra_head=ld_head(p["app_name"], "kaomoji/", p["faq"]))
    with open(os.path.join(ROOT, "kaomoji", "index.html"), "w", encoding="utf-8") as f:
        f.write(out)
    redirect_stub("v2/kaomoji/", "kaomoji/")
    print("kaomoji/index.html", total, "個顏文字")


def pick_page(page, path, title, desc, h1, h1en, answer, groups, guide_p, find=None, cls="", extra=(), en=""):
    EN = html.escape(en or guide_p.get("en", ""))
    """emoji、特殊符號共用：groups = [(分類名, [(字, 名稱, 關鍵字), …]), …]"""
    R = "../" * path.count("/")
    cats = '<button type="button" class="chip" data-cat="gfav" aria-pressed="false">我的最愛</button>' + "".join(
        f'<button type="button" class="chip" data-cat="g{i}" aria-pressed="{"true" if i == 0 else "false"}">{html.escape(n)}</button>'
        for i, (n, _) in enumerate(groups)) + "".join(
        f'<button type="button" class="chip" data-cat="gx{j}" aria-pressed="false">{html.escape(n)}</button>' for j, (n, _) in enumerate(extra))
    def btn(ch, name, kw):
        a = f' aria-label="{html.escape(name)}"' if name else ""
        k = f' data-k="{html.escape(" ".join(kw))}"' if kw else ""
        long = ' class="long"' if cls == "symbols" and len(ch.replace("\ufe0e", "").replace("\ufe0f", "")) > 2 else ""
        return f'<button type="button"{a}{k}{long}>{html.escape(ch)}</button>'
    body_groups = "".join(
        f'<section class="pick-group{" on" if i == 0 else ""}" id="g{i}" aria-label="{html.escape(n)}"><h2>{html.escape(n)}</h2>'
        + "".join(btn(*it) for it in items) + "</section>"
        for i, (n, items) in enumerate(groups)) + "".join(
        f'<section class="pick-group cards" id="gx{j}" aria-label="{html.escape(n)}"><h2 class="vh">{html.escape(n)}</h2>{h}</section>' for j, (n, h) in enumerate(extra))
    total = sum(len(items) for _, items in groups)
    finder = (f'<label class="find"><span class="vh">搜尋</span><input id="find" type="search" placeholder="{html.escape(find)}" autocomplete="off"><small id="findCount">共 {total} 個</small></label>'
              if find else "")
    body = f"""<main class="{cls}">
<div class="head">
  <h1>{html.escape(h1)}<i{' lang="en"' if h1en.isascii() else ""}>{html.escape(h1en)}</i></h1>
  <p class="ans" id="ans">{answer}</p>
  <p class="en-lead ans-en" lang="en">{EN}</p>
  <button type="button" class="more" data-more="ans" aria-expanded="false">看完整說明</button>
</div>
{settings_block(R)}
{finder}
<div class="cats" role="group" aria-label="分類">{cats}</div>
<div class="pick-card">
  <button type="button" class="pick-now" id="pickNow" aria-label="複製這個"></button>
  <p class="pick-name" id="pickName"></p>
  <div class="acts"><button type="button" class="chip" id="pickFav" aria-pressed="false">收藏</button><button type="button" class="chip go" id="pickAdd">加進草稿</button></div>
</div>
<div class="pick-list" id="pickList"><section class="pick-group" id="gfav" aria-label="我的最愛"><h2>我的最愛</h2></section>{body_groups}<p class="empty" id="findEmpty" hidden>找不到，換個說法試試（例如「哭」「貓」「愛心」）。</p></div>
{guide(guide_p, R)}
</main>"""
    head = ld_head(title.split("｜")[0], path, guide_p["faq"])
    out = shell(page, path, title, desc, body, ["pick", "cards"], ["pick", "cards"], index=True, extra_head=head, pre_js=["kaomoji", "dividers"] if extra else [])
    os.makedirs(os.path.join(ROOT, path), exist_ok=True)
    with open(os.path.join(ROOT, path, "index.html"), "w", encoding="utf-8") as f:
        f.write(out)
    print(path + "index.html", total, "個")


def build_emoji():
    d = json.load(open(os.path.join(ROOT, "scripts", "data", "emoji-zh.json"), encoding="utf-8"))
    groups = [(n, [(e, name, kw) for e, name, kw in items]) for n, items in d["groups"]]
    total = sum(len(i) for _, i in groups)
    guide_p = {
        "guide_title": "脆（Threads）emoji 大全",
        "guide_lead": f"這裡收了 {total} 個 emoji，依表情、人物、動物自然、食物、旅行地點、活動、物品、符號、旗幟分好類，每一個都有中文名字，可以直接打「哭」「貓」「愛心」搜尋。只收 Emoji 15.1 以前（2023 年以前發表）的版本，近兩三年的 iPhone、Android 大多顯示得出來；旗幟在 Windows 電腦上會顯示成兩個英文字母。點一下看名字，點兩下複製；想跟顏文字、分隔線一起排，就加進草稿，回到排版頁照脆實際的寬度看換行。",
        "faq": [
            ("emoji 要怎麼複製？", "點兩下 emoji 就會複製，回脆、IG、LINE 貼上就好。也可以先點一下，在上面的小卡看清楚名字，再點小卡裡的大 emoji 複製。"),
            ("為什麼有些 emoji 在別人手機上是方框？", "emoji 每年都會新增，舊手機的系統字型沒有新的圖，就會顯示成方框、問號，或拆成兩個 emoji。這一頁只收 Emoji 15.1 以前的版本，iPhone 要 iOS 17.4 以上才看得到 15.1 的那幾個；比較舊的手機少數新 emoji 可能顯示不出來。"),
            ("emoji 在脆會佔幾個字的寬度？", "在脆的串文裡，一個 emoji 大約是一個中文字寬。排版時加進草稿，回到排版頁就能照實際的寬度看到會在哪裡換行。"),
            ("膚色不同的 emoji 在哪裡？", "這一頁先列預設的黃色版本。要換膚色，可以在手機鍵盤上長按同一個 emoji 選。"),
            ("emoji 的中文名字是哪裡來的？", "用的是 Unicode 官方的繁體中文名稱與關鍵字，所以搜尋「笑」「哭」這類常用說法都找得到。"),
        ],
    }
    pick_page("emoji", "emoji/", "Emoji 大全｜中文名字搜尋、點兩下複製，脆（Threads）、IG 都能用",
              f"免費 emoji 大全：{total} 個 emoji 依表情、人物、動物、食物、旅行、活動、物品、符號、旗幟分類，每個都有中文名字可以搜尋，點兩下複製，貼到脆（Threads）、IG、LINE 都不會變方框。",
              "表情符號", "emoji",
              f"<b>脆用的 emoji</b>：{total} 個 emoji 依心情和主題分類，每個都有中文名字，打「哭」「貓」「愛心」就能找。點一下看名字，點兩下複製，或加進草稿跟顏文字一起排。只收 2023 年以前發表、手機大多顯示得出來的版本。",
              groups, guide_p, find="搜尋：笑、哭、貓、愛心…", en=f'{total:,} emoji in {len(groups)} groups, each with its Traditional Chinese name and keywords for search. Tap one to see its name, double-tap to copy, or add it to your draft. Only emoji released by 2023 (Emoji 15.1), so they show up on most phones.')


def build_symbols():
    d = json.load(open(os.path.join(ROOT, "scripts", "data", "symbols.json"), encoding="utf-8"))
    names = json.load(open(os.path.join(ROOT, "scripts", "data", "emoji-zh.json"), encoding="utf-8"))["symbolNames"]
    emo = set(e.replace("\ufe0f", "") for _, items in json.load(open(os.path.join(ROOT, "scripts", "data", "emoji-zh.json"), encoding="utf-8"))["groups"] for e, _, _ in items)
    def text_style(ch):
        base = ch.replace("\ufe0e", "").replace("\ufe0f", "")
        return base + "\ufe0e" if base in emo else ch   # iPhone 預設會畫成彩色 emoji 的，標成文字樣式
    groups = []
    for n, chars in d["groups"]:
        seen, items = set(), []
        for ch in chars.split():
            ch = text_style(ch)
            if ch in seen: continue
            seen.add(ch)
            items.append((ch, names.get(ch.replace("\ufe0e", ""), "") or n + "類符號", []))
        groups.append((n, items))
    total = sum(len(i) for _, i in groups)
    guide_p = {
        "guide_title": "脆（Threads）特殊符號大全",
        "guide_lead": f"愛心、星星、花、箭頭、括號、圓圈數字、音符、勾叉、線條、貨幣、數學、單位、注音、日文小字……共 {total} 個特殊符號，都是文字符號：會被系統畫成彩色 emoji 的那幾個，這裡都加了「用文字樣式顯示」的標記，貼到脆、IG、LINE 會跟著文字的顏色，排起來比較乾淨。點一下看名字，點兩下複製，也可以加進草稿，回到排版頁照脆的寬度一起排。",
        "faq": [
            ("特殊符號跟 emoji 有什麼不一樣？", "特殊符號是文字的一部分，顏色跟著文字走、大小跟字一樣，排起來比較整齊；emoji 是彩色的小圖。想要乾淨的排版，用 ♡ ✦ ⋆ 這類符號會比 emoji 安靜。"),
            ("特殊符號要怎麼複製？", "點兩下符號就會複製，回脆貼上。也可以先點一下，在上面的小卡看清楚，再點小卡裡的大符號複製。"),
            ("為什麼同一個符號在別的手機看起來不一樣？", "符號會用各家系統自己的字型畫，粗細和造型會有一點差別；少數符號在 iPhone 上會被畫成彩色 emoji。這一頁挑的是比較常見的符號，太冷門、很多手機缺字的先不放。"),
            ("圓圈數字最多到幾？", "白底的 ① 到 ⑳、黑底的 ❶ 到 ⓴ 都有，括號數字 ⑴ 到 ⑽、點數字 ⒈ 到 ⒑ 也在同一類。"),
            ("可以用符號排出邊框或分隔線嗎？", "可以。線條、點點裝飾這兩類就是排分隔線常用的符號；想要現成的整條花邊，可以到分隔線頁直接挑。"),
        ],
    }
    pick_page("symbols", "symbols/", "特殊符號大全｜愛心、星星、箭頭、圓圈數字點兩下複製，脆（Threads）可用",
              f"免費特殊符號大全：愛心、星星、花草、天氣、箭頭、括號、圓圈數字、音符、勾叉、線條、貨幣、數學、單位、注音等 {total} 個符號，點兩下複製，貼到脆（Threads）、IG、LINE 都能用。",
              "特殊符號", "symbols",
              f"<b>特殊符號</b>是長在文字裡的小圖：愛心、星星、箭頭、圓圈數字……共 {total} 個，顏色跟著字走，排起來比 emoji 乾淨。點一下看名字，點兩下複製，或加進草稿一起排版。",
              groups, guide_p, cls="symbols", en=f'{total:,} text symbols in {len(groups)} groups: hearts, stars, flowers, arrows, brackets, circled numbers, music notes, check marks, lines, currency, math, units, Zhuyin and small kana. They follow your text color, so posts look cleaner than with emoji. Tap to see, double-tap to copy.')


def build_fonts(pages):
    p = dict(pages["fonts"])
    sample = "Good night, 2026!"
    js = ("global.window={};require('./core.js');require('./v2/fonts-extra.js');"
          "const C=window.TRCore,X=window.TRFontsExtra,t=" + json.dumps(sample) + ";"
          "process.stdout.write(JSON.stringify({core:C.STYLES.filter(s=>s.id!=='plain').map(s=>[s.id,s.name,C.stylize(t,s.id),'']),"
          "extra:X.EXTRA.map(s=>[s.id,s.name,s.fn(t),s.note||''])}))")
    d = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT))
    def rows(items):
        return "".join(
            f'<li><button type="button" data-style="{sid}" aria-pressed="false"><span class="t">{html.escape(out)}</span>'
            f'<span class="n">{html.escape(name)}{f"<small>{html.escape(note)}</small>" if note else ""}</span></button></li>'
            for sid, name, out, note in items)
    n = len(d["core"]) + len(d["extra"])
    EN = html.escape(p["en"])
    p["guide_lead"] = (f"脆的貼文沒有字體選單，大家看到的粗體、草寫、花體英文，其實是長得像字母的 Unicode 符號。這一頁一次列出 {n} 種："
                       f"粗體、斜體、草寫、哥德、空心、打字機、全形、圓圈、方塊這些換的是字母本身；刪除線、底線、上劃線這些是在每個英文字母、數字後面疊一條線（中文不加，很多字型疊在中文上會變方框）；"
                       "上標、下標小字跟倒過來寫，適合當小註解或彩蛋。打字就會一起換，點兩下複製，或加進草稿跟顏文字一起排版。")
    p["faq"] = list(p["faq"]) + [
        ("刪除線、底線中文也能用嗎？", "這裡只幫英文字母、數字、符號加線，中文跳過不加。刪除線、底線這些是在字後面疊一條組合用的線，很多手機字型疊在中文字上會變成方框，貼到脆反而難看。"),
        ("標點符號也能換字體嗎？", "大部分不行。粗體、草寫、哥德這些字體在 Unicode 裡只有英文字母（有些連數字），沒有對應的標點，所以逗號、驚嘆號會維持原樣。例外是「全形」：！？（）＃＠這些標點都有全形版本，會一起換；刪除線、底線這類疊線，還有「倒過來」，也會套到標點上。"),
        ("上標、下標為什麼有些字母沒變？", "Unicode 只有部分字母有上標、下標的小字（例如上標沒有 q，下標只有 a、e、h、i 等十幾個），沒有的會保持原樣。"),
    ]
    body = f"""<main>
<div class="head">
  <h1>特殊字體<i lang="en">fonts</i></h1>
  <p class="ans" id="ans"><b>脆的特殊字體</b>是長得像字母的 Unicode 符號：打一行字，{n} 種樣式一起換好，點兩下複製。粗體、草寫、哥德之外，還有刪除線、底線、上標小字、倒過來寫。</p>
  <p class="en-lead ans-en" lang="en">{EN}</p>
  <button type="button" class="more" data-more="ans" aria-expanded="false">看完整說明</button>
</div>
{settings_block("../")}
<label class="font-in"><span class="vh">要轉換的字</span><input id="fontIn" type="text" placeholder="{sample}" autocomplete="off" spellcheck="false"><small>{n} 種</small></label>
<div class="pick-card">
  <button type="button" class="pick-now font" id="pickNow" aria-label="複製這一行"></button>
  <p class="pick-name" id="pickName"></p>
  <div class="acts"><button type="button" class="chip go" id="pickAdd">加進草稿</button></div>
</div>
<ul class="font-list">
  <li><h2>換字母（{len(d["core"])} 種，排版尺裡選取英文也能換）</h2></li>{rows(d["core"])}
  <li><h2>疊線、小字、倒過來（{len(d["extra"])} 種）</h2></li>{rows(d["extra"])}
</ul>
{guide(p, "../")}
</main>"""
    out = shell("fonts", "fonts/", p["title"], p["description"], body, ["pick", "fonts"], ["fonts-extra", "fonts"],
                extra_head=ld_head(p["app_name"], "fonts/", p["faq"]))
    with open(os.path.join(ROOT, "fonts", "index.html"), "w", encoding="utf-8") as f:
        f.write(out)
    redirect_stub("v2/fonts/", "fonts/")
    print("fonts/index.html", n, "種字體")


def index_ld():
    """舊首頁（現在是擴充功能用的 sidepanel.html）的結構化資料：常見問題 7 題、SoftwareApplication。新首頁沿用同一份"""
    import re
    s = open(os.path.join(ROOT, "sidepanel.html"), encoding="utf-8").read()
    faq, apps = [], []
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        d = json.loads(m.group(1))
        if d.get("@type") == "FAQPage":
            faq = [(q["name"], q["acceptedAnswer"]["text"]) for q in d["mainEntity"]]
        elif "SoftwareApplication" in (d.get("@type") if isinstance(d.get("@type"), list) else [d.get("@type")]):
            apps.append(d)   # 型別是 ["SoftwareApplication", "WebApplication"]
    return faq, apps


# 首頁的工具目錄：別人第一次來，一眼看到六個工具各做什麼（排版就是這頁，用 [ ] 標著）
TOOL_INDEX = [
    ("排版", "", "空白行不被吃・置中・照手機寬度預覽"),
    ("顏文字", "kaomoji/", "換臉、換動作，點兩下複製"),
    ("emoji", "emoji/", "打中文就找得到"),
    ("特殊符號", "symbols/", "愛心、星星、箭頭、圈圈數字"),
    ("特殊字體", "fonts/", "粗體、草寫、哥德等英文字體"),
    ("分隔線", "dividers/", "花邊分隔線，還有放字的框"),
]

def tool_index():
    items = "".join(
        (f'<a href="{href}"><b>{html.escape(n)}</b><span>{html.escape(d)}</span></a>' if href else
         f'<a href="./" aria-current="page"><b>{html.escape(n)}</b><span>{html.escape(d)}</span></a>')
        for n, href, d in TOOL_INDEX)
    return f'<nav class="toolidx" aria-label="六個工具"><p class="ti-lab"><span>六個工具</span><i lang="en">six tools</i></p>{items}</nav>'


def build_edit():
    guide_p = {
        "guide_title": "脆（Threads）排版預覽工具",
        "guide_lead": "在脆發文時，空白行常常被吃掉、半形空白會消失，想置中也沒有按鈕。翠排版尺照脆網頁版和 iPhone App 實際量到的寬度，讓你一邊打字一邊看到貼出去的樣子：換行、空白行、置中、靠右、英文特殊字體、顏文字、分隔線都能先排好，按複製再回脆貼上。電腦和手機都能用，草稿只存在你自己的瀏覽器。",
        "faq": index_ld()[0],
    }
    EN = html.escape('Threads layout ruler: preview your Threads posts at the real width of the iPhone app and the desktop site. Blank lines stay, lines can be centered or right-aligned, English can be switched to fancy fonts, and kaomoji, big kaomoji and dividers are one tap away. Copy and open Threads when it looks right. Free, no login.')
    tool = lambda k, label: f'<button type="button" class="chip" data-tool="{k}" aria-pressed="false">{label}</button>'
    body = f"""<main>
<div class="head">
  <h1>排版<i lang="en">layout</i></h1>
  <p class="ans" id="ans"><b>翠排版尺</b>照脆（Threads）實際的寬度即時排版：空白行不會被吃掉、選取幾行按「置中」或「靠右」、選取英文換字體、插入顏文字和分隔線，排好按「複製全文」直接貼上。免費、免登入。</p>
  <p class="en-lead ans-en" lang="en">{EN}</p>
  <button type="button" class="more" data-more="ans" aria-expanded="false">看完整說明</button>
</div>
{settings_block("")}
{tool_index()}
<div class="seg">
  <button type="button" class="chip" data-mode="edit" aria-pressed="true">編輯</button><button type="button" class="chip" data-mode="preview" aria-pressed="false">預覽</button>
  <span class="r"><button type="button" class="chip" data-view="feed" aria-pressed="true">列表</button><button type="button" class="chip" data-view="detail" aria-pressed="false">點開</button></span>
</div>
<div class="wbar"><span id="wText"></span><button type="button" class="chip" id="wBtn"><span class="m-only">換寬度</span><span class="d-only">修改其他設定項目</span></button></div>
<p class="sample-note" id="sampleNote" hidden>這是範例草稿，直接改就好，或 <button type="button" class="chip" id="clearSample">清掉重新開始</button></p>
<div class="split">
<div id="editPane">
  <div class="ed">
    <div class="tools" role="toolbar" aria-label="排版工具">
      <button type="button" class="chip" data-align="center">置中</button><button type="button" class="chip" data-align="left">靠左</button><button type="button" class="chip" data-align="right">靠右</button>
      {tool("kao", "＋顏文字")}{tool("big", "＋大型")}{tool("font", "＋字體")}{tool("div", "＋分隔線")}
    </div>
    <div class="tool-panel" id="toolPanel" hidden></div>
    <div id="posts"></div>
    <p class="hint">點兩下顏文字換臉・選取英文按「＋字體」</p>
  </div>
</div>
<div id="previewPane" hidden><div class="t-wrap"><div class="t-card" id="tCard"></div></div></div>
</div>
<div class="bottom">
  <button type="button" class="chip" id="undo">復原</button><button type="button" class="chip" id="paste">貼上</button><button type="button" class="chip" id="addPost">＋新增一則</button><button type="button" class="chip go" id="copyAll">複製並開脆</button>
</div>
{guide(guide_p, "")}
<div class="tour-frame" id="tourFrame" aria-hidden="true" hidden><i></i><i></i><i></i><i></i></div><div class="tour" id="tour" role="dialog" aria-label="導覽" aria-live="polite" hidden><span class="tour-no"></span><b></b><p class="tour-text"></p><div class="row"><span class="tour-dots" aria-hidden="true"></span><span class="acts"><button type="button" class="chip tour-skip">略過</button><button type="button" class="chip go tour-next">下一步</button></span></div></div>
</main>"""
    out = shell("edit", "", "脆（Threads）排版工具｜空行不消失、一鍵置中、特殊字體、顏文字｜翠排版尺",
                "免費線上工具，照脆（Threads）實際的寬度即時預覽排版：空行不會消失、一鍵置中、靠右、換特殊字體、插入顏文字和分隔線，手機電腦都能用。",
                body, ["edit"], ["edit"], extra_head=ld_head("翠排版尺", "", guide_p["faq"], (index_ld()[1] or [None])[0]),
                body_class="edit", pre_js=["kaomoji", "dividers"], strip=False)
    redirect_stub("v2/", "")
    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as f:
        f.write(out)
    print("index.html 排版頁")


def ld_head(name, path, faq, app=None):
    """WebApplication＋常見問題的結構化資料；app 給了就用它取代預設的 WebApplication（首頁沿用舊版那份比較完整的）"""
    ld = {"@context": "https://schema.org", "@type": "WebApplication", "name": name, "url": SITE + path,
          "applicationCategory": "UtilitiesApplication", "operatingSystem": "Any", "inLanguage": "zh-Hant",
          "offers": {"@type": "Offer", "price": "0", "priceCurrency": "TWD"},
          "author": {"@type": "Person", "name": "space.grapefruit_", "url": "https://www.threads.com/@space.grapefruit_"}}
    blocks = [app or ld]
    if faq:
        blocks.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]})
    return "".join('<script type="application/ld+json">' + json.dumps(b, ensure_ascii=False).replace("</", "<\\/") + "</script>\n" for b in blocks)


def redirect_stub(old, new):
    """改版試用時給過的網址（/v2/…）：轉到正式網址，不讓連結失效"""
    R = "../" * old.count("/")
    page = f'''<!doctype html>
<!-- 這個檔案由 scripts/build-v2.py 產生：改版試用期的網址，現在轉到正式頁 -->
<html lang="zh-Hant"><head><meta charset="utf-8"><script>if(location.hostname==="alanis6v6.github.io")location.replace("https://spacegrapefruit.com"+location.pathname+location.search+(location.search?"&":"?")+"from=gh"+location.hash);</script><meta name="robots" content="noindex">
<link rel="canonical" href="{SITE + new}"><meta http-equiv="refresh" content="0; url={R + new}">
<title>翠排版尺</title></head>
<body><p><a href="{R + new}">翠排版尺搬到這裡了</a></p><script>location.replace("{R + new}" + location.search + location.hash);</script></body></html>
'''
    os.makedirs(os.path.join(ROOT, old), exist_ok=True)
    with open(os.path.join(ROOT, old, "index.html"), "w", encoding="utf-8") as f:
        f.write(page)


def big_cards(src):
    """大型顏文字（src="big"）或分隔線頁的框（src="div"）：圖先畫好寫進 HTML"""
    js = ("global.window={};require('./core.js');require('./kaomoji.js');require('./dividers.js');"
          "const K=window.TRKaomoji,D=window.TRDividers,L=" + json.dumps(src) + "==='big'?K.big:D.cards;"
          "process.stdout.write(JSON.stringify(L.map(b=>({name:b.name,text:b.text==null?null:b.text,art:K.fill(b)}))))")
    items = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT))
    out = []
    for i, b in enumerate(items):
        inp = (f'<input class="big-input" type="text" value="{html.escape(b["text"])}" aria-label="{html.escape(b["name"])}的字" autocomplete="off">'
               if b["text"] is not None else "")
        out.append(f'<article class="big-card" data-src="{src}" data-i="{i}"><h3>{html.escape(b["name"])}</h3>{inp}'
                   f'<pre class="big-art">{html.escape(b["art"])}</pre>'
                   f'<div class="acts"><button type="button" class="chip big-copy">複製</button><button type="button" class="chip go big-use">放進排版</button></div></article>')
    return "".join(out), len(items)


def build_dividers(pages):
    p = dict(pages["dividers"])
    js = "global.window={};require('./dividers.js');process.stdout.write(JSON.stringify(window.TRDividers.lines))"
    lines = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT))
    groups = [(n, [(l, n + "分隔線", []) for l in items]) for n, items in lines]
    cards, nc = big_cards("div")
    total = sum(len(i) for _, i in groups)
    p["guide_lead"] = (f"分隔線可以把長文分段、讓重點更好找。這裡有 {total} 條分隔線，依愛心、蝴蝶結、花花、星星、閃閃發亮、線條分好類，點一下放上面的小卡，點兩下複製；"
                       f"另外 {nc} 種「框和放字的分隔線」可以直接打字進去，字數不同也會自動置中。脆的字型不是等寬的，手機一行也比電腦短，按「放進排版」就能用實際寬度預覽，排好再貼。")
    pick_page("dividers", "dividers/", p["title"], p["description"], "分隔線", "dividers",
              f"<b>脆的分隔線</b>：用符號排出的一整行花邊，放在段落之間。{total} 條分隔線、{nc} 種可以放字的框，點兩下複製，或加進草稿照脆的寬度一起排，手機不會換行才貼。",
              groups, p, cls="dividers", extra=[("框・放字", cards)])


if __name__ == "__main__":
    build_kaomoji(load_pages())
    build_edit()
    build_fonts(load_pages())
    build_dividers(load_pages())
    build_emoji()
    build_symbols()
