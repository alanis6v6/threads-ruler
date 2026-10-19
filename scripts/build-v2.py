#!/usr/bin/env python3
# 翠排版尺 v2（手機版改版，redesign-2026 分支）：產生 v2/ 底下的工具頁。
# 顏文字直接寫進 HTML（不是等 JS 畫出來），搜尋跟 AI 摘要讀得到每一個；說明跟常見問題沿用 build-pages.py 的文字。
# 改了資料或這支腳本之後重跑：python3 scripts/build-v2.py
import html, json, os, subprocess

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SITE = "https://alanis6v6.github.io/threads-ruler/"


def load_pages():
    src = open(os.path.join(ROOT, "scripts", "build-pages.py"), encoding="utf-8").read()
    ns = {"__file__": os.path.join(ROOT, "scripts", "build-pages.py")}
    exec(src.split("\ndef ")[0], ns)
    return ns["PAGES"]


def kaomoji_data():
    js = "global.window={};require('./core.js');require('./kaomoji.js');process.stdout.write(JSON.stringify(window.TRKaomoji.faces))"
    return json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT))


TABS = [
    ("edit", "排版", "../../", '<path d="M4 6h16M4 12h10M4 18h13"/>'),
    ("kaomoji", "顏文字", "../kaomoji/", '<circle cx="12" cy="12" r="8.5"/><path d="M8.6 10.2h.01M15.4 10.2h.01M9 14.2c1.6 1.4 4.4 1.4 6 0"/>'),
    ("fonts", "字體", "../../fonts/", '<path d="M5 19 10.5 5h1L17 19M7.4 13.5h7.2"/>'),
    ("emoji", "emoji", None, '<path d="M12 20.5c-4.8-3.2-8.5-6.4-8.5-10.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 8.5 2.3c0 3.8-3.7 7-8.5 10.2z"/>'),
    ("dividers", "分隔線", "../../dividers/", '<path d="M3 12h4M10 12h4M17 12h4M12 7v.01M12 17v.01"/>'),
]


def shell(page, title, desc, canonical, body):
    # 還沒做好的工具（href 是 None）先放淡色的字，不連到別的地方
    tabs = "".join(
        ('<a href="%s"%s><svg viewBox="0 0 24 24" aria-hidden="true">%s</svg>%s</a>'
         % (href, ' aria-current="page"' if key == page else "", icon, name)) if href else
        ('<span class="soon" aria-disabled="true" title="做中"><svg viewBox="0 0 24 24" aria-hidden="true">%s</svg>%s</span>' % (icon, name))
        for key, name, href, icon in TABS
    )
    return f'''<!doctype html>
<!-- 這個檔案由 scripts/build-v2.py 產生，請改腳本或資料後重跑 -->
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<!-- 改版試用中：先不給搜尋收錄，正式上線時換掉舊頁再拿掉這行 -->
<meta name="robots" content="noindex">
<link rel="canonical" href="{canonical}">
<script>document.documentElement.className += " js";</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,600&family=Noto+Serif+TC:wght@500;600;900&display=swap">
<link rel="stylesheet" href="../shell.css">
<link rel="stylesheet" href="../{page}.css">
</head>
<body>
<header class="top">
  <a class="brand" href="https://alanis6v6.github.io/">space.grapefruit<small>翠排版尺</small></a>
  <nav class="top-acts"><a href="../../#guide">說明</a><button type="button" id="setBtn" aria-expanded="false" aria-controls="settings">設定</button></nav>
</header>
{body}
<div class="flash" id="flash" aria-hidden="true"><i>— settings —</i><b>設定</b><small>layout · width · spaces · copy</small></div>
<p class="toast" id="toast" role="status" aria-live="polite"></p>
<div class="strip"><span class="t" id="stripText"></span><span class="n" id="stripCount">草稿</span><a class="o" href="../../">去排版</a></div>
<nav class="tabbar" aria-label="工具">{tabs}</nav>
<script src="../../core.js"></script>
<script src="../shell.js"></script>
<script src="../{page}.js"></script>
</body>
</html>
'''


def settings_block():
    w = lambda key: f'<button type="button" class="w" data-set="{key}"></button>'
    return f'''<section class="settings" id="settings" hidden aria-label="設定">
  <div class="lab"><span>settings</span><button type="button" id="setClose">收起</button></div>
  <p class="sent">預覽寬度是{w("width")}，顯示{w("view")}。<br>空白行{w("blank")}；<br>半形空白轉全形{w("spaces")}。<br>置中依照{w("center")}，複製後{w("open")}。<br>介面語言{w("lang")}。</p>
  <div class="sent-tail"><button type="button" class="chip" id="tidyClip">整理剪貼簿</button><a class="chip" href="../../">導覽</a><button type="button" class="chip go" id="clearDraft">清空草稿</button></div>
</section>'''


def guide(p):
    faq = "".join(f"<h3>{html.escape(q)}</h3><p>{html.escape(a)}</p>" for q, a in p["faq"])
    return f'''<section class="guide" id="guide">
  <h2>{html.escape(p["guide_title"])}</h2>
  <p>{html.escape(p["guide_lead"])}</p>
  {faq}
</section>
<p class="foot">作者 <a href="https://www.threads.com/@space.grapefruit_" rel="noopener">@space.grapefruit_</a>・<a href="../../privacy.html">隱私權</a></p>'''


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
    cats = "".join(
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
    first = faces[start][1][0]
    body = f'''<main>
<div class="head">
  <h1>顏文字<i lang="en">kaomoji</i></h1>
  <p class="ans" id="ans"><b>顏文字換臉</b>是保留手勢、只換中間表情：點一個顏文字，就能換臉、換動作，再加進草稿或直接複製到脆（Threads）、IG、LINE。共 {total} 個、{len(faces)} 類，免費、免登入。</p>
  <button type="button" class="more" data-more="ans" aria-expanded="false">看完整說明</button>
</div>
{settings_block()}
<div class="cats" role="group" aria-label="顏文字分類">{cats}</div>
<div class="kao-card" id="kaoCard">
  <button type="button" class="kao-now" id="kaoNow" lang="und" aria-label="複製這個顏文字">{html.escape(first)}</button>
  <div class="acts"><button type="button" class="chip" id="swapFace">換臉</button><button type="button" class="chip" id="swapBody">換動作</button><button type="button" class="chip go" id="addKao">加進草稿</button></div>
</div>
<div class="kao-list" lang="und">{groups}</div>
{guide(p)}
</main>'''
    out = shell("kaomoji", p["title"], p["description"], SITE + "kaomoji/", body)
    os.makedirs(os.path.join(ROOT, "v2", "kaomoji"), exist_ok=True)
    with open(os.path.join(ROOT, "v2", "kaomoji", "index.html"), "w", encoding="utf-8") as f:
        f.write(out)
    print("v2/kaomoji/index.html", total, "個顏文字")


if __name__ == "__main__":
    build_kaomoji(load_pages())
