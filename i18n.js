// 多國語言：繁體中文是原文，其他語言照 T 表換字。
// 畫面上固定的字由 apply() 逐一比對文字換掉；app.js 裡動態產生的字用 TRI18N.t("原文", { 變數 })。
// 新增或修改中文字時，記得在 T 表補上同一句的英文、日文、韓文（null = 保持原文）。
(function(){
  var LANGS = [["zh", "繁體中文"], ["en", "English"], ["ja", "日本語"], ["ko", "한국어"]];
  var IDX = { en: 0, ja: 1, ko: 2 };
  var HTML_LANG = { zh: "zh-Hant", en: "en", ja: "ja", ko: "ko" };
  var KEY = "threads-ruler-lang";

  // 原文: [English, 日本語, 한국어]
  var T = {
    "各機型的寬度": ["Widths by model", "機種ごとの幅", "기기별 폭"],
    "用手機打開時預設是「本機」，直接用你這台裝置的實際寬度，不用自己挑；想看別人的手機會怎麼顯示，再從上面的寬度選單換一個。常見的寬度：360 是 Galaxy S22～S25 等多數 Android，375 是 iPhone SE 與 13 mini，390 是 iPhone 12～16 與 16e，412 是 Pixel 6～10 與 Galaxy S24／S25 Ultra，430 是 iPhone 15 與 16 Pro Max（14 Plus 那類是 428，差不到一個字）。電腦版網頁固定 639。這些數字是網頁實際可用的寬度，跟手機規格表上的解析度不一樣。": ["On a phone it defaults to \"This device\" and uses your own screen width, so you don't have to pick one; to see how it looks on someone else's phone, switch width in the menu above. Common widths: 360 for most Android phones such as the Galaxy S22–S25, 375 for the iPhone SE and 13 mini, 390 for the iPhone 12–16 and 16e, 412 for the Pixel 6–10 and Galaxy S24/S25 Ultra, and 430 for the iPhone 15 and 16 Pro Max (the 14 Plus and similar are 428, less than one character apart). The desktop web layout is always 639. These are CSS widths the page actually gets, not the resolution on the spec sheet.", "スマホで開くと初期設定は「この端末」で、あなたの画面の実際の幅を使うので自分で選ぶ必要はありません。他の人の端末での見え方を確認したいときは、上の幅メニューから切り替えてください。よくある幅：360はGalaxy S22〜S25など多くのAndroid、375はiPhone SEと13 mini、390はiPhone 12〜16と16e、412はPixel 6〜10とGalaxy S24／S25 Ultra、430はiPhone 15と16 Pro Max（14 Plusなどは428で、1文字にも満たない差）。PC版は常に639です。これらはページが実際に使える幅で、スペック表の解像度とは違います。", "휴대폰으로 열면 기본값이 「이 기기」라서 내 화면의 실제 폭을 그대로 써요. 직접 고를 필요가 없고, 다른 사람 휴대폰에서 어떻게 보이는지 보고 싶을 때만 위의 폭 메뉴에서 바꾸면 돼요. 흔한 폭: 360은 갤럭시 S22~S25 등 대부분의 안드로이드, 375는 아이폰 SE와 13 mini, 390은 아이폰 12~16과 16e, 412는 픽셀 6~10과 갤럭시 S24/S25 울트라, 430은 아이폰 15와 16 Pro Max(14 Plus 같은 기기는 428로 한 글자도 차이 나지 않아요). PC 웹은 항상 639예요. 이 숫자는 페이지가 실제로 쓸 수 있는 폭이라 사양표의 해상도와는 달라요."],
    "自動偵測目前這台": ["auto-detected", "自動検出", "자동 감지"],
    "Galaxy S22～S25": ["Galaxy S22–S25", "Galaxy S22〜S25", "갤럭시 S22~S25"],
    "iPhone SE、13 mini": ["iPhone SE, 13 mini", "iPhone SE・13 mini", "아이폰 SE, 13 mini"],
    "iPhone 12～16、16e": ["iPhone 12–16, 16e", "iPhone 12〜16・16e", "아이폰 12~16, 16e"],
    "Pixel 6～10、S24 Ultra": ["Pixel 6–10, S24 Ultra", "Pixel 6〜10・S24 Ultra", "픽셀 6~10, S24 울트라"],
    "iPhone 15、16 Pro Max": ["iPhone 15, 16 Pro Max", "iPhone 15・16 Pro Max", "아이폰 15, 16 Pro Max"],
    "360 是多數 Android、375 是 iPhone SE、390 是 iPhone 12～16、412 是 Pixel、430 是 Pro Max；在手機上打開時，還會多一個「本機」，直接用你螢幕的寬度。": ["360 covers most Android phones, 375 the iPhone SE, 390 the iPhone 12–16, 412 the Pixel, and 430 the Pro Max. On a phone you also get \"This device\", which uses your own screen width.", "360は多くのAndroid、375はiPhone SE、390はiPhone 12〜16、412はPixel、430はPro Maxの幅です。スマホで開くと「この端末」も選べて、画面の実際の幅を使います。", "360은 대부분의 안드로이드, 375는 아이폰 SE, 390은 아이폰 12~16, 412는 픽셀, 430은 Pro Max예요. 휴대폰에서 열면 「이 기기」가 추가되어 내 화면 폭을 그대로 써요."],
    "看哪一種畫面": ["Which view", "どの画面で見る", "어떤 화면으로 볼까"],
    "用哪種寬度": ["Which width", "どの幅で見る", "어떤 폭으로 볼까"],
    "本機 {w}": ["This device {w}", "この端末 {w}", "이 기기 {w}"],
    "電腦版": ["Desktop", "PC版", "PC 버전"],
    "網頁版 639": ["web, 639", "Web版 639", "웹 639"],
    "使用說明": ["How to use", "使い方", "사용법"],
    "常見問題與說明": ["FAQ & how it works", "よくある質問と使い方", "자주 묻는 질문과 사용법"],
    "直接在這裡打字。選取文字之後，下面可以置中或換英文字體": ["Type right here. Select text and use the bar below to center it or change the font.", "ここに直接入力できます。文字を選ぶと、下のバーで中央揃えやフォント変更ができます。", "여기에 바로 입력하세요. 글을 선택하면 아래 바에서 가운데 정렬이나 글꼴 변경을 할 수 있어요."],
    "按「Aa」換英文字體，或按「置中」對齊這幾行": ["Tap \"Aa\" for fancy fonts, or \"Center\" to center these lines.", "「Aa」でフォント変更、「中央揃え」でこの行を中央に。", "「Aa」로 글꼴을 바꾸거나 「가운데 정렬」로 이 줄들을 정렬하세요."],
    "{n} 字/行": ["{n} chars/line", "{n}文字/行", "줄당 {n}자"],
    "先選取要換字體的英文": ["Select the English text you want to restyle first", "先にフォントを変える英字を選択してください", "먼저 글꼴을 바꿀 영문을 선택해 주세요"],
    "先點一下要排版的那一則": ["Tap the post you want to format first", "先に整えたい投稿をタップしてください", "먼저 꾸밀 글을 눌러 주세요"],
    "☺ 素材": ["☺ Materials", "☺ 素材", "☺ 소재"],
    "收起鍵盤": ["Hide keyboard", "キーボードを閉じる", "키보드 숨기기"],
    "調整高度": ["Resize", "高さを調整", "높이 조절"],
    "排版前先想好：這篇是會被滑過，還是會被點開看？{kao}\n\n在串文列表裡，電腦版一行大約 36 個中文字；點開之後主貼文變寬，一行可以放到 39 個字。\n\n同一段話，換行的位置就不一樣了。": ["Before you format, ask yourself: will this post be scrolled past, or opened?{kao}\n\nIn the feed, the desktop layout fits a certain number of characters per line; once a post is opened, the main post gets wider and each line fits more.\n\nSame words, different line breaks.", "整える前に考えよう：この投稿はスクロールで流し見される？それとも開いて読まれる？{kao}\n\nフィードではPC版の1行はだいたい全角36文字。投稿を開くとメイン投稿が広くなり、1行39文字まで入ります。\n\n同じ文章でも、改行の位置が変わるんです。", "꾸미기 전에 먼저 생각해 보세요. 이 글은 스크롤로 지나칠까요, 아니면 열어서 읽힐까요?{kao}\n\n피드에서는 PC 기준 한 줄에 한글 약 36자, 글을 열면 본문이 넓어져 한 줄에 39자까지 들어갑니다.\n\n같은 문장이라도 줄바꿈 위치가 달라져요."],
    "選取英文就能換字體：\nThreads Layout Ruler\n\n點上面那個顏文字的臉，可以直接換成別的表情 ʕ•ᴥ•ʔ": ["Select English text to change its font:\nThreads Layout Ruler\n\nTap the kaomoji face above to swap it for another expression ʕ•ᴥ•ʔ", "英字を選択するとフォントを変えられます：\nThreads Layout Ruler\n\n上の顔文字の顔をタップすると、別の表情に変えられます ʕ•ᴥ•ʔ", "영문을 선택하면 글꼴을 바꿀 수 있어요:\nThreads Layout Ruler\n\n위의 이모티콘 얼굴을 누르면 다른 표정으로 바꿀 수 있어요 ʕ•ᴥ•ʔ"],
    "小提醒：連續打好幾個半形空白，翠只會留一個，這裡會自動幫你換成全形。\n\n選取這行試試「置中」\n\n切到手機版看看，一行只剩 24 個字左右。": ["Tip: if you type several spaces in a row, Threads keeps only one. This tool converts them to full-width spaces for you.\n\nSelect this line and try \"Center\"\n\nSwitch to mobile and see how much shorter each line gets.", "ヒント：半角スペースを続けて打っても、Threadsでは1つしか残りません。ここでは自動で全角に変換します。\n\nこの行を選択して「中央揃え」を試してみて\n\nスマホ表示に切り替えると、1行が24文字くらいまで短くなります。", "팁: 반각 공백을 여러 개 연달아 입력해도 스레드에는 하나만 남아요. 여기서는 자동으로 전각 공백으로 바꿔 줍니다.\n\n이 줄을 선택해서 「가운데 정렬」을 눌러 보세요\n\n모바일로 바꿔 보면 한 줄이 24자 정도로 짧아져요."],
    "選取英文就能換字型：\nTHREADS Layout Ruler\n\n點顏文字換臉、換手勢 {kao}": ["Select English text to change its font:\nTHREADS Layout Ruler\n\nTap a kaomoji to swap its face and arms {kao}", "英字を選択するとフォントを変えられます：\nTHREADS Layout Ruler\n\n顔文字をタップして顔や手を変えよう {kao}", "영문을 선택하면 글꼴을 바꿀 수 있어요:\nTHREADS Layout Ruler\n\n이모티콘을 눌러 얼굴과 손 모양을 바꿔 보세요 {kao}"],
    "第 {n} 則": ["Post {n}", "{n}件目", "{n}번째 글"],
    "複製": ["Copy", "コピー", "복사"],
    "刪除第 {n} 則": ["Delete post {n}", "{n}件目を削除", "{n}번째 글 삭제"],
    "第 {n} 則內容": ["Post {n} text", "{n}件目の本文", "{n}번째 글 내용"],
    "把草稿貼進來，或直接在右邊預覽裡寫…": ["Paste your draft here, or type straight into the preview…", "下書きを貼り付けるか、右のプレビューに直接書いてね…", "초안을 붙여넣거나 오른쪽 미리보기에 바로 쓰세요…"],
    "接著寫第 {n} 則…": ["Write post {n}…", "{n}件目を書く…", "{n}번째 글 쓰기…"],
    "有會被翠吃掉的半形空白（連續或行首）。": ["Some half-width spaces will be removed by Threads (repeated or at line start).", "Threadsで消える半角スペースがあります（連続・行頭）。", "스레드에서 사라지는 반각 공백이 있어요(연속 또는 줄 맨 앞)."],
    "換成全形空白": ["Convert to full-width", "全角スペースに変換", "전각 공백으로 바꾸기"],
    "已換成全形空白": ["Converted to full-width spaces", "全角スペースに変換しました", "전각 공백으로 바꿨어요"],
    "你的帳號": ["your_account", "あなたのアカウント", "내 계정"],
    "2 分鐘": ["2m", "2分", "2분"],
    "（第 {n} 則還沒寫，點這裡開始打字）": ["(Post {n} is empty — tap here to start typing)", "（{n}件目はまだ空です。ここをタップして入力）", "({n}번째 글이 비어 있어요. 여기를 눌러 입력하세요)"],
    "＋顏文字": ["+ Kaomoji", "＋顔文字", "+ 이모티콘"],
    "刪除": ["Delete", "削除", "삭제"],
    "填入發文框": ["Fill composer", "投稿欄に入力", "작성창에 넣기"],
    "{w}px · 約 {n} 字/行": ["{w}px · ~{n} CJK chars/line", "{w}px · 約{n}文字/行", "{w}px · 줄당 약 {n}자"],
    "點頭像或名字，點開這一則": ["Tap the avatar or name to open this post", "アイコンか名前をタップしてこの投稿を開く", "프로필 사진이나 이름을 눌러 이 글 열기"],
    "← 回到串文列表": ["← Back to feed", "← フィードに戻る", "← 피드로 돌아가기"],
    "串文列表": ["Feed", "フィード", "피드"],
    "點開的那則": ["Opened post", "開いた投稿", "연 글"],
    "點開・下面的串文": ["Opened · posts below", "開いた投稿・下のスレッド", "연 글 · 아래 글"],
    "點開・上面的串文": ["Opened · posts above", "開いた投稿・上のスレッド", "연 글 · 위 글"],
    "網頁版實測": ["measured on web", "Web版で実測", "웹에서 측정"],
    "<b>{w}</b>px · {n} 字/行": ["<b>{w}</b>px · {n} chars/line", "<b>{w}</b>px · {n}文字/行", "<b>{w}</b>px · 줄당 {n}자"],
    "{n} 行": ["{n} lines", "{n}行", "{n}줄"],
    "置中依 {name}": ["Center for {name}", "中央揃えの基準：{name}", "가운데 정렬 기준: {name}"],
    "電腦": ["Desktop", "PC", "PC"],
    "手機 {w}": ["Mobile {w}", "スマホ {w}", "모바일 {w}"],
    "列表與點開折衷": ["between feed and opened", "フィードと開いた投稿の中間", "피드와 연 글의 중간"],
    "點開": ["Opened", "開いた投稿", "연 글"],
    "兩邊折衷": ["Balance both", "両方の中間", "둘의 중간"],
    "選到的行太長，會自動換行，沒辦法置中": ["The selected line is too long and wraps, so it can't be centered", "選択した行が長すぎて折り返すため、中央揃えできません", "선택한 줄이 너무 길어 줄바꿈되므로 가운데 정렬할 수 없어요"],
    "已經是這個對齊了": ["Already aligned this way", "すでにこの揃え方です", "이미 이렇게 정렬되어 있어요"],
    "已靠左": ["Aligned left", "左揃えにしました", "왼쪽 정렬했어요"],
    "已依 {name} 置中 {n} 行": ["Centered {n} lines for {name}", "{name}基準で{n}行を中央揃えしました", "{name} 기준으로 {n}줄을 가운데 정렬했어요"],
    "，{n} 行太長沒動": [", {n} lines too long, left as is", "、{n}行は長すぎるためそのまま", ", {n}줄은 너무 길어 그대로 두었어요"],
    "之後按「置中」會依{name}；已經置中的行，選取後再按一次就會重算": ["\"Center\" now uses {name}. To recalculate a centered line, select it and press again", "今後の「中央揃え」は{name}基準です。中央揃え済みの行は、選択してもう一度押すと再計算します", "이제 「가운데 정렬」은 {name} 기준이에요. 이미 정렬한 줄은 선택 후 다시 누르면 다시 계산해요"],
    "手勢（臉不變）": ["Arms (face stays)", "手（顔はそのまま）", "손 모양(얼굴은 그대로)"],
    "放不下，縮小成 {n}% 顯示（換行位置不變）": ["Scaled to {n}% to fit (line breaks unchanged)", "収まらないため{n}%に縮小表示（改行位置は変わりません）", "화면에 맞게 {n}%로 축소했어요(줄바꿈 위치는 그대로)"],
    "已刪除第 {n} 則，按「復原」可以救回來": ["Deleted post {n}. Press \"Undo\" to bring it back", "{n}件目を削除しました。「元に戻す」で復元できます", "{n}번째 글을 삭제했어요. 「되돌리기」로 복구할 수 있어요"],
    "第 {n} 則已複製，切到翠貼上": ["Post {n} copied — paste it into Threads", "{n}件目をコピーしました。Threadsに貼り付けてね", "{n}번째 글을 복사했어요. 스레드에 붙여넣으세요"],
    "超過 500 字，已打開翠的發文框，請自己貼上": ["Over 500 characters — the Threads composer is open, please paste it yourself", "500文字を超えたため、Threadsの投稿欄だけ開きました。貼り付けてください", "500자를 넘어서 스레드 작성창만 열었어요. 직접 붙여넣어 주세요"],
    "這則還沒有內容": ["This post is empty", "この投稿はまだ空です", "이 글은 아직 비어 있어요"],
    "已複製": ["Copied", "コピーしました", "복사됨"],
    "瀏覽器擋住了複製，請手動全選後複製": ["The browser blocked copying. Please select all and copy manually", "ブラウザがコピーをブロックしました。全選択して手動でコピーしてください", "브라우저가 복사를 막았어요. 전체 선택 후 직접 복사해 주세요"],
    "已復原上一步": ["Undone", "元に戻しました", "되돌렸어요"],
    "全文已複製": ["All posts copied", "全文をコピーしました", "전체 글을 복사했어요"],
    "還沒有內容可以填": ["Nothing to fill yet", "入力する内容がまだありません", "넣을 내용이 아직 없어요"],
    "先切到翠的分頁，按「有什麼新鮮事？」打開發文視窗；分頁是在安裝前打開的話，重新整理一次": ["Switch to your Threads tab and click \"What's new?\" to open the composer. If the tab was opened before installing, reload it once", "Threadsのタブで「What's new?」を押して投稿画面を開いてください。インストール前に開いたタブなら一度再読み込みしてください", "스레드 탭에서 「새로운 소식이 있나요?」를 눌러 작성창을 열어 주세요. 설치 전에 연 탭이면 한 번 새로고침하세요"],
    "先在翠按「有什麼新鮮事？」打開發文視窗": ["Click \"What's new?\" on Threads to open the composer first", "先にThreadsで「What's new?」を押して投稿画面を開いてください", "먼저 스레드에서 「새로운 소식이 있나요?」를 눌러 작성창을 열어 주세요"],
    "填入失敗，請改用「複製」貼上": ["Couldn't fill it in — please use \"Copy\" and paste instead", "入力できませんでした。「コピー」して貼り付けてください", "넣지 못했어요. 「복사」 후 붙여넣어 주세요"],
    "已填入 {n} 則，確認後在翠按「發佈」": ["Filled {n} posts. Check them, then press \"Post\" on Threads", "{n}件入力しました。確認してThreadsで「投稿」を押してください", "{n}개 글을 넣었어요. 확인 후 스레드에서 「게시」를 누르세요"],
    "只填入前 {n} 則，後面的請用「複製」貼上": ["Only the first {n} posts were filled — copy and paste the rest", "最初の{n}件だけ入力しました。残りは「コピー」して貼り付けてください", "앞의 {n}개 글만 넣었어요. 나머지는 「복사」해서 붙여넣으세요"],
    "（發文視窗多的 {n} 則沒動）": [" ({n} extra posts in the composer were left untouched)", "（投稿画面の余分な{n}件はそのままです）", "(작성창의 남는 {n}개 글은 그대로 두었어요)"],
    "已從發文框帶入 {n} 則": ["Imported {n} posts from the composer", "投稿欄から{n}件取り込みました", "작성창에서 {n}개 글을 가져왔어요"],
    "剪貼簿裡沒有文字": ["No text on the clipboard", "クリップボードにテキストがありません", "클립보드에 텍스트가 없어요"],
    "已貼上成新的一則": ["Pasted as a new post", "新しい投稿として貼り付けました", "새 글로 붙여넣었어요"],
    "瀏覽器不讓讀剪貼簿，請在文字框長按貼上": ["The browser won't let us read the clipboard. Long-press in a text box to paste", "ブラウザがクリップボードの読み取りを許可していません。入力欄を長押しして貼り付けてください", "브라우저가 클립보드 읽기를 허용하지 않아요. 입력칸을 길게 눌러 붙여넣으세요"],
    "剪貼簿整理好了，回翠貼上": ["Clipboard tidied — paste it back into Threads", "クリップボードを整えました。Threadsに貼り付けてね", "클립보드를 정리했어요. 스레드에 붙여넣으세요"],
    "半形空白不會自動轉換": ["Half-width spaces won't be converted", "半角スペースは自動変換しません", "반각 공백을 자동으로 바꾸지 않아요"],
    "打字時，連續和行首的半形空白會自動變全形": ["While typing, repeated and leading half-width spaces become full-width", "入力中、連続・行頭の半角スペースを自動で全角にします", "입력하는 동안 연속되거나 줄 맨 앞의 반각 공백을 전각으로 바꿔요"],
    "打字時，整則的半形空白都會變全形（英文字間距也會變寬）": ["While typing, every half-width space becomes full-width (gaps between English words get wider too)", "入力中、すべての半角スペースを全角にします（英単語の間隔も広がります）", "입력하는 동안 모든 반각 공백을 전각으로 바꿔요(영어 단어 사이도 넓어져요)"],
    "之後按複製會直接打開翠的發文框": ["Copying will now open the Threads composer", "コピーするとThreadsの投稿欄を開きます", "이제 복사하면 스레드 작성창이 열려요"],
    "之後按複製只會複製，不會跳到翠": ["Copying will now only copy, without opening Threads", "コピーのみ行い、Threadsは開きません", "이제 복사만 하고 스레드는 열지 않아요"],
    "已清空，按「復原」可以救回來": ["Cleared. Press \"Undo\" to bring it back", "クリアしました。「元に戻す」で復元できます", "비웠어요. 「되돌리기」로 복구할 수 있어요"],
    "左邊打草稿\n右邊看翠上的樣子": ["Draft on the left,\nsee it as on Threads on the right", "左で下書き、\n右でThreadsでの見え方", "왼쪽에서 초안을 쓰고\n오른쪽에서 스레드 모습 확인"],
    "每一則串文一個框，字數、行數即時算好。也可以直接在右邊預覽裡打字，兩邊會同步。": ["One box per post, with live character and line counts. You can also type straight into the preview on the right — both stay in sync.", "投稿ごとに1つの入力欄。文字数と行数をリアルタイムで表示します。右のプレビューに直接書いても両方が同期します。", "글마다 입력칸이 하나씩 있고 글자 수와 줄 수를 바로 계산해요. 오른쪽 미리보기에 바로 써도 양쪽이 동기화돼요."],
    "滑過去，\n還是點開看？": ["Scrolled past,\nor opened?", "流し見される？\nそれとも開かれる？", "스크롤로 지나칠까,\n열어서 볼까?"],
    "串文列表和點開貼文的文字寬度不同，換行位置也不同。點預覽裡的頭像或名字，也會點開那一則。": ["The feed and an opened post have different text widths, so lines break in different places. Tapping an avatar or name in the preview opens that post too.", "フィードと開いた投稿では文字の幅が違うため、改行位置も変わります。プレビューのアイコンや名前をタップしてもその投稿を開けます。", "피드와 연 글은 글자 폭이 달라서 줄바꿈 위치도 달라요. 미리보기에서 프로필 사진이나 이름을 눌러도 그 글이 열려요."],
    "電腦和手機\n一行放的字差很多": ["Desktop and mobile\nfit very different line lengths", "PCとスマホで\n1行の文字数が大きく違う", "PC와 모바일은\n한 줄 글자 수가 크게 달라요"],
    "電腦版一行大約 36 個中文字，手機大約 21 個。先切到讀者最常用的裝置再排。": ["A desktop line fits about 36 CJK characters, mobile about 21. Switch to the device your readers use most before formatting.", "PC版は1行約36文字、スマホは約21文字。読者がよく使う端末に切り替えてから整えましょう。", "PC는 한 줄에 약 36자, 모바일은 약 21자예요. 독자가 많이 쓰는 기기로 바꾼 뒤 꾸미세요."],
    "選一支手機的寬度": ["Pick a phone width", "スマホの幅を選ぶ", "휴대폰 폭 고르기"],
    "段落間距\n不會被吃掉": ["Paragraph spacing\nstays put", "段落の間隔が\n消えない", "문단 간격이\n사라지지 않아요"],
    "翠會刪掉空白行。打開後按複製，會在空白行塞入看不見的點字空白，貼上去間距就留住了。": ["Threads removes blank lines. With this on, copying fills blank lines with an invisible Braille blank, so the spacing survives when you paste.", "Threadsは空行を消してしまいます。オンにしてコピーすると、空行に見えない点字の空白を入れるので、貼り付けても間隔が残ります。", "스레드는 빈 줄을 지워요. 켜고 복사하면 빈 줄에 보이지 않는 점자 공백을 넣어서 붙여넣어도 간격이 유지돼요."],
    "連打的空白\n自動變全形": ["Repeated spaces\nbecome full-width", "連続スペースを\n自動で全角に", "연속 공백을\n자동으로 전각으로"],
    "翠會吃掉連續和行首的半形空白。「會被吃掉的」只轉這兩種，英文單字之間的空白不動。": ["Threads removes repeated and leading half-width spaces. \"Only removed ones\" converts just those two kinds and leaves spaces between English words alone.", "Threadsは連続・行頭の半角スペースを消します。「消えるものだけ」はこの2種類だけを変換し、英単語の間のスペースはそのままです。", "스레드는 연속되거나 줄 맨 앞의 반각 공백을 지워요. 「사라지는 것만」은 이 두 가지만 바꾸고 영어 단어 사이 공백은 그대로 둬요."],
    "置中要顧\n哪一種版型": ["Center for\nwhich layout?", "どのレイアウトで\n中央揃えする？", "어느 레이아웃에\n맞춰 가운데 정렬할까?"],
    "列表和點開的寬度差 48，同一串空白沒辦法兩邊都剛好置中。預設「兩邊折衷」，兩邊都接近置中。": ["The feed and opened views differ by 48px, so the same spaces can't center perfectly in both. The default, \"Balance both\", gets close to centered in each.", "フィードと開いた投稿は幅が48違うため、同じスペースで両方を完全に中央揃えはできません。初期設定の「両方の中間」なら、どちらもほぼ中央になります。", "피드와 연 글은 폭이 48 차이 나서 같은 공백으로 둘 다 정확히 가운데 맞출 수 없어요. 기본값 「둘의 중간」이면 양쪽 모두 거의 가운데예요."],
    "複製完，\n直接跳進翠的發文框": ["Copy, then jump\nstraight into Threads", "コピーしたら\nそのままThreadsの投稿欄へ", "복사하면 바로\n스레드 작성창으로"],
    "按「複製」、「複製全文」或「✨ 整理剪貼簿」後，會直接打開翠 App 的發文框，文字已經填好（500 字以內），連貼上都不用。不想跳過去，可以在這裡關掉。": ["After \"Copy\", \"Copy all\" or \"✨ Tidy clipboard\", the Threads app composer opens with your text already filled in (up to 500 characters) — no pasting needed. Turn it off here if you'd rather stay.", "「コピー」「全文コピー」「✨ クリップボード整理」を押すと、Threadsアプリの投稿欄が開き、文字も入力済み（500文字まで）。貼り付けも不要です。移動したくなければここでオフに。", "「복사」, 「전체 복사」, 「✨ 클립보드 정리」를 누르면 스레드 앱 작성창이 열리고 글도 채워져 있어요(500자까지). 붙여넣을 필요도 없어요. 이동하기 싫으면 여기서 끄세요."],
    "打開這個開關，按「複製」後會在新分頁打開翠的發文視窗並填好文字。電腦預設關，手機預設開：在手機上按複製，會直接跳進翠 App 的發文框。": ["With this on, \"Copy\" opens the Threads composer in a new tab with your text filled in. Off by default on desktop, on by default on mobile, where copying jumps straight into the Threads app.", "オンにすると、「コピー」後に新しいタブでThreadsの投稿画面を開き、文字を入力します。PCは初期オフ、スマホは初期オン：スマホでコピーするとThreadsアプリの投稿欄に直接移動します。", "켜 두면 「복사」 후 새 탭에서 스레드 작성창을 열고 글을 채워요. PC는 기본 꺼짐, 모바일은 기본 켜짐이라 모바일에서 복사하면 스레드 앱 작성창으로 바로 가요."],
    "只想看預覽，\n就把編輯欄收起來": ["Just want the preview?\nHide the editor", "プレビューだけ見たいなら\n編集欄を閉じる", "미리보기만 보고 싶다면\n편집창 숨기기"],
    "關掉文字編輯欄，預覽會變寬，直接在預覽裡編輯就好。": ["Turn off the editor to widen the preview, then edit right in the preview.", "テキスト編集欄をオフにするとプレビューが広くなります。プレビュー内で直接編集できます。", "편집창을 끄면 미리보기가 넓어져요. 미리보기에서 바로 편집하면 돼요."],
    "選一段英文，\n點一下就換字型": ["Select English text,\ntap to change its font", "英字を選んで\nタップでフォント変更", "영문을 선택하고\n눌러서 글꼴 바꾸기"],
    "看示範：分別選取「Layout」和「Ruler」，換成粗體和草寫。可以一直換，按「一般」就變回來。": ["Watch: \"Layout\" and \"Ruler\" are selected and switched to bold and script. Change as often as you like — \"Normal\" turns it back.", "デモ：「Layout」と「Ruler」をそれぞれ選択して、太字と筆記体に。何度でも変えられて、「標準」で元に戻ります。", "시연: 「Layout」과 「Ruler」를 각각 선택해 굵게, 필기체로 바꿔요. 몇 번이든 바꿀 수 있고 「기본」을 누르면 돌아와요."],
    "點一下顏文字，\n換臉、換手勢": ["Tap a kaomoji\nto swap face and arms", "顔文字をタップして\n顔と手を変える", "이모티콘을 눌러\n얼굴과 손 모양 바꾸기"],
    "有粉紅虛線的顏文字點一下，就能挑表情和手勢；懶得挑就按骰子隨機。": ["Tap a kaomoji with a pink dotted underline to pick a face and arms, or roll the dice for a random one.", "ピンクの点線がある顔文字をタップすると、表情と手を選べます。迷ったらサイコロでランダムに。", "분홍 점선이 있는 이모티콘을 누르면 표정과 손 모양을 고를 수 있어요. 고르기 귀찮으면 주사위로 랜덤!"],
    "加到主畫面，\n當 App 用": ["Add to Home Screen,\nuse it like an app", "ホーム画面に追加して\nアプリのように", "홈 화면에 추가해\n앱처럼 쓰기"],
    "看示範：Chrome 右上角 ⋮ → 「安裝應用程式」→ 安裝。之後從主畫面打開就是全螢幕，在翠 App 按分享也能直接選翠排版尺。": ["Watch: Chrome menu ⋮ (top right) → \"Install app\" → Install. It then opens full screen from your home screen, and you can pick Threads Ruler from Share in the Threads app.", "デモ：Chrome右上の ⋮ →「アプリをインストール」→ インストール。ホーム画面から全画面で開けて、Threadsアプリの共有からThreads Rulerを選べます。", "시연: Chrome 오른쪽 위 ⋮ → 「앱 설치」 → 설치. 이후 홈 화면에서 전체 화면으로 열리고, 스레드 앱의 공유에서 Threads Ruler를 바로 고를 수 있어요."],
    "看示範：用 Safari 打開這個網站 → 下方的分享按鈕 → 「加入主畫面」→ 加入。之後從主畫面打開就是全螢幕，沒網路也能用。": ["Watch: open this site in Safari → Share button at the bottom → \"Add to Home Screen\" → Add. It then opens full screen from your home screen and works offline.", "デモ：Safariでこのサイトを開く → 下の共有ボタン →「ホーム画面に追加」→ 追加。ホーム画面から全画面で開けて、オフラインでも使えます。", "시연: Safari로 이 사이트 열기 → 아래 공유 버튼 → 「홈 화면에 추가」 → 추가. 이후 홈 화면에서 전체 화면으로 열리고 오프라인에서도 쓸 수 있어요."],
    "開始使用": ["Get started", "はじめる", "시작하기"],
    "下一步": ["Next", "次へ", "다음"],
    "略過導覽": ["Skip tour", "ツアーをスキップ", "둘러보기 건너뛰기"],
    "上一步": ["Back", "戻る", "이전"],
    "↻ 再看一次": ["↻ Replay", "↻ もう一度", "↻ 다시 보기"],
    "新分頁": ["New tab", "新しいタブ", "새 탭"],
    "書籤": ["Bookmarks", "ブックマーク", "북마크"],
    "下載": ["Downloads", "ダウンロード", "다운로드"],
    "安裝應用程式": ["Install app", "アプリをインストール", "앱 설치"],
    "拷貝": ["Copy", "コピー", "복사"],
    "加入閱讀列表": ["Add to Reading List", "リーディングリストに追加", "읽기 목록에 추가"],
    "加入書籤": ["Add Bookmark", "ブックマークを追加", "북마크 추가"],
    "加入主畫面": ["Add to Home Screen", "ホーム画面に追加", "홈 화면에 추가"],
    "翠排版尺": ["Threads Ruler", "Threads Ruler", "Threads Ruler"],
    "照翠實際的寬度排版，直接在預覽裡寫。": ["Format at Threads' real widths — type right in the preview.", "Threadsの実際の幅でレイアウト。プレビューに直接書けます。", "스레드의 실제 폭으로 꾸미고, 미리보기에 바로 쓰세요."],
    "要安裝應用程式嗎？": ["Install app?", "アプリをインストールしますか？", "앱을 설치할까요?"],
    "安裝": ["Install", "インストール", "설치"],
    "取消": ["Cancel", "キャンセル", "취소"],
    "加入": ["Add", "追加", "추가"],
    "已加到第 {n} 則": ["Added to post {n}", "{n}件目に追加しました", "{n}번째 글에 추가했어요"],
    "點一下插進游標的位置，沒點過預覽就加在最後一則": ["Tap to insert at the cursor; if you haven't clicked the preview, it goes at the end of the last post", "タップでカーソル位置に挿入。プレビューを触っていなければ最後の投稿に追加します", "누르면 커서 위치에 넣어요. 미리보기를 누른 적이 없으면 마지막 글 끝에 넣어요"],
    "點一下插進游標的位置；框和放字的插進去後，直接在預覽改字": ["Tap to insert at the cursor. For frames and text lines, edit the words right in the preview", "タップでカーソル位置に挿入。枠や文字入りのものは挿入後にプレビューで文字を編集できます", "누르면 커서 위치에 넣어요. 테두리·글자 넣기는 넣은 뒤 미리보기에서 글자를 고치세요"],
    "框・放字": ["Frames · text", "枠・文字入り", "테두리 · 글자"],
    "點一下插進去，會自己空一行；切到「手機」看會不會換行": ["Tap to insert on its own lines; switch to \"Mobile\" to check it doesn't wrap", "タップで前後に空行を入れて挿入。「スマホ」に切り替えて折り返さないか確認を", "누르면 앞뒤로 한 줄 띄워 넣어요. 「모바일」로 바꿔 줄바꿈되는지 확인하세요"],
    "大型顏文字": ["Big kaomoji", "大きい顔文字", "큰 이모티콘"],
    "{name}已複製，切到翠貼上": ["{name} copied — paste it into Threads", "{name}をコピーしました。Threadsに貼り付けてね", "{name} 복사했어요. 스레드에 붙여넣으세요"],
    "已複製，切到翠貼上": ["Copied — paste it into Threads", "コピーしました。Threadsに貼り付けてね", "복사했어요. 스레드에 붙여넣으세요"],
    "已放進排版，看看電腦和手機預覽有沒有歪": ["Added to the layout — check the desktop and mobile previews for misalignment", "レイアウトに追加しました。PCとスマホのプレビューでずれていないか確認してね", "레이아웃에 넣었어요. PC와 모바일 미리보기에서 틀어지지 않았는지 확인하세요"],
    "已帶入文字，排好按「複製全文」回翠貼上": ["Text imported. When it looks right, press \"Copy all\" and paste into Threads", "テキストを取り込みました。整えたら「全文コピー」でThreadsに貼り付けてね", "글을 가져왔어요. 다 꾸몄으면 「전체 복사」 후 스레드에 붙여넣으세요"],
    "作者": ["by", "作者", "제작"],
    "文字編輯欄": ["Text editor", "テキスト編集欄", "텍스트 편집창"],
    "範例草稿": ["Sample draft", "サンプル", "예시 초안"],
    "每則上限 500 字": ["500 characters per post", "1投稿500文字まで", "글당 최대 500자"],
    "＋ 新增一則串文": ["+ Add a post", "＋ 投稿を追加", "+ 글 추가"],
    "翠預覽": ["Threads preview", "Threadsプレビュー", "스레드 미리보기"],
    "檢視": ["View", "表示", "보기"],
    "點開貼文": ["Opened post", "開いた投稿", "연 글"],
    "裝置": ["Device", "端末", "기기"],
    "手機": ["Mobile", "スマホ", "모바일"],
    "螢幕寬": ["Screen", "画面幅", "화면 폭"],
    "本機": ["This device", "この端末", "이 기기"],
    "把剪貼簿裡的字整理好（空白行保留、會被吃掉的半形空白轉全形），回翠直接貼上": ["Tidy the text on your clipboard (keep blank lines, convert removable spaces to full-width), then paste it back into Threads", "クリップボードの文字を整えて（空行を保持、消える半角スペースを全角に）、そのままThreadsに貼り付け", "클립보드 글을 정리해서(빈 줄 유지, 사라지는 반각 공백을 전각으로) 스레드에 바로 붙여넣기"],
    "✨ 整理剪貼簿": ["✨ Tidy clipboard", "✨ クリップボード整理", "✨ 클립보드 정리"],
    "▶ 導覽": ["▶ Tour", "▶ ツアー", "▶ 둘러보기"],
    "？ 使用說明": ["? Help", "？ 使い方", "? 도움말"],
    "常用動作": ["Quick actions", "よく使う操作", "자주 쓰는 동작"],
    "↶ 復原": ["↶ Undo", "↶ 元に戻す", "↶ 되돌리기"],
    "＋ 新增一則": ["+ Add post", "＋ 投稿を追加", "+ 글 추가"],
    "📋 貼上": ["📋 Paste", "📋 貼り付け", "📋 붙여넣기"],
    "填入整串": ["Fill thread", "スレッドを入力", "스레드 전체 넣기"],
    "複製全文": ["Copy all", "全文コピー", "전체 복사"],
    "打字": ["Typing", "入力", "입력"],
    "點預覽裡的文字直接改，換行位置即時跟著變。": ["Click the text in the preview to edit it; line breaks update as you type.", "プレビューの文字をタップして直接編集。改行位置もリアルタイムで変わります。", "미리보기의 글을 눌러 바로 고치면 줄바꿈 위치도 바로 바뀌어요."],
    "點某一則的頭像或名字，就會點開那一則；上面的串文維持列表寬度，點開的那則變寬。": ["Click a post's avatar or name to open it. Posts above keep the feed width; the opened one gets wider.", "投稿のアイコンか名前をタップするとその投稿を開きます。上の投稿はフィード幅のまま、開いた投稿は広くなります。", "글의 프로필 사진이나 이름을 누르면 그 글이 열려요. 위 글은 피드 폭 그대로, 연 글은 넓어져요."],
    "選取文字": ["Selecting text", "テキストを選択", "글 선택"],
    "跳出「置中／靠左」和英文特殊字體，點一下就換。置中要顧哪種版型，在上方「置中依據」切換。": ["Shows \"Center / Left\" and fancy English fonts — one tap to apply. Choose which layout centering targets under \"Center for\".", "「中央／左揃え」と英字の特殊フォントが出ます。タップで変更。中央揃えの基準は上の「中央揃えの基準」で切り替え。", "「가운데 / 왼쪽」과 영문 특수 글꼴이 나와요. 눌러서 바로 바꾸세요. 가운데 정렬 기준은 위의 「가운데 정렬 기준」에서 바꿔요."],
    "顏文字": ["Kaomoji", "顔文字", "이모티콘"],
    "有粉紅虛線的顏文字點一下，可以換臉、換手勢。": ["Tap a kaomoji with a pink dotted underline to swap its face or arms.", "ピンクの点線がある顔文字をタップすると、顔や手を変えられます。", "분홍 점선이 있는 이모티콘을 누르면 얼굴과 손 모양을 바꿀 수 있어요."],
    "每則工具": ["Post tools", "投稿ごとのツール", "글별 도구"],
    "滑到某一則上：字數與行數、＋顏文字、刪除、複製。": ["Hover over a post: character and line count, + Kaomoji, Delete, Copy.", "投稿にカーソルを合わせると：文字数と行数、＋顔文字、削除、コピー。", "글 위에 마우스를 올리면: 글자 수와 줄 수, + 이모티콘, 삭제, 복사."],
    "在翠上排版": ["Format on Threads", "Threads上で整える", "스레드에서 바로 꾸미기"],
    "在翠打開發文視窗，旁邊會出現「📏 翠排版尺」工具卡：選取文字按置中／靠左、換英文字體；游標放在顏文字上可以換臉換手勢；發佈前按「✨ 發佈前整理」，空白行和空白就不會被吃掉。": ["Open the Threads composer and a \"📏 Threads Ruler\" card appears beside it: select text to center / left-align or change English fonts; put the cursor on a kaomoji to swap its face and arms; press \"✨ Tidy before posting\" so blank lines and spaces aren't removed.", "Threadsで投稿画面を開くと、横に「📏 Threads Ruler」ツールカードが出ます：テキストを選んで中央／左揃え、英字フォント変更。顔文字にカーソルを置くと顔や手を変更。投稿前に「✨ 投稿前に整える」で空行やスペースが消えません。", "스레드에서 작성창을 열면 옆에 「📏 Threads Ruler」 도구 카드가 나와요: 글을 선택해 가운데/왼쪽 정렬, 영문 글꼴 변경. 이모티콘에 커서를 두면 얼굴·손 모양 변경. 게시 전에 「✨ 게시 전 정리」를 누르면 빈 줄과 공백이 사라지지 않아요."],
    "填入翠": ["Fill into Threads", "Threadsに入力", "스레드에 넣기"],
    "在翠按「有什麼新鮮事？」打開發文視窗，再按「填入整串」或某一則的「填入發文框」，排好的字會直接填進去，確認後自己按發佈。翠的發文視窗旁邊也有「用翠排版尺排版」按鈕，可以把寫到一半的字帶進來。": ["On Threads, click \"What's new?\" to open the composer, then press \"Fill thread\" or a post's \"Fill composer\" to insert your formatted text. Check it and press Post yourself. There's also a \"Format with Threads Ruler\" button next to the composer to bring in a half-written draft.", "Threadsで「What's new?」を押して投稿画面を開き、「スレッドを入力」または各投稿の「投稿欄に入力」を押すと、整えた文字が入力されます。確認して自分で投稿してください。投稿画面の横の「Threads Rulerで整える」ボタンで、書きかけの文字も取り込めます。", "스레드에서 「새로운 소식이 있나요?」를 눌러 작성창을 연 뒤 「스레드 전체 넣기」나 글별 「작성창에 넣기」를 누르면 꾸민 글이 바로 들어가요. 확인 후 직접 게시하세요. 작성창 옆 「Threads Ruler로 꾸미기」 버튼으로 쓰던 글을 가져올 수도 있어요."],
    "加到主畫面": ["Add to Home Screen", "ホーム画面に追加", "홈 화면에 추가"],
    "手機可以把翠排版尺加到主畫面當 App 用。": ["On your phone, add Threads Ruler to your home screen and use it like an app.", "スマホではThreads Rulerをホーム画面に追加してアプリのように使えます。", "휴대폰에서는 Threads Ruler를 홈 화면에 추가해 앱처럼 쓸 수 있어요."],
    "📲 看示範": ["📲 Show me", "📲 デモを見る", "📲 시연 보기"],
    "寬度讀數": ["Width readout", "幅の表示", "폭 표시"],
    "粉紅框是目前版型；預覽放不下時會整張等比縮小，換行位置不變。": ["The pink box is the current layout. If the preview doesn't fit, it scales down as a whole — line breaks stay the same.", "ピンクの枠が現在のレイアウトです。プレビューが収まらないときは全体を縮小しますが、改行位置は変わりません。", "분홍 테두리가 현재 레이아웃이에요. 미리보기가 안 들어가면 전체를 비율대로 줄이지만 줄바꿈 위치는 그대로예요."],
    "設定": ["Settings", "設定", "설정"],
    "保留空白行": ["Keep blank lines", "空行を保持", "빈 줄 유지"],
    "複製時在空白行塞入看不見的點字空白（U+2800），翠就不會把段落間距吃掉": ["When copying, blank lines get an invisible Braille blank (U+2800) so Threads keeps your paragraph spacing", "コピー時に空行へ見えない点字の空白（U+2800）を入れるので、Threadsで段落の間隔が消えません", "복사할 때 빈 줄에 보이지 않는 점자 공백(U+2800)을 넣어 스레드가 문단 간격을 지우지 않아요"],
    "翠會把連續的半形空白縮成一個、把行首的半形空白刪掉": ["Threads shrinks repeated half-width spaces to one and removes them at the start of a line", "Threadsは連続する半角スペースを1つにまとめ、行頭の半角スペースを削除します", "스레드는 연속된 반각 공백을 하나로 줄이고 줄 맨 앞의 반각 공백을 지워요"],
    "半形空白轉全形": ["Full-width spaces", "半角→全角スペース", "반각 공백을 전각으로"],
    "關": ["Off", "オフ", "끔"],
    "會被吃掉的": ["Only removed ones", "消えるものだけ", "사라지는 것만"],
    "全部": ["All", "すべて", "전부"],
    "串文列表和點開後的寬度不同，行首補空白沒辦法兩邊都剛好置中": ["The feed and opened widths differ, so leading spaces can't center perfectly in both", "フィードと開いた投稿は幅が違うため、行頭スペースで両方を完全に中央揃えはできません", "피드와 연 글은 폭이 달라서 줄 앞 공백으로 둘 다 정확히 가운데 맞출 수 없어요"],
    "置中依據": ["Center for", "中央揃えの基準", "가운데 정렬 기준"],
    "列表": ["Feed", "フィード", "피드"],
    "複製後自動打開翠的發文框，並把文字填好（500 字以內）": ["After copying, open the Threads composer with your text filled in (up to 500 characters)", "コピー後にThreadsの投稿欄を開き、文字を入力します（500文字まで）", "복사 후 스레드 작성창을 열고 글을 채워요(500자까지)"],
    "複製後打開翠": ["Open Threads after copy", "コピー後にThreadsを開く", "복사 후 스레드 열기"],
    "清空全部": ["Clear all", "すべてクリア", "모두 지우기"],
    "確認清空": ["Confirm clear", "クリアの確認", "지우기 확인"],
    "確定清空全部串文？": ["Clear all posts?", "すべての投稿をクリアしますか？", "모든 글을 지울까요?"],
    "清空": ["Clear", "クリア", "지우기"],
    "素材": ["Materials", "素材", "소재"],
    "素材種類": ["Material type", "素材の種類", "소재 종류"],
    "分隔線": ["Dividers", "区切り線", "구분선"],
    "寬度怎麼量的、空白與置中的規則": ["How the widths were measured, and the rules for spaces and centering", "幅の測り方、スペースと中央揃えのルール", "폭 측정 방법, 공백과 가운데 정렬 규칙"],
    "電腦版": ["Desktop", "PC版", "PC"],
    "2026-09-16 在 threads.com 網頁版量測：卡片 639px、左右留白 24px；串文列表頭像佔 48px，文字寬 543px；點開的那則頭像移到名字那一行，文字吃滿 591px；下面接續的串文 553px。字級 15px、行高 21px。": ["Measured on threads.com on 2026-09-16: card 639px with 24px side padding; in the feed the avatar takes 48px and text is 543px wide; in an opened post the avatar moves to the name row and text fills 591px; posts below are 553px. Font size 15px, line height 21px.", "2026-09-16にthreads.comのWeb版で計測：カード639px、左右余白24px。フィードではアイコンが48px、文字幅543px。開いた投稿はアイコンが名前の行に移り、文字幅591px。下に続く投稿は553px。文字サイズ15px、行の高さ21px。", "2026-09-16 threads.com 웹에서 측정: 카드 639px, 좌우 여백 24px. 피드에서는 프로필 사진이 48px, 글 폭 543px. 연 글은 프로필 사진이 이름 줄로 올라가 글 폭 591px. 아래 이어지는 글은 553px. 글자 크기 15px, 줄 높이 21px."],
    "手機版": ["Mobile", "スマホ版", "모바일"],
    "2026-09-17 用 iPhone（393pt 寬）的翠 App 截圖逐像素量：左右留白 12、串文列表文字從 60 開始（頭像佔 48，圖片也是這個寬度），點開的那則吃滿整排，上面的串文維持列表寬度；中文一字 15、行高 23。點開後「下面」的串文寬度還沒驗證，暫用網頁版比例。在手機上打開時，「本機」會用你螢幕的實際寬度。": ["Measured pixel by pixel on 2026-09-17 from Threads app screenshots on an iPhone (393pt wide): 12 side padding; feed text starts at 60 (the avatar takes 48, images use the same width); an opened post uses the full width while posts above keep the feed width. One CJK character is 15, line height 23. The width of posts below an opened one isn't verified yet and uses the web ratio. On a phone, \"This device\" uses your actual screen width.", "2026-09-17にiPhone（幅393pt）のThreadsアプリのスクリーンショットを1ピクセルずつ計測：左右余白12、フィードの文字は60から（アイコン48、画像も同じ幅）。開いた投稿は横幅いっぱい、上の投稿はフィード幅のまま。全角1文字15、行の高さ23。開いた投稿の「下」の幅は未検証のため、Web版の比率を使っています。スマホで開くと「この端末」は実際の画面幅を使います。", "2026-09-17 iPhone(폭 393pt)의 스레드 앱 스크린샷을 픽셀 단위로 측정: 좌우 여백 12, 피드 글은 60부터 시작(프로필 사진 48, 이미지도 같은 폭). 연 글은 전체 폭, 위 글은 피드 폭 유지. 한 글자 15, 줄 높이 23. 연 글 「아래」 글의 폭은 아직 검증 전이라 웹 비율을 써요. 휴대폰에서 열면 「이 기기」는 실제 화면 폭을 써요."],
    "空白": ["Spaces", "スペース", "공백"],
    "翠會把連續的半形空白縮成一個、把行首的半形空白刪掉，全形空白不會。「會被吃掉的」只轉這兩種，英文單字間的單一空白保持半形；「全部」連英文字間距都會變寬。": ["Threads shrinks repeated half-width spaces to one and removes leading ones; full-width spaces are kept. \"Only removed ones\" converts just those two cases and leaves single spaces between English words half-width; \"All\" widens the gaps between English words too.", "Threadsは連続する半角スペースを1つにまとめ、行頭の半角スペースを削除しますが、全角スペースは残ります。「消えるものだけ」はこの2種類だけを変換し、英単語間の1つのスペースは半角のまま。「すべて」は英単語の間隔も広くなります。", "스레드는 연속된 반각 공백을 하나로 줄이고 줄 맨 앞의 반각 공백을 지우지만, 전각 공백은 남겨요. 「사라지는 것만」은 이 두 경우만 바꾸고 영어 단어 사이의 공백 하나는 반각으로 둬요. 「전부」는 영어 단어 사이도 넓어져요."],
    "置中": ["Center", "中央揃え", "가운데 정렬"],
    "翠本身沒有置中，這裡是在行首補全形空白（一個約 15px）。串文列表和點開後的文字寬度差 48，同一串空白不可能兩邊都剛好置中（翠 App 上也一樣），只照列表置中的話，點開後會往左偏約 24。所以預設「兩邊折衷」：依兩種寬度的中間值計算，兩邊各偏大約一個字以內；也可以在上方「置中依據」改成只顧「列表」或「點開」。電腦和手機寬度差很多，會依目前選的裝置計算。": ["Threads has no centering, so this adds full-width spaces at the start of each line (about 15px each). The feed and opened widths differ by 48, so the same spaces can't be exactly centered in both (same in the Threads app). Centering for the feed only shifts the opened post about 24 to the left. The default, \"Balance both\", uses the midpoint, so each is off by less than one character; you can switch \"Center for\" to \"Feed\" or \"Opened\". Desktop and mobile widths differ a lot, so it uses the device you've selected.", "Threadsには中央揃えがないため、行頭に全角スペース（1つ約15px）を足しています。フィードと開いた投稿は幅が48違うので、同じスペースで両方を完全に中央にはできません（Threadsアプリでも同じ）。フィード基準だけで揃えると、開いたときに左へ約24ずれます。そこで初期設定は「両方の中間」：2つの幅の中間で計算し、どちらもずれは1文字以内。上の「中央揃えの基準」で「フィード」や「開いた投稿」だけにもできます。PCとスマホは幅が大きく違うため、選んでいる端末で計算します。", "스레드에는 가운데 정렬이 없어서, 줄 맨 앞에 전각 공백(하나에 약 15px)을 채워요. 피드와 연 글은 폭이 48 차이 나서 같은 공백으로 둘 다 정확히 가운데 맞출 수 없어요(스레드 앱도 마찬가지). 피드 기준으로만 맞추면 연 글에서는 왼쪽으로 약 24 치우쳐요. 그래서 기본값은 「둘의 중간」: 두 폭의 중간값으로 계산해 양쪽 모두 한 글자 이내로만 어긋나요. 위의 「가운데 정렬 기준」에서 「피드」나 「연 글」만 고를 수도 있어요. PC와 모바일은 폭 차이가 커서 지금 고른 기기 기준으로 계산해요."],
    "英文字體": ["English fonts", "英字フォント", "영문 글꼴"],
    "其實是長得像字母的 Unicode 符號，貼到哪裡都看得到；但搜尋找不到、螢幕報讀器也唸不出來，關鍵字和 hashtag 建議保持一般字。": ["These are really Unicode symbols that look like letters, so they show up anywhere you paste them — but search can't find them and screen readers can't read them. Keep keywords and hashtags in normal text.", "実は文字に似たUnicode記号なので、どこに貼っても表示されます。ただし検索には引っかからず、スクリーンリーダーも読み上げられません。キーワードやハッシュタグは通常の文字のままがおすすめです。", "사실 글자처럼 생긴 유니코드 기호라서 어디에 붙여도 보여요. 하지만 검색에 걸리지 않고 스크린 리더도 읽지 못하니, 키워드와 해시태그는 일반 글자로 두세요."],
    "：iPhone 用 Safari 打開網站 → 下方分享按鈕 → 「加入主畫面」；之後從主畫面打開就是全螢幕，沒網路也能用。Android 用 Chrome 選「安裝應用程式」，之後在翠按分享時也能直接選翠排版尺。": [": on iPhone, open the site in Safari → Share button at the bottom → \"Add to Home Screen\". It then opens full screen from your home screen and works offline. On Android, choose \"Install app\" in Chrome; you can then pick Threads Ruler from Share in Threads.", "：iPhoneはSafariでサイトを開く → 下の共有ボタン →「ホーム画面に追加」。ホーム画面から全画面で開けて、オフラインでも使えます。AndroidはChromeで「アプリをインストール」を選ぶと、Threadsの共有からThreads Rulerを直接選べます。", ": iPhone은 Safari로 사이트 열기 → 아래 공유 버튼 → 「홈 화면에 추가」. 이후 홈 화면에서 전체 화면으로 열리고 오프라인에서도 쓸 수 있어요. Android는 Chrome에서 「앱 설치」를 고르면 스레드의 공유에서 Threads Ruler를 바로 고를 수 있어요."],
    "（手機預設開）：按「複製」或「複製全文」後，會直接跳到翠 App 的發文框，文字已經填好（500 字以內；超過就只打開發文框，自己貼上）。按「✨ 整理剪貼簿」也一樣。iPhone 第一次會問要不要在「Threads」中打開，按打開就好。電腦上則是在新分頁打開翠的發文視窗。": [" (on by default on mobile): after \"Copy\" or \"Copy all\", you jump straight to the Threads app composer with the text filled in (up to 500 characters; beyond that only the composer opens and you paste yourself). \"✨ Tidy clipboard\" works the same way. The first time, iPhone asks whether to open in \"Threads\" — tap Open. On desktop, the Threads composer opens in a new tab.", "（スマホは初期オン）：「コピー」か「全文コピー」を押すと、Threadsアプリの投稿欄に移動し、文字も入力済み（500文字まで。超える場合は投稿欄だけ開くので自分で貼り付け）。「✨ クリップボード整理」も同じです。iPhoneでは初回に「Threads」で開くか聞かれるので、開くを押してください。PCでは新しいタブでThreadsの投稿画面を開きます。", "(모바일 기본 켜짐): 「복사」나 「전체 복사」를 누르면 스레드 앱 작성창으로 바로 가고 글도 채워져 있어요(500자까지, 넘으면 작성창만 열리니 직접 붙여넣기). 「✨ 클립보드 정리」도 같아요. iPhone은 처음에 「Threads」에서 열지 물어보니 열기를 누르면 돼요. PC에서는 새 탭에서 스레드 작성창이 열려요."],
    "從翠 App 帶字進來": ["Bring text in from the Threads app", "Threadsアプリから文字を取り込む", "스레드 앱에서 글 가져오기"],
    "：在翠 App 複製文字 → 打開翠排版尺按「📋 貼上」；排好按「複製全文」回翠貼上。": [": copy text in the Threads app → open Threads Ruler and press \"📋 Paste\"; when it looks right, press \"Copy all\" and paste into Threads.", "：Threadsアプリで文字をコピー → Threads Rulerを開いて「📋 貼り付け」。整えたら「全文コピー」でThreadsに貼り付け。", ": 스레드 앱에서 글 복사 → Threads Ruler를 열고 「📋 붙여넣기」. 다 꾸몄으면 「전체 복사」 후 스레드에 붙여넣기."],
    "不想編輯、只想修空白": ["Just fix the spacing, no editing", "編集せずスペースだけ直したい", "편집 없이 공백만 고치기"],
    "：在翠 App 複製 → 按「✨ 整理剪貼簿」→ 回翠貼上，空白行和空白就不會被吃掉。": [": copy in the Threads app → press \"✨ Tidy clipboard\" → paste back into Threads, and blank lines and spaces won't be removed.", "：Threadsアプリでコピー →「✨ クリップボード整理」→ Threadsに貼り付ければ、空行やスペースが消えません。", ": 스레드 앱에서 복사 → 「✨ 클립보드 정리」 → 스레드에 붙여넣으면 빈 줄과 공백이 사라지지 않아요."],
    "iPhone 捷徑（一鍵帶字進來）": ["iPhone Shortcut (one-tap import)", "iPhoneショートカット（ワンタップで取り込み）", "iPhone 단축어(한 번에 가져오기)"],
    "：打開「捷徑」App → 右上角 ＋ 新增捷徑 → 加入動作「取得剪貼簿」→ 加入「URL 編碼」→ 加入「URL」，內容填": [": open the Shortcuts app → + at the top right to add a shortcut → add the action \"Get Clipboard\" → add \"URL Encode\" → add \"URL\" and enter", "：「ショートカット」アプリを開く → 右上の＋で新規作成 → アクション「クリップボードを取得」を追加 →「URLエンコード」を追加 →「URL」を追加して内容に", ": 「단축어」 앱 열기 → 오른쪽 위 +로 새 단축어 → 동작 「클립보드 가져오기」 추가 → 「URL 인코딩」 추가 → 「URL」을 추가하고 내용에"],
    "後面接上「URL 編碼後的文字」變數 → 加入「打開 URL」→ 命名「翠排版」。之後在翠 App 複製文字，點這個捷徑，翠排版尺就會打開並把字帶進來。想放進分享選單：捷徑設定打開「在分享表單中顯示」，並把第一個動作改成「如果沒有捷徑輸入，就取得剪貼簿」。": ["followed by the \"URL Encoded Text\" variable → add \"Open URLs\" → name it \"Threads Ruler\". Now copy text in the Threads app and run the shortcut: Threads Ruler opens with the text. To add it to the Share sheet, turn on \"Show in Share Sheet\" in the shortcut settings and change the first action to \"If there's no input, get Clipboard\".", "と入力し、後ろに変数「URLエンコードされたテキスト」をつなぐ →「URLを開く」を追加 → 名前を「Threads Ruler」に。Threadsアプリで文字をコピーしてこのショートカットを実行すると、Threads Rulerが開いて文字を取り込みます。共有シートに入れたい場合は、設定で「共有シートに表示」をオンにし、最初のアクションを「入力がない場合はクリップボードを取得」に変えてください。", "를 입력하고 뒤에 「URL 인코딩된 텍스트」 변수를 연결 → 「URL 열기」 추가 → 이름을 「Threads Ruler」로. 이제 스레드 앱에서 글을 복사하고 이 단축어를 실행하면 Threads Ruler가 열리며 글을 가져와요. 공유 시트에 넣으려면 단축어 설정에서 「공유 시트에서 보기」를 켜고, 첫 동작을 「입력이 없으면 클립보드 가져오기」로 바꾸세요."],
    "草稿": ["Drafts", "下書き", "초안"],
    "只存在這台裝置的瀏覽器裡，清除瀏覽器資料或換裝置就會不見，長文記得另外備份。": ["Stored only in this device's browser. They disappear if you clear browser data or switch devices, so back up long posts.", "この端末のブラウザにだけ保存されます。閲覧データを消したり端末を変えると消えるので、長文は別に保存しておきましょう。", "이 기기의 브라우저에만 저장돼요. 브라우저 데이터를 지우거나 기기를 바꾸면 사라지니 긴 글은 따로 백업하세요."],
    "脆（翠、Threads）排版預覽工具": ["Threads post formatter & preview", "Threads投稿レイアウトプレビュー", "스레드 글 꾸미기 · 미리보기 도구"],
    "單獨功能：": ["Tools: ", "単体ツール：", "개별 도구: "],
    "顏文字大全（含大型顏文字）": ["Kaomoji collection (incl. big kaomoji)", "顔文字コレクション（大きい顔文字つき）", "이모티콘 모음(큰 이모티콘 포함)"],
    "英文特殊字體轉換": ["Fancy font generator", "英字特殊フォント変換", "영문 특수 글꼴 변환"],
    "© 2026 alanis6v6 ／ space.grapefruit_ · 授權：": ["© 2026 alanis6v6 / space.grapefruit_ · License: ", "© 2026 alanis6v6 ／ space.grapefruit_ · ライセンス：", "© 2026 alanis6v6 / space.grapefruit_ · 라이선스: "],
    "PolyForm Noncommercial 1.0.0＋畫面署名條款": ["PolyForm Noncommercial 1.0.0 + on-screen attribution terms", "PolyForm Noncommercial 1.0.0＋画面上のクレジット表示条項", "PolyForm Noncommercial 1.0.0 + 화면 저작자 표시 조항"],
    "（禁止他人商業使用；修改或轉載版本須在畫面上保留原作者署名）・": [" (no commercial use by others; modified or redistributed versions must keep the author credit on screen) · ", "（第三者の商用利用禁止。改変・転載版は画面上に原作者のクレジットを残すこと）・", " (타인의 상업적 이용 금지, 수정·재배포본은 화면에 원작자 표시 유지) · "],
    "隱私權政策": ["Privacy policy", "プライバシーポリシー", "개인정보 처리방침"],
    "段落": ["Paragraph", "段落", "문단"],
    "靠左": ["Left", "左揃え", "왼쪽"],
    "點一下就換，可以一直換": ["Tap to switch — as often as you like", "タップで変更、何度でも", "누르면 바뀌고, 몇 번이든 가능"],
    "換顏文字": ["Change kaomoji", "顔文字を変更", "이모티콘 바꾸기"],
    "🎲 隨機": ["🎲 Random", "🎲 ランダム", "🎲 랜덤"],
    "關閉": ["Close", "閉じる", "닫기"],
    "要換的部分": ["Part to change", "変える部分", "바꿀 부분"],
    "換臉": ["Face", "顔を変更", "얼굴"],
    "換手勢": ["Arms", "手を変更", "손 모양"],
    "照翠實際的寬度排版，也能": ["Format at Threads' real widths, and ", "Threadsの実際の幅でレイアウト。", "스레드의 실제 폭으로 꾸미고, "],
    "直接轉換英文特殊字體": ["convert English to fancy fonts", "英字の特殊フォント変換もできます", "영문 특수 글꼴로 바로 변환"],
    "輸入英文或數字，下面同時列出 14 種字體，點「複製」就能貼到翠。想跟排版一起做，在上面的預覽裡選取英文，也會跳出同一組字體。": ["Type English letters or numbers to see all 14 styles below; press \"Copy\" and paste into Threads. To do it while formatting, select English in the preview above and the same fonts pop up.", "英字か数字を入力すると、下に14種類のフォントが並びます。「コピー」でThreadsに貼り付け。レイアウトと一緒にやるなら、上のプレビューで英字を選択すると同じフォントが出ます。", "영문이나 숫자를 입력하면 아래에 14가지 글꼴이 한꺼번에 나와요. 「복사」 후 스레드에 붙여넣으세요. 꾸미면서 하려면 위 미리보기에서 영문을 선택해도 같은 글꼴이 나와요."],
    "要轉換的英文": ["English text to convert", "変換する英字", "변환할 영문"],
    "脆（翠、Threads）英文特殊字體": ["Fancy fonts for Threads", "Threads用 英字特殊フォント", "스레드용 영문 특수 글꼴"],
    "更多工具：": ["More tools: ", "ほかのツール：", "더 많은 도구: "],
    "翠排版尺（換行、空白行、置中）": ["Threads Ruler (line breaks, blank lines, centering)", "Threads Ruler（改行・空行・中央揃え）", "Threads Ruler(줄바꿈, 빈 줄, 가운데 정렬)"],
    "顏文字大全": ["Kaomoji collection", "顔文字コレクション", "이모티콘 모음"],
    "挑顏文字": ["pick kaomoji", "顔文字を選ぶ", "이모티콘 고르기"],
    "點一下就複製，回翠貼上。想邊排版邊換表情，在上面的預覽裡點顏文字就能換臉、換手勢。": ["Tap to copy, then paste into Threads. To change expressions while formatting, tap a kaomoji in the preview above to swap its face and arms.", "タップでコピーしてThreadsに貼り付け。レイアウトしながら表情を変えたいときは、上のプレビューで顔文字をタップすると顔や手を変えられます。", "누르면 복사돼요. 스레드에 붙여넣으세요. 꾸미면서 표정을 바꾸려면 위 미리보기에서 이모티콘을 눌러 얼굴과 손 모양을 바꾸세요."],
    "顏文字分類": ["Kaomoji categories", "顔文字のカテゴリ", "이모티콘 분류"],
    "開心": ["Happy", "うれしい", "기쁨"],
    "大笑": ["Laughing", "大笑い", "폭소"],
    "愛心／喜歡": ["Love", "ハート／好き", "하트 / 좋아"],
    "害羞撒嬌": ["Shy & cute", "照れ・甘え", "수줍음 · 애교"],
    "加油／得意": ["Cheer / proud", "がんばれ／ドヤ", "화이팅 / 뿌듯"],
    "打招呼": ["Hello", "あいさつ", "인사"],
    "哭哭／難過": ["Crying / sad", "泣く／悲しい", "울음 / 슬픔"],
    "嘟嘴／不開心": ["Pouty / upset", "むすっ／不機嫌", "삐짐 / 기분 나쁨"],
    "生氣": ["Angry", "怒り", "화남"],
    "無言／呆": ["Speechless", "無言／ぽかん", "할 말 없음 / 멍"],
    "驚訝": ["Surprised", "びっくり", "놀람"],
    "累／睡覺": ["Tired / sleepy", "疲れ／おやすみ", "피곤 / 잠"],
    "拜託／道歉": ["Please / sorry", "お願い／ごめん", "부탁 / 사과"],
    "吃東西": ["Eating", "食べる", "먹기"],
    "貓貓": ["Cats", "ねこ", "고양이"],
    "狗狗": ["Dogs", "いぬ", "강아지"],
    "熊熊": ["Bears", "くま", "곰"],
    "兔兔": ["Bunnies", "うさぎ", "토끼"],
    "動作": ["Actions", "動作", "동작"],
    "哭哭": ["Crying", "泣く", "울음"],
    "無言傻眼": ["Speechless", "無言・あきれ", "할 말 없음"],
    "翠不是等寬字型，大型顏文字照抄常常會歪。按「放進排版」會變成上面的一則串文，用翠實際的寬度預覽，切到「手機」看會不會換行；確認好再複製。": ["Threads doesn't use a monospaced font, so copied big kaomoji often come out crooked. \"Add to layout\" turns one into a post above, previewed at Threads' real width — switch to \"Mobile\" to check for wrapping, then copy.", "Threadsは等幅フォントではないので、大きい顔文字をそのまま貼るとずれがちです。「レイアウトに追加」で上の投稿になり、Threadsの実際の幅でプレビューできます。「スマホ」に切り替えて折り返さないか確認してからコピーしてね。", "스레드는 고정폭 글꼴이 아니라서 큰 이모티콘을 그대로 붙이면 자주 틀어져요. 「레이아웃에 넣기」를 누르면 위에 글로 들어가 스레드 실제 폭으로 미리 볼 수 있어요. 「모바일」로 바꿔 줄바꿈되는지 확인하고 복사하세요."],
    "放進排版": ["Add to layout", "レイアウトに追加", "레이아웃에 넣기"],
    "貓貓舉牌": ["Cat with sign", "看板ねこ", "팻말 든 고양이"],
    "兔兔舉牌": ["Bunny with sign", "看板うさぎ", "팻말 든 토끼"],
    "貓貓 Hello": ["Cat Hello", "ねこ Hello", "고양이 Hello"],
    "請看這～裡": ["Look here~", "こっち見て～", "여기 봐 주세요~"],
    "音樂播放器": ["Music player", "音楽プレーヤー", "음악 플레이어"],
    "施個小魔法": ["A little magic", "ちょっと魔法", "작은 마법"],
    "魔法兔兔": ["Magic bunny", "魔法うさぎ", "마법 토끼"],
    "來杯咖啡": ["Coffee time", "コーヒーどうぞ", "커피 한 잔"],
    "草泥馬飄走": ["Alpaca drifting away", "アルパカふわ～", "둥실 떠가는 알파카"],
    "盯——": ["Staring…", "じーっ", "빤히——"],
    "飛踢": ["Flying kick", "飛び蹴り", "날아차기"],
    "毛茸茸衝過來": ["Fluffy rush", "もふもふ突撃", "복슬복슬 돌진"],
    "小熊": ["Little bear", "こぐま", "아기곰"],
    "打出問號的時候": ["When you type a question mark", "はてなを打つとき", "물음표를 칠 때"],
    "沒有你我怎麼活": ["Can't live without you", "君なしでは生きられない", "너 없인 못 살아"],
    "脆（翠、Threads）顏文字大全": ["Kaomoji for Threads", "Threads用 顔文字コレクション", "스레드용 이모티콘 모음"],
    "挑分隔線": ["pick dividers", "区切り線を選ぶ", "구분선 고르기"],
    "框和標題線": ["frames & title lines", "枠とタイトル線", "테두리와 제목선"],
    "點一下就複製。手機上翠一行大約 21 個中文字寬，比較長的分隔線在手機會換行；按上面預覽的「手機」可以先看。": ["Tap to copy. On mobile, a Threads line is about 21 CJK characters wide, so longer dividers wrap — press \"Mobile\" in the preview above to check first.", "タップでコピー。スマホのThreadsは1行約21文字幅なので、長い区切り線は折り返します。上のプレビューで「スマホ」を押すと事前に確認できます。", "누르면 복사돼요. 모바일 스레드는 한 줄이 약 21자 폭이라 긴 구분선은 줄바꿈돼요. 위 미리보기의 「모바일」을 눌러 먼저 확인하세요."],
    "分隔線分類": ["Divider categories", "区切り線のカテゴリ", "구분선 분류"],
    "愛心": ["Hearts", "ハート", "하트"],
    "蝴蝶結": ["Bows", "リボン", "리본"],
    "花花": ["Flowers", "お花", "꽃"],
    "星星": ["Stars", "星", "별"],
    "閃閃發亮": ["Sparkles", "キラキラ", "반짝반짝"],
    "線條": ["Lines", "ライン", "선"],
    "小裝飾": ["Ornaments", "小さな飾り", "작은 장식"],
    "框和可以放字的分隔線": ["Frames and dividers with text", "枠と文字入り区切り線", "테두리와 글자 넣는 구분선"],
    "在輸入框打字，框和分隔線會跟著變。按「放進排版」可以用翠實際的寬度預覽，確認好再複製。": ["Type in the box and the frame or divider updates. \"Add to layout\" previews it at Threads' real width before you copy.", "入力欄に文字を打つと、枠や区切り線も変わります。「レイアウトに追加」でThreadsの実際の幅でプレビューしてからコピーしてね。", "입력칸에 글을 쓰면 테두리와 구분선이 따라 바뀌어요. 「레이아웃에 넣기」로 스레드 실제 폭에서 미리 보고 복사하세요."],
    "放字：星星線": ["Text: star line", "文字入り：星ライン", "글자: 별 라인"],
    "放字：花邊": ["Text: floral edge", "文字入り：花の縁", "글자: 꽃 테두리"],
    "放字：華麗線": ["Text: fancy line", "文字入り：華やかライン", "글자: 화려한 라인"],
    "引號框": ["Quote frame", "カギ括弧枠", "인용 테두리"],
    "小花框": ["Little flower frame", "小花の枠", "작은 꽃 테두리"],
    "筆記": ["Note", "メモ", "노트"],
    "虛線框": ["Dashed frame", "点線枠", "점선 테두리"],
    "圓角框": ["Rounded frame", "角丸枠", "둥근 테두리"],
    "雙線框": ["Double frame", "二重線枠", "이중선 테두리"],
    "花朵框": ["Blossom frame", "花の枠", "꽃송이 테두리"],
    "箭頭框": ["Arrow frame", "矢印枠", "화살표 테두리"],
    "十字框": ["Cross frame", "十字枠", "십자 테두리"],
    "月亮框": ["Moon frame", "月の枠", "달 테두리"],
    "小花雙線框": ["Flower double frame", "小花の二重線枠", "꽃 이중선 테두리"],
    "皇冠框": ["Crown frame", "王冠枠", "왕관 테두리"],
    "緞帶框": ["Ribbon frame", "リボン枠", "리본 테두리"],
    "宮廷框": ["Royal frame", "宮廷風の枠", "궁정풍 테두리"],
    "閃耀框": ["Sparkle frame", "キラキラ枠", "반짝 테두리"],
    "星空": ["Starry sky", "星空", "별하늘"],
    "脆（翠、Threads）分隔線與框": ["Dividers & frames for Threads", "Threads用 区切り線と枠", "스레드용 구분선과 테두리"],
    "一般": ["Normal", "標準", "기본"],
    "粗體": ["Bold", "太字", "굵게"],
    "黑體": ["Sans bold", "ゴシック太字", "고딕 굵게"],
    "斜體": ["Italic", "斜体", "기울임"],
    "粗斜體": ["Bold italic", "太字斜体", "굵은 기울임"],
    "草寫": ["Script", "筆記体", "필기체"],
    "細草寫": ["Light script", "細い筆記体", "가는 필기체"],
    "哥德": ["Gothic", "ゴシック体(Fraktur)", "고딕체"],
    "粗哥德": ["Bold gothic", "太いFraktur", "굵은 고딕체"],
    "空心": ["Double-struck", "袋文字", "윤곽체"],
    "打字機": ["Monospace", "タイプライター", "타자기"],
    "全形": ["Full-width", "全角", "전각"],
    "小型大寫": ["Small caps", "スモールキャップ", "작은 대문자"],
    "圓圈": ["Circled", "丸囲み", "동그라미"],
    "方塊": ["Squared", "四角囲み", "네모"],
    "Threads Ruler is a free Threads post formatter and layout preview. See exactly where lines break on Threads web and the iPhone app before you post, keep blank lines and line breaks from being removed, center text, and add fancy fonts (bold, italic, cursive, gothic), kaomoji and dividers. No login, works on desktop and mobile. Interface in Traditional Chinese.": ["Threads Ruler is a free Threads post formatter and layout preview. See exactly where lines break on Threads web and the iPhone app before you post, keep blank lines and line breaks from being removed, center text, and add fancy fonts (bold, italic, cursive, gothic), kaomoji and dividers. No login, works on desktop and mobile.", "Threads Rulerは無料のThreads投稿レイアウト・プレビューツールです。投稿前にThreadsのWeb版とiPhoneアプリでどこで改行されるかを確認し、空行や改行が消えないようにし、中央揃えや英字の特殊フォント（太字・斜体・筆記体・Fraktur）、顔文字、区切り線を追加できます。ログイン不要、PCでもスマホでも使えます。", "Threads Ruler는 무료 스레드 글 꾸미기·미리보기 도구예요. 게시 전에 스레드 웹과 iPhone 앱에서 어디서 줄바꿈되는지 확인하고, 빈 줄과 줄바꿈이 사라지지 않게 하고, 가운데 정렬, 영문 특수 글꼴(굵게, 기울임, 필기체, 고딕), 이모티콘과 구분선을 넣을 수 있어요. 로그인 없이 PC와 모바일에서 쓸 수 있어요."],
    "Threads fancy font generator: type English and copy bold, italic, cursive, script, gothic (fraktur), double-struck, monospace, bubble and small caps text for Threads posts, bios and Instagram. Free, no login.": [null, "Threads用の特殊フォント変換：英字を入力して、太字・斜体・筆記体・Fraktur・袋文字・タイプライター・丸囲み・スモールキャップをコピー。Threadsの投稿やプロフィール、Instagramに使えます。無料・ログイン不要。", "스레드 특수 글꼴 변환기: 영문을 입력하고 굵게, 기울임, 필기체, 고딕(프락투어), 윤곽체, 타자기, 동그라미, 작은 대문자를 복사해 스레드 글과 프로필, 인스타그램에 쓰세요. 무료, 로그인 불필요."],
    "Kaomoji collection: cute Japanese emoticons sorted by mood and animal (happy, shy, crying, angry, cat, dog, bear, bunny), plus big multi-line kaomoji and ASCII art with editable signs. One click to copy for Threads, Instagram and Discord.": [null, "顔文字コレクション：気分や動物（うれしい、照れ、泣く、怒り、ねこ、いぬ、くま、うさぎ）で分けたかわいい顔文字と、看板の文字を変えられる大きい顔文字・AA。ワンクリックでコピーして、Threads、Instagram、Discordに。", "이모티콘 모음: 기분과 동물(기쁨, 수줍음, 울음, 화남, 고양이, 강아지, 곰, 토끼)별로 나눈 귀여운 일본식 이모티콘과, 팻말 글자를 바꿀 수 있는 여러 줄짜리 큰 이모티콘·아스키 아트. 한 번 눌러 복사해 스레드, 인스타그램, 디스코드에 쓰세요."],
    "Cute text dividers and borders: aesthetic heart, bow, flower, star and sparkle line separators and text frames to copy and paste into Threads and Instagram posts, with a preview of how they wrap on mobile.": [null, "かわいい区切り線と枠：ハート、リボン、お花、星、キラキラの区切り線と文字枠をコピーして、ThreadsやInstagramの投稿に。スマホでの折り返しもプレビューできます。", "귀여운 구분선과 테두리: 하트, 리본, 꽃, 별, 반짝이 구분선과 글자 테두리를 복사해 스레드와 인스타그램 글에 붙여넣으세요. 모바일에서 줄바꿈되는 모습도 미리 볼 수 있어요."]
  };

  // 第一次打開：瀏覽器語言裡有中文就用中文，否則依序找英日韓；搜尋引擎一律看中文原文
  function detect(){
    try{
      var saved = localStorage.getItem(KEY);
      if(saved === "zh" || IDX[saved] != null) return saved;
      if(localStorage.getItem("threads-ruler-v1")) return "zh"; // 更新前就在用的人維持中文
    }catch(e){}
    if(/bot|crawl|spider|slurp|lighthouse/i.test(navigator.userAgent)) return "zh";
    var list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""])
      .map(function(l){ return String(l).toLowerCase(); });
    if(list.some(function(l){ return l.indexOf("zh") === 0; })) return "zh";
    for(var i = 0; i < list.length; i++){
      var base = list[i].split("-")[0];
      if(IDX[base] != null) return base;
    }
    return "en";
  }
  var lang = detect();
  var li = IDX[lang];

  function lookup(s){
    if(lang === "zh") return null;
    var r = T[s];
    return r && r[li] != null ? r[li] : null;
  }
  function fill(s, vars){
    return vars ? s.replace(/\{(\w+)\}/g, function(m, k){ return vars[k] != null ? vars[k] : m; }) : s;
  }
  function t(s, vars){
    var v = lookup(s);
    return fill(v == null ? s : v, vars);
  }

  // 預覽裡的貼文、使用者輸入、顏文字圖本身都不翻；中文常見問題只給中文讀者（其他語言隱藏）
  var SKIP = "script,style,textarea,pre,code,#card,[contenteditable],.guide .lead,.guide .qas";
  var ATTRS = ["title", "placeholder", "aria-label", "alt"];
  var OWN_TEXT = [" text", "の文字", " 글자"]; // 「○○的字」輸入框
  function attr(el, a){
    var v = el.getAttribute(a);
    if(!v) return;
    var r = lookup(v.trim());
    if(r == null && /的字$/.test(v)){
      var name = lookup(v.slice(0, -2));
      if(name != null) r = name + OWN_TEXT[li];
    }
    if(r != null) el.setAttribute(a, r);
  }
  function walk(el){
    if(el.matches && el.matches(SKIP)) return;
    if(el.classList && el.classList.contains("en-lead")){
      var e = lookup(el.textContent.trim());
      if(e != null) el.textContent = e;
      return;
    }
    ATTRS.forEach(function(a){ attr(el, a); });
    el.childNodes.forEach(function(c){
      if(c.nodeType === 1) walk(c);
      else if(c.nodeType === 3){
        var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(c.nodeValue);
        if(!m[2]) return;
        var r = lookup(m[2]);
        if(r != null) c.nodeValue = m[1] + r + m[3];
      }
    });
  }
  function apply(root){ if(lang !== "zh" && root) walk(root); }

  // ═══ 語言選單（頁首藍色膠囊） ═══
  function setupMenu(){
    var btn = document.getElementById("langBtn"), menu = document.getElementById("langMenu");
    if(!btn || !menu) return;
    LANGS.forEach(function(l){
      var b = document.createElement("button");
      b.type = "button"; b.setAttribute("role", "menuitemradio");
      b.setAttribute("lang", HTML_LANG[l[0]]);
      b.setAttribute("aria-checked", l[0] === lang ? "true" : "false");
      b.textContent = l[1];
      b.addEventListener("click", function(){
        if(l[0] !== lang){
          try{ localStorage.setItem(KEY, l[0]); }catch(e){}
          location.reload();
        }
        close();
      });
      menu.append(b);
    });
    function open(){ menu.hidden = false; btn.setAttribute("aria-expanded", "true"); var on = menu.querySelector('[aria-checked="true"]'); if(on) on.focus(); }
    function close(){ menu.hidden = true; btn.setAttribute("aria-expanded", "false"); }
    btn.addEventListener("click", function(e){ e.stopPropagation(); menu.hidden ? open() : close(); });
    document.addEventListener("click", function(e){ if(!menu.hidden && !menu.contains(e.target)) close(); });
    document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !menu.hidden){ close(); btn.focus(); } });
  }

  document.documentElement.setAttribute("lang", HTML_LANG[lang]);
  document.documentElement.dataset.lang = lang;
  if(lang !== "zh") document.title = ["Threads Ruler – Threads post formatter & line break preview", "Threads Ruler – Threads投稿のレイアウト・改行プレビュー", "Threads Ruler – 스레드 글 꾸미기 · 줄바꿈 미리보기"][li];
  apply(document.body);
  setupMenu();

  window.TRI18N = { lang: lang, t: t, apply: apply };
})();
