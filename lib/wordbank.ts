export interface WordEntry {
  word: string;
  meaning: string;
  phrase: string;
  pos: '動' | '名' | '形' | '副';
}

// v5.2: 週次レビュー(docs/weekly-review-checklist.md)でCEFR B2以下と判明した語のブロックリスト。
// 英検1級語彙問題はC1〜C2水準を要求するため、sampleWordBank()はここに含まれる語を
// 正解語・誤答語のどちらの候補にも選ばない。判明次第このSetに追記していく運用とする。
export const CEFR_BELOW_C1_BLOCKLIST: Set<string> = new Set([
  'collaborate', // B2: 学校英語で頻出、1級語彙としては平易すぎる
  'legitimate',  // B2: 準1級レベルで既出の基本語
  'extrovert',   // B2: 日常語彙化しており文脈推測が容易
  'thermal',     // B2: 中学・高校基礎語彙相当
  'retrieve',    // B2: IT・日常文脈で頻用され推測しやすい
  'extremist',   // B2: ニュース語彙として平易、文脈からの推測が容易
  'eminent',     // B2: 意味の推測難度が1級水準に達していない
]);

export const WORD_BANK: WordEntry[] = [
  {
    "word": "accolade",
    "meaning": "称賛 (⇔ praise, acclaim)",
    "phrase": "receive the highest accolade for the project",
    "pos": "名"
  },
  {
    "word": "solace",
    "meaning": "慰め, 癒し (⇔ comfort)",
    "phrase": "seek solace in music after a long day",
    "pos": "名"
  },
  {
    "word": "fervent",
    "meaning": "熱烈な (⇔ passionate, zealous)",
    "phrase": "a fervent hope for world peace",
    "pos": "形"
  },
  {
    "word": "apathetic",
    "meaning": "無感動の, 無関心な (⇔ indifferent, disinterested)",
    "phrase": "be apathetic towards political issues",
    "pos": "形"
  },
  {
    "word": "catalyst",
    "meaning": "変化を促すもの, きっかけ, 触媒",
    "phrase": "act as a catalyst for economic growth",
    "pos": "名"
  },
  {
    "word": "wane",
    "meaning": "徐々に弱まる, 衰える (⇔ fade, diminish)",
    "phrase": "public support for the bill began to wane",
    "pos": "動"
  },
  {
    "word": "clout",
    "meaning": "影響力 (⇔ power, influence)",
    "phrase": "have considerable political clout in the industry",
    "pos": "名"
  },
  {
    "word": "override",
    "meaning": "～を覆す (⇔ overrule)",
    "phrase": "override a previous decision",
    "pos": "動"
  },
  {
    "word": "secede",
    "meaning": "(国から)分離独立する",
    "phrase": "secede from the federation",
    "pos": "動"
  },
  {
    "word": "appall",
    "meaning": "～をぞっとさせる, 驚かせる (⇔ horrorify)",
    "phrase": "be appalled by the poor working conditions",
    "pos": "動"
  },
  {
    "word": "debunk",
    "meaning": "(人, 思想など)の正体を暴露する",
    "phrase": "debunk a myth about health supplements",
    "pos": "動"
  },
  {
    "word": "vent",
    "meaning": "(感情などを)発散する, 吐き出す",
    "phrase": "vent one's frustration on a colleague",
    "pos": "動"
  },
  {
    "word": "prognosis",
    "meaning": "(病気の)予後, 予測",
    "phrase": "a gloomy prognosis for the company’s future",
    "pos": "名"
  },
  {
    "word": "meticulous",
    "meaning": "細部まで注意を払った (⇔ detailed, fastidious)",
    "phrase": "pay meticulous attention to detail",
    "pos": "形"
  },
  {
    "word": "acrimony",
    "meaning": "とげとげしさ (⇔ acrimonious)",
    "phrase": "the meeting ended in acrimony",
    "pos": "名"
  },
  {
    "word": "propensity",
    "meaning": "(好ましくない)傾向, 性癖 (⇔ proclivity, inclination)",
    "phrase": "a propensity to procrastinate",
    "pos": "名"
  },
  {
    "word": "entice",
    "meaning": "～を誘惑する, おびき寄せる (⇔ repel)",
    "phrase": "entice customers with special discounts",
    "pos": "動"
  },
  {
    "word": "alienate",
    "meaning": "(人)を遠ざける, 疎外する",
    "phrase": "alienate potential investors",
    "pos": "動"
  },
  {
    "word": "exonerate",
    "meaning": "(人)の無罪を証明する (⇔ acquit)",
    "phrase": "be fully exonerated from all charges",
    "pos": "動"
  },
  {
    "word": "clamor",
    "meaning": "喧騒, 騒ぎ, ～を強く要求する",
    "phrase": "clamor for more transparency in government",
    "pos": "動"
  },
  {
    "word": "respite",
    "meaning": "(仕事などの)小休止, 休息 (⇔ break)",
    "phrase": "a brief respite from the hectic schedule",
    "pos": "名"
  },
  {
    "word": "huddle",
    "meaning": "(恐怖・寒さで)身を寄せ合う",
    "phrase": "huddle together for warmth",
    "pos": "動"
  },
  {
    "word": "figment",
    "meaning": "空想, 作り事",
    "phrase": "a figment of one's imagination",
    "pos": "名"
  },
  {
    "word": "tenacious",
    "meaning": "粘り強い, あきらめない (⇔ persistent)",
    "phrase": "a tenacious negotiator who never gives up",
    "pos": "形"
  },
  {
    "word": "lucrative",
    "meaning": "利益の大きい, もうかる (⇔ profitable)",
    "phrase": "a lucrative business deal in the tech sector",
    "pos": "形"
  },
  {
    "word": "squander",
    "meaning": "(金・時間など)を浪費する (⇔ waste)",
    "phrase": "squander a great opportunity",
    "pos": "動"
  },
  {
    "word": "flimsy",
    "meaning": "壊れやすい, 説得力に欠ける",
    "phrase": "a flimsy excuse for the delay",
    "pos": "形"
  },
  {
    "word": "incision",
    "meaning": "切開",
    "phrase": "make a small incision in the skin",
    "pos": "名"
  },
  {
    "word": "lethargic",
    "meaning": "けだるい, 無気力な (⇔ sluggish, listless)",
    "phrase": "feel lethargic in the hot weather",
    "pos": "形"
  },
  {
    "word": "pinnacle",
    "meaning": "頂点, 絶頂 (⇔ apex, zenith)",
    "phrase": "reach the pinnacle of one's career",
    "pos": "名"
  },
  {
    "word": "allay",
    "meaning": "(恐怖など)を和らげる (⇔ alleviate)",
    "phrase": "allay public fears about the economy",
    "pos": "動"
  },
  {
    "word": "feat",
    "meaning": "功績, 偉業",
    "phrase": "a remarkable feat of engineering",
    "pos": "名"
  },
  {
    "word": "ransack",
    "meaning": "(場所)をくまなく探す, 引っかき回す",
    "phrase": "ransack the house for valuables",
    "pos": "動"
  },
  {
    "word": "caustic",
    "meaning": "(批判が)辛らつな, 腐食性の",
    "phrase": "make caustic remarks about the strategy",
    "pos": "形"
  },
  {
    "word": "frivolous",
    "meaning": "軽率な, ふまじめな (⇔ flippant)",
    "phrase": "a frivolous lawsuit against the company",
    "pos": "形"
  },
  {
    "word": "latitude",
    "meaning": "自由, 裁量 (⇔ liberty, discretion)",
    "phrase": "give employees more latitude in decision-making",
    "pos": "名"
  },
  {
    "word": "adept",
    "meaning": "熟練して (⇔ skillful, proficient)",
    "phrase": "be adept at handling difficult clients",
    "pos": "形"
  },
  {
    "word": "avid",
    "meaning": "熱心な, 熱烈な (⇔ eager, keen, enthusiastic)",
    "phrase": "an avid reader of business news",
    "pos": "形"
  },
  {
    "word": "asylum",
    "meaning": "亡命, 保護 (⇔ sanctuary)",
    "phrase": "seek political asylum in a foreign country",
    "pos": "名"
  },
  {
    "word": "placate",
    "meaning": "(人を)なだめる, 和らげる (⇔ appease, pacify)",
    "phrase": "placate an angry customer",
    "pos": "動"
  },
  {
    "word": "pristine",
    "meaning": "新品同様の, 汚れていない (⇔ untouched)",
    "phrase": "keep the equipment in pristine condition",
    "pos": "形"
  },
  {
    "word": "blatantly",
    "meaning": "公然と, 露骨に",
    "phrase": "blatantly ignore the safety regulations",
    "pos": "副"
  },
  {
    "word": "attire",
    "meaning": "服装, 衣装 (⇔ apparel, clothes)",
    "phrase": "formal business attire is required",
    "pos": "名"
  },
  {
    "word": "offshoot",
    "meaning": "派生したもの, 分派",
    "phrase": "an offshoot of a major corporation",
    "pos": "名"
  },
  {
    "word": "gullible",
    "meaning": "だまされやすい, 信じやすい (⇔ naive)",
    "phrase": "be gullible enough to believe the scam",
    "pos": "形"
  },
  {
    "word": "hindsight",
    "meaning": "あと知恵, あとから判断する能力 (⇔ foresight)",
    "phrase": "with the benefit of hindsight",
    "pos": "名"
  },
  {
    "word": "ambush",
    "meaning": "待ち伏せ",
    "phrase": "an ambush by a rival company in the market",
    "pos": "名"
  },
  {
    "word": "zenith",
    "meaning": "頂点, 絶頂 (⇔ pinnacle, apex)",
    "phrase": "at the zenith of the empire’s power",
    "pos": "名"
  },
  {
    "word": "penchant",
    "meaning": "傾向, 愛着 (⇔ fondness, inclination)",
    "phrase": "a penchant for taking risks",
    "pos": "名"
  },
  {
    "word": "vigil",
    "meaning": "寝ずの番, 徹夜の見張り",
    "phrase": "keep a silent vigil by the bedside",
    "pos": "名"
  },
  {
    "word": "sheepishly",
    "meaning": "恥ずかしそうに",
    "phrase": "smile sheepishly after making a mistake",
    "pos": "副"
  },
  {
    "word": "unkempt",
    "meaning": "だらしない, 手入れされていない",
    "phrase": "an unkempt appearance after the long trip",
    "pos": "形"
  },
  {
    "word": "wince",
    "meaning": "(痛み・不快などで)顔をしかめる",
    "phrase": "wince at the thought of more work",
    "pos": "動"
  },
  {
    "word": "dilapidated",
    "meaning": "老朽化した, 荒廃した",
    "phrase": "a dilapidated building in the downtown area",
    "pos": "形"
  },
  {
    "word": "blemish",
    "meaning": "欠点, 汚れ, 傷",
    "phrase": "a minor blemish on an otherwise perfect record",
    "pos": "名"
  },
  {
    "word": "paltry",
    "meaning": "わずかな, 取るに足らない (⇔ petty, meager)",
    "phrase": "a paltry sum of money for the project",
    "pos": "形"
  },
  {
    "word": "ambivalent",
    "meaning": "相反する感情を抱く (⇔ ambivalence)",
    "phrase": "be ambivalent about the new policy",
    "pos": "形"
  },
  {
    "word": "hermit",
    "meaning": "世捨て人, 隠遁者",
    "phrase": "live like a hermit in the mountains",
    "pos": "名"
  },
  {
    "word": "quench",
    "meaning": "（喉の渇きなど）を癒す, 和らげる",
    "phrase": "quench one's thirst with cold water",
    "pos": "動"
  },
  {
    "word": "dispel",
    "meaning": "（不安・恐怖など）を払いのける",
    "phrase": "dispel any doubts about the merger",
    "pos": "動"
  },
  {
    "word": "wrath",
    "meaning": "憤怒, 激怒 (⇔ fire, fury)",
    "phrase": "face the wrath of the angry boss",
    "pos": "名"
  },
  {
    "word": "polarize",
    "meaning": "二極化させる",
    "phrase": "polarize public opinion on the issue",
    "pos": "動"
  },
  {
    "word": "condolence",
    "meaning": "哀悼, お悔やみの言葉",
    "phrase": "offer condolences to the family",
    "pos": "名"
  },
  {
    "word": "charlatan",
    "meaning": "ペテン師, 偽医者",
    "phrase": "be exposed as a charlatan",
    "pos": "名"
  },
  {
    "word": "succinct",
    "meaning": "簡潔な (⇔ concise)",
    "phrase": "give a succinct summary of the report",
    "pos": "形"
  },
  {
    "word": "infraction",
    "meaning": "違反, 違反行為 (⇔ violation)",
    "phrase": "a minor infraction of the rules",
    "pos": "名"
  },
  {
    "word": "detract",
    "meaning": "(価値など)を損なう",
    "phrase": "detract from the overall quality",
    "pos": "動"
  },
  {
    "word": "gorge",
    "meaning": "渓谷, 峡谷 (⇔ canyon, ravine)",
    "phrase": "a deep gorge between the mountains",
    "pos": "名"
  },
  {
    "word": "acquittal",
    "meaning": "無罪判決 (⇔ conviction)",
    "phrase": "result in a full acquittal for the defendant",
    "pos": "名"
  },
  {
    "word": "lurch",
    "meaning": "(乗り物などが)急に傾く",
    "phrase": "the car lurched forward suddenly",
    "pos": "動"
  },
  {
    "word": "adorn",
    "meaning": "～を装飾する, 飾る (⇔ decorate)",
    "phrase": "adorn the hall with flowers",
    "pos": "動"
  },
  {
    "word": "rubble",
    "meaning": "がれき, 破片",
    "phrase": "be reduced to rubble in the earthquake",
    "pos": "名"
  },
  {
    "word": "homage",
    "meaning": "敬意, 尊敬 (⇔ deference, reverence)",
    "phrase": "pay homage to the former leader",
    "pos": "名"
  },
  {
    "word": "stint",
    "meaning": "任務期間, 任務",
    "phrase": "a two-year stint in the marketing department",
    "pos": "名"
  },
  {
    "word": "procure",
    "meaning": "～を調達する, 手に入れる",
    "phrase": "procure necessary materials for the project",
    "pos": "動"
  },
  {
    "word": "mortify",
    "meaning": "～に恥をかかせる (⇔ embarrass)",
    "phrase": "be mortified by the embarrassing mistake",
    "pos": "動"
  },
  {
    "word": "fret",
    "meaning": "いらいらする, 思い悩む",
    "phrase": "fret about the upcoming presentation",
    "pos": "動"
  },
  {
    "word": "denigrate",
    "meaning": "～を中傷する, けなす (⇔ belittle)",
    "phrase": "denigrate the achievements of others",
    "pos": "動"
  },
  {
    "word": "desecrate",
    "meaning": "～を冒涜する (⇔ violate)",
    "phrase": "desecrate a sacred site",
    "pos": "動"
  },
  {
    "word": "ultimatum",
    "meaning": "最後通牒",
    "phrase": "issue an ultimatum to the strikers",
    "pos": "名"
  },
  {
    "word": "fidelity",
    "meaning": "忠実, 貞節 (⇔ faithfulness)",
    "phrase": "fidelity to one's principles",
    "pos": "名"
  },
  {
    "word": "premium",
    "meaning": "保険料, 割増料金",
    "phrase": "pay a high premium for health insurance",
    "pos": "名"
  },
  {
    "word": "susceptible",
    "meaning": "影響を受けやすい, 感染しやすい",
    "phrase": "be susceptible to peer pressure",
    "pos": "形"
  },
  {
    "word": "debris",
    "meaning": "破片, がれき",
    "phrase": "clear the debris after the storm",
    "pos": "名"
  },
  {
    "word": "extol",
    "meaning": "～を絶賛する, 激賞する (⇔ laud)",
    "phrase": "extol the virtues of the new system",
    "pos": "動"
  },
  {
    "word": "aversion",
    "meaning": "嫌悪, 反感 (⇔ hatred)",
    "phrase": "have a strong aversion to risk",
    "pos": "名"
  },
  {
    "word": "immaculate",
    "meaning": "清潔な, 汚れていない (⇔ spotless)",
    "phrase": "keep the office in immaculate condition",
    "pos": "形"
  },
  {
    "word": "gregarious",
    "meaning": "社交的な, 人づきあいのよい (⇔ sociable)",
    "phrase": "a gregarious person who loves parties",
    "pos": "形"
  },
  {
    "word": "ostracize",
    "meaning": "(人)をのけ者にする",
    "phrase": "be ostracized by the community",
    "pos": "動"
  },
  {
    "word": "uncouth",
    "meaning": "(人・行為などが) 無作法な, 粗野な (⇔ coarse)",
    "phrase": "be criticized for uncouth behavior",
    "pos": "形"
  },
  {
    "word": "salient",
    "meaning": "顕著な, 目立った",
    "phrase": "the salient features of the proposal",
    "pos": "形"
  },
  {
    "word": "mayhem",
    "meaning": "騒動, 大混乱",
    "phrase": "cause mayhem in the city center",
    "pos": "名"
  },
  {
    "word": "defunct",
    "meaning": "現存しない, 消滅した (⇔ extinct)",
    "phrase": "a defunct manufacturing company",
    "pos": "形"
  },
  {
    "word": "petrify",
    "meaning": "(恐怖などで)すくませる, 石化する",
    "phrase": "be petrified with fear",
    "pos": "動"
  },
  {
    "word": "invoke",
    "meaning": "(法・権利など)を行使する, 発動する",
    "phrase": "invoke an emergency clause in the contract",
    "pos": "動"
  },
  {
    "word": "rebuke",
    "meaning": "(人)を強く非難する, 叱責する",
    "phrase": "receive a sharp rebuke from the manager",
    "pos": "動"
  },
  {
    "word": "implore",
    "meaning": "～を懇願する (⇔ beseech, beg)",
    "phrase": "implore the government to take action",
    "pos": "動"
  },
  {
    "word": "accost",
    "meaning": "～に近寄って話しかける",
    "phrase": "be accosted by a stranger on the street",
    "pos": "動"
  },
  {
    "word": "erratic",
    "meaning": "不安定な, むらのある (⇔ unpredictable)",
    "phrase": "erratic behavior of the stock market",
    "pos": "形"
  },
  {
    "word": "absolve",
    "meaning": "～を免除する, 赦免する",
    "phrase": "be absolved of all responsibility",
    "pos": "動"
  },
  {
    "word": "hoard",
    "meaning": "蓄える, 貯蔵する, ため込む (⇔ stockpile)",
    "phrase": "hoard food supplies for the winter",
    "pos": "動"
  },
  {
    "word": "euphoric",
    "meaning": "幸福感にあふれた",
    "phrase": "be euphoric after winning the award",
    "pos": "形"
  },
  {
    "word": "incarcerate",
    "meaning": "～を投獄する, 拘束する (⇔ imprison)",
    "phrase": "be incarcerated for tax evasion",
    "pos": "動"
  },
  {
    "word": "brevity",
    "meaning": "簡潔さ, 短さ",
    "phrase": "brevity is the soul of wit",
    "pos": "名"
  },
  {
    "word": "pamper",
    "meaning": "(人・動物など)を甘やかす",
    "phrase": "pamper oneself with a spa treatment",
    "pos": "動"
  },
  {
    "word": "culpable",
    "meaning": "責められるべき (⇔ blameworthy)\"",
    "phrase": "be held culpable for the accident",
    "pos": "形"
  },
  {
    "word": "impervious",
    "meaning": "無感覚な, 不浸透性の (⇔ impenetrable, immune)",
    "phrase": "be impervious to criticism",
    "pos": "形"
  },
  {
    "word": "prowess",
    "meaning": "卓越した技量, 能力",
    "phrase": "demonstrate one's technical prowess",
    "pos": "名"
  },
  {
    "word": "incoherent",
    "meaning": "支離滅裂な (⇔ coherent)",
    "phrase": "give an incoherent explanation",
    "pos": "形"
  },
  {
    "word": "morale",
    "meaning": "士気, 意気込み",
    "phrase": "boost the morale of the team",
    "pos": "名"
  },
  {
    "word": "substantiate",
    "meaning": "(仮定・主張など)を実証する (⇔ corroborate)",
    "phrase": "substantiate the claims with evidence",
    "pos": "動"
  },
  {
    "word": "erroneous",
    "meaning": "間違った, 誤った情報に基づく (⇔ incorrect)",
    "phrase": "based on erroneous information",
    "pos": "形"
  },
  {
    "word": "exacerbate",
    "meaning": "悪化させる (⇔ aggravate)",
    "phrase": "exacerbate the existing problem",
    "pos": "動"
  },
  {
    "word": "elusive",
    "meaning": "(人・動物などが) つかまえにくい, 理解しにくい",
    "phrase": "an elusive solution to the crisis",
    "pos": "形"
  },
  {
    "word": "stifle",
    "meaning": "～を抑える, 押し殺す (⇔ suppress)",
    "phrase": "stifle a yawn during the meeting",
    "pos": "動"
  },
  {
    "word": "hatch",
    "meaning": "(陰謀・計画など)を企てる",
    "phrase": "hatch a plot to overthrow the CEO",
    "pos": "動"
  },
  {
    "word": "exorbitant",
    "meaning": "法外な, 過度な (⇔ excessive, unreasonable)",
    "phrase": "charge an exorbitant price for services",
    "pos": "形"
  },
  {
    "word": "confiscate",
    "meaning": "(財産・土地などを) 没収する, 押収する",
    "phrase": "the police confiscated the illegal goods",
    "pos": "動"
  },
  {
    "word": "curtail",
    "meaning": "削減する, 短縮する (⇔ limit, cut)",
    "phrase": "curtail spending on luxury items",
    "pos": "動"
  },
  {
    "word": "cessation",
    "meaning": "中止, 停止, 中断",
    "phrase": "a cessation of hostilities in the region",
    "pos": "名"
  },
  {
    "word": "inundate",
    "meaning": "～を押し寄せる, 水浸しにする (⇔ overwhelm, flood)",
    "phrase": "be inundated with phone calls",
    "pos": "動"
  },
  {
    "word": "rampage",
    "meaning": "暴れ回る, 暴動",
    "phrase": "angry protesters went on a rampage",
    "pos": "動"
  },
  {
    "word": "echelon",
    "meaning": "(組織・社会などの)段階, 階層",
    "phrase": "the upper echelons of management",
    "pos": "名"
  },
  {
    "word": "disdain",
    "meaning": "軽蔑, 侮辱 (⇔ scorn, derision)",
    "phrase": "treat the suggestion with disdain",
    "pos": "名"
  },
  {
    "word": "eschew",
    "meaning": "～を避ける",
    "phrase": "eschew violence at all costs",
    "pos": "動"
  },
  {
    "word": "palatable",
    "meaning": "口に合う, 美味な, 好ましい",
    "phrase": "a palatable compromise for both parties",
    "pos": "形"
  },
  {
    "word": "referendum",
    "meaning": "国民投票, 住民投票",
    "phrase": "hold a referendum on the new law",
    "pos": "名"
  },
  {
    "word": "fickle",
    "meaning": "気まぐれな, 不安定な (⇔ unreliable)",
    "phrase": "fickle consumer tastes in fashion",
    "pos": "形"
  },
  {
    "word": "tantamount",
    "meaning": "～と同等の, 同じような (⇔ equivalent)",
    "phrase": "is tantamount to a confession of guilt",
    "pos": "形"
  },
  {
    "word": "placid",
    "meaning": "穏やかな, 静かな (⇔ calm, tranquil)",
    "phrase": "a placid lake in the morning",
    "pos": "形"
  },
  {
    "word": "heave",
    "meaning": "引っ張る, 投げる, 持ち上げる",
    "phrase": "heave a heavy box onto the truck",
    "pos": "動"
  },
  {
    "word": "scrawl",
    "meaning": "(字を)走り書きする",
    "phrase": "scrawl a quick note on a napkin",
    "pos": "動"
  },
  {
    "word": "revitalize",
    "meaning": "～に新しい活力を与える (⇔ replenish, restore)",
    "phrase": "revitalize the local economy",
    "pos": "動"
  },
  {
    "word": "instill",
    "meaning": "(主義・感情などを) 教え込む",
    "phrase": "instill confidence in the students",
    "pos": "動"
  },
  {
    "word": "hassle",
    "meaning": "面倒, 苦労",
    "phrase": "avoid the hassle of traveling by air",
    "pos": "名"
  },
  {
    "word": "opt",
    "meaning": "選ぶ, 決める",
    "phrase": "opt for the more expensive model",
    "pos": "動"
  },
  {
    "word": "disparate",
    "meaning": "異なる, 異質な",
    "phrase": "bring together disparate groups of people",
    "pos": "形"
  },
  {
    "word": "elicit",
    "meaning": "(反応・感情などを) 引き出す",
    "phrase": "elicit a positive response from the audience",
    "pos": "動"
  },
  {
    "word": "robust",
    "meaning": "たくましい, 頑丈な (⇔ sturdy, strong)",
    "phrase": "a robust economy despite the crisis",
    "pos": "形"
  },
  {
    "word": "shun",
    "meaning": "～を避ける, 遠ざける (⇔ avoid)",
    "phrase": "be shunned by former colleagues",
    "pos": "動"
  },
  {
    "word": "nomadic",
    "meaning": "放浪の, 遊牧民の",
    "phrase": "lead a nomadic lifestyle in the desert",
    "pos": "形"
  },
  {
    "word": "disperse",
    "meaning": "(群集・霧などが) 散る, 分散させる",
    "phrase": "the crowd began to disperse after the speech",
    "pos": "動"
  },
  {
    "word": "havoc",
    "meaning": "大混乱, 大惨事 (⇔ disorder)",
    "phrase": "wreak havoc on the global supply chain",
    "pos": "名"
  },
  {
    "word": "mar",
    "meaning": "～を損なう, 台無しにする (⇔ tarnish, spoil)",
    "phrase": "mar the beauty of the landscape",
    "pos": "動"
  },
  {
    "word": "clandestine",
    "meaning": "秘密の, 内密の (⇔ secret, private)",
    "phrase": "a clandestine meeting between the leaders",
    "pos": "形"
  },
  {
    "word": "irreparably",
    "meaning": "修復できないほどに",
    "phrase": "be irreparably damaged in the fire",
    "pos": "副"
  },
  {
    "word": "preemptive",
    "meaning": "先制の",
    "phrase": "take preemptive action against the threat",
    "pos": "形"
  },
  {
    "word": "subvert",
    "meaning": "～を覆す, 破壊する (⇔ undermine)",
    "phrase": "subvert the democratic process",
    "pos": "動"
  },
  {
    "word": "liquidate",
    "meaning": "清算する, 精算する",
    "phrase": "liquidate the assets of the company",
    "pos": "動"
  },
  {
    "word": "fruition",
    "meaning": "達成, 実現",
    "phrase": "the project finally came to fruition",
    "pos": "名"
  },
  {
    "word": "consternation",
    "meaning": "驚愕, 仰天, 狼狽 (⇔ dismay)",
    "phrase": "cause consternation among the public",
    "pos": "名"
  },
  {
    "word": "garner",
    "meaning": "～を獲得する, 集める",
    "phrase": "garner enough support for the proposal",
    "pos": "動"
  },
  {
    "word": "predicament",
    "meaning": "窮地, 困難な状況 (⇔ plight, dilemma)",
    "phrase": "be in a difficult financial predicament",
    "pos": "名"
  },
  {
    "word": "contingency",
    "meaning": "不測の事態, 将来起こり得ること",
    "phrase": "have a contingency plan for emergencies",
    "pos": "名"
  },
  {
    "word": "salvage",
    "meaning": "救出する, 回収する",
    "phrase": "salvage what is left from the ruins",
    "pos": "動"
  },
  {
    "word": "barrage",
    "meaning": "(言葉などの)集中攻撃, 弾幕",
    "phrase": "be hit with a barrage of questions",
    "pos": "名"
  },
  {
    "word": "nonchalant",
    "meaning": "平然とした, 無頓着な (⇔ casual)",
    "phrase": "maintain a nonchalant attitude under pressure",
    "pos": "形"
  },
  {
    "word": "dawdle",
    "meaning": "ぐずぐずする, 時間を浪費する",
    "phrase": "don't dawdle or we'll be late",
    "pos": "動"
  },
  {
    "word": "capitulate",
    "meaning": "降伏する, 屈服する (⇔ surrender)",
    "phrase": "refuse to capitulate to the enemy",
    "pos": "動"
  },
  {
    "word": "rebuff",
    "meaning": "(申し出などを) 拒絶する (⇔ snub, reject)",
    "phrase": "rebuff an offer of assistance",
    "pos": "動"
  },
  {
    "word": "pedantic",
    "meaning": "細部にこだわる, 細かい",
    "phrase": "be criticized for being too pedantic",
    "pos": "形"
  },
  {
    "word": "squeamish",
    "meaning": "すぐに気分が悪くなる",
    "phrase": "be squeamish about the sight of blood",
    "pos": "形"
  },
  {
    "word": "diatribe",
    "meaning": "痛烈な批判, 非難",
    "phrase": "launch a diatribe against the government",
    "pos": "名"
  },
  {
    "word": "reprehensible",
    "meaning": "非難されるべき (⇔ disgraceful)",
    "phrase": "his actions were morally reprehensible",
    "pos": "形"
  },
  {
    "word": "cryptic",
    "meaning": "謎めいた, 不可解な (⇔ mysterious)",
    "phrase": "receive a cryptic message from an unknown sender",
    "pos": "形"
  },
  {
    "word": "exuberant",
    "meaning": "喜びにあふれた,活気に満ちた (⇔ lively, jubilant)",
    "phrase": "an exuberant crowd at the festival",
    "pos": "形"
  },
  {
    "word": "pallid",
    "meaning": "青白い, 活気のない (⇔ pale)",
    "phrase": "the patient looked pallid and weak",
    "pos": "形"
  },
  {
    "word": "acrid",
    "meaning": "辛らつな, とげとげしい (⇔ pungent)",
    "phrase": "an acrid smell of burning rubber",
    "pos": "形"
  },
  {
    "word": "inception",
    "meaning": "開始, 初め (⇔ beginning)",
    "phrase": "since the inception of the company",
    "pos": "名"
  },
  {
    "word": "resurgence",
    "meaning": "復活, 再起 (⇔ revival)",
    "phrase": "a resurgence of interest in local crafts",
    "pos": "名"
  },
  {
    "word": "delve",
    "meaning": "掘り下げる, 探求する",
    "phrase": "delve into the history of the region",
    "pos": "動"
  },
  {
    "word": "embed",
    "meaning": "埋め込む",
    "phrase": "embed a video in the website",
    "pos": "動"
  },
  {
    "word": "bestow",
    "meaning": "授ける, 与える",
    "phrase": "bestow an honorary degree on the scientist",
    "pos": "動"
  },
  {
    "word": "stringent",
    "meaning": "厳しい, 厳格な (⇔ strict)",
    "phrase": "implement stringent safety measures",
    "pos": "形"
  },
  {
    "word": "dissipate",
    "meaning": "浪費する, 消える",
    "phrase": "the fog began to dissipate gradually",
    "pos": "動"
  },
  {
    "word": "hoax",
    "meaning": "悪ふざけ, 作り話",
    "phrase": "the bomb threat turned out to be a hoax",
    "pos": "名"
  },
  {
    "word": "astound",
    "meaning": "～をびっくり仰天させる (⇔ astonish)",
    "phrase": "her talent for music continues to astound me",
    "pos": "動"
  },
  {
    "word": "reinstate",
    "meaning": "復職させる, 復帰させる (⇔ restore)",
    "phrase": "be reinstated to his former position",
    "pos": "動"
  },
  {
    "word": "momentous",
    "meaning": "重大な, 重要な (⇔ significant)",
    "phrase": "a momentous decision for the future",
    "pos": "形"
  },
  {
    "word": "adjunct",
    "meaning": "付属物, 補助 (⇔ accessory)",
    "phrase": "serve as an adjunct to the main course",
    "pos": "名"
  },
  {
    "word": "annotation",
    "meaning": "注釈, 注記",
    "phrase": "add annotations to the document",
    "pos": "名"
  },
  {
    "word": "untenable",
    "meaning": "(理論・立場などが) 擁護できない",
    "phrase": "an untenable position in the debate",
    "pos": "形"
  },
  {
    "word": "assuage",
    "meaning": "～を和らげる, 緩和する (⇔ ease, relieve)",
    "phrase": "assuage the concerns of the investors",
    "pos": "動"
  },
  {
    "word": "flounder",
    "meaning": "苦労する, もがく, つまずく (⇔ struggle)",
    "phrase": "the startup is beginning to flounder",
    "pos": "動"
  },
  {
    "word": "pander",
    "meaning": "迎合する, おもねる",
    "phrase": "pander to the tastes of the majority",
    "pos": "動"
  },
  {
    "word": "overt",
    "meaning": "公然の, あからさまな (⇔ obvious, blatant)",
    "phrase": "an overt threat to national security",
    "pos": "形"
  },
  {
    "word": "antagonistic",
    "meaning": "敵対する, 敵意のある (⇔ hostile)",
    "phrase": "be antagonistic towards the new manager",
    "pos": "形"
  },
  {
    "word": "budge",
    "meaning": "(意見・態度などを) 変える, 動かす",
    "phrase": "refuse to budge on the price",
    "pos": "動"
  },
  {
    "word": "sedentary",
    "meaning": "座っていることの多い",
    "phrase": "lead a sedentary lifestyle in the office",
    "pos": "形"
  },
  {
    "word": "accentuate",
    "meaning": "～を強調する, 際立たせる (⇔ emphasize)",
    "phrase": "accentuate the positive aspects of the deal",
    "pos": "動"
  },
  {
    "word": "ember",
    "meaning": "残り火, 燃えさし",
    "phrase": "the glowing embers of the fire",
    "pos": "名"
  },
  {
    "word": "engender",
    "meaning": "～を生じさせる, 引き起こす (⇔ cause)",
    "phrase": "engender trust among the employees",
    "pos": "動"
  },
  {
    "word": "reiterate",
    "meaning": "～を何度も繰り返して言う (⇔ repeat)",
    "phrase": "reiterate the importance of safety",
    "pos": "動"
  },
  {
    "word": "compunction",
    "meaning": "良心の呵責, 悔恨",
    "phrase": "feel no compunction about lying",
    "pos": "名"
  },
  {
    "word": "deluge",
    "meaning": "大洪水, 豪雨, 殺到",
    "phrase": "a deluge of complaints after the update",
    "pos": "名"
  },
  {
    "word": "diffident",
    "meaning": "自信のない, 気後れした (⇔ confident)",
    "phrase": "a diffident young man in the interview",
    "pos": "形"
  },
  {
    "word": "mollify",
    "meaning": "～をなだめる, 感情を和らげる (⇔ pacify, soothe)",
    "phrase": "mollify the angry crowd with a speech",
    "pos": "動"
  },
  {
    "word": "torment",
    "meaning": "～を苦しめる, 悩ませる (⇔ torture)",
    "phrase": "be tormented by a difficult decision",
    "pos": "動"
  },
  {
    "word": "douse",
    "meaning": "(水をかけて火を)消す",
    "phrase": "douse the campfire before leaving",
    "pos": "動"
  },
  {
    "word": "debacle",
    "meaning": "大失敗, 大敗北 (⇔ fiasco)",
    "phrase": "the product launch was a total debacle",
    "pos": "名"
  },
  {
    "word": "backlog",
    "meaning": "やり残し, 未処理分",
    "phrase": "deal with a huge backlog of emails",
    "pos": "名"
  },
  {
    "word": "resplendent",
    "meaning": "きらびやかな, まばゆい",
    "phrase": "resplendent in her traditional dress",
    "pos": "形"
  },
  {
    "word": "quaint",
    "meaning": "(古風で)趣のある",
    "phrase": "a quaint village with stone houses",
    "pos": "形"
  },
  {
    "word": "tepid",
    "meaning": "(飲み物が)なまぬるい, (感情などが)熱意のない",
    "phrase": "a tepid response to the new proposal",
    "pos": "形"
  },
  {
    "word": "malleable",
    "meaning": "柔軟な, 順応性のある (⇔ flexible)",
    "phrase": "young minds are very malleable",
    "pos": "形"
  },
  {
    "word": "poignant",
    "meaning": "心に強く訴える, 感動的な (⇔ moving, touching)",
    "phrase": "a poignant story of lost love",
    "pos": "形"
  },
  {
    "word": "exude",
    "meaning": "～をにじみ出させる (⇔ emit, ooze)",
    "phrase": "exude confidence during the meeting",
    "pos": "動"
  },
  {
    "word": "plague",
    "meaning": "～を悩ませる, 苦しめる",
    "phrase": "be plagued by constant injuries",
    "pos": "動"
  },
  {
    "word": "detrimental",
    "meaning": "有害な, 不利益な (⇔ harmful, damaging)",
    "phrase": "detrimental effects of smoking on health",
    "pos": "形"
  },
  {
    "word": "inadvertently",
    "meaning": "うっかり, 不注意にも (⇔ accidentally)",
    "phrase": "inadvertently delete an important file",
    "pos": "副"
  },
  {
    "word": "culminate",
    "meaning": "最高潮に達する, 終わる (⇔ climax)",
    "phrase": "the talks culminated in a historic agreement",
    "pos": "動"
  },
  {
    "word": "mundane",
    "meaning": "平凡な, 世俗的な (⇔ ordinary, worldly)",
    "phrase": "the mundane tasks of daily life",
    "pos": "形"
  },
  {
    "word": "succumb",
    "meaning": "(誘惑・圧力などに)負ける, 屈する",
    "phrase": "succumb to temptation",
    "pos": "動"
  },
  {
    "word": "vicinity",
    "meaning": "付近, 近辺 (⇔ neighborhood, proximity)",
    "phrase": "in the immediate vicinity of the station",
    "pos": "名"
  },
  {
    "word": "perk",
    "meaning": "手当, 特典",
    "phrase": "perks of the job include a free gym membership",
    "pos": "名"
  },
  {
    "word": "fluctuate",
    "meaning": "変動する, 上下する (⇔ vary)",
    "phrase": "oil prices fluctuate daily",
    "pos": "動"
  },
  {
    "word": "insurmountable",
    "meaning": "乗り越えられない, 克服できない",
    "phrase": "face insurmountable obstacles",
    "pos": "形"
  },
  {
    "word": "impending",
    "meaning": "差し迫った (⇔ approaching, imminent)",
    "phrase": "the impending deadline for the project",
    "pos": "形"
  },
  {
    "word": "contentious",
    "meaning": "議論を呼ぶ, 物議を醸す (⇔ controversial)",
    "phrase": "a contentious issue in the election",
    "pos": "形"
  },
  {
    "word": "retaliation",
    "meaning": "報復, 仕返し (⇔ reprisal)",
    "phrase": "act in retaliation for the attack",
    "pos": "名"
  },
  {
    "word": "circumvent",
    "meaning": "回避する, 抜け道を見つける",
    "phrase": "circumvent the security system",
    "pos": "動"
  },
  {
    "word": "tout",
    "meaning": "～を褒めちぎる, もてはやす",
    "phrase": "be touted as the next big thing",
    "pos": "動"
  },
  {
    "word": "refute",
    "meaning": "～の誤りを証明する, ～に反駁する",
    "phrase": "refute the allegations with facts",
    "pos": "動"
  },
  {
    "word": "animosity",
    "meaning": "敵意, 憎しみ (⇔ hostility)",
    "phrase": "feel no animosity towards the rival",
    "pos": "名"
  },
  {
    "word": "fugitive",
    "meaning": "逃亡者, 脱走者",
    "phrase": "the fugitive was caught after a week",
    "pos": "名"
  },
  {
    "word": "ramification",
    "meaning": "(派生的な)影響, 結果 (⇔ consequence)",
    "phrase": "serious ramifications for the economy",
    "pos": "名"
  },
  {
    "word": "adamant",
    "meaning": "断固とした, 頑固な",
    "phrase": "be adamant that the plan should continue",
    "pos": "形"
  },
  {
    "word": "languish",
    "meaning": "辛い状況にある, 活動が停滞する",
    "phrase": "languish in prison for years",
    "pos": "動"
  },
  {
    "word": "gall",
    "meaning": "厚かましさ, ずうずうしさ (⇔ impudence, audacity)",
    "phrase": "have the gall to ask for more money",
    "pos": "名"
  },
  {
    "word": "meddle",
    "meaning": "干渉する, おせっかいを焼く (⇔ interfere)",
    "phrase": "don't meddle in my private affairs",
    "pos": "動"
  },
  {
    "word": "reprimand",
    "meaning": "～を叱責する (⇔ scold, rebuke)",
    "phrase": "receive a formal reprimand from the board",
    "pos": "動"
  },
  {
    "word": "engrossed",
    "meaning": "没頭して, 夢中になって",
    "phrase": "be engrossed in a fascinating book",
    "pos": "形"
  },
  {
    "word": "anesthetic",
    "meaning": "麻酔 (剤)",
    "phrase": "be under a local anesthetic",
    "pos": "名"
  },
  {
    "word": "plunder",
    "meaning": "略奪する, 強奪する",
    "phrase": "plunder the city of its treasures",
    "pos": "動"
  },
  {
    "word": "grueling",
    "meaning": "人を疲れさせる, 厳しい",
    "phrase": "a grueling workout at the gym",
    "pos": "形"
  },
  {
    "word": "precursor",
    "meaning": "前兆, 前触れ (⇔ forerunner, harbinger)",
    "phrase": "a precursor to the modern computer",
    "pos": "名"
  },
  {
    "word": "brunt",
    "meaning": "(攻撃の)矛先",
    "phrase": "bear the brunt of the criticism",
    "pos": "名"
  },
  {
    "word": "litany",
    "meaning": "延々と続くもの",
    "phrase": "a litany of excuses for the failure",
    "pos": "名"
  },
  {
    "word": "repercussion",
    "meaning": "余波, 反響 (⇔ consequence)",
    "phrase": "economic repercussions of the pandemic",
    "pos": "名"
  },
  {
    "word": "rationale",
    "meaning": "理由, 根拠 (⇔ justification, reason)",
    "phrase": "the rationale behind the decision",
    "pos": "名"
  },
  {
    "word": "adroit",
    "meaning": "巧みな、抜け目のない",
    "phrase": "an adroit handling of the situation",
    "pos": "形"
  },
  {
    "word": "enmity",
    "meaning": "敵意、憎しみ",
    "phrase": "long-standing enmity between the two groups",
    "pos": "名"
  },
  {
    "word": "excruciating",
    "meaning": "（苦痛が）非常に激しい",
    "phrase": "excruciating pain in the back",
    "pos": "形"
  },
  {
    "word": "versatility",
    "meaning": "汎用性、多用途性",
    "phrase": "the versatility of the new software",
    "pos": "名"
  },
  {
    "word": "foliage",
    "meaning": "（集合的に）葉",
    "phrase": "the thick foliage of the jungle",
    "pos": "名"
  },
  {
    "word": "bequeath",
    "meaning": "（遺産などによって）譲渡する",
    "phrase": "bequeath a fortune to the university",
    "pos": "動"
  },
  {
    "word": "cavalier",
    "meaning": "そっけない、気づかない",
    "phrase": "a cavalier attitude towards safety",
    "pos": "形"
  },
  {
    "word": "caliber",
    "meaning": "（高い）質、能力、力量",
    "phrase": "a player of high caliber",
    "pos": "名"
  },
  {
    "word": "valiant",
    "meaning": "思い切った、勇気のある",
    "phrase": "make a valiant effort to save the company",
    "pos": "形"
  },
  {
    "word": "incontrovertible",
    "meaning": "議論の余地のない、明白の",
    "phrase": "incontrovertible evidence of global warming",
    "pos": "形"
  },
  {
    "word": "camaraderie",
    "meaning": "友情、仲間意識",
    "phrase": "build a sense of camaraderie in the team",
    "pos": "名"
  },
  {
    "word": "embezzle",
    "meaning": "（金など）を使い込む、横領する",
    "phrase": "be charged with embezzling company funds",
    "pos": "動"
  },
  {
    "word": "deterrent",
    "meaning": "阻止するもの、妨害物",
    "phrase": "a strong deterrent against crime",
    "pos": "名"
  },
  {
    "word": "berate",
    "meaning": "〜をきつく叱る、非難する",
    "phrase": "be berated by the teacher for being late",
    "pos": "動"
  },
  {
    "word": "bask",
    "meaning": "（恩恵・人気など）に浴する",
    "phrase": "bask in the glory of victory",
    "pos": "動"
  },
  {
    "word": "belligerent",
    "meaning": "好戦的な、けんか腰の",
    "phrase": "a belligerent tone of voice",
    "pos": "形"
  },
  {
    "word": "rebut",
    "meaning": "（罪状・非難など）を反証する",
    "phrase": "rebut the arguments in the debate",
    "pos": "動"
  },
  {
    "word": "eulogy",
    "meaning": "賛辞",
    "phrase": "deliver a moving eulogy at the funeral",
    "pos": "名"
  },
  {
    "word": "commotion",
    "meaning": "動揺、騒ぎ",
    "phrase": "cause a great commotion in the hall",
    "pos": "名"
  },
  {
    "word": "accomplice",
    "meaning": "共犯者、共謀者",
    "phrase": "be arrested as an accomplice to the crime",
    "pos": "名"
  },
  {
    "word": "fallacy",
    "meaning": "誤った考え",
    "phrase": "the fallacy of the common belief",
    "pos": "名"
  },
  {
    "word": "plagiarize",
    "meaning": "（他人のアイデアなど）を盗用する",
    "phrase": "be accused of plagiarizing the essay",
    "pos": "動"
  },
  {
    "word": "conflagration",
    "meaning": "大火災",
    "phrase": "the conflagration destroyed several buildings",
    "pos": "名"
  },
  {
    "word": "obtrusive",
    "meaning": "出しゃばりの、押しつけがましい",
    "phrase": "the obtrusive presence of the paparazzi",
    "pos": "形"
  },
  {
    "word": "savor",
    "meaning": "（活躍・経験など）をかみしめる、堪能する",
    "phrase": "savor the moment of success",
    "pos": "動"
  },
  {
    "word": "frugal",
    "meaning": "倹約な、質素な",
    "phrase": "lead a frugal life to save money",
    "pos": "形"
  },
  {
    "word": "unscathed",
    "meaning": "無傷で、無事で",
    "phrase": "emerge unscathed from the accident",
    "pos": "形"
  },
  {
    "word": "glut",
    "meaning": "（商品などの）供給過剰",
    "phrase": "a glut of used cars on the market",
    "pos": "名"
  },
  {
    "word": "knack",
    "meaning": "こつ、要領、特技",
    "phrase": "have a knack for making people laugh",
    "pos": "名"
  },
  {
    "word": "farce",
    "meaning": "茶番、ばかげたこと",
    "phrase": "the whole trial was a complete farce",
    "pos": "名"
  },
  {
    "word": "interject",
    "meaning": "〜を不意に差しはさむ",
    "phrase": "interject a comment into the conversation",
    "pos": "動"
  },
  {
    "word": "marginally",
    "meaning": "わずかに、かろうじて",
    "phrase": "profits increased marginally this year",
    "pos": "副"
  },
  {
    "word": "broach",
    "meaning": "（言いにくい話題など）を切り出す、持ち出す",
    "phrase": "broach the subject of a salary increase",
    "pos": "動"
  },
  {
    "word": "misgiving",
    "meaning": "不安、懸念",
    "phrase": "have serious misgivings about the new plan",
    "pos": "名"
  },
  {
    "word": "reconnaissance",
    "meaning": "偵察、調査",
    "phrase": "conduct a reconnaissance mission",
    "pos": "名"
  },
  {
    "word": "infatuated",
    "meaning": "夢中になって、のぼせて",
    "phrase": "be infatuated with a new hobby",
    "pos": "形"
  },
  {
    "word": "relegate",
    "meaning": "（人など）を格下げする、左遷する",
    "phrase": "be relegated to the minor leagues",
    "pos": "動"
  },
  {
    "word": "bolster",
    "meaning": "〜を強化する、支える",
    "phrase": "bolster the confidence of the team",
    "pos": "動"
  },
  {
    "word": "reparation",
    "meaning": "賠償金、補償、償い",
    "phrase": "make reparations for the damages",
    "pos": "名"
  },
  {
    "word": "turmoil",
    "meaning": "騒動、混乱",
    "phrase": "political turmoil in the country",
    "pos": "名"
  },
  {
    "word": "conjure",
    "meaning": "（魔法・念力などで）〜を思い起こさせる",
    "phrase": "conjure up memories of childhood",
    "pos": "動"
  },
  {
    "word": "permeate",
    "meaning": "（液体・気体など）に浸透する",
    "phrase": "the smell of coffee permeated the room",
    "pos": "動"
  },
  {
    "word": "gist",
    "meaning": "要点、趣旨",
    "phrase": "get the gist of the conversation",
    "pos": "名"
  },
  {
    "word": "prolific",
    "meaning": "（芸術家などが）多作の",
    "phrase": "a prolific writer of mystery novels",
    "pos": "形"
  },
  {
    "word": "admonish",
    "meaning": "人を叱る、諭す",
    "phrase": "admonish a child for bad behavior",
    "pos": "動"
  },
  {
    "word": "rout",
    "meaning": "（試合・選挙などでの）大敗北、総崩れ",
    "phrase": "a total rout of the opposition party",
    "pos": "名"
  },
  {
    "word": "disband",
    "meaning": "（組織など）を解散させる",
    "phrase": "the group decided to disband after the project",
    "pos": "動"
  },
  {
    "word": "somber",
    "meaning": "陰うつな、重苦しい",
    "phrase": "a somber mood at the meeting",
    "pos": "形"
  },
  {
    "word": "recuperate",
    "meaning": "（病気・けがなどから）回復する",
    "phrase": "recuperate from a serious illness",
    "pos": "動"
  },
  {
    "word": "epitomize",
    "meaning": "（〜の特徴を）典型的に示す",
    "phrase": "epitomize the American dream",
    "pos": "動"
  },
  {
    "word": "rift",
    "meaning": "仲たがい、亀裂",
    "phrase": "a growing rift between the two leaders",
    "pos": "名"
  },
  {
    "word": "divulge",
    "meaning": "（秘密など）を漏らす、明らかにする",
    "phrase": "divulge top-secret information",
    "pos": "動"
  },
  {
    "word": "dwindle",
    "meaning": "（数・量などが）徐々に減る",
    "phrase": "dwindle to almost nothing",
    "pos": "動"
  },
  {
    "word": "denote",
    "meaning": "（文字・符号などが）〜を示す、意味する",
    "phrase": "the red color denotes danger",
    "pos": "動"
  },
  {
    "word": "exodus",
    "meaning": "大量流出、出ていくこと",
    "phrase": "a mass exodus of refugees from the area",
    "pos": "名"
  },
  {
    "word": "hereditary",
    "meaning": "遺伝性の、世襲の",
    "phrase": "a hereditary disease in the family",
    "pos": "形"
  },
  {
    "word": "corroborate",
    "meaning": "（意見・証拠など）を裏付ける",
    "phrase": "corroborate the witness's story",
    "pos": "動"
  },
  {
    "word": "inscrutable",
    "meaning": "不可解な、神秘的な",
    "phrase": "an inscrutable expression on his face",
    "pos": "形"
  },
  {
    "word": "emaciated",
    "meaning": "（病気などで）やせ衰えた",
    "phrase": "emaciated survivors of the famine",
    "pos": "形"
  },
  {
    "word": "affront",
    "meaning": "（公然の）侮辱、無礼",
    "phrase": "an affront to our dignity",
    "pos": "名"
  },
  {
    "word": "fiasco",
    "meaning": "（行事・企てなどの）大失敗",
    "phrase": "the party turned out to be a fiasco",
    "pos": "名"
  },
  {
    "word": "aloof",
    "meaning": "冷淡で、よそよそしくて",
    "phrase": "keep oneself aloof from the crowd",
    "pos": "形"
  },
  {
    "word": "altruistic",
    "meaning": "利他的な",
    "phrase": "an altruistic desire to help others",
    "pos": "形"
  },
  {
    "word": "quandary",
    "meaning": "困惑、苦境",
    "phrase": "be in a quandary about what to do",
    "pos": "名"
  },
  {
    "word": "embellish",
    "meaning": "（事実を）脚色する、美化する",
    "phrase": "embellish the story with more details",
    "pos": "動"
  },
  {
    "word": "renege",
    "meaning": "（約束などを）破る、反故にする",
    "phrase": "renege on a campaign promise",
    "pos": "動"
  },
  {
    "word": "nudge",
    "meaning": "ひじで軽くつつく",
    "phrase": "nudge someone to pay attention",
    "pos": "動"
  },
  {
    "word": "indoctrinate",
    "meaning": "人に（思想など）を吹き込む",
    "phrase": "indoctrinate children with political ideas",
    "pos": "動"
  },
  {
    "word": "remorse",
    "meaning": "（罪悪などに対する）後悔、良心の呵責",
    "phrase": "feel deep remorse for one's actions",
    "pos": "名"
  },
  {
    "word": "delude",
    "meaning": "人を惑わす、欺く",
    "phrase": "don't delude yourself into thinking it's easy",
    "pos": "動"
  },
  {
    "word": "defuse",
    "meaning": "（緊張など）を和らげる",
    "phrase": "defuse a tense situation",
    "pos": "動"
  },
  {
    "word": "precarious",
    "meaning": "不安定な、危うい",
    "phrase": "be in a precarious financial position",
    "pos": "形"
  },
  {
    "word": "feign",
    "meaning": "〜を装う、〜のふりをする",
    "phrase": "feign illness to skip work",
    "pos": "動"
  },
  {
    "word": "abject",
    "meaning": "悲惨な、ひどい",
    "phrase": "live in abject poverty",
    "pos": "形"
  },
  {
    "word": "ulterior",
    "meaning": "隠された、表に出てこない",
    "phrase": "an ulterior motive for the kindness",
    "pos": "形"
  },
  {
    "word": "lambaste",
    "meaning": "〜を酷評する、こき下ろす",
    "phrase": "be lambasted by the critics",
    "pos": "動"
  },
  {
    "word": "commiserate",
    "meaning": "同情する、哀れむ",
    "phrase": "commiserate with a friend over a loss",
    "pos": "動"
  },
  {
    "word": "flagrant",
    "meaning": "目に余る、破廉恥な",
    "phrase": "a flagrant violation of human rights",
    "pos": "形"
  },
  {
    "word": "flout",
    "meaning": "（ルールなど）を軽視する",
    "phrase": "flout the law openly",
    "pos": "動"
  },
  {
    "word": "inculcate",
    "meaning": "（思想・知識など）を叩き込む、教え込む",
    "phrase": "inculcate values in the next generation",
    "pos": "動"
  },
  {
    "word": "infer",
    "meaning": "〜と推測する",
    "phrase": "infer the meaning from the context",
    "pos": "動"
  },
  {
    "word": "emulate",
    "meaning": "見習う、まねる",
    "phrase": "emulate the success of a mentor",
    "pos": "動"
  },
  {
    "word": "alleviate",
    "meaning": "（苦痛・問題など）を軽減する",
    "phrase": "alleviate the symptoms of the flu",
    "pos": "動"
  },
  {
    "word": "staunch",
    "meaning": "誠実な、忠実な",
    "phrase": "a staunch supporter of the party",
    "pos": "形"
  },
  {
    "word": "disseminate",
    "meaning": "（情報・知識など）を広める",
    "phrase": "disseminate information via the internet",
    "pos": "動"
  },
  {
    "word": "baffle",
    "meaning": "（人）を困惑させる",
    "phrase": "be baffled by the complex puzzle",
    "pos": "動"
  },
  {
    "word": "menial",
    "meaning": "単調な、技術を要しない",
    "phrase": "perform menial tasks in the office",
    "pos": "形"
  },
  {
    "word": "candid",
    "meaning": "率直な、遠慮のない",
    "phrase": "a candid discussion about the future",
    "pos": "形"
  },
  {
    "word": "irate",
    "meaning": "激怒した、怒り狂った",
    "phrase": "receive an irate phone call from a client",
    "pos": "形"
  },
  {
    "word": "clique",
    "meaning": "徒党、派閥",
    "phrase": "the school is dominated by cliques",
    "pos": "名"
  },
  {
    "word": "sporadic",
    "meaning": "散発的な、不定期な",
    "phrase": "sporadic outbreaks of the disease",
    "pos": "形"
  },
  {
    "word": "abate",
    "meaning": "（嵐、痛みなどが）弱まる、和らぐ",
    "phrase": "the storm began to abate at night",
    "pos": "動"
  },
  {
    "word": "idyllic",
    "meaning": "牧歌的な、のどかな",
    "phrase": "an idyllic life in the countryside",
    "pos": "形"
  },
  {
    "word": "exquisite",
    "meaning": "精巧な、繊細で美しい",
    "phrase": "an exquisite piece of jewelry",
    "pos": "形"
  },
  {
    "word": "tarnish",
    "meaning": "（評判など）を傷つける",
    "phrase": "tarnish the reputation of the company",
    "pos": "動"
  },
  {
    "word": "vindicate",
    "meaning": "正当性を立証する",
    "phrase": "be vindicated by the new evidence",
    "pos": "動"
  },
  {
    "word": "auspicious",
    "meaning": "幸先のよい、吉兆の",
    "phrase": "an auspicious start to the new year",
    "pos": "形"
  },
  {
    "word": "fastidious",
    "meaning": "細心の注意を払う",
    "phrase": "be fastidious about cleanliness",
    "pos": "形"
  },
  {
    "word": "encapsulate",
    "meaning": "要約する、カプセルに包む",
    "phrase": "encapsulate the main points in a summary",
    "pos": "動"
  },
  {
    "word": "deferential",
    "meaning": "敬意を払う、丁寧な",
    "phrase": "show a deferential attitude towards elders",
    "pos": "形"
  },
  {
    "word": "annex",
    "meaning": "〜を併合する",
    "phrase": "annex the neighboring territory",
    "pos": "動"
  },
  {
    "word": "pungent",
    "meaning": "刺激の強い、辛辣な",
    "phrase": "the pungent smell of onions",
    "pos": "形"
  },
  {
    "word": "conjecture",
    "meaning": "推測、憶測",
    "phrase": "pure conjecture without any proof",
    "pos": "名"
  },
  {
    "word": "muster",
    "meaning": "（勇気など）を奮い起こす",
    "phrase": "muster the courage to speak up",
    "pos": "動"
  },
  {
    "word": "forfeit",
    "meaning": "没収される、失う",
    "phrase": "forfeit the right to appeal",
    "pos": "動"
  },
  {
    "word": "murky",
    "meaning": "濁った、見通せない",
    "phrase": "murky waters of the lake",
    "pos": "形"
  },
  {
    "word": "bigotry",
    "meaning": "偏見、偏狭な行為",
    "phrase": "fight against racial bigotry",
    "pos": "名"
  },
  {
    "word": "augment",
    "meaning": "〜を増加させる",
    "phrase": "augment the existing income with a side job",
    "pos": "動"
  },
  {
    "word": "drab",
    "meaning": "単調な, 退屈な (⇔ boring)",
    "phrase": "a drab and grey winter morning",
    "pos": "形"
  },
  {
    "word": "scruple",
    "meaning": "良心のとがめ, ためらい",
    "phrase": "have no scruples about cheating",
    "pos": "名"
  },
  {
    "word": "feud",
    "meaning": "確執, いさかい",
    "phrase": "a long-standing family feud",
    "pos": "名"
  },
  {
    "word": "brash",
    "meaning": "生意気な, 偉そうな (⇔ arrogant, impudent)",
    "phrase": "a brash young executive",
    "pos": "形"
  },
  {
    "word": "encrypt",
    "meaning": "（データ）を暗号化する (⇔ encode)",
    "phrase": "encrypt sensitive information",
    "pos": "動"
  },
  {
    "word": "apprehend",
    "meaning": "～を逮捕する, 捕らえる (⇔ capture, arrest)",
    "phrase": "apprehend the suspect at the airport",
    "pos": "動"
  },
  {
    "word": "pique",
    "meaning": "(好奇心・興味など)をそそる, ～を怒らせる",
    "phrase": "pique the interest of the audience",
    "pos": "動"
  },
  {
    "word": "infest",
    "meaning": "(害虫・小動物などが)はびこる",
    "phrase": "the house is infested with ants",
    "pos": "動"
  },
  {
    "word": "gloat",
    "meaning": "ほくそ笑む, 満悦する",
    "phrase": "don't gloat over your rival's failure",
    "pos": "動"
  },
  {
    "word": "archaic",
    "meaning": "時代遅れの, 古風な (⇔ outdated)",
    "phrase": "archaic laws that are no longer relevant",
    "pos": "形"
  },
  {
    "word": "veer",
    "meaning": "(急に)方向を変える",
    "phrase": "the car veered off the road",
    "pos": "動"
  },
  {
    "word": "quell",
    "meaning": "(暴動・反乱など)を鎮める, 抑える (⇔ suppress, stifle)",
    "phrase": "quell the rebellion with force",
    "pos": "動"
  },
  {
    "word": "evade",
    "meaning": "（義務・責任など）を逃れる",
    "phrase": "evade taxes or legal responsibilities",
    "pos": "動"
  },
  {
    "word": "benign",
    "meaning": "（腫瘍などが）良性の / 優しい",
    "phrase": "the test results showed the tumor was benign",
    "pos": "形"
  },
  {
    "word": "concession",
    "meaning": "譲歩",
    "phrase": "make a major concession during negotiations",
    "pos": "名"
  },
  {
    "word": "enlighten",
    "meaning": "（人）に知らせる、教える",
    "phrase": "enlighten the staff about the new policy",
    "pos": "動"
  },
  {
    "word": "preclude",
    "meaning": "〜を妨げる、不可能にする",
    "phrase": "preclude the possibility of a misunderstanding",
    "pos": "動"
  },
  {
    "word": "treacherous",
    "meaning": "（安全だと思わせて）実は危険な、油断できない",
    "phrase": "the mountain roads are treacherous in winter",
    "pos": "形"
  },
  {
    "word": "besiege",
    "meaning": "（要塞のある町など）を取り囲む、に押し寄せる",
    "phrase": "be besieged by reporters for a comment",
    "pos": "動"
  },
  {
    "word": "impeccable",
    "meaning": "非の打ちどころがない",
    "phrase": "deliver an impeccable presentation in English",
    "pos": "形"
  },
  {
    "word": "flaunt",
    "meaning": "〜を誇示する、ひけらかす",
    "phrase": "flaunt one’s wealth on social media",
    "pos": "動"
  },
  {
    "word": "revamp",
    "meaning": "〜を改良する、改造する",
    "phrase": "revamp the company website to attract customers",
    "pos": "動"
  },
  {
    "word": "stake",
    "meaning": "（事業・計画などの）出資、関与 / （競争などの）賭け、掛け金",
    "phrase": "have a significant stake in the joint venture",
    "pos": "名"
  },
  {
    "word": "opulent",
    "meaning": "ぜいたくな、豪華な",
    "phrase": "stay at an opulent hotel in Dubai",
    "pos": "形"
  },
  {
    "word": "frigid",
    "meaning": "極寒の、厳寒の / 無感動な、冷淡な",
    "phrase": "receive a frigid reception from the client",
    "pos": "形"
  },
  {
    "word": "embargo",
    "meaning": "通商停止、貿易禁止",
    "phrase": "lift the arms embargo on the country",
    "pos": "名"
  },
  {
    "word": "blur",
    "meaning": "ぼやける、見えにくくなる",
    "phrase": "the lines between work and life begin to blur",
    "pos": "動"
  },
  {
    "word": "bemoan",
    "meaning": "〜について不満に思う、嘆く",
    "phrase": "bemoan the lack of funding for the project",
    "pos": "動"
  },
  {
    "word": "impasse",
    "meaning": "行き詰まり、難局",
    "phrase": "reach a diplomatic impasse in the talks",
    "pos": "名"
  },
  {
    "word": "inconspicuous",
    "meaning": "目立たない、地味な",
    "phrase": "place an inconspicuous security camera",
    "pos": "形"
  },
  {
    "word": "derelict",
    "meaning": "見捨てられた、放置された",
    "phrase": "a derelict warehouse in the industrial zone",
    "pos": "形"
  },
  {
    "word": "meager",
    "meaning": "（量・質）が不十分な、乏しい",
    "phrase": "live on a meager salary",
    "pos": "形"
  },
  {
    "word": "decry",
    "meaning": "〜を公然と非難する",
    "phrase": "decry the government's decision on taxes",
    "pos": "動"
  },
  {
    "word": "botch",
    "meaning": "（不注意・未熟で）〜をしくじる、やり損なう",
    "phrase": "botch a simple task due to carelessness",
    "pos": "動"
  },
  {
    "word": "bout",
    "meaning": "（病気・活動が続く）期間 / 試合",
    "phrase": "a long bout of flu kept me at home",
    "pos": "名"
  },
  {
    "word": "collateral",
    "meaning": "担保（物件） / 付随する、二次的な",
    "phrase": "use one's house as collateral for a loan",
    "pos": "名"
  },
  {
    "word": "impediment",
    "meaning": "障害、支障",
    "phrase": "a major impediment to economic progress",
    "pos": "名"
  },
  {
    "word": "precocious",
    "meaning": "早熟な",
    "phrase": "a precocious child who plays the piano at four",
    "pos": "形"
  },
  {
    "word": "mediocre",
    "meaning": "よくも悪くもない、平凡な",
    "phrase": "give a mediocre performance at the concert",
    "pos": "形"
  },
  {
    "word": "negligent",
    "meaning": "怠慢な、不注意な",
    "phrase": "be held liable for negligent driving",
    "pos": "形"
  },
  {
    "word": "kickback",
    "meaning": "リベート、払い戻し",
    "phrase": "receive illegal kickbacks from the supplier",
    "pos": "名"
  },
  {
    "word": "requisite",
    "meaning": "必要（不可欠）な",
    "phrase": "possess the requisite skills for the job",
    "pos": "形"
  },
  {
    "word": "defiance",
    "meaning": "反抗の態度",
    "phrase": "act in open defiance of the new law",
    "pos": "名"
  },
  {
    "word": "concerted",
    "meaning": "協力して行われた、協調的な",
    "phrase": "make a concerted effort to reduce costs",
    "pos": "形"
  },
  {
    "word": "banter",
    "meaning": "軽口、冗談の言い合い",
    "phrase": "engage in friendly banter with colleagues",
    "pos": "名"
  },
  {
    "word": "antiseptic",
    "meaning": "消毒薬、防腐剤",
    "phrase": "apply an antiseptic to the wound",
    "pos": "名"
  },
  {
    "word": "incessant",
    "meaning": "絶え間のない、ひっきりなしの",
    "phrase": "complained about the incessant noise from next door",
    "pos": "形"
  },
  {
    "word": "allegiance",
    "meaning": "忠誠、忠節",
    "phrase": "pledge allegiance to the country",
    "pos": "名"
  },
  {
    "word": "delinquent",
    "meaning": "（人が）滞納した / 非行の、罪を犯した",
    "phrase": "be delinquent in paying one's taxes",
    "pos": "形"
  },
  {
    "word": "prod",
    "meaning": "〜に促す、思い出させる",
    "phrase": "prod the government into taking action",
    "pos": "動"
  },
  {
    "word": "coerce",
    "meaning": "（人）に強要する",
    "phrase": "be coerced into signing the contract",
    "pos": "動"
  },
  {
    "word": "pertinent",
    "meaning": "関係のある、適切な",
    "phrase": "ask a pertinent question during the meeting",
    "pos": "形"
  },
  {
    "word": "arbitrary",
    "meaning": "任意の、恣意的な",
    "phrase": "make an arbitrary decision without any evidence",
    "pos": "形"
  },
  {
    "word": "stagnant",
    "meaning": "よどんだ、流れの悪い / 不景気な",
    "phrase": "the stagnant economy needs a stimulus",
    "pos": "形"
  },
  {
    "word": "bane",
    "meaning": "破滅のもと、悩みの種",
    "phrase": "plastic waste is the bane of the environment",
    "pos": "名"
  },
  {
    "word": "morbid",
    "meaning": "病的な、不健全な",
    "phrase": "have a morbid fascination with death",
    "pos": "形"
  },
  {
    "word": "purge",
    "meaning": "〜から追放する",
    "phrase": "purge the party of corrupt members",
    "pos": "動"
  },
  {
    "word": "pervasive",
    "meaning": "行き渡った、蔓延した",
    "phrase": "the pervasive influence of social media",
    "pos": "形"
  },
  {
    "word": "appraise",
    "meaning": "〜を評価する、鑑定する",
    "phrase": "appraise the market value of the property",
    "pos": "動"
  },
  {
    "word": "nullify",
    "meaning": "〜を無効にする、破棄する",
    "phrase": "nullify the results of the election",
    "pos": "動"
  },
  {
    "word": "tacit",
    "meaning": "暗黙の",
    "phrase": "give tacit approval to the plan",
    "pos": "形"
  },
  {
    "word": "swerve",
    "meaning": "（急に）向きを変える、ハンドルを切る",
    "phrase": "swerve to avoid a collision with a deer",
    "pos": "動"
  },
  {
    "word": "perpetrate",
    "meaning": "（犯罪などを）犯す、実行する",
    "phrase": "perpetrate a fraud against investors",
    "pos": "動"
  },
  {
    "word": "reclusive",
    "meaning": "引きこもりがちな",
    "phrase": "lead a reclusive life in the countryside",
    "pos": "形"
  },
  {
    "word": "onus",
    "meaning": "責任、義務",
    "phrase": "the onus is on the company to prove safety",
    "pos": "名"
  },
  {
    "word": "cinch",
    "meaning": "たやすいこと、朝飯前のこと",
    "phrase": "the exam was a cinch for him",
    "pos": "名"
  },
  {
    "word": "mesmerize",
    "meaning": "〜をうっとりさせる、魅了する",
    "phrase": "be mesmerized by the beautiful scenery",
    "pos": "動"
  },
  {
    "word": "lurid",
    "meaning": "ゾッとするような、ぞっとする",
    "phrase": "the tabloid published the lurid details of the case",
    "pos": "形"
  },
  {
    "word": "exhort",
    "meaning": "（人）に強く勧める、説得する",
    "phrase": "exhort the team to work harder",
    "pos": "動"
  },
  {
    "word": "throng",
    "meaning": "群衆、人だかり / 群がる",
    "phrase": "a throng of people gathered at the airport",
    "pos": "名"
  },
  {
    "word": "thwart",
    "meaning": "（計画など）を阻止する、（人）を妨げる",
    "phrase": "thwart an attempted bank robbery",
    "pos": "動"
  },
  {
    "word": "insinuate",
    "meaning": "（悪口など）を遠回しに言う",
    "phrase": "insinuate that he had cheated on the test",
    "pos": "動"
  },
  {
    "word": "canvass",
    "meaning": "（寄付・投票などを求めて）訪ねて回る",
    "phrase": "canvass the neighborhood for votes",
    "pos": "動"
  },
  {
    "word": "complacent",
    "meaning": "自己満足の、惰性に入った",
    "phrase": "don't become complacent about your success",
    "pos": "形"
  },
  {
    "word": "innuendo",
    "meaning": "（性的な・不快な）ほのめかし、当てこすり",
    "phrase": "be full of sexual innuendo",
    "pos": "名"
  },
  {
    "word": "clench",
    "meaning": "（歯）を食いしばる、（手）を握りしめる",
    "phrase": "clench one's fists in anger",
    "pos": "動"
  },
  {
    "word": "astute",
    "meaning": "（人・行動などが）鋭敏な、抜け目のない",
    "phrase": "make an astute observation about the market",
    "pos": "形"
  },
  {
    "word": "levity",
    "meaning": "軽率さ、場違いな陽気さ",
    "phrase": "add some levity to a serious situation",
    "pos": "名"
  },
  {
    "word": "falter",
    "meaning": "口ごもる、調子が悪くなる",
    "phrase": "falter in one's commitment to the goal",
    "pos": "動"
  },
  {
    "word": "copious",
    "meaning": "（量・数などが）多くの",
    "phrase": "take copious notes during the lecture",
    "pos": "形"
  },
  {
    "word": "retort",
    "meaning": "（人が）（すぐに）〜と言い返す、切り返す",
    "phrase": "retort that it was none of their business",
    "pos": "動"
  },
  {
    "word": "wilt",
    "meaning": "しおれる、ぐったりする",
    "phrase": "the flowers began to wilt in the heat",
    "pos": "動"
  },
  {
    "word": "accrue",
    "meaning": "（利子・資産などが）たまる",
    "phrase": "interest will accrue on the savings account",
    "pos": "動"
  },
  {
    "word": "reprieve",
    "meaning": "（死刑などからの）一時的な猶予",
    "phrase": "receive a last-minute reprieve from execution",
    "pos": "名"
  },
  {
    "word": "rehash",
    "meaning": "焼き直し（をしたもの）",
    "phrase": "the movie was just a rehash of the original",
    "pos": "名"
  },
  {
    "word": "congregate",
    "meaning": "集まる、集合する",
    "phrase": "people congregated in the town square",
    "pos": "動"
  },
  {
    "word": "demure",
    "meaning": "（女性・衣装などが）おとなしい、控えめな",
    "phrase": "wear a demure dress for the party",
    "pos": "形"
  },
  {
    "word": "mock",
    "meaning": "模擬の、ばかにする、からかう",
    "phrase": "take a mock exam before the real one",
    "pos": "形"
  },
  {
    "word": "abscond",
    "meaning": "（場所から）逃亡する、行方をくらます",
    "phrase": "abscond with the company's funds",
    "pos": "動"
  },
  {
    "word": "ebb",
    "meaning": "（人気・景気などが）衰退する、（潮が）引く",
    "phrase": "public confidence in the government is at an ebb",
    "pos": "動"
  },
  {
    "word": "dissuade",
    "meaning": "（人）を説得して〜を思いとどまらせる",
    "phrase": "dissuade him from quitting his job",
    "pos": "動"
  },
  {
    "word": "repudiate",
    "meaning": "〜を否認する、〜を拒絶する",
    "phrase": "repudiate the allegations of misconduct",
    "pos": "動"
  },
  {
    "word": "deposition",
    "meaning": "宣誓証言（すること）、供述調書",
    "phrase": "give a formal deposition in court",
    "pos": "名"
  },
  {
    "word": "retention",
    "meaning": "記憶、記憶力 / 保有、保持",
    "phrase": "improve the retention of new employees",
    "pos": "名"
  },
  {
    "word": "propagation",
    "meaning": "（思想・情報などの）伝播、普及",
    "phrase": "the propagation of false information",
    "pos": "名"
  },
  {
    "word": "cringe",
    "meaning": "（恐怖などで）すくむ、後ずさりする",
    "phrase": "cringe at the thought of public speaking",
    "pos": "動"
  },
  {
    "word": "unruly",
    "meaning": "言うことを聞かない、手に負えない",
    "phrase": "an unruly crowd of protesters",
    "pos": "形"
  },
  {
    "word": "dislodge",
    "meaning": "（もの・人）を（指定の場所から）取り除く",
    "phrase": "dislodge a piece of food stuck in the throat",
    "pos": "動"
  },
  {
    "word": "tactful",
    "meaning": "機転の利く、そつのない",
    "phrase": "be tactful in handling the sensitive issue",
    "pos": "形"
  },
  {
    "word": "derisive",
    "meaning": "嘲笑的な、あざけりの",
    "phrase": "give a derisive laugh at the suggestion",
    "pos": "形"
  },
  {
    "word": "blunder",
    "meaning": "へま、ミス、不手際",
    "phrase": "make a major blunder in the report",
    "pos": "名"
  },
  {
    "word": "proliferate",
    "meaning": "急増する、拡散する",
    "phrase": "the use of smartphones has proliferated",
    "pos": "動"
  },
  {
    "word": "boisterous",
    "meaning": "騒がしい、陽気な",
    "phrase": "a boisterous group of children playing",
    "pos": "形"
  },
  {
    "word": "coax",
    "meaning": "〜をうまく連れ出す、なだめすかす",
    "phrase": "coax the cat out from under the bed",
    "pos": "動"
  },
  {
    "word": "teem",
    "meaning": "（場所が）（人・動物などが）多い、うようよいる",
    "phrase": "the streets were teeming with tourists",
    "pos": "動"
  },
  {
    "word": "pariah",
    "meaning": "のけ者、嫌われ者",
    "phrase": "become a social pariah after the scandal",
    "pos": "名"
  },
  {
    "word": "vanity",
    "meaning": "うぬぼれ、虚栄心",
    "phrase": "it was a blow to his vanity",
    "pos": "名"
  },
  {
    "word": "cumbersome",
    "meaning": "扱いづらい、運びづらい",
    "phrase": "the new regulations are cumbersome to follow",
    "pos": "形"
  },
  {
    "word": "deplorable",
    "meaning": "ひどい、悲惨な",
    "phrase": "live in deplorable conditions in the slums",
    "pos": "形"
  },
  {
    "word": "extrovert",
    "meaning": "外交的な人、社交的な人",
    "phrase": "she is an extrovert who loves meeting people",
    "pos": "名"
  },
  {
    "word": "bravado",
    "meaning": "虚勢、強がり",
    "phrase": "his talk of fighting was mere bravado",
    "pos": "名"
  },
  {
    "word": "dogmatic",
    "meaning": "独断的な、教義上の",
    "phrase": "be very dogmatic in one's religious beliefs",
    "pos": "形"
  },
  {
    "word": "lavish",
    "meaning": "ぜいたくな、豪華な / 気前のよい",
    "phrase": "throw a lavish party for their anniversary",
    "pos": "形"
  },
  {
    "word": "contrive",
    "meaning": "〜を考案する、〜をたくらむ",
    "phrase": "contrive a way to escape from prison",
    "pos": "動"
  },
  {
    "word": "slur",
    "meaning": "誹謗、中傷",
    "phrase": "make a racial slur against the player",
    "pos": "名"
  },
  {
    "word": "omen",
    "meaning": "前兆、予兆",
    "phrase": "a dark cloud is often a bad omen",
    "pos": "名"
  },
  {
    "word": "imposition",
    "meaning": "押しつけ、無理強い",
    "phrase": "apologize for the imposition on your time",
    "pos": "名"
  },
  {
    "word": "abdicate",
    "meaning": "（王位・権利など）を放棄する",
    "phrase": "the king decided to abdicate the throne",
    "pos": "動"
  },
  {
    "word": "swindle",
    "meaning": "〜をだます、だまし取る",
    "phrase": "swindle elderly people out of their savings",
    "pos": "動"
  },
  {
    "word": "slouch",
    "meaning": "前かがみになる、だらけた格好をする",
    "phrase": "don't slouch in your chair during the interview",
    "pos": "動"
  },
  {
    "word": "lanky",
    "meaning": "やせてひょろっとした",
    "phrase": "a lanky teenager with long arms and legs",
    "pos": "形"
  },
  {
    "word": "reprisal",
    "meaning": "報復、仕返し",
    "phrase": "take action in reprisal for the attack",
    "pos": "名"
  },
  {
    "word": "desolate",
    "meaning": "人けのない、荒れ果てた / 孤独な、寂しい",
    "phrase": "a desolate landscape after the forest fire",
    "pos": "形"
  },
  {
    "word": "perennial",
    "meaning": "いつまでも続く、多年生の",
    "phrase": "inflation is a perennial problem for the economy",
    "pos": "形"
  },
  {
    "word": "bluff",
    "meaning": "はったりをかける、はったり",
    "phrase": "he was just bluffing about having a gun",
    "pos": "動"
  },
  {
    "word": "squirm",
    "meaning": "もがく、身をよじる",
    "phrase": "squirm with embarrassment during the speech",
    "pos": "動"
  },
  {
    "word": "transpire",
    "meaning": "（事件などが）起こる / （植物が）水分を発散させる",
    "phrase": "it later transpired that he had lied",
    "pos": "動"
  },
  {
    "word": "aboveboard",
    "meaning": "公明正大な、隠しごとのない",
    "phrase": "the deal was completely open and aboveboard",
    "pos": "形"
  },
  {
    "word": "eminent",
    "meaning": "高名な、著名な",
    "phrase": "an eminent scientist in the field of physics",
    "pos": "形"
  },
  {
    "word": "discerning",
    "meaning": "洞察力のある、目の肥えた",
    "phrase": "a discerning customer who knows quality",
    "pos": "形"
  },
  {
    "word": "labyrinth",
    "meaning": "迷宮、迷路 / 複雑な状況",
    "phrase": "navigate the labyrinth of tax laws",
    "pos": "名"
  },
  {
    "word": "conciliate",
    "meaning": "（人）をなだめる、懐柔する、調停する",
    "phrase": "try to conciliate the angry customer",
    "pos": "動"
  },
  {
    "word": "perfunctory",
    "meaning": "（行為が）いい加減な、通り一遍の",
    "phrase": "give a perfunctory nod to the neighbor",
    "pos": "形"
  },
  {
    "word": "repatriate",
    "meaning": "（人）を本国へ送還する",
    "phrase": "repatriate refugees to their home country",
    "pos": "動"
  },
  {
    "word": "traverse",
    "meaning": "（場所）を横切る、越える",
    "phrase": "traverse the entire continent by train",
    "pos": "動"
  },
  {
    "word": "bridle",
    "meaning": "（感情を表に出して）つんとする",
    "phrase": "bridle at the suggestion of being lazy",
    "pos": "動"
  },
  {
    "word": "queasy",
    "meaning": "胃・胃がむかむかする、吐き気がする",
    "phrase": "feel a bit queasy after the long boat ride",
    "pos": "形"
  },
  {
    "word": "grapple",
    "meaning": "（困難などに）取り組む、取っ組み合う",
    "phrase": "grapple with the problem of climate change",
    "pos": "動"
  },
  {
    "word": "livid",
    "meaning": "激怒した、怒り狂った",
    "phrase": "be livid when he found out the truth",
    "pos": "形"
  },
  {
    "word": "zeal",
    "meaning": "熱意、情熱",
    "phrase": "show great zeal for environmental protection",
    "pos": "名"
  },
  {
    "word": "stupor",
    "meaning": "人事不省、昏睡状態",
    "phrase": "fall into a drunken stupor",
    "pos": "名"
  },
  {
    "word": "harrowing",
    "meaning": "悲惨な、痛ましい",
    "phrase": "a harrowing account of the survivors",
    "pos": "形"
  },
  {
    "word": "brazen",
    "meaning": "厚かましい、図々しい",
    "phrase": "a brazen lie that no one believed",
    "pos": "形"
  },
  {
    "word": "elucidation",
    "meaning": "解明、明快な説明",
    "phrase": "provide a clear elucidation of the theory",
    "pos": "名"
  },
  {
    "word": "repel",
    "meaning": "〜を追い払う、撃退する",
    "phrase": "repel an attack by the enemy",
    "pos": "動"
  },
  {
    "word": "scamper",
    "meaning": "すばやく走る",
    "phrase": "the mouse scampered across the floor",
    "pos": "動"
  },
  {
    "word": "meander",
    "meaning": "曲がりくねる、だらだら進む",
    "phrase": "the river meanders through the valley",
    "pos": "動"
  },
  {
    "word": "despondent",
    "meaning": "失望した、意気消沈した",
    "phrase": "feel despondent after failing the exam",
    "pos": "形"
  },
  {
    "word": "wade",
    "meaning": "歩く、歩いて渡る",
    "phrase": "wade through the shallow water to the shore",
    "pos": "動"
  },
  {
    "word": "inquisitive",
    "meaning": "好奇心の強い、知りたがる",
    "phrase": "an inquisitive child who asks many questions",
    "pos": "形"
  },
  {
    "word": "chastise",
    "meaning": "〜を厳しく非難する、責める",
    "phrase": "chastise the children for their bad behavior",
    "pos": "動"
  },
  {
    "word": "retard",
    "meaning": "〜を遅らせる、妨げる",
    "phrase": "cold weather can retard the growth of plants",
    "pos": "動"
  },
  {
    "word": "complexion",
    "meaning": "肌の色、顔色",
    "phrase": "have a clear and healthy complexion",
    "pos": "名"
  },
  {
    "word": "constellation",
    "meaning": "星座",
    "phrase": "the Orion constellation is easy to find",
    "pos": "名"
  },
  {
    "word": "imbue",
    "meaning": "〜に染み込ませる、植え付ける",
    "phrase": "imbue the students with a sense of purpose",
    "pos": "動"
  },
  {
    "word": "frenetic",
    "meaning": "慌たらしい、狂ったような",
    "phrase": "the frenetic pace of life in the city",
    "pos": "形"
  },
  {
    "word": "snag",
    "meaning": "思いがけない障害",
    "phrase": "hit a snag in the negotiations",
    "pos": "名"
  },
  {
    "word": "rummage",
    "meaning": "引っかき回して捜す",
    "phrase": "rummage through the drawer for a key",
    "pos": "動"
  },
  {
    "word": "condone",
    "meaning": "〜を容赦する、大目に見る",
    "phrase": "the school does not condone bullying",
    "pos": "動"
  },
  {
    "word": "brusquely",
    "meaning": "ぶっきらぼうに、不愛想に",
    "phrase": "be dismissed brusquely by the manager",
    "pos": "副"
  },
  {
    "word": "derogatory",
    "meaning": "軽蔑的な、侮辱的な",
    "phrase": "make a derogatory comment about her appearance",
    "pos": "形"
  },
  {
    "word": "oblique",
    "meaning": "間接的な、遠回しの",
    "phrase": "make an oblique reference to the problem",
    "pos": "形"
  },
  {
    "word": "rumble",
    "meaning": "ゴロゴロ鳴る",
    "phrase": "hear the rumble of thunder in the distance",
    "pos": "動"
  },
  {
    "word": "goad",
    "meaning": "（人）をけけしかける、駆り立てる",
    "phrase": "goad him into losing his temper",
    "pos": "動"
  },
  {
    "word": "deduce",
    "meaning": "〜を推定する、推論する",
    "phrase": "deduce the answer from the clues provided",
    "pos": "動"
  },
  {
    "word": "awry",
    "meaning": "曲がった、ゆがんだ",
    "phrase": "something has gone awry with the plan",
    "pos": "形"
  },
  {
    "word": "dearth",
    "meaning": "不足、欠乏",
    "phrase": "a dearth of qualified teachers in the area",
    "pos": "名"
  },
  {
    "word": "detest",
    "meaning": "〜を嫌う、ひどく嫌う",
    "phrase": "detest having to get up early",
    "pos": "動"
  },
  {
    "word": "agility",
    "meaning": "機敏さ、敏捷さ",
    "phrase": "the player's agility on the field was impressive",
    "pos": "名"
  },
  {
    "word": "uncanny",
    "meaning": "不思議な、神秘的な",
    "phrase": "an uncanny resemblance to her mother",
    "pos": "形"
  },
  {
    "word": "wager",
    "meaning": "賭ける、賭け",
    "phrase": "wager a large sum of money on the horse race",
    "pos": "動"
  },
  {
    "word": "peruse",
    "meaning": "〜を読む、熟読する",
    "phrase": "peruse the contract before signing it",
    "pos": "動"
  },
  {
    "word": "invincible",
    "meaning": "無敵の、征服できない",
    "phrase": "the team seemed invincible after the victory",
    "pos": "形"
  },
  {
    "word": "plenary",
    "meaning": "全員出席の、完全な",
    "phrase": "a plenary session of the conference",
    "pos": "形"
  },
  {
    "word": "litigate",
    "meaning": "訴訟を起こす、法廷で争う",
    "phrase": "litigate the matter in a court of law",
    "pos": "動"
  },
  {
    "word": "juncture",
    "meaning": "（重大な）時点、時期",
    "phrase": "at this critical juncture in history",
    "pos": "名"
  },
  {
    "word": "sleek",
    "meaning": "しゃれた、かっこいい",
    "phrase": "drive a sleek new sports car",
    "pos": "形"
  },
  {
    "word": "indulge",
    "meaning": "ふける、満足させる",
    "phrase": "indulge in a luxury spa treatment",
    "pos": "動"
  },
  {
    "word": "truce",
    "meaning": "休戦、停戦協定",
    "phrase": "the two sides agreed on a temporary truce",
    "pos": "名"
  },
  {
    "word": "facetious",
    "meaning": "ふざけた、冗談の",
    "phrase": "stop being facetious and take this seriously",
    "pos": "形"
  },
  {
    "word": "prelude",
    "meaning": "前兆、前段階",
    "phrase": "the protest was a prelude to the revolution",
    "pos": "名"
  },
  {
    "word": "libel",
    "meaning": "名誉毀損",
    "phrase": "sue the newspaper for libel",
    "pos": "名"
  },
  {
    "word": "dangle",
    "meaning": "ぶらさがる、ぶら下げる",
    "phrase": "dangle a set of keys in front of the baby",
    "pos": "動"
  },
  {
    "word": "adjourn",
    "meaning": "休会する、延期する",
    "phrase": "the meeting was adjourned until tomorrow",
    "pos": "動"
  },
  {
    "word": "plausible",
    "meaning": "もっともらしい",
    "phrase": "give a plausible explanation for the delay",
    "pos": "形"
  },
  {
    "word": "altercation",
    "meaning": "口論、言い争い",
    "phrase": "be involved in a heated altercation",
    "pos": "名"
  },
  {
    "word": "convoluted",
    "meaning": "複雑な、入り組んだ",
    "phrase": "a convoluted plot that was hard to follow",
    "pos": "形"
  },
  {
    "word": "immune",
    "meaning": "免疫のある、影響を受けない",
    "phrase": "be immune to the effects of the drug",
    "pos": "形"
  },
  {
    "word": "replicate",
    "meaning": "〜を再現する、複製する",
    "phrase": "replicate the experiment in the lab",
    "pos": "動"
  },
  {
    "word": "deter",
    "meaning": "〜を思いとどまらせる、阻止する",
    "phrase": "the high price may deter customers",
    "pos": "動"
  },
  {
    "word": "aggravate",
    "meaning": "悪化させる、いら立たせる",
    "phrase": "the loud music aggravated his headache",
    "pos": "動"
  },
  {
    "word": "strain",
    "meaning": "血統、品種 / 精神的緊張、ストレス",
    "phrase": "be under a lot of mental strain at work",
    "pos": "名"
  },
  {
    "word": "faction",
    "meaning": "派閥、党派",
    "phrase": "a small faction within the political party",
    "pos": "名"
  },
  {
    "word": "demise",
    "meaning": "終了、終焉 / 死亡",
    "phrase": "the demise of the local newspaper",
    "pos": "名"
  },
  {
    "word": "lethal",
    "meaning": "致死の、致命的な",
    "phrase": "a lethal dose of the medication",
    "pos": "形"
  },
  {
    "word": "counterfeit",
    "meaning": "偽の、偽造の",
    "phrase": "pass a counterfeit hundred-dollar bill",
    "pos": "形"
  },
  {
    "word": "avert",
    "meaning": "（危険など）を防ぐ / 目をそらす",
    "phrase": "avert a major disaster through quick action",
    "pos": "動"
  },
  {
    "word": "forensic",
    "meaning": "科学捜査の、犯罪科学の",
    "phrase": "conduct a forensic examination of the evidence",
    "pos": "形"
  },
  {
    "word": "negate",
    "meaning": "〜を否定する / 無効にする",
    "phrase": "the new evidence negates the original theory",
    "pos": "動"
  },
  {
    "word": "feasible",
    "meaning": "実現可能な",
    "phrase": "a feasible solution to the housing crisis",
    "pos": "形"
  },
  {
    "word": "diminish",
    "meaning": "〜を減らす、小さくする / 減少する",
    "phrase": "the threat of war has diminished",
    "pos": "動"
  },
  {
    "word": "forge",
    "meaning": "〜を築く、強化する / 偽造する",
    "phrase": "forge a strong partnership with the company",
    "pos": "動"
  },
  {
    "word": "vie",
    "meaning": "競う、張り合う",
    "phrase": "companies vie for market share",
    "pos": "動"
  },
  {
    "word": "waive",
    "meaning": "（権利など）を放棄する",
    "phrase": "waive the late payment fee",
    "pos": "動"
  },
  {
    "word": "onset",
    "meaning": "（好ましくないことの）開始、始まり",
    "phrase": "the onset of winter in late November",
    "pos": "名"
  },
  {
    "word": "slack",
    "meaning": "緩い、たるんだ / 不活発な",
    "phrase": "the slack rope hung from the tree",
    "pos": "形"
  },
  {
    "word": "precedent",
    "meaning": "前例、先例",
    "phrase": "set a precedent for future cases",
    "pos": "名"
  },
  {
    "word": "stark",
    "meaning": "まったくの、完全な / 荒涼とした",
    "phrase": "a stark contrast between the two sisters",
    "pos": "形"
  },
  {
    "word": "anomaly",
    "meaning": "異常、例外",
    "phrase": "the results were an anomaly in the data",
    "pos": "名"
  },
  {
    "word": "alleged",
    "meaning": "（証拠なしに）主張された",
    "phrase": "the alleged crimes took place last year",
    "pos": "形"
  },
  {
    "word": "entrench",
    "meaning": "〜を固定化する、根付かせる",
    "phrase": "the new system is now well entrenched",
    "pos": "動"
  },
  {
    "word": "deportation",
    "meaning": "国外追放、送還",
    "phrase": "face deportation back to their home country",
    "pos": "名"
  },
  {
    "word": "verdict",
    "meaning": "評決、答申",
    "phrase": "the jury reached a verdict of not guilty",
    "pos": "名"
  },
  {
    "word": "strand",
    "meaning": "〜を立ち往生させる",
    "phrase": "be stranded at the airport due to the storm",
    "pos": "動"
  },
  {
    "word": "eclipse",
    "meaning": "〜の影を薄くする、凌駕する / （天体の）食、失墜",
    "phrase": "his talent eclipses that of his father",
    "pos": "動"
  },
  {
    "word": "culprit",
    "meaning": "犯人、被告",
    "phrase": "the police caught the culprit after a week",
    "pos": "名"
  },
  {
    "word": "prerequisite",
    "meaning": "必要条件、前提条件",
    "phrase": "experience is a prerequisite for the job",
    "pos": "名"
  },
  {
    "word": "cohesive",
    "meaning": "結束した、まとまりのある",
    "phrase": "build a cohesive team for the project",
    "pos": "形"
  },
  {
    "word": "covert",
    "meaning": "密かな、隠密の",
    "phrase": "conduct a covert operation in the city",
    "pos": "形"
  },
  {
    "word": "hub",
    "meaning": "中心、中枢",
    "phrase": "the city is a major transportation hub",
    "pos": "名"
  },
  {
    "word": "plight",
    "meaning": "苦境、深刻な状況",
    "phrase": "the plight of the homeless in winter",
    "pos": "名"
  },
  {
    "word": "spearhead",
    "meaning": "〜の先頭に立つ、やりの穂先",
    "phrase": "spearhead a new campaign for education",
    "pos": "動"
  },
  {
    "word": "installment",
    "meaning": "1回分の支払い",
    "phrase": "pay for the car in monthly installments",
    "pos": "名"
  },
  {
    "word": "exemplify",
    "meaning": "〜の典型例となる、例証する",
    "phrase": "this case exemplifies the problem",
    "pos": "動"
  },
  {
    "word": "daunting",
    "meaning": "人の気力をくじく、非常に手ごわい",
    "phrase": "face a daunting task ahead",
    "pos": "形"
  },
  {
    "word": "momentum",
    "meaning": "勢い、はずみ",
    "phrase": "the campaign is gaining momentum",
    "pos": "名"
  },
  {
    "word": "proximity",
    "meaning": "近いこと",
    "phrase": "the proximity of the hotel to the beach",
    "pos": "名"
  },
  {
    "word": "ubiquitous",
    "meaning": "至るところに存在する、遍在する",
    "phrase": "cell phones are ubiquitous nowadays",
    "pos": "形"
  },
  {
    "word": "arid",
    "meaning": "乾燥した",
    "phrase": "an arid climate with very little rain",
    "pos": "形"
  },
  {
    "word": "obscurity",
    "meaning": "無名、世に知られていないこと",
    "phrase": "rise from obscurity to fame",
    "pos": "名"
  },
  {
    "word": "banal",
    "meaning": "陳腐な、ありふれた",
    "phrase": "a banal conversation about the weather",
    "pos": "形"
  },
  {
    "word": "encroach",
    "meaning": "侵入する、侵害する",
    "phrase": "encroach on the neighbor's property",
    "pos": "動"
  },
  {
    "word": "blister",
    "meaning": "水膨れ、やけど",
    "phrase": "develop a painful blister on the foot",
    "pos": "名"
  },
  {
    "word": "longevity",
    "meaning": "寿命、長寿",
    "phrase": "the longevity of the people in the village",
    "pos": "名"
  },
  {
    "word": "verification",
    "meaning": "確認、証拠",
    "phrase": "provide verification of one's identity",
    "pos": "名"
  },
  {
    "word": "envoy",
    "meaning": "使節、使者",
    "phrase": "a special envoy sent to discuss peace",
    "pos": "名"
  },
  {
    "word": "incur",
    "meaning": "〜を負う、こうむる",
    "phrase": "incur heavy losses in the investment",
    "pos": "動"
  },
  {
    "word": "gauge",
    "meaning": "〜を評価する、測定する",
    "phrase": "gauge the public reaction to the news",
    "pos": "動"
  },
  {
    "word": "foster",
    "meaning": "〜を育む、促進する / 養育する",
    "phrase": "foster a sense of community in the area",
    "pos": "動"
  },
  {
    "word": "smuggle",
    "meaning": "〜を密輸する、こっそり持ち込む",
    "phrase": "smuggle drugs across the border",
    "pos": "動"
  },
  {
    "word": "eviction",
    "meaning": "立ち退き、追い出し",
    "phrase": "face eviction for not paying the rent",
    "pos": "名"
  },
  {
    "word": "lurk",
    "meaning": "潜む、潜伏する",
    "phrase": "a stranger was lurking in the shadows",
    "pos": "動"
  },
  {
    "word": "dire",
    "meaning": "悲惨な、恐ろしい",
    "phrase": "the situation has become dire",
    "pos": "形"
  },
  {
    "word": "wreak",
    "meaning": "（害などを）もたらす",
    "phrase": "wreak havoc on the global economy",
    "pos": "動"
  },
  {
    "word": "burgeon",
    "meaning": "急速に成長する、芽吹く",
    "phrase": "the burgeoning tech industry in the city",
    "pos": "動"
  },
  {
    "word": "cumulative",
    "meaning": "累積する、次第に増加する",
    "phrase": "the cumulative effect of poor diet",
    "pos": "形"
  },
  {
    "word": "fraught",
    "meaning": "〜に満ちた / 不安にさせる",
    "phrase": "the journey was fraught with danger",
    "pos": "形"
  },
  {
    "word": "decipher",
    "meaning": "〜を解読する",
    "phrase": "decipher the ancient script",
    "pos": "動"
  },
  {
    "word": "adherent",
    "meaning": "支持者、信奉者",
    "phrase": "an adherent of the new religious movement",
    "pos": "名"
  },
  {
    "word": "bombardment",
    "meaning": "爆撃、砲撃",
    "phrase": "a heavy bombardment of the city",
    "pos": "名"
  },
  {
    "word": "juggle",
    "meaning": "〜をうまくやりくりする",
    "phrase": "juggle work and family life",
    "pos": "動"
  },
  {
    "word": "explicit",
    "meaning": "露骨な、あからさまな / 明白な",
    "phrase": "give explicit instructions for the task",
    "pos": "形"
  },
  {
    "word": "insulate",
    "meaning": "〜を遮断する、隔離する",
    "phrase": "insulate the house against the cold",
    "pos": "動"
  },
  {
    "word": "pivotal",
    "meaning": "重要な、決定的な",
    "phrase": "play a pivotal role in the negotiations",
    "pos": "形"
  },
  {
    "word": "expedite",
    "meaning": "〜を促進する、急がせる",
    "phrase": "expedite the delivery of the package",
    "pos": "動"
  },
  {
    "word": "subdued",
    "meaning": "元気のない、おとなしい / 控えめな",
    "phrase": "a subdued atmosphere at the funeral",
    "pos": "形"
  },
  {
    "word": "destitute",
    "meaning": "困窮した、極貧の",
    "phrase": "be left destitute after the war",
    "pos": "形"
  },
  {
    "word": "grievance",
    "meaning": "不満、苦情",
    "phrase": "file a formal grievance against the company",
    "pos": "名"
  },
  {
    "word": "arduous",
    "meaning": "骨の折れる、きつい",
    "phrase": "an arduous climb up the mountain",
    "pos": "形"
  },
  {
    "word": "oblivious",
    "meaning": "気づかないで、無頓着で / 忘れて",
    "phrase": "be oblivious to the danger",
    "pos": "形"
  },
  {
    "word": "recoup",
    "meaning": "〜を取り戻す",
    "phrase": "recoup the costs of the project",
    "pos": "動"
  },
  {
    "word": "demoralize",
    "meaning": "〜の士気をくじく、意気消沈させる",
    "phrase": "the defeat demoralized the team",
    "pos": "動"
  },
  {
    "word": "fraudulent",
    "meaning": "詐貴の、不正な",
    "phrase": "a fraudulent claim for insurance",
    "pos": "形"
  },
  {
    "word": "frantic",
    "meaning": "取り乱した、必死の",
    "phrase": "be frantic with worry about the child",
    "pos": "形"
  },
  {
    "word": "incremental",
    "meaning": "少しずつ増加する",
    "phrase": "make incremental changes to the system",
    "pos": "形"
  },
  {
    "word": "afflict",
    "meaning": "〜を苦しめる、悩ませる",
    "phrase": "be afflicted with a chronic disease",
    "pos": "動"
  },
  {
    "word": "plummet",
    "meaning": "急落する、落ちる",
    "phrase": "temperatures are expected to plummet tonight",
    "pos": "動"
  },
  {
    "word": "stunt",
    "meaning": "派手な行為、スタント / 成長・発達を妨げる",
    "phrase": "poor nutrition can stunt growth",
    "pos": "動"
  },
  {
    "word": "liable",
    "meaning": "責任がある、義務がある / 〜しがちな",
    "phrase": "be liable for the damages",
    "pos": "形"
  },
  {
    "word": "premise",
    "meaning": "前提、根拠",
    "phrase": "based on the premise that people are good",
    "pos": "名"
  },
  {
    "word": "demolition",
    "meaning": "取り壊し、解体",
    "phrase": "the demolition of the old building",
    "pos": "名"
  },
  {
    "word": "turbulent",
    "meaning": "動乱の、混乱した / 荒れ狂った",
    "phrase": "a turbulent period in the country's history",
    "pos": "形"
  },
  {
    "word": "allot",
    "meaning": "〜を割り当てる、配分する",
    "phrase": "allot a task to each member of the group",
    "pos": "動"
  },
  {
    "word": "dissect",
    "meaning": "〜を解剖する、分析する",
    "phrase": "dissect the argument in the essay",
    "pos": "動"
  },
  {
    "word": "provision",
    "meaning": "規定、条件 / 備え、供給",
    "phrase": "a provision in the contract",
    "pos": "名"
  },
  {
    "word": "hone",
    "meaning": "〜に磨きをかける",
    "phrase": "hone one's skills through practice",
    "pos": "動"
  },
  {
    "word": "jeopardy",
    "meaning": "危険、危機",
    "phrase": "put the lives of many in jeopardy",
    "pos": "名"
  },
  {
    "word": "disintegration",
    "meaning": "崩壊、分解",
    "phrase": "the disintegration of the Soviet Union",
    "pos": "名"
  },
  {
    "word": "misnomer",
    "meaning": "不適切な名称、誤称",
    "phrase": "it's a misnomer to call it a park",
    "pos": "名"
  },
  {
    "word": "pitfall",
    "meaning": "落とし穴、思わぬ危険",
    "phrase": "avoid the common pitfalls of investing",
    "pos": "名"
  },
  {
    "word": "meekly",
    "meaning": "おとなしく、従順に",
    "phrase": "obey the orders meekly",
    "pos": "副"
  },
  {
    "word": "terrain",
    "meaning": "地形、地勢、土地",
    "phrase": "difficult terrain for the soldiers",
    "pos": "名"
  },
  {
    "word": "brew",
    "meaning": "〜を醸し出す、醸造する",
    "phrase": "a storm is brewing in the distance",
    "pos": "動"
  },
  {
    "word": "pseudonym",
    "meaning": "ペンネーム、筆名",
    "phrase": "write under a pseudonym",
    "pos": "名"
  },
  {
    "word": "stealth",
    "meaning": "密かな行動、ステルス性",
    "phrase": "operate with stealth and precision",
    "pos": "名"
  },
  {
    "word": "mosaic",
    "meaning": "モザイク風のもの、寄せ集め",
    "phrase": "a mosaic of different cultures in the city",
    "pos": "名"
  },
  {
    "word": "ponder",
    "meaning": "熟考する、思案する",
    "phrase": "ponder the meaning of life",
    "pos": "動"
  },
  {
    "word": "flex",
    "meaning": "筋肉を動かす、曲げる",
    "phrase": "flex one's muscles after the workout",
    "pos": "動"
  },
  {
    "word": "testament",
    "meaning": "証拠、証言",
    "phrase": "a testament to his hard work",
    "pos": "名"
  },
  {
    "word": "prudence",
    "meaning": "慎重さ、用心早さ",
    "phrase": "exercise prudence in spending money",
    "pos": "名"
  },
  {
    "word": "adjacent",
    "meaning": "隣の、隣接した",
    "phrase": "a building adjacent to the park",
    "pos": "形"
  },
  {
    "word": "confederation",
    "meaning": "同盟、連合",
    "phrase": "a confederation of independent states",
    "pos": "名"
  },
  {
    "word": "chant",
    "meaning": "〜を唱える、繰り返す",
    "phrase": "the crowd began to chant his name",
    "pos": "動"
  },
  {
    "word": "endemic",
    "meaning": "特有の、固有の、風土病の",
    "phrase": "a plant endemic to the island",
    "pos": "形"
  },
  {
    "word": "unravel",
    "meaning": "解明する、ほどく",
    "phrase": "unravel the mystery of the murder",
    "pos": "動"
  },
  {
    "word": "curfew",
    "meaning": "外出禁止令、門限",
    "phrase": "impose a 10 p.m. curfew on teenagers",
    "pos": "名"
  },
  {
    "word": "spate",
    "meaning": "多発、続発",
    "phrase": "a spate of robberies in the neighborhood",
    "pos": "名"
  },
  {
    "word": "infringe",
    "meaning": "〜を侵害する、違反する",
    "phrase": "infringe on someone's copyright",
    "pos": "動"
  },
  {
    "word": "crackdown",
    "meaning": "厳重な取り締まり",
    "phrase": "a crackdown on illegal drugs",
    "pos": "名"
  },
  {
    "word": "reminiscent",
    "meaning": "思い出させる、連想させる",
    "phrase": "a style reminiscent of the 1960s",
    "pos": "形"
  },
  {
    "word": "aptitude",
    "meaning": "才能、素質、適性",
    "phrase": "have a natural aptitude for music",
    "pos": "名"
  },
  {
    "word": "regenerate",
    "meaning": "再生する、再建する",
    "phrase": "regenerate the city center",
    "pos": "動"
  },
  {
    "word": "fixture",
    "meaning": "備え付けの設備、定番",
    "phrase": "a permanent fixture in the team",
    "pos": "名"
  },
  {
    "word": "perplexed",
    "meaning": "当惑した、困惑した",
    "phrase": "be perplexed by the sudden change",
    "pos": "形"
  },
  {
    "word": "dissident",
    "meaning": "反体制の、異議を唱える",
    "phrase": "a political dissident living in exile",
    "pos": "形"
  },
  {
    "word": "rapport",
    "meaning": "信頼関係、協調",
    "phrase": "build a good rapport with the students",
    "pos": "名"
  },
  {
    "word": "typify",
    "meaning": "〜の典型となる、特徴を示す",
    "phrase": "this behavior typifies his character",
    "pos": "動"
  },
  {
    "word": "impunity",
    "meaning": "免責、処罰を受けないこと",
    "phrase": "act with impunity despite the law",
    "pos": "名"
  },
  {
    "word": "novice",
    "meaning": "初心者、未熟者",
    "phrase": "a novice at skiing",
    "pos": "名"
  },
  {
    "word": "amnesty",
    "meaning": "恩赦、特赦",
    "phrase": "grant amnesty to political prisoners",
    "pos": "名"
  },
  {
    "word": "ablaze",
    "meaning": "燃え立って、輝いて",
    "phrase": "the house was ablaze with lights",
    "pos": "形"
  },
  {
    "word": "stipulation",
    "meaning": "規定、条件",
    "phrase": "a key stipulation in the contract",
    "pos": "名"
  },
  {
    "word": "commune",
    "meaning": "共同社会、共同体",
    "phrase": "live in a religious commune",
    "pos": "名"
  },
  {
    "word": "chronic",
    "meaning": "慢性的な",
    "phrase": "suffer from chronic back pain",
    "pos": "形"
  },
  {
    "word": "protocol",
    "meaning": "儀礼、手順 / 条約議定書",
    "phrase": "follow the standard protocol for security",
    "pos": "名"
  },
  {
    "word": "temper",
    "meaning": "〜を和らげる / 冷静、平静",
    "phrase": "temper justice with mercy",
    "pos": "動"
  },
  {
    "word": "retrospect",
    "meaning": "回顧、回想",
    "phrase": "in retrospect",
    "pos": "名"
  },
  {
    "word": "interim",
    "meaning": "合間、中間の / 仮の、暫定的な",
    "phrase": "serve as an interim CEO",
    "pos": "名"
  },
  {
    "word": "capitalize",
    "meaning": "利用する、活用する / 資本化する",
    "phrase": "capitalize on the growing demand",
    "pos": "動"
  },
  {
    "word": "antithesis",
    "meaning": "正反対、対照",
    "phrase": "his behavior is the antithesis of professional",
    "pos": "名"
  },
  {
    "word": "ordinance",
    "meaning": "条例、法令",
    "phrase": "pass a local ordinance against smoking",
    "pos": "名"
  },
  {
    "word": "align",
    "meaning": "〜を直線に並べる、整列させる",
    "phrase": "align the goals with the values",
    "pos": "動"
  },
  {
    "word": "repeal",
    "meaning": "〜を廃止する、撤廃する",
    "phrase": "repeal an outdated law",
    "pos": "動"
  },
  {
    "word": "underscore",
    "meaning": "〜を強調する、明確にする / 下線を引く",
    "phrase": "underscore the importance of safety",
    "pos": "動"
  },
  {
    "word": "ardent",
    "meaning": "熱心な、熱狂的な",
    "phrase": "an ardent supporter of the team",
    "pos": "形"
  },
  {
    "word": "depreciate",
    "meaning": "価値を下げる、減価償却する",
    "phrase": "the car depreciates quickly",
    "pos": "動"
  },
  {
    "word": "hype",
    "meaning": "誇大広告、誇張",
    "phrase": "the movie didn't live up to the hype",
    "pos": "名"
  },
  {
    "word": "adversary",
    "meaning": "敵、敵対者",
    "phrase": "defeat a formidable adversary",
    "pos": "名"
  },
  {
    "word": "moratorium",
    "meaning": "一時的停止、支払猶予",
    "phrase": "call for a moratorium on nuclear testing",
    "pos": "名"
  },
  {
    "word": "ailing",
    "meaning": "病気の、不況の",
    "phrase": "government help for the ailing economy",
    "pos": "形"
  },
  {
    "word": "relentless",
    "meaning": "容赦のない、情け容赦のない",
    "phrase": "relentless pressure to meet targets",
    "pos": "形"
  },
  {
    "word": "transient",
    "meaning": "一時的な、つかの間の / 流れ者",
    "phrase": "the transient nature of youth",
    "pos": "形"
  },
  {
    "word": "orchestrate",
    "meaning": "〜を調整する、組織化する",
    "phrase": "orchestrate a complex marketing campaign",
    "pos": "動"
  },
  {
    "word": "sprout",
    "meaning": "芽を出す、発芽する",
    "phrase": "seeds began to sprout in the garden",
    "pos": "動"
  },
  {
    "word": "assail",
    "meaning": "〜を襲撃する、非難する",
    "phrase": "be assailed by many doubts",
    "pos": "動"
  },
  {
    "word": "affable",
    "meaning": "愛想のよい、気さくな",
    "phrase": "an affable host who made everyone feel welcome",
    "pos": "形"
  },
  {
    "word": "disheveled",
    "meaning": "乱れた、だらしない",
    "phrase": "an untidy and disheveled appearance",
    "pos": "形"
  },
  {
    "word": "insatiable",
    "meaning": "飽くことを知らない、強欲な",
    "phrase": "an insatiable appetite for power",
    "pos": "形"
  },
  {
    "word": "defraud",
    "meaning": "詐取する、だまし取る",
    "phrase": "defraud investors of millions of dollars",
    "pos": "動"
  },
  {
    "word": "arcane",
    "meaning": "難解な、少数の人にしか理解されない",
    "phrase": "be full of arcane terminology",
    "pos": "形"
  },
  {
    "word": "autonomously",
    "meaning": "自主的に、自律的に",
    "phrase": "the device operates autonomously",
    "pos": "副"
  },
  {
    "word": "distraught",
    "meaning": "取り乱した、錯乱した",
    "phrase": "be distraught with grief after the loss",
    "pos": "形"
  },
  {
    "word": "affix",
    "meaning": "〜を貼る、添付する",
    "phrase": "affix a stamp to the envelope",
    "pos": "動"
  },
  {
    "word": "wayward",
    "meaning": "わがままな、気まぐれな",
    "phrase": "a wayward child who refuses to obey",
    "pos": "形"
  },
  {
    "word": "allude",
    "meaning": "ほのめかす、暗に言及する",
    "phrase": "allude to the problem without mentioning it",
    "pos": "動"
  },
  {
    "word": "cordon",
    "meaning": "非常線、包囲網",
    "phrase": "police set up a cordon around the building",
    "pos": "名"
  },
  {
    "word": "tatter",
    "meaning": "ぼろ、ぼろ布 / ぼろぼろになる",
    "phrase": "his clothes were in tatters",
    "pos": "名"
  },
  {
    "word": "careen",
    "meaning": "（人・車などが）揺れながら疾走する",
    "phrase": "the car careened down the street",
    "pos": "動"
  },
  {
    "word": "haggle",
    "meaning": "値切る、交渉する",
    "phrase": "haggle over the price of the souvenir",
    "pos": "動"
  },
  {
    "word": "contrition",
    "meaning": "悔恨、悔い改め",
    "phrase": "show deep contrition for one's actions",
    "pos": "名"
  },
  {
    "word": "woo",
    "meaning": "〜の支持を得ようとする、求婚する",
    "phrase": "woo potential voters with promises",
    "pos": "動"
  },
  {
    "word": "retroactively",
    "meaning": "遡って、遡及的に",
    "phrase": "the rule applies retroactively to last year",
    "pos": "副"
  },
  {
    "word": "rowdy",
    "meaning": "乱暴な、騒々しい",
    "phrase": "a rowdy bunch of teenagers",
    "pos": "形"
  },
  {
    "word": "stump",
    "meaning": "〜を困らせる、途方に暮れさせる",
    "phrase": "stumped by a difficult math problem",
    "pos": "動"
  },
  {
    "word": "protrude",
    "meaning": "突き出る、突出する",
    "phrase": "protrude from the wall",
    "pos": "動"
  },
  {
    "word": "laudable",
    "meaning": "称賛に値する",
    "phrase": "a laudable goal for the organization",
    "pos": "形"
  },
  {
    "word": "chauvinism",
    "meaning": "性差別主義、狂信的愛国主義",
    "phrase": "be accused of male chauvinism",
    "pos": "名"
  },
  {
    "word": "skirmish",
    "meaning": "小競り合い、小さな戦い",
    "phrase": "a small skirmish between the two armies",
    "pos": "名"
  },
  {
    "word": "austerity",
    "meaning": "緊縮、厳しさ",
    "phrase": "implement austerity measures to cut costs",
    "pos": "名"
  },
  {
    "word": "abort",
    "meaning": "中止する、中絶する",
    "phrase": "abort the mission due to bad weather",
    "pos": "動"
  },
  {
    "word": "pry",
    "meaning": "詮索する、のぞく",
    "phrase": "pry into other people's private lives",
    "pos": "動"
  },
  {
    "word": "connoisseur",
    "meaning": "目利き、鑑定家",
    "phrase": "a connoisseur of fine wines",
    "pos": "名"
  },
  {
    "word": "impassive",
    "meaning": "無感動な、冷静な",
    "phrase": "keep an impassive face during the trial",
    "pos": "形"
  },
  {
    "word": "extenuating",
    "meaning": "情状酌量の余地がある",
    "phrase": "extenuating circumstances for the crime",
    "pos": "形"
  },
  {
    "word": "nocturnal",
    "meaning": "夜行性の、夜間の",
    "phrase": "owls are nocturnal animals",
    "pos": "形"
  },
  {
    "word": "squalid",
    "meaning": "汚い、不潔な",
    "phrase": "live in squalid conditions in the slums",
    "pos": "形"
  },
  {
    "word": "posthumous",
    "meaning": "死後の、死後に出版された",
    "phrase": "receive a posthumous award for bravery",
    "pos": "形"
  },
  {
    "word": "maneuver",
    "meaning": "操作、作戦行動 / 〜を巧みに操る",
    "phrase": "a brilliant maneuver on the battlefield",
    "pos": "名"
  },
  {
    "word": "brawl",
    "meaning": "騒動、乱闘",
    "phrase": "a drunken brawl outside the bar",
    "pos": "名"
  },
  {
    "word": "chiseled",
    "meaning": "彫りの深い、彫刻された",
    "phrase": "have chiseled features like a model",
    "pos": "形"
  },
  {
    "word": "deadlock",
    "meaning": "行き詰まり、膠着状態",
    "phrase": "the negotiations have reached a deadlock",
    "pos": "名"
  },
  {
    "word": "volatile",
    "meaning": "変わりやすい、不安定な",
    "phrase": "invest in a volatile stock market",
    "pos": "形"
  },
  {
    "word": "devious",
    "meaning": "ずる賢い、遠回りの",
    "phrase": "get what they want through devious means",
    "pos": "形"
  },
  {
    "word": "tenet",
    "meaning": "主義、教義",
    "phrase": "one of the basic tenets of democracy",
    "pos": "名"
  },
  {
    "word": "appease",
    "meaning": "なだめる",
    "phrase": "try to appease the angry customers with a refund",
    "pos": "動"
  },
  {
    "word": "instigate",
    "meaning": "（反乱などを）扇動する",
    "phrase": "instigate a strike against the company",
    "pos": "動"
  },
  {
    "word": "resonate",
    "meaning": "反響する、共鳴する",
    "phrase": "his message resonated with young voters",
    "pos": "動"
  },
  {
    "word": "obliterate",
    "meaning": "（跡形もなく）消す",
    "phrase": "the ancient city was obliterated by the volcano",
    "pos": "動"
  },
  {
    "word": "jostle",
    "meaning": "押し合う、押しのける",
    "phrase": "be jostled by the crowd at the station",
    "pos": "動"
  },
  {
    "word": "hunch",
    "meaning": "予感、虫の知らせ",
    "phrase": "I have a hunch that they will win the game",
    "pos": "名"
  },
  {
    "word": "lament",
    "meaning": "嘆く、悲しむ",
    "phrase": "lament the loss of a dear friend",
    "pos": "動"
  },
  {
    "word": "trample",
    "meaning": "踏みつける、踏みつぶす",
    "phrase": "don't trample on the flowers in the garden",
    "pos": "動"
  },
  {
    "word": "squabble",
    "meaning": "口げんかする",
    "phrase": "children squabbling over a toy",
    "pos": "動"
  },
  {
    "word": "resilient",
    "meaning": "回復力がある、弾力性がある",
    "phrase": "a resilient economy that recovers quickly",
    "pos": "形"
  },
  {
    "word": "void",
    "meaning": "空虚な、無効な",
    "phrase": "the contract was declared null and void",
    "pos": "形"
  },
  {
    "word": "innocuous",
    "meaning": "無害な、無難な",
    "phrase": "make an innocuous remark about the weather",
    "pos": "形"
  },
  {
    "word": "taunt",
    "meaning": "あざけり、嘲笑",
    "phrase": "ignore the taunts of the bullies",
    "pos": "名"
  },
  {
    "word": "reverberate",
    "meaning": "反響する",
    "phrase": "his voice reverberated through the hall",
    "pos": "動"
  },
  {
    "word": "illustrious",
    "meaning": "著名な、輝かしい",
    "phrase": "an illustrious career in the film industry",
    "pos": "形"
  },
  {
    "word": "verbose",
    "meaning": "冗長な",
    "phrase": "a verbose explanation that confused everyone",
    "pos": "形"
  },
  {
    "word": "gallant",
    "meaning": "勇敢な、堂々とした",
    "phrase": "make a gallant effort to save the child",
    "pos": "形"
  },
  {
    "word": "pulverize",
    "meaning": "粉々にする",
    "phrase": "pulverize the stones into fine dust",
    "pos": "動"
  },
  {
    "word": "forlorn",
    "meaning": "孤独な、みじめな",
    "phrase": "look forlorn after being left alone",
    "pos": "形"
  },
  {
    "word": "inveterate",
    "meaning": "根深い、常習的な",
    "phrase": "an inveterate liar whom no one trusts",
    "pos": "形"
  },
  {
    "word": "pester",
    "meaning": "悩ませる、困らせる",
    "phrase": "pester their parents for a new game",
    "pos": "動"
  },
  {
    "word": "mirage",
    "meaning": "蜃気楼、幻影",
    "phrase": "the oasis turned out to be a mirage",
    "pos": "名"
  },
  {
    "word": "ingratiate",
    "meaning": "気に入られるようにする",
    "phrase": "try to ingratiate himself with the boss",
    "pos": "動"
  },
  {
    "word": "transgression",
    "meaning": "違反、罪",
    "phrase": "be punished for a minor transgression",
    "pos": "名"
  },
  {
    "word": "usurp",
    "meaning": "奪う、強奪する",
    "phrase": "usurp the throne from the rightful king",
    "pos": "動"
  },
  {
    "word": "exasperate",
    "meaning": "いら立たせる",
    "phrase": "be exasperated by the constant delays",
    "pos": "動"
  },
  {
    "word": "resuscitate",
    "meaning": "蘇生させる",
    "phrase": "try to resuscitate the drowning victim",
    "pos": "動"
  },
  {
    "word": "sojourn",
    "meaning": "滞在する",
    "phrase": "enjoy a brief sojourn in the countryside",
    "pos": "動"
  },
  {
    "word": "parry",
    "meaning": "受け流す、かわす",
    "phrase": "parry a blow with a shield",
    "pos": "動"
  },
  {
    "word": "pageant",
    "meaning": "野外劇、歴史ショー",
    "phrase": "take part in a colorful historical pageant",
    "pos": "名"
  },
  {
    "word": "omniscient",
    "meaning": "全知の、博識の",
    "phrase": "the narrator of the story is omniscient",
    "pos": "形"
  },
  {
    "word": "propitious",
    "meaning": "好都合な、幸先の良い",
    "phrase": "a propitious start to the new business",
    "pos": "形"
  },
  {
    "word": "pliant",
    "meaning": "柔軟な、従順な",
    "phrase": "pliant leather that is easy to work with",
    "pos": "形"
  },
  {
    "word": "impecunious",
    "meaning": "金のない、貧乏な",
    "phrase": "an impecunious student living on bread",
    "pos": "形"
  },
  {
    "word": "muddle",
    "meaning": "混乱させる、乱雑にする",
    "phrase": "muddle the facts of the case",
    "pos": "動"
  },
  {
    "word": "repartee",
    "meaning": "機才に富んだやりとり",
    "phrase": "engage in a witty repartee with friends",
    "pos": "名"
  },
  {
    "word": "sluggish",
    "meaning": "停滞した、怠惰な",
    "phrase": "a sluggish economy with low growth",
    "pos": "形"
  },
  {
    "word": "remiss",
    "meaning": "怠慢な、不注意な",
    "phrase": "be remiss in one's duties as a parent",
    "pos": "形"
  },
  {
    "word": "scathing",
    "meaning": "厳しい、痛烈な",
    "phrase": "write a scathing review of the movie",
    "pos": "形"
  },
  {
    "word": "allure",
    "meaning": "魅力、誘惑する",
    "phrase": "the allure of the big city lights",
    "pos": "名"
  },
  {
    "word": "burnish",
    "meaning": "磨く、つやを出す",
    "phrase": "burnish one's reputation as a leader",
    "pos": "動"
  },
  {
    "word": "contingent",
    "meaning": "〜次第の、不測の",
    "phrase": "the deal is contingent on their approval",
    "pos": "形"
  },
  {
    "word": "ebullient",
    "meaning": "元気あふれる、沸き立つ",
    "phrase": "be in an ebullient mood after the news",
    "pos": "形"
  },
  {
    "word": "scrupulous",
    "meaning": "良心的な、慎重な",
    "phrase": "be scrupulous about following the rules",
    "pos": "形"
  },
  {
    "word": "incumbent",
    "meaning": "現職の / 義務である",
    "phrase": "it is incumbent on us to take action",
    "pos": "形"
  },
  {
    "word": "superfluous",
    "meaning": "余分な、不必要な",
    "phrase": "remove superfluous words from the text",
    "pos": "形"
  },
  {
    "word": "rejuvenate",
    "meaning": "若返らせる、元気づける",
    "phrase": "rejuvenate the city's downtown area",
    "pos": "動"
  },
  {
    "word": "lithe",
    "meaning": "しなやかな、柔軟な",
    "phrase": "the lithe movements of a dancer",
    "pos": "形"
  },
  {
    "word": "perpetual",
    "meaning": "永久の、絶え間のない",
    "phrase": "live in a state of perpetual fear",
    "pos": "形"
  },
  {
    "word": "pensive",
    "meaning": "物思いに沈んだ",
    "phrase": "look pensive while staring out the window",
    "pos": "形"
  },
  {
    "word": "prevaricate",
    "meaning": "言葉を濁す、うそをつく",
    "phrase": "prevaricate when asked about the budget",
    "pos": "動"
  },
  {
    "word": "discourse",
    "meaning": "会話、講演、論説",
    "phrase": "engage in a serious political discourse",
    "pos": "名"
  },
  {
    "word": "insidious",
    "meaning": "潜行性の、狡猾な",
    "phrase": "the insidious effects of the disease",
    "pos": "形"
  },
  {
    "word": "mitigate",
    "meaning": "和らげる、軽減する",
    "phrase": "mitigate the impact of the crisis",
    "pos": "動"
  },
  {
    "word": "surmise",
    "meaning": "推測する",
    "phrase": "surmise that he had already left the office",
    "pos": "動"
  },
  {
    "word": "venerate",
    "meaning": "崇拝する、尊敬する",
    "phrase": "venerate their ancestors with a ceremony",
    "pos": "動"
  },
  {
    "word": "indict",
    "meaning": "起訴する、告発する",
    "phrase": "be indicted on charges of corruption",
    "pos": "動"
  },
  {
    "word": "precipitate",
    "meaning": "引き起こす、沈殿させる",
    "phrase": "precipitate a sudden change in policy",
    "pos": "動"
  },
  {
    "word": "implausible",
    "meaning": "信じがたい",
    "phrase": "an implausible excuse for being late",
    "pos": "形"
  },
  {
    "word": "obviate",
    "meaning": "取り除く、回避する",
    "phrase": "obviate the need for further testing",
    "pos": "動"
  },
  {
    "word": "proficient",
    "meaning": "熟達した、堪能な",
    "phrase": "be proficient in several languages",
    "pos": "形"
  },
  {
    "word": "lucid",
    "meaning": "分かりやすい、明快な",
    "phrase": "give a lucid explanation of the theory",
    "pos": "形"
  },
  {
    "word": "tenuous",
    "meaning": "薄い、貧弱な",
    "phrase": "a tenuous connection between the two events",
    "pos": "形"
  },
  {
    "word": "implacable",
    "meaning": "なだめがたい、執拗な",
    "phrase": "an implacable enemy who never gives up",
    "pos": "形"
  },
  {
    "word": "cogent",
    "meaning": "説得力のある",
    "phrase": "present a cogent argument for the change",
    "pos": "形"
  },
  {
    "word": "intrinsic",
    "meaning": "固有の、本来備わっている",
    "phrase": "the intrinsic value of the artwork",
    "pos": "形"
  },
  {
    "word": "vibrant",
    "meaning": "活気のある",
    "phrase": "a vibrant city with a rich culture",
    "pos": "形"
  },
  {
    "word": "adversity",
    "meaning": "逆境、不幸",
    "phrase": "show great courage in the face of adversity",
    "pos": "名"
  },
  {
    "word": "benevolent",
    "meaning": "慈悲深い、親切な",
    "phrase": "a benevolent old man who helps everyone",
    "pos": "形"
  },
  {
    "word": "conspicuous",
    "meaning": "目立つ",
    "phrase": "be conspicuous by his absence",
    "pos": "形"
  },
  {
    "word": "diligent",
    "meaning": "勤勉な、熱心な",
    "phrase": "a diligent student who studies every day",
    "pos": "形"
  },
  {
    "word": "equivocal",
    "meaning": "曖昧な、疑わしい",
    "phrase": "give an equivocal answer to the question",
    "pos": "形"
  },
  {
    "word": "garrulous",
    "meaning": "おしゃべりな",
    "phrase": "a garrulous neighbor who talks too much",
    "pos": "形"
  },
  {
    "word": "haughty",
    "meaning": "傲慢な、高慢な",
    "phrase": "his haughty attitude made him unpopular",
    "pos": "形"
  },
  {
    "word": "immutable",
    "meaning": "不変の",
    "phrase": "the laws of nature are immutable",
    "pos": "形"
  },
  {
    "word": "judicious",
    "meaning": "賢明な、思慮深い",
    "phrase": "make a judicious choice of words",
    "pos": "形"
  },
  {
    "word": "kindle",
    "meaning": "火をつける、燃え立たせる",
    "phrase": "kindle a fire in the fireplace",
    "pos": "動"
  },
  {
    "word": "magnanimous",
    "meaning": "寛大な",
    "phrase": "be magnanimous toward his defeated rival",
    "pos": "形"
  },
  {
    "word": "nefarious",
    "meaning": "極悪な、非道な",
    "phrase": "a nefarious plot to take over the world",
    "pos": "形"
  },
  {
    "word": "obsequious",
    "meaning": "こびへつらう",
    "phrase": "be surrounded by obsequious assistants",
    "pos": "形"
  },
  {
    "word": "palliative",
    "meaning": "一時しのぎの、緩和的な",
    "phrase": "provide palliative care for the patient",
    "pos": "形"
  },
  {
    "word": "reticent",
    "meaning": "控えめな、寡黙な",
    "phrase": "be reticent about his personal life",
    "pos": "形"
  },
  {
    "word": "sycophant",
    "meaning": "おべっか使い",
    "phrase": "be surrounded by sycophants",
    "pos": "名"
  },
  {
    "word": "trepidation",
    "meaning": "恐怖、不安",
    "phrase": "feel great trepidation before the surgery",
    "pos": "名"
  },
  {
    "word": "vacillate",
    "meaning": "揺らぐ、ためらう",
    "phrase": "vacillate between the two options",
    "pos": "動"
  },
  {
    "word": "wary",
    "meaning": "用心深い",
    "phrase": "be wary of strangers offering gifts",
    "pos": "形"
  },
  {
    "word": "zealous",
    "meaning": "熱心な、熱狂的な",
    "phrase": "a zealous supporter of the cause",
    "pos": "形"
  },
  {
    "word": "aberration",
    "meaning": "逸脱、異常",
    "phrase": "the test result was a temporary aberration",
    "pos": "名"
  },
  {
    "word": "capricious",
    "meaning": "気まぐれな",
    "phrase": "be frustrated by her capricious behavior",
    "pos": "形"
  },
  {
    "word": "deleterious",
    "meaning": "有害な",
    "phrase": "the deleterious effects of smoking",
    "pos": "形"
  },
  {
    "word": "enervate",
    "meaning": "気力を奪う、弱らせる",
    "phrase": "the heat enervated the travelers",
    "pos": "動"
  },
  {
    "word": "fortuitous",
    "meaning": "偶然の、幸運な",
    "phrase": "a fortuitous meeting with an old friend",
    "pos": "形"
  },
  {
    "word": "guile",
    "meaning": "狡猾さ、ずるさ",
    "phrase": "use guile to get what they want",
    "pos": "名"
  },
  {
    "word": "hackneyed",
    "meaning": "陳腐な、ありふれた",
    "phrase": "a hackneyed phrase that everyone uses",
    "pos": "形"
  },
  {
    "word": "idiosyncrasy",
    "meaning": "特異体質、独特の癖",
    "phrase": "the idiosyncrasies of his writing style",
    "pos": "名"
  },
  {
    "word": "jocular",
    "meaning": "ひょうきんな、おどけた",
    "phrase": "make a jocular comment to ease the tension",
    "pos": "形"
  },
  {
    "word": "languid",
    "meaning": "元気のない、物憂げな",
    "phrase": "spend a languid afternoon by the pool",
    "pos": "形"
  },
  {
    "word": "nuance",
    "meaning": "微妙な違い、ニュアンス",
    "phrase": "notice the nuances in her voice",
    "pos": "名"
  },
  {
    "word": "obdurate",
    "meaning": "頑固な",
    "phrase": "remain obdurate despite our pleas",
    "pos": "形"
  },
  {
    "word": "querulous",
    "meaning": "不満の多い、愚痴っぽい",
    "phrase": "a querulous voice that annoyed everyone",
    "pos": "形"
  },
  {
    "word": "recalcitrant",
    "meaning": "反抗的な、手に負えない",
    "phrase": "a recalcitrant child who refuses to obey",
    "pos": "形"
  },
  {
    "word": "sagacious",
    "meaning": "賢明な、機転の利く",
    "phrase": "a sagacious leader who made wise decisions",
    "pos": "形"
  },
  {
    "word": "taciturn",
    "meaning": "無口な",
    "phrase": "a taciturn man who rarely speaks",
    "pos": "形"
  },
  {
    "word": "unctuous",
    "meaning": "お調子者の、うわべだけの",
    "phrase": "be annoyed by his unctuous manner",
    "pos": "形"
  },
  {
    "word": "venerable",
    "meaning": "敬意を払われる、由緒ある",
    "phrase": "a venerable institution with a long history",
    "pos": "形"
  },
  {
    "word": "wistful",
    "meaning": "物欲しそうな、哀愁を帯びた",
    "phrase": "look wistful while thinking of the past",
    "pos": "形"
  },
  {
    "word": "xenophobia",
    "meaning": "外国人嫌い",
    "phrase": "a rise in xenophobia in the region",
    "pos": "名"
  },
  {
    "word": "yoke",
    "meaning": "束縛、支配",
    "phrase": "break free from the yoke of oppression",
    "pos": "動"
  },
  {
    "word": "candor",
    "meaning": "素直さ、誠実さ",
    "phrase": "speak with candor about the problem",
    "pos": "名"
  },
  {
    "word": "efface",
    "meaning": "消す、目立たなくする",
    "phrase": "efface the memory of the accident",
    "pos": "動"
  },
  {
    "word": "garish",
    "meaning": "派手な、けばけばしい",
    "phrase": "wear garish clothes to the party",
    "pos": "形"
  },
  {
    "word": "harangue",
    "meaning": "熱弁、長い演説",
    "phrase": "give a long harangue about politics",
    "pos": "名"
  },
  {
    "word": "iconoclast",
    "meaning": "聖像破壊者、因習打破主義者",
    "phrase": "a famous iconoclast who challenged traditions",
    "pos": "名"
  },
  {
    "word": "jaded",
    "meaning": "疲れ切った、飽き飽きした",
    "phrase": "feel jaded after many years in the job",
    "pos": "形"
  },
  {
    "word": "kindred",
    "meaning": "親類、同種の",
    "phrase": "find a kindred spirit in the new colleague",
    "pos": "名"
  },
  {
    "word": "laconic",
    "meaning": "簡潔な、口数の少ない",
    "phrase": "give a laconic answer to the question",
    "pos": "形"
  },
  {
    "word": "maverick",
    "meaning": "異端児、一匹狼",
    "phrase": "a political maverick who goes his own way",
    "pos": "名"
  },
  {
    "word": "nadir",
    "meaning": "どん底、最下点",
    "phrase": "at the nadir of his career",
    "pos": "名"
  },
  {
    "word": "opaque",
    "meaning": "不透明な、分かりにくい",
    "phrase": "the meaning of the poem is opaque",
    "pos": "形"
  },
  {
    "word": "quixotic",
    "meaning": "空想的な、現実離れした",
    "phrase": "a quixotic plan to save the world",
    "pos": "形"
  },
  {
    "word": "rancor",
    "meaning": "恨み、憎しみ",
    "phrase": "speak without any rancor toward them",
    "pos": "名"
  },
  {
    "word": "surreptitious",
    "meaning": "秘密の、隠密の",
    "phrase": "make a surreptitious visit to the office",
    "pos": "形"
  },
  {
    "word": "unfettered",
    "meaning": "拘束されない、自由な",
    "phrase": "enjoy unfettered access to the library",
    "pos": "形"
  },
  {
    "word": "vacuous",
    "meaning": "空虚な、うつろな",
    "phrase": "be annoyed by her vacuous expression",
    "pos": "形"
  },
  {
    "word": "wanton",
    "meaning": "理不尽な、むちゃくちゃな",
    "phrase": "the wanton destruction of public property",
    "pos": "形"
  },
  {
    "word": "yonder",
    "meaning": "あそこの、向こうの",
    "phrase": "look at the hills over yonder",
    "pos": "形"
  },
  {
    "word": "zealot",
    "meaning": "狂信者、熱狂的な人",
    "phrase": "be seen as a political zealot",
    "pos": "名"
  },
  {
    "word": "cajole",
    "meaning": "なだめすかす、おだてる",
    "phrase": "cajole him into lend me his car",
    "pos": "動"
  },
  {
    "word": "deference",
    "meaning": "敬意、服従",
    "phrase": "treat the elders with great deference",
    "pos": "名"
  },
  {
    "word": "fathom",
    "meaning": "推測する、見抜く",
    "phrase": "unable to fathom the reason for his departure",
    "pos": "動"
  },
  {
    "word": "impudence",
    "meaning": "厚かましさ、不作法",
    "phrase": "be shocked by the impudence of the boy",
    "pos": "名"
  },
  {
    "word": "juxtapose",
    "meaning": "並べる、並置する",
    "phrase": "juxtapose two different styles of art",
    "pos": "動"
  },
  {
    "word": "kowtow",
    "meaning": "ぺこぺこする、平身低頭する",
    "phrase": "refuse to kowtow to the boss",
    "pos": "動"
  },
  {
    "word": "abhor",
    "meaning": "ひどく嫌う",
    "phrase": "abhor any form of animal cruelty",
    "pos": "動"
  },
  {
    "word": "conundrum",
    "meaning": "難問、なぞなぞ",
    "phrase": "solve the conundrum of the missing keys",
    "pos": "名"
  },
  {
    "word": "enigma",
    "meaning": "謎、不可解なもの",
    "phrase": "his disappearance remains an enigma",
    "pos": "名"
  },
  {
    "word": "mangle",
    "meaning": "めちゃくちゃにする",
    "phrase": "the car was mangled in the crash",
    "pos": "動"
  },
  {
    "word": "extrapolate",
    "meaning": "推定する",
    "phrase": "extrapolate future trends from the data",
    "pos": "動"
  },
  {
    "word": "terse",
    "meaning": "簡潔な",
    "phrase": "give a terse response to the question",
    "pos": "形"
  },
  {
    "word": "distend",
    "meaning": "膨張する",
    "phrase": "the stomach distends after a large meal",
    "pos": "動"
  },
  {
    "word": "scoff",
    "meaning": "あざ笑う",
    "phrase": "scoff at the idea of ghosts",
    "pos": "動"
  },
  {
    "word": "gadget",
    "meaning": "装置、道具",
    "phrase": "a useful gadget for the kitchen",
    "pos": "名"
  },
  {
    "word": "postulate",
    "meaning": "仮定する",
    "phrase": "postulate that the earth is round",
    "pos": "動"
  },
  {
    "word": "manifest",
    "meaning": "明らかな",
    "phrase": "the symptoms manifest themselves slowly",
    "pos": "形"
  },
  {
    "word": "affinity",
    "meaning": "親近感、類似性",
    "phrase": "feel a natural affinity for the place",
    "pos": "名"
  },
  {
    "word": "revert",
    "meaning": "元に戻る",
    "phrase": "revert to the old system next month",
    "pos": "動"
  },
  {
    "word": "vilify",
    "meaning": "中傷する",
    "phrase": "be vilified by the media for his views",
    "pos": "動"
  },
  {
    "word": "incapacitate",
    "meaning": "無力にする",
    "phrase": "the injury will incapacitate him for weeks",
    "pos": "動"
  },
  {
    "word": "calamity",
    "meaning": "災難",
    "phrase": "the flood was a major calamity",
    "pos": "名"
  },
  {
    "word": "mortality",
    "meaning": "死亡率",
    "phrase": "reduce the infant mortality rate",
    "pos": "名"
  },
  {
    "word": "onslaught",
    "meaning": "猛攻",
    "phrase": "withstand the onslaught of the enemy",
    "pos": "名"
  },
  {
    "word": "revelation",
    "meaning": "驚くべき新事実",
    "phrase": "a shocking revelation about the secret",
    "pos": "名"
  },
  {
    "word": "lull",
    "meaning": "和らげる、なだめる",
    "phrase": "lull the baby to sleep",
    "pos": "動"
  },
  {
    "word": "incubate",
    "meaning": "抱く、孵化させる",
    "phrase": "incubate the eggs at a constant temperature",
    "pos": "動"
  },
  {
    "word": "attrition",
    "meaning": "自然減、消耗",
    "phrase": "a high rate of employee attrition",
    "pos": "名"
  },
  {
    "word": "incense",
    "meaning": "怒らせる",
    "phrase": "be incensed by the unfair treatment",
    "pos": "動"
  },
  {
    "word": "poach",
    "meaning": "密猟する",
    "phrase": "arrested for poaching elephants",
    "pos": "動"
  },
  {
    "word": "intercept",
    "meaning": "遮る、傍受する",
    "phrase": "intercept a secret message from the spy",
    "pos": "動"
  },
  {
    "word": "deceased",
    "meaning": "故人、死去した",
    "phrase": "the family of the deceased man",
    "pos": "名"
  },
  {
    "word": "straddle",
    "meaning": "またがる",
    "phrase": "straddle the fence between the two houses",
    "pos": "動"
  },
  {
    "word": "corrode",
    "meaning": "腐食させる",
    "phrase": "acid will corrode the metal pipe",
    "pos": "動"
  },
  {
    "word": "nurture",
    "meaning": "育てる",
    "phrase": "nurture the talent of young artists",
    "pos": "動"
  },
  {
    "word": "connotation",
    "meaning": "含意、言外の意味",
    "phrase": "a word with a negative connotation",
    "pos": "名"
  },
  {
    "word": "anecdotal",
    "meaning": "逸話的な",
    "phrase": "rely on anecdotal evidence rather than facts",
    "pos": "形"
  },
  {
    "word": "smother",
    "meaning": "窒息させる、抑える",
    "phrase": "smother the fire with a blanket",
    "pos": "動"
  },
  {
    "word": "amiable",
    "meaning": "愛想のよい、好意的な",
    "phrase": "an amiable person who is easy to get along with",
    "pos": "形"
  },
  {
    "word": "idly",
    "meaning": "怠けて、何もしないで",
    "phrase": "sit idly by while the work is done",
    "pos": "副"
  },
  {
    "word": "balk",
    "meaning": "ためらう、拒む",
    "phrase": "balk at the high cost of the project",
    "pos": "動"
  },
  {
    "word": "degenerate",
    "meaning": "退化する、堕落する",
    "phrase": "the situation degenerated into a fight",
    "pos": "動"
  },
  {
    "word": "secrete",
    "meaning": "分泌する",
    "phrase": "the glands secrete a special fluid",
    "pos": "動"
  },
  {
    "word": "quizzical",
    "meaning": "いぶかしげな、不思議そうな",
    "phrase": "give her a quizzical look in response",
    "pos": "形"
  },
  {
    "word": "dazzle",
    "meaning": "幻惑させる、感嘆させる",
    "phrase": "dazzle the audience with the magic trick",
    "pos": "動"
  },
  {
    "word": "upshot",
    "meaning": "結末、結果",
    "phrase": "the upshot of the meeting was positive",
    "pos": "名"
  },
  {
    "word": "dupe",
    "meaning": "だます、かつぐ",
    "phrase": "be duped into buying a fake watch",
    "pos": "動"
  },
  {
    "word": "insurgency",
    "meaning": "反乱、暴動",
    "phrase": "suppress the armed insurgency in the area",
    "pos": "名"
  },
  {
    "word": "proscribe",
    "meaning": "禁止する",
    "phrase": "the use of certain drugs is proscribed",
    "pos": "動"
  },
  {
    "word": "slam",
    "meaning": "酷評する、叩きつける",
    "phrase": "the movie was slammed by the critics",
    "pos": "動"
  },
  {
    "word": "soar",
    "meaning": "急騰する、急上昇する",
    "phrase": "temperatures are expected to soar this weekend",
    "pos": "動"
  },
  {
    "word": "backlash",
    "meaning": "反発",
    "phrase": "face a public backlash against the new tax",
    "pos": "名"
  },
  {
    "word": "articulate",
    "meaning": "明確に表現する",
    "phrase": "be able to articulate one's ideas clearly",
    "pos": "動"
  },
  {
    "word": "paramount",
    "meaning": "最優先の、最高の",
    "phrase": "safety is of paramount importance in this factory",
    "pos": "形"
  },
  {
    "word": "surge",
    "meaning": "急増、高まり",
    "phrase": "a sudden surge in demand for electric cars",
    "pos": "名"
  },
  {
    "word": "clot",
    "meaning": "凝固する、塊",
    "phrase": "a drug used to prevent blood clots",
    "pos": "動"
  },
  {
    "word": "flourish",
    "meaning": "栄える、繁栄する",
    "phrase": "the business began to flourish under new management",
    "pos": "動"
  },
  {
    "word": "ignite",
    "meaning": "火をつける、点火する",
    "phrase": "the spark ignited a massive forest fire",
    "pos": "動"
  },
  {
    "word": "intimidate",
    "meaning": "脅す、威圧する",
    "phrase": "don't let the large crowd intimidate you",
    "pos": "動"
  },
  {
    "word": "intricate",
    "meaning": "複雑な、入り組んだ",
    "phrase": "an intricate design on the silver box",
    "pos": "形"
  },
  {
    "word": "perpetuate",
    "meaning": "永続させる",
    "phrase": "perpetuate the myth that he was a hero",
    "pos": "動"
  },
  {
    "word": "discard",
    "meaning": "捨てる、処分する",
    "phrase": "discard old clothes to make more space",
    "pos": "動"
  },
  {
    "word": "adjudicate",
    "meaning": "裁く、裁定する",
    "phrase": "a neutral committee to adjudicate the dispute",
    "pos": "動"
  },
  {
    "word": "connive",
    "meaning": "共謀する、見逃す",
    "phrase": "connive with the enemy to steal the plans",
    "pos": "動"
  },
  {
    "word": "condescending",
    "meaning": "見下すような",
    "phrase": "speak in a condescending tone to his staff",
    "pos": "形"
  },
  {
    "word": "dank",
    "meaning": "じめじめした",
    "phrase": "the dank and dark basement of the house",
    "pos": "形"
  },
  {
    "word": "cursory",
    "meaning": "大まかな、急ぎの",
    "phrase": "give the report a cursory glance before the meeting",
    "pos": "形"
  },
  {
    "word": "faze",
    "meaning": "ひるませる、動揺させる",
    "phrase": "she remained calm and was not fazed by the news",
    "pos": "動"
  },
  {
    "word": "suave",
    "meaning": "温厚な、物腰の柔らかい",
    "phrase": "a suave and sophisticated gentleman",
    "pos": "形"
  },
  {
    "word": "conducive",
    "meaning": "貢献する、助けとなる",
    "phrase": "quiet surroundings are conducive to study",
    "pos": "形"
  },
  {
    "word": "obfuscate",
    "meaning": "わかりにくくする",
    "phrase": "try to obfuscate the truth with complicated words",
    "pos": "動"
  },
  {
    "word": "sanctity",
    "meaning": "神聖さ",
    "phrase": "respect the sanctity of the religious site",
    "pos": "名"
  },
  {
    "word": "elocution",
    "meaning": "演説法、明瞭な話し方",
    "phrase": "take elocution lessons to improve public speaking",
    "pos": "名"
  },
  {
    "word": "amenable",
    "meaning": "従順な、素直な",
    "phrase": "be amenable to the proposed changes",
    "pos": "形"
  },
  {
    "word": "subsidize",
    "meaning": "補助金を与える",
    "phrase": "the government subsidizes public transport",
    "pos": "動"
  },
  {
    "word": "prone",
    "meaning": "〜しがちな、傾向がある",
    "phrase": "be prone to making careless mistakes",
    "pos": "形"
  },
  {
    "word": "surveillance",
    "meaning": "監視",
    "phrase": "be under constant video surveillance",
    "pos": "名"
  },
  {
    "word": "ascribe",
    "meaning": "〜のせいにする、〜に帰する",
    "phrase": "ascribe the failure to a lack of preparation",
    "pos": "動"
  },
  {
    "word": "pinpoint",
    "meaning": "正確に特定する",
    "phrase": "pinpoint the exact location of the leak",
    "pos": "動"
  },
  {
    "word": "decimate",
    "meaning": "大量に減らす",
    "phrase": "the population was decimated by the plague",
    "pos": "動"
  },
  {
    "word": "surcharge",
    "meaning": "追加料金",
    "phrase": "pay a small surcharge for extra luggage",
    "pos": "名"
  },
  {
    "word": "cripple",
    "meaning": "無力にする、損なう",
    "phrase": "the strike crippled the nation's economy",
    "pos": "動"
  },
  {
    "word": "discrepancy",
    "meaning": "矛盾、不一致",
    "phrase": "find a discrepancy in the financial accounts",
    "pos": "名"
  },
  {
    "word": "pretext",
    "meaning": "口実、言い訳",
    "phrase": "leave the room on the pretext of making a call",
    "pos": "名"
  },
  {
    "word": "outlay",
    "meaning": "支出、経費",
    "phrase": "a large initial outlay for the equipment",
    "pos": "名"
  },
  {
    "word": "menace",
    "meaning": "脅威",
    "phrase": "a menace to the safety of the public",
    "pos": "名"
  },
  {
    "word": "crunch",
    "meaning": "危機、不足",
    "phrase": "the company is facing a severe credit crunch",
    "pos": "名"
  },
  {
    "word": "divert",
    "meaning": "そらす、転換する",
    "phrase": "divert the traffic to a side road",
    "pos": "動"
  },
  {
    "word": "coincide",
    "meaning": "同時に起こる、一致する",
    "phrase": "the festival coincides with the long holiday",
    "pos": "動"
  },
  {
    "word": "overhaul",
    "meaning": "徹底点検する、整備する",
    "phrase": "overhaul the entire education system",
    "pos": "動"
  },
  {
    "word": "defiant",
    "meaning": "反抗的な",
    "phrase": "remain defiant despite the police warnings",
    "pos": "形"
  },
  {
    "word": "scour",
    "meaning": "捜し回る、磨く",
    "phrase": "scour the area for the missing child",
    "pos": "動"
  },
  {
    "word": "thrive",
    "meaning": "繁栄する、成功する",
    "phrase": "children thrive in a happy and stable home",
    "pos": "動"
  },
  {
    "word": "mandate",
    "meaning": "権限、命令",
    "phrase": "the new law gives the police a mandate to act",
    "pos": "名"
  },
  {
    "word": "disrupt",
    "meaning": "混乱させる、中断させる",
    "phrase": "heavy snow disrupted the train service",
    "pos": "動"
  },
  {
    "word": "scrutinize",
    "meaning": "綿密に調べる",
    "phrase": "scrutinize the contract before signing it",
    "pos": "動"
  },
  {
    "word": "deteriorate",
    "meaning": "悪化する",
    "phrase": "his health began to deteriorate rapidly",
    "pos": "動"
  },
  {
    "word": "evoke",
    "meaning": "呼び起こす、喚起する",
    "phrase": "the music evokes memories of my childhood",
    "pos": "動"
  },
  {
    "word": "deplete",
    "meaning": "激減させる、使い果たす",
    "phrase": "deplete the earth's natural resources",
    "pos": "動"
  },
  {
    "word": "recede",
    "meaning": "遠のく、後退する",
    "phrase": "the flood waters began to recede at last",
    "pos": "動"
  },
  {
    "word": "waver",
    "meaning": "揺らぐ、ためらう",
    "phrase": "he did not waver in his commitment to the goal",
    "pos": "動"
  },
  {
    "word": "sabotage",
    "meaning": "妨害する、破壊する",
    "phrase": "sabotage the enemy's communication line",
    "pos": "動"
  },
  {
    "word": "contemplate",
    "meaning": "熟考する",
    "phrase": "contemplate a move to another country",
    "pos": "動"
  },
  {
    "word": "obstruct",
    "meaning": "妨害する、ふさぐ",
    "phrase": "obstruct the view with a tall building",
    "pos": "動"
  },
  {
    "word": "shoddy",
    "meaning": "粗悪な、手抜きの",
    "phrase": "be disappointed by the shoddy workmanship",
    "pos": "形"
  },
  {
    "word": "leeway",
    "meaning": "自由、裁量",
    "phrase": "give the students some leeway in the exam",
    "pos": "名"
  },
  {
    "word": "leverage",
    "meaning": "影響力、てこの原理",
    "phrase": "leverage one's skills to get a promotion",
    "pos": "名"
  },
  {
    "word": "whine",
    "meaning": "不平を言う、泣き言を言う",
    "phrase": "stop whining about the long walk",
    "pos": "動"
  },
  {
    "word": "repository",
    "meaning": "保管場所、倉庫",
    "phrase": "a repository for ancient documents",
    "pos": "名"
  },
  {
    "word": "impoverish",
    "meaning": "貧しくする",
    "phrase": "the war will impoverish the entire nation",
    "pos": "動"
  },
  {
    "word": "outcast",
    "meaning": "のけ者、追放された人",
    "phrase": "feel like an outcast in the new school",
    "pos": "名"
  },
  {
    "word": "figuratively",
    "meaning": "比喩的に",
    "phrase": "speak figuratively about the journey of life",
    "pos": "副"
  },
  {
    "word": "semblance",
    "meaning": "うわべ、外見",
    "phrase": "try to maintain a semblance of order",
    "pos": "名"
  },
  {
    "word": "indelible",
    "meaning": "消せない、忘れられない",
    "phrase": "leave an indelible mark on his memory",
    "pos": "形"
  },
  {
    "word": "mystique",
    "meaning": "神秘的な雰囲気",
    "phrase": "the mystique of the ancient pyramids",
    "pos": "名"
  },
  {
    "word": "clumsy",
    "meaning": "不器用な、ぎこちない",
    "phrase": "a clumsy attempt to fix the laptop",
    "pos": "形"
  },
  {
    "word": "bountiful",
    "meaning": "豊富な、気前のよい",
    "phrase": "a bountiful harvest of apples this year",
    "pos": "形"
  },
  {
    "word": "sanctuary",
    "meaning": "聖域、保護区",
    "phrase": "a sanctuary for endangered birds",
    "pos": "名"
  },
  {
    "word": "germinate",
    "meaning": "芽が出る、発芽する",
    "phrase": "the seeds began to germinate in spring",
    "pos": "動"
  },
  {
    "word": "precipitous",
    "meaning": "急な、険しい",
    "phrase": "a precipitous drop in the temperature",
    "pos": "形"
  },
  {
    "word": "blurt",
    "meaning": "うっかり口にする",
    "phrase": "blurt out the secret by mistake",
    "pos": "動"
  },
  {
    "word": "tumble",
    "meaning": "転ぶ、倒れる",
    "phrase": "tumble down the stairs in the dark",
    "pos": "動"
  },
  {
    "word": "outage",
    "meaning": "供給停止",
    "phrase": "a major power outage in the city",
    "pos": "名"
  },
  {
    "word": "pompous",
    "meaning": "もったいぶった、尊大な",
    "phrase": "be annoyed by his pompous speech",
    "pos": "形"
  },
  {
    "word": "scruffy",
    "meaning": "汚らしい、みぼらしい",
    "phrase": "wear a scruffy old jacket to work",
    "pos": "形"
  },
  {
    "word": "censure",
    "meaning": "非難、酷評",
    "phrase": "face a formal censure from the committee",
    "pos": "動"
  },
  {
    "word": "flinch",
    "meaning": "ひるむ、たじろぐ",
    "phrase": "flinch when the loud noise started",
    "pos": "動"
  },
  {
    "word": "duplicity",
    "meaning": "二枚舌、不誠実な行為",
    "phrase": "be shocked by her duplicity and lies",
    "pos": "名"
  },
  {
    "word": "apparition",
    "meaning": "亡霊、幽霊",
    "phrase": "see a ghostly apparition in the hall",
    "pos": "名"
  },
  {
    "word": "spillage",
    "meaning": "こぼれること、こぼれた量",
    "phrase": "clean up the oil spillage on the floor",
    "pos": "名"
  },
  {
    "word": "stampede",
    "meaning": "一斉に逃げる、殺到",
    "phrase": "a stampede of fans toward the stage",
    "pos": "動"
  },
  {
    "word": "clemency",
    "meaning": "寛大さ、温情",
    "phrase": "appeal for clemency from the governor",
    "pos": "名"
  },
  {
    "word": "chide",
    "meaning": "叱る、たしなめる",
    "phrase": "chide the boy for his messy room",
    "pos": "動"
  },
  {
    "word": "trudge",
    "meaning": "とぼとぼ歩く",
    "phrase": "trudge through the deep snow to home",
    "pos": "動"
  },
  {
    "word": "edify",
    "meaning": "啓発する、教化する",
    "phrase": "an edifying book for young readers",
    "pos": "動"
  },
  {
    "word": "fiendish",
    "meaning": "悪魔のような、残忍な",
    "phrase": "a fiendish plot to destroy the city",
    "pos": "形"
  },
  {
    "word": "gripe",
    "meaning": "不平、愚痴",
    "phrase": "my main gripe is the lack of communication",
    "pos": "名"
  },
  {
    "word": "cleave",
    "meaning": "忠実である / 切り開く",
    "phrase": "cleave to one's traditional beliefs",
    "pos": "動"
  },
  {
    "word": "luscious",
    "meaning": "甘美な、甘い、豊かな",
    "phrase": "the luscious taste of ripe strawberries",
    "pos": "形"
  },
  {
    "word": "mirth",
    "meaning": "はしゃぐこと、陽気",
    "phrase": "the room was filled with mirth and laughter",
    "pos": "名"
  },
  {
    "word": "caveat",
    "meaning": "警告、忠告",
    "phrase": "add a caveat to the contract before signing",
    "pos": "名"
  },
  {
    "word": "atonement",
    "meaning": "償い、罪滅ぼし",
    "phrase": "an act of atonement for his past mistakes",
    "pos": "名"
  },
  {
    "word": "embroider",
    "meaning": "脚色する / 刺繍する",
    "phrase": "embroider the story to make it more exciting",
    "pos": "動"
  },
  {
    "word": "strife",
    "meaning": "争い、衝突",
    "phrase": "the country was torn apart by civil strife",
    "pos": "名"
  },
  {
    "word": "partake",
    "meaning": "参加する / 共に食べる",
    "phrase": "partake in the local festival celebrations",
    "pos": "動"
  },
  {
    "word": "fortress",
    "meaning": "要塞、城塞",
    "phrase": "the castle served as a powerful fortress",
    "pos": "名"
  },
  {
    "word": "advocate",
    "meaning": "提唱者 / 支持する",
    "phrase": "a strong advocate for environmental protection",
    "pos": "動"
  },
  {
    "word": "manipulate",
    "meaning": "巧みに操る",
    "phrase": "be careful not to manipulate the data",
    "pos": "動"
  },
  {
    "word": "regime",
    "meaning": "政権、政治体制",
    "phrase": "living under a strict military regime",
    "pos": "名"
  },
  {
    "word": "subsequent",
    "meaning": "その後の、それに続く",
    "phrase": "the subsequent events proved him right",
    "pos": "形"
  },
  {
    "word": "vulnerable",
    "meaning": "傷つきやすい、弱い",
    "phrase": "vulnerable groups in the local community",
    "pos": "形"
  },
  {
    "word": "indigenous",
    "meaning": "先住の、固有の",
    "phrase": "protect the rights of indigenous people",
    "pos": "形"
  },
  {
    "word": "trait",
    "meaning": "特性、特徴",
    "phrase": "patience is a necessary trait for a teacher",
    "pos": "名"
  },
  {
    "word": "predator",
    "meaning": "捕食動物、捕食者",
    "phrase": "the lion is a top predator in the wild",
    "pos": "名"
  },
  {
    "word": "ultimately",
    "meaning": "結局、最終的に",
    "phrase": "ultimately the decision is up to you",
    "pos": "副"
  },
  {
    "word": "diagnose",
    "meaning": "診断する",
    "phrase": "diagnose the illness at an early stage",
    "pos": "動"
  },
  {
    "word": "legitimate",
    "meaning": "正当な、合法の",
    "phrase": "have a legitimate reason for being late",
    "pos": "形"
  },
  {
    "word": "enhance",
    "meaning": "高める、強化する",
    "phrase": "enhance the flavor of the dish with herbs",
    "pos": "動"
  },
  {
    "word": "pricey",
    "meaning": "高価な",
    "phrase": "eating out in London can be quite pricey",
    "pos": "形"
  },
  {
    "word": "quota",
    "meaning": "ノルマ、割り当て",
    "phrase": "meet the monthly sales quota easily",
    "pos": "名"
  },
  {
    "word": "forefront",
    "meaning": "最前線",
    "phrase": "be at the forefront of medical research",
    "pos": "名"
  },
  {
    "word": "uprising",
    "meaning": "反乱、暴動",
    "phrase": "a popular uprising against the government",
    "pos": "名"
  },
  {
    "word": "constitutional",
    "meaning": "憲法の、合憲の",
    "phrase": "a constitutional right to freedom of speech",
    "pos": "形"
  },
  {
    "word": "specimen",
    "meaning": "標本、サンプル",
    "phrase": "collect a specimen of the local rock",
    "pos": "名"
  },
  {
    "word": "displace",
    "meaning": "追い出す、立ち退かせる",
    "phrase": "many people were displaced by the flood",
    "pos": "動"
  },
  {
    "word": "mortgage",
    "meaning": "住宅ローン、抵当",
    "phrase": "pay off the mortgage after twenty years",
    "pos": "名"
  },
  {
    "word": "socioeconomic",
    "meaning": "社会経済的な",
    "phrase": "the socioeconomic impact of the new law",
    "pos": "形"
  },
  {
    "word": "livelihood",
    "meaning": "生計、生活手段",
    "phrase": "fishing is the main livelihood of the village",
    "pos": "名"
  },
  {
    "word": "intensify",
    "meaning": "強める、激しくする",
    "phrase": "intensify the search for the missing boy",
    "pos": "動"
  },
  {
    "word": "snip",
    "meaning": "はさみで切る",
    "phrase": "snip the loose thread off the shirt",
    "pos": "動"
  },
  {
    "word": "dismay",
    "meaning": "狼狽させる、失望させる",
    "phrase": "to her dismay the shop was already closed",
    "pos": "動"
  },
  {
    "word": "proponent",
    "meaning": "支持者、提唱者",
    "phrase": "a leading proponent of renewable energy",
    "pos": "名"
  },
  {
    "word": "notorious",
    "meaning": "悪名高い",
    "phrase": "a notorious criminal who escaped from prison",
    "pos": "形"
  },
  {
    "word": "scrutiny",
    "meaning": "精密な調査、監視",
    "phrase": "the plan came under close public scrutiny",
    "pos": "名"
  },
  {
    "word": "rehabilitate",
    "meaning": "社会復帰させる / 修復する",
    "phrase": "rehabilitate the injured bird for release",
    "pos": "動"
  },
  {
    "word": "inflict",
    "meaning": "（害など）を負わせる",
    "phrase": "inflict a heavy defeat on the rival team",
    "pos": "動"
  },
  {
    "word": "stigma",
    "meaning": "不名誉、汚名",
    "phrase": "remove the social stigma of mental illness",
    "pos": "名"
  },
  {
    "word": "compliance",
    "meaning": "順守、従順",
    "phrase": "be in full compliance with the safety rules",
    "pos": "名"
  },
  {
    "word": "unprecedented",
    "meaning": "前例のない",
    "phrase": "take unprecedented measures to stop the crisis",
    "pos": "形"
  },
  {
    "word": "perpetrator",
    "meaning": "加害者、犯人",
    "phrase": "the perpetrator of the crime was caught",
    "pos": "名"
  },
  {
    "word": "prevalence",
    "meaning": "普及、蔓延",
    "phrase": "the high prevalence of the flu this winter",
    "pos": "名"
  },
  {
    "word": "mandatory",
    "meaning": "義務的な、強制的な",
    "phrase": "attendance at the meeting is mandatory",
    "pos": "形"
  },
  {
    "word": "solidarity",
    "meaning": "連帯、結束",
    "phrase": "show solidarity with the striking workers",
    "pos": "名"
  },
  {
    "word": "integrity",
    "meaning": "誠実、完全性",
    "phrase": "a person of great moral integrity",
    "pos": "名"
  },
  {
    "word": "marginalize",
    "meaning": "社会的に無視する、追いやる",
    "phrase": "marginalize the minority groups in society",
    "pos": "動"
  },
  {
    "word": "paradigm",
    "meaning": "理論的枠組み、典型",
    "phrase": "a major paradigm shift in modern science",
    "pos": "名"
  },
  {
    "word": "inherent",
    "meaning": "固有の、本来備わっている",
    "phrase": "the inherent risks of mountain climbing",
    "pos": "形"
  },
  {
    "word": "discreet",
    "meaning": "控えめな、慎重な",
    "phrase": "make a discreet inquiry about the job",
    "pos": "形"
  },
  {
    "word": "versatile",
    "meaning": "多才な、多目的の",
    "phrase": "a versatile actor who can play any role",
    "pos": "形"
  },
  {
    "word": "collaborate",
    "meaning": "協力する、共同でする",
    "phrase": "collaborate with local artists on the project",
    "pos": "動"
  },
  {
    "word": "implement",
    "meaning": "実行する、実施する",
    "phrase": "implement the new policy next month",
    "pos": "動"
  },
  {
    "word": "transparency",
    "meaning": "透明性、明白さ",
    "phrase": "demand more transparency from the company",
    "pos": "名"
  },
  {
    "word": "autonomy",
    "meaning": "自治、自主性",
    "phrase": "the region was granted more autonomy",
    "pos": "名"
  },
  {
    "word": "feasibility",
    "meaning": "実現可能性",
    "phrase": "conduct a feasibility study on the project",
    "pos": "名"
  },
  {
    "word": "consensus",
    "meaning": "合意、意見の一致",
    "phrase": "reach a consensus after hours of debate",
    "pos": "名"
  },
  {
    "word": "sustain",
    "meaning": "維持する、支える",
    "phrase": "sustain a high level of performance",
    "pos": "動"
  },
  {
    "word": "profound",
    "meaning": "深い、重大な",
    "phrase": "have a profound influence on his life",
    "pos": "形"
  },
  {
    "word": "innovation",
    "meaning": "革新、新機軸",
    "phrase": "encourage innovation in the tech industry",
    "pos": "名"
  },
  {
    "word": "equity",
    "meaning": "公平、公正 / 株式",
    "phrase": "strive for social equity and justice",
    "pos": "名"
  },
  {
    "word": "integration",
    "meaning": "統合、融合",
    "phrase": "the integration of technology in schools",
    "pos": "名"
  },
  {
    "word": "allocation",
    "meaning": "割り当て、配分",
    "phrase": "the allocation of funds for education",
    "pos": "名"
  },
  {
    "word": "diversify",
    "meaning": "多様化する",
    "phrase": "diversify the company's product range",
    "pos": "動"
  },
  {
    "word": "sustainability",
    "meaning": "持続可能性",
    "phrase": "promote the sustainability of resources",
    "pos": "名"
  },
  {
    "word": "empower",
    "meaning": "権限を与える",
    "phrase": "empower women to start their own businesses",
    "pos": "動"
  },
  {
    "word": "validity",
    "meaning": "妥当性、有効性",
    "phrase": "check the validity of the passport",
    "pos": "名"
  },
  {
    "word": "provisional",
    "meaning": "暫定的な、仮の",
    "phrase": "reach a provisional agreement on the price",
    "pos": "形"
  },
  {
    "word": "benchmark",
    "meaning": "指標、基準",
    "phrase": "set a new benchmark for quality",
    "pos": "名"
  },
  {
    "word": "paradox",
    "meaning": "逆説、パラドックス",
    "phrase": "the paradox of wanting more but having less",
    "pos": "名"
  },
  {
    "word": "synchronize",
    "meaning": "同期させる",
    "phrase": "synchronize the clocks in the office",
    "pos": "動"
  },
  {
    "word": "facilitate",
    "meaning": "促進する、容易にする",
    "phrase": "computers facilitate the flow of information",
    "pos": "動"
  },
  {
    "word": "correlation",
    "meaning": "相関関係",
    "phrase": "a strong correlation between smoking and cancer",
    "pos": "名"
  },
  {
    "word": "underestimate",
    "meaning": "過小評価する",
    "phrase": "never underestimate the power of nature",
    "pos": "動"
  },
  {
    "word": "drawback",
    "meaning": "欠点、不都合",
    "phrase": "the only drawback of the house is its location",
    "pos": "名"
  },
  {
    "word": "skeptical",
    "meaning": "懐疑的な",
    "phrase": "be skeptical of claims made in adverts",
    "pos": "形"
  },
  {
    "word": "embrace",
    "meaning": "受け入れる、抱擁する",
    "phrase": "embrace a new culture when moving abroad",
    "pos": "動"
  },
  {
    "word": "controversial",
    "meaning": "論争を引き起こす",
    "phrase": "a controversial decision to build the dam",
    "pos": "形"
  },
  {
    "word": "expel",
    "meaning": "追放する、退学させる",
    "phrase": "be expelled from school for bad behavior",
    "pos": "動"
  },
  {
    "word": "oppress",
    "meaning": "抑圧する、虐げる",
    "phrase": "be oppressed by a cruel government",
    "pos": "動"
  },
  {
    "word": "disposal",
    "meaning": "処分、売却",
    "phrase": "the safe disposal of nuclear waste",
    "pos": "名"
  },
  {
    "word": "overrun",
    "meaning": "はびこる、超過する",
    "phrase": "the garden was overrun with weeds",
    "pos": "動"
  },
  {
    "word": "recipient",
    "meaning": "受取人、拝受者",
    "phrase": "the recipient of a prestigious award",
    "pos": "名"
  },
  {
    "word": "societal",
    "meaning": "社会の、社会に関する",
    "phrase": "face many societal pressures to succeed",
    "pos": "形"
  },
  {
    "word": "rebellious",
    "meaning": "反抗的な",
    "phrase": "a rebellious teenager who breaks the rules",
    "pos": "形"
  },
  {
    "word": "niche",
    "meaning": "適所、ニッチ",
    "phrase": "find a niche in the local market",
    "pos": "名"
  },
  {
    "word": "devastate",
    "meaning": "荒廃させる、困惑させる",
    "phrase": "the town was devastated by the earthquake",
    "pos": "動"
  },
  {
    "word": "prestige",
    "meaning": "名声、威信",
    "phrase": "the prestige of working for a top company",
    "pos": "名"
  },
  {
    "word": "brutality",
    "meaning": "残虐行為、蛮行",
    "phrase": "the brutality of the police during the riot",
    "pos": "名"
  },
  {
    "word": "casualty",
    "meaning": "死傷者、被害者",
    "phrase": "the number of casualties in the war",
    "pos": "名"
  },
  {
    "word": "rampant",
    "meaning": "はびこる、激しい",
    "phrase": "rampant inflation in the country",
    "pos": "形"
  },
  {
    "word": "coalition",
    "meaning": "連合、提携",
    "phrase": "a coalition of political parties",
    "pos": "名"
  },
  {
    "word": "confinement",
    "meaning": "拘束、制限",
    "phrase": "be kept in solitary confinement",
    "pos": "名"
  },
  {
    "word": "microscopic",
    "meaning": "極微の、顕微鏡的な",
    "phrase": "microscopic organisms in the water",
    "pos": "形"
  },
  {
    "word": "neutrality",
    "meaning": "中立",
    "phrase": "maintain neutrality in the conflict",
    "pos": "名"
  },
  {
    "word": "evacuating",
    "meaning": "避難すること",
    "phrase": "the city started evacuating the citizens",
    "pos": "動"
  },
  {
    "word": "hygiene",
    "meaning": "衛生",
    "phrase": "maintain a high standard of personal hygiene",
    "pos": "名"
  },
  {
    "word": "integral",
    "meaning": "不可欠な、完全な",
    "phrase": "an integral part of the local community",
    "pos": "形"
  },
  {
    "word": "outnumber",
    "meaning": "数で勝る",
    "phrase": "the protestors were outnumbered by the police",
    "pos": "動"
  },
  {
    "word": "disproportionate",
    "meaning": "不釣り合いな",
    "phrase": "spend a disproportionate amount on rent",
    "pos": "形"
  },
  {
    "word": "restoration",
    "meaning": "回復、修復",
    "phrase": "the restoration of the old cathedral",
    "pos": "名"
  },
  {
    "word": "stowage",
    "meaning": "収納、収納場所",
    "phrase": "the stowage of luggage under the seats",
    "pos": "名"
  },
  {
    "word": "snitch",
    "meaning": "密告者、チクリ屋",
    "phrase": "he was known as a snitch in school",
    "pos": "名"
  },
  {
    "word": "emphatic",
    "meaning": "強調された、力強い",
    "phrase": "an emphatic refusal to the proposal",
    "pos": "形"
  },
  {
    "word": "snide",
    "meaning": "皮肉な、意地の悪い",
    "phrase": "make a snide remark about his tie",
    "pos": "形"
  },
  {
    "word": "widget",
    "meaning": "小さな装置、機器",
    "phrase": "a useful widget for the computer",
    "pos": "名"
  },
  {
    "word": "credulity",
    "meaning": "信じやすい性質",
    "phrase": "take advantage of the public's credulity",
    "pos": "名"
  },
  {
    "word": "ephemeral",
    "meaning": "一時的な、つかの間の",
    "phrase": "the ephemeral beauty of a flower",
    "pos": "形"
  },
  {
    "word": "insubstantial",
    "meaning": "非現実的な、わずかな",
    "phrase": "an insubstantial amount of evidence",
    "pos": "形"
  },
  {
    "word": "beckon",
    "meaning": "手招きする、誘う",
    "phrase": "the warm sea seemed to beckon us",
    "pos": "動"
  },
  {
    "word": "sneer",
    "meaning": "あざけり笑う、冷笑する",
    "phrase": "sneer at the suggestion of help",
    "pos": "動"
  },
  {
    "word": "halt",
    "meaning": "止まる、停止する",
    "phrase": "The production was brought to a halt.",
    "pos": "動"
  },
  {
    "word": "exert",
    "meaning": "(力・影響力など)を及ぼす",
    "phrase": "exert influence on the decision-making process",
    "pos": "動"
  },
  {
    "word": "ballot",
    "meaning": "投票用紙",
    "phrase": "cast a ballot in the presidential election",
    "pos": "名"
  },
  {
    "word": "disciplinary",
    "meaning": "懲戒の、規律上の",
    "phrase": "take disciplinary action against the employee",
    "pos": "形"
  },
  {
    "word": "solidify",
    "meaning": "(液体が)固まる、(関係などが)固まる",
    "phrase": "solidify the partnership between the two firms",
    "pos": "動"
  },
  {
    "word": "bribery",
    "meaning": "賄賂",
    "phrase": "be arrested on charges of bribery",
    "pos": "名"
  },
  {
    "word": "curb",
    "meaning": "抑制、制限",
    "phrase": "measures to curb rising inflation",
    "pos": "動"
  },
  {
    "word": "rash",
    "meaning": "性急な、軽率な",
    "phrase": "make a rash decision without thinking",
    "pos": "形"
  },
  {
    "word": "irrelevant",
    "meaning": "関連のない",
    "phrase": "That information is irrelevant to the case.",
    "pos": "形"
  },
  {
    "word": "demographic",
    "meaning": "(一群の人々から成る)層、人口統計の",
    "phrase": "target a younger demographic",
    "pos": "形"
  },
  {
    "word": "communal",
    "meaning": "共同の、共有の",
    "phrase": "a communal kitchen in the dormitory",
    "pos": "形"
  },
  {
    "word": "norm",
    "meaning": "規範、基準",
    "phrase": "social norms that vary by culture",
    "pos": "名"
  },
  {
    "word": "overdue",
    "meaning": "(支払・提出の)期限が過ぎた",
    "phrase": "The library book is two weeks overdue.",
    "pos": "形"
  },
  {
    "word": "seamless",
    "meaning": "継ぎ目のない、途切れのない",
    "phrase": "a seamless transition to the new system",
    "pos": "形"
  },
  {
    "word": "brag",
    "meaning": "自慢する",
    "phrase": "brag about winning the championship",
    "pos": "動"
  },
  {
    "word": "upscale",
    "meaning": "高所得者(向け)の",
    "phrase": "an upscale restaurant in the city center",
    "pos": "形"
  },
  {
    "word": "renowned",
    "meaning": "名高い、著名な",
    "phrase": "a world-renowned expert in physics",
    "pos": "形"
  },
  {
    "word": "freight",
    "meaning": "運送貨物、貨物輸送",
    "phrase": "send the goods by ocean freight",
    "pos": "名"
  },
  {
    "word": "outcry",
    "meaning": "(世間の)抗議、憤激",
    "phrase": "a public outcry against the tax increase",
    "pos": "名"
  },
  {
    "word": "unearth",
    "meaning": "を掘り出す、発掘する",
    "phrase": "unearth new evidence in the investigation",
    "pos": "動"
  },
  {
    "word": "municipality",
    "meaning": "地方自治体",
    "phrase": "services provided by the local municipality",
    "pos": "名"
  },
  {
    "word": "taxonomic",
    "meaning": "分類学の、分類上の",
    "phrase": "the taxonomic classification of species",
    "pos": "形"
  },
  {
    "word": "watershed",
    "meaning": "(人生などの)転機、分岐点",
    "phrase": "a watershed moment in history",
    "pos": "名"
  },
  {
    "word": "instability",
    "meaning": "不安定さ",
    "phrase": "political instability in the region",
    "pos": "名"
  },
  {
    "word": "suppress",
    "meaning": "を抑える、鎮圧する",
    "phrase": "suppress a yawn during the meeting",
    "pos": "動"
  },
  {
    "word": "misinterpret",
    "meaning": "を誤って解釈する",
    "phrase": "misinterpret the instructions on the label",
    "pos": "動"
  },
  {
    "word": "decent",
    "meaning": "満足できる、まずまずの",
    "phrase": "earn a decent salary in his first job",
    "pos": "形"
  },
  {
    "word": "retrieve",
    "meaning": "を取り戻す、取り戻す",
    "phrase": "retrieve deleted files from the computer",
    "pos": "動"
  },
  {
    "word": "criminality",
    "meaning": "犯罪性、犯罪行為",
    "phrase": "study the causes of juvenile criminality",
    "pos": "名"
  },
  {
    "word": "vandalism",
    "meaning": "(文化・芸術などの)破壊行為",
    "phrase": "Acts of vandalism were reported in the park.",
    "pos": "名"
  },
  {
    "word": "sanitation",
    "meaning": "(公衆)衛生",
    "phrase": "improve sanitation in developing countries",
    "pos": "名"
  },
  {
    "word": "setback",
    "meaning": "(進歩・発展の)妨げ、後退",
    "phrase": "The project suffered a major setback.",
    "pos": "名"
  },
  {
    "word": "inconsequential",
    "meaning": "取るに足りない、重要でない",
    "phrase": "The difference in cost is inconsequential.",
    "pos": "形"
  },
  {
    "word": "stockpile",
    "meaning": "備蓄(品)、を蓄える",
    "phrase": "stockpile food in case of an emergency",
    "pos": "名"
  },
  {
    "word": "doom",
    "meaning": "運命づける、(悪い方向に)運命づける",
    "phrase": "The plan was doomed to failure.",
    "pos": "動"
  },
  {
    "word": "conglomerate",
    "meaning": "複合企業、集合体",
    "phrase": "a global conglomerate with many subsidiaries",
    "pos": "名"
  },
  {
    "word": "refurbish",
    "meaning": "を改装する",
    "phrase": "refurbish an old building into a hotel",
    "pos": "動"
  },
  {
    "word": "assimilate",
    "meaning": "(思想・文化などを)同化する、吸収する",
    "phrase": "assimilate new information quickly",
    "pos": "動"
  },
  {
    "word": "state-of-the-art",
    "meaning": "最新鋭の",
    "phrase": "equipped with state-of-the-art technology",
    "pos": "形"
  },
  {
    "word": "respiratory",
    "meaning": "呼吸(器官)の",
    "phrase": "suffer from a respiratory infection",
    "pos": "形"
  },
  {
    "word": "loom",
    "meaning": "不気味に現れる",
    "phrase": "A large shadow loomed in the distance.",
    "pos": "動"
  },
  {
    "word": "perimeter",
    "meaning": "周囲、境界線",
    "phrase": "patrol the perimeter of the facility",
    "pos": "名"
  },
  {
    "word": "pendulum",
    "meaning": "振り子",
    "phrase": "The pendulum swings back and forth.",
    "pos": "名"
  },
  {
    "word": "hallmark",
    "meaning": "特質、特徴",
    "phrase": "The attention to detail is his hallmark.",
    "pos": "名"
  },
  {
    "word": "squarely",
    "meaning": "真っ向から",
    "phrase": "face the problem squarely",
    "pos": "副"
  },
  {
    "word": "parameter",
    "meaning": "要因、要素",
    "phrase": "set the parameters for the experiment",
    "pos": "名"
  },
  {
    "word": "wild",
    "meaning": "荒れ果てた",
    "phrase": "The garden has grown wild and overgrown.",
    "pos": "形"
  },
  {
    "word": "epidemic",
    "meaning": "流行、伝染病",
    "phrase": "an epidemic of flu in the winter",
    "pos": "名"
  },
  {
    "word": "peril",
    "meaning": "危険",
    "phrase": "The crew was in mortal peril.",
    "pos": "名"
  },
  {
    "word": "predisposed",
    "meaning": "の傾向がある",
    "phrase": "be predisposed to certain diseases",
    "pos": "形"
  },
  {
    "word": "sovereign",
    "meaning": "主権を有する、独立した",
    "phrase": "a sovereign state with its own laws",
    "pos": "形"
  },
  {
    "word": "hardscrabble",
    "meaning": "生計がやっとの、苦労して得た",
    "phrase": "a hardscrabble life on a small farm",
    "pos": "形"
  },
  {
    "word": "impersonal",
    "meaning": "人間味のない、事務的な",
    "phrase": "an impersonal manner of speaking",
    "pos": "形"
  },
  {
    "word": "beset",
    "meaning": "悩ませる、困難を引き起こす",
    "phrase": "The project was beset by many problems.",
    "pos": "動"
  },
  {
    "word": "entity",
    "meaning": "（独立した）存在、実体",
    "phrase": "The company is a separate legal entity.",
    "pos": "名"
  },
  {
    "word": "intervene",
    "meaning": "（調停・援助などのために）介入する",
    "phrase": "The government decided to intervene.",
    "pos": "動"
  },
  {
    "word": "attic",
    "meaning": "屋根裏部屋",
    "phrase": "store old furniture in the attic",
    "pos": "名"
  },
  {
    "word": "presumption",
    "meaning": "想定、推定",
    "phrase": "a presumption of innocence until proven guilty",
    "pos": "名"
  },
  {
    "word": "assertive",
    "meaning": "（はっきり意見を述べる）自信に満ちた",
    "phrase": "be assertive when stating your opinion",
    "pos": "形"
  },
  {
    "word": "liken",
    "meaning": "をたとえる",
    "phrase": "liken the human brain to a computer",
    "pos": "動"
  },
  {
    "word": "fragility",
    "meaning": "もろさ、脆弱性",
    "phrase": "the fragility of the global economy",
    "pos": "名"
  },
  {
    "word": "hefty",
    "meaning": "高額な、がっしりした、大きくて重い",
    "phrase": "pay a hefty fine for the violation",
    "pos": "形"
  },
  {
    "word": "foe",
    "meaning": "敵、（競技などの）相手",
    "phrase": "defeat a powerful foe in the election",
    "pos": "名"
  },
  {
    "word": "incidence",
    "meaning": "発生（率）",
    "phrase": "a high incidence of heart disease",
    "pos": "名"
  },
  {
    "word": "catastrophe",
    "meaning": "破局、大失敗",
    "phrase": "The earthquake was a natural catastrophe.",
    "pos": "名"
  },
  {
    "word": "outstrip",
    "meaning": "（需要・要求）を上回る、超える",
    "phrase": "Demand outstripped the available supply.",
    "pos": "動"
  },
  {
    "word": "tack",
    "meaning": "方針、方法",
    "phrase": "take a different tack in the negotiations",
    "pos": "名"
  },
  {
    "word": "standstill",
    "meaning": "行き詰まり、立ち止まること",
    "phrase": "Traffic was at a complete standstill.",
    "pos": "名"
  },
  {
    "word": "extraterrestrial",
    "meaning": "地球外の、地球外生物",
    "phrase": "the search for extraterrestrial life",
    "pos": "形"
  },
  {
    "word": "consolidate",
    "meaning": "～をまとめる、統合する",
    "phrase": "consolidate several accounts into one",
    "pos": "動"
  },
  {
    "word": "invariably",
    "meaning": "いつも、決まって",
    "phrase": "It invariably rains when I go out.",
    "pos": "副"
  },
  {
    "word": "populace",
    "meaning": "（ある国の）民衆、大衆、人口",
    "phrase": "educate the general populace",
    "pos": "名"
  },
  {
    "word": "glamorous",
    "meaning": "魅力的な、魅惑的な",
    "phrase": "lead a glamorous life in Hollywood",
    "pos": "形"
  },
  {
    "word": "stoke",
    "meaning": "（感情など）をあおる、かき立てる",
    "phrase": "stoke fears of a coming crisis",
    "pos": "動"
  },
  {
    "word": "ration",
    "meaning": "（[rations] 食料）を配給する",
    "phrase": "ration water during the drought",
    "pos": "動"
  },
  {
    "word": "deceptive",
    "meaning": "（見かけなどが）当てにならない、欺くような",
    "phrase": "Appearances can be very deceptive.",
    "pos": "形"
  },
  {
    "word": "reminisce",
    "meaning": "懐かしむ、思い出にふける",
    "phrase": "reminisce about the good old days",
    "pos": "動"
  },
  {
    "word": "strive",
    "meaning": "（熱心に）努力する",
    "phrase": "strive to improve the quality of life",
    "pos": "動"
  },
  {
    "word": "affluent",
    "meaning": "裕福な、豊かな",
    "phrase": "live in an affluent neighborhood",
    "pos": "形"
  },
  {
    "word": "rundown",
    "meaning": "概要、要旨",
    "phrase": "give a quick rundown of the report",
    "pos": "名"
  },
  {
    "word": "formidable",
    "meaning": "（敵・問題などが）手ごわい",
    "phrase": "face a formidable opponent in the final",
    "pos": "形"
  },
  {
    "word": "deregulate",
    "meaning": "（商取引などの）規制を撤廃する",
    "phrase": "deregulate the airline industry",
    "pos": "動"
  },
  {
    "word": "erupt",
    "meaning": "（戦争などが）勃発する、（感情が）爆発する",
    "phrase": "Violence erupted in the city streets.",
    "pos": "動"
  },
  {
    "word": "diminutive",
    "meaning": "非常に小さい",
    "phrase": "a diminutive figure in the crowd",
    "pos": "形"
  },
  {
    "word": "indicative",
    "meaning": "示して、暗示して",
    "phrase": "The results are indicative of a trend.",
    "pos": "形"
  },
  {
    "word": "reliant",
    "meaning": "依存している",
    "phrase": "be heavily reliant on foreign oil",
    "pos": "形"
  },
  {
    "word": "prosecute",
    "meaning": "（人）を起訴する",
    "phrase": "prosecute someone for shoplifting",
    "pos": "動"
  },
  {
    "word": "stunning",
    "meaning": "とても美しい、魅力的な",
    "phrase": "a stunning view of the mountains",
    "pos": "形"
  },
  {
    "word": "edible",
    "meaning": "食べられる、食用の",
    "phrase": "Are these wild mushrooms edible?",
    "pos": "形"
  },
  {
    "word": "addictive",
    "meaning": "中毒性の、依存性のある",
    "phrase": "The game is highly addictive.",
    "pos": "形"
  },
  {
    "word": "plead",
    "meaning": "（有罪・無罪を）認める、（を）嘆願する",
    "phrase": "plead guilty to the charges",
    "pos": "動"
  },
  {
    "word": "traumatic",
    "meaning": "心的外傷を与える",
    "phrase": "a traumatic experience from childhood",
    "pos": "形"
  },
  {
    "word": "contradictory",
    "meaning": "（話・考えなどが）矛盾している",
    "phrase": "receive contradictory advice from experts",
    "pos": "形"
  },
  {
    "word": "hierarchical",
    "meaning": "（社会・組織などが）階層的な",
    "phrase": "a rigid hierarchical structure",
    "pos": "形"
  },
  {
    "word": "populous",
    "meaning": "人口の多い、人の多い",
    "phrase": "the most populous city in the world",
    "pos": "形"
  },
  {
    "word": "raid",
    "meaning": "（軍などによる）急襲",
    "phrase": "conduct a police raid on the building",
    "pos": "名"
  },
  {
    "word": "humanitarian",
    "meaning": "人道的な、博愛主義の",
    "phrase": "provide humanitarian aid to refugees",
    "pos": "形"
  },
  {
    "word": "workload",
    "meaning": "（一定期間に行うべき）仕事量",
    "phrase": "manage a heavy workload at the office",
    "pos": "名"
  },
  {
    "word": "monopoly",
    "meaning": "（事業などの）独占、専売",
    "phrase": "have a monopoly on the local market",
    "pos": "名"
  },
  {
    "word": "finalize",
    "meaning": "（計画・契約などを）最終的に決定する",
    "phrase": "finalize the details of the contract",
    "pos": "動"
  },
  {
    "word": "shroud",
    "meaning": "～を包む、覆う",
    "phrase": "The mountain was shrouded in mist.",
    "pos": "動"
  },
  {
    "word": "scavenge",
    "meaning": "あさる",
    "phrase": "scavenge for food in the trash",
    "pos": "動"
  },
  {
    "word": "despicable",
    "meaning": "卑劣な、軽蔑すべき",
    "phrase": "a despicable act of cruelty",
    "pos": "形"
  },
  {
    "word": "esoteric",
    "meaning": "難解な、深遠な",
    "phrase": "discussing esoteric philosophical theories",
    "pos": "形"
  },
  {
    "word": "pawn",
    "meaning": "～を質に入れる、（人の）手先、利用される人",
    "phrase": "be used as a pawn in a political game",
    "pos": "動"
  },
  {
    "word": "eerie",
    "meaning": "不気味な、薄気味悪い",
    "phrase": "an eerie silence in the empty house",
    "pos": "形"
  },
  {
    "word": "weather",
    "meaning": "（困難など）を切り抜ける",
    "phrase": "weather the storm during the crisis",
    "pos": "動"
  },
  {
    "word": "far-fetched",
    "meaning": "信じがたい、ありえない、現実味のない",
    "phrase": "a far-fetched story that nobody believed",
    "pos": "形"
  },
  {
    "word": "foolproof",
    "meaning": "絶対確実な、絶対に失敗のない",
    "phrase": "a foolproof plan for success",
    "pos": "形"
  },
  {
    "word": "forte",
    "meaning": "得意なこと、強み",
    "phrase": "Public speaking is not my forte.",
    "pos": "名"
  },
  {
    "word": "quip",
    "meaning": "皮肉、気のきいた言葉",
    "phrase": "make a clever quip during the speech",
    "pos": "名"
  },
  {
    "word": "trespass",
    "meaning": "（不法に）侵入する",
    "phrase": "No trespassing on private property.",
    "pos": "動"
  },
  {
    "word": "stalemate",
    "meaning": "行き詰まり、こう着状態",
    "phrase": "The talks ended in a stalemate.",
    "pos": "名"
  },
  {
    "word": "agitate",
    "meaning": "世論に訴える、扇動する",
    "phrase": "agitate for political reform",
    "pos": "動"
  },
  {
    "word": "entail",
    "meaning": "を伴う、必要とする",
    "phrase": "The job entails a lot of travel.",
    "pos": "動"
  },
  {
    "word": "detour",
    "meaning": "回り道、迂回路",
    "phrase": "take a detour to avoid the traffic",
    "pos": "名"
  },
  {
    "word": "milestone",
    "meaning": "画期的な出来事、出来事",
    "phrase": "a major milestone in his career",
    "pos": "名"
  },
  {
    "word": "reclaim",
    "meaning": "を請求する、取り戻す",
    "phrase": "reclaim land from the sea",
    "pos": "動"
  },
  {
    "word": "transparent",
    "meaning": "透明な、透き通った",
    "phrase": "be transparent about your intentions",
    "pos": "形"
  },
  {
    "word": "dissolution",
    "meaning": "（組織・関係などの）解散、分解、崩壊",
    "phrase": "the dissolution of the partnership",
    "pos": "名"
  },
  {
    "word": "barren",
    "meaning": "（土地が）不毛の、やせた",
    "phrase": "a barren desert landscape",
    "pos": "形"
  },
  {
    "word": "occupant",
    "meaning": "（建物・部屋などの）占有者、居住者",
    "phrase": "The previous occupant of the house.",
    "pos": "名"
  },
  {
    "word": "land",
    "meaning": "（職など）を手に入れる",
    "phrase": "land a dream job at a top firm",
    "pos": "動"
  },
  {
    "word": "onlooker",
    "meaning": "傍観者、野次馬",
    "phrase": "A crowd of onlookers gathered nearby.",
    "pos": "名"
  },
  {
    "word": "loot",
    "meaning": "（場所など）から略奪する",
    "phrase": "Looting occurred during the riots.",
    "pos": "動"
  },
  {
    "word": "conspiracy",
    "meaning": "陰謀、共謀",
    "phrase": "a conspiracy to overthrow the government",
    "pos": "名"
  },
  {
    "word": "lousy",
    "meaning": "お粗末な、ひどい",
    "phrase": "have a lousy day at work",
    "pos": "形"
  },
  {
    "word": "legislature",
    "meaning": "議会、立法府",
    "phrase": "The bill was passed by the legislature.",
    "pos": "名"
  },
  {
    "word": "interrogation",
    "meaning": "尋問、取り調べ",
    "phrase": "undergo hours of intense interrogation",
    "pos": "名"
  },
  {
    "word": "itchy",
    "meaning": "かゆい、むずむずする",
    "phrase": "I have an itchy rash on my arm.",
    "pos": "形"
  },
  {
    "word": "scheme",
    "meaning": "事業計画、陰謀",
    "phrase": "a scheme to make money quickly",
    "pos": "名"
  },
  {
    "word": "vocalization",
    "meaning": "発声、発生された音（声）",
    "phrase": "vocalizations made by whales",
    "pos": "名"
  },
  {
    "word": "obsolescence",
    "meaning": "廃れること、旧式化",
    "phrase": "planned obsolescence of electronics",
    "pos": "名"
  },
  {
    "word": "preferential",
    "meaning": "優先的な、優遇の",
    "phrase": "receive preferential treatment at the hotel",
    "pos": "形"
  },
  {
    "word": "pesky",
    "meaning": "うるさい、やっかいな",
    "phrase": "deal with pesky mosquitoes all night",
    "pos": "形"
  },
  {
    "word": "janitor",
    "meaning": "（ビル・学校などの）管理人、清掃作業員",
    "phrase": "The janitor cleaned the hallway.",
    "pos": "名"
  },
  {
    "word": "thermal",
    "meaning": "熱の、温度の",
    "phrase": "thermal insulation for the house",
    "pos": "形"
  },
  {
    "word": "racket",
    "meaning": "大騒ぎ、騒音",
    "phrase": "Stop making such a racket!",
    "pos": "名"
  },
  {
    "word": "humane",
    "meaning": "人道的な、残酷でない",
    "phrase": "ensure the humane treatment of animals",
    "pos": "形"
  },
  {
    "word": "withhold",
    "meaning": "～を与えずにおく、保留する",
    "phrase": "withhold information from the police",
    "pos": "動"
  },
  {
    "word": "obsessive",
    "meaning": "頭から離れない、強迫観念の",
    "phrase": "have an obsessive interest in details",
    "pos": "形"
  },
  {
    "word": "proposition",
    "meaning": "（対処が必要な）提案、申し出",
    "phrase": "an attractive business proposition",
    "pos": "名"
  },
  {
    "word": "containment",
    "meaning": "（好ましくないものの）制御、封じ込め",
    "phrase": "the containment of the viral outbreak",
    "pos": "名"
  },
  {
    "word": "distressing",
    "meaning": "悲惨な、痛ましい、つらい",
    "phrase": "witness a distressing scene in the street",
    "pos": "形"
  },
  {
    "word": "impair",
    "meaning": "（能力など）を弱める、損なう",
    "phrase": "Alcohol can impair your judgment.",
    "pos": "動"
  },
  {
    "word": "resurrect",
    "meaning": "（失われたもの・忘れられたものなど）を復活させる",
    "phrase": "resurrect a forgotten tradition",
    "pos": "動"
  },
  {
    "word": "discontent",
    "meaning": "不満、不平",
    "phrase": "growing discontent among the workers",
    "pos": "名"
  },
  {
    "word": "reside",
    "meaning": "（権限・性質などが）存在する、備わっている",
    "phrase": "The power resides with the people.",
    "pos": "動"
  },
  {
    "word": "long-lasting",
    "meaning": "長続きする、持続的な",
    "phrase": "a long-lasting effect on the environment",
    "pos": "形"
  },
  {
    "word": "execute",
    "meaning": "～を実行する、～を執行する",
    "phrase": "execute the plan without delay",
    "pos": "動"
  },
  {
    "word": "extremist",
    "meaning": "過激派、過激主義者",
    "phrase": "be arrested for extremist activities",
    "pos": "名"
  },
  {
    "word": "degrade",
    "meaning": "（人の品位など）を下げる、悪化させる",
    "phrase": "degrade the quality of the soil",
    "pos": "動"
  },
  {
    "word": "cede",
    "meaning": "（権利などを）譲渡する、割譲する",
    "phrase": "cede territory after the war",
    "pos": "動"
  },
  {
    "word": "emigrate",
    "meaning": "移住する",
    "phrase": "emigrate from Japan to Canada",
    "pos": "動"
  },
  {
    "word": "shot",
    "meaning": "挑戦、試み、見込み",
    "phrase": "give it a shot and see what happens",
    "pos": "名"
  },
  {
    "word": "commodity",
    "meaning": "商品、売買品",
    "phrase": "Gold is a valuable commodity.",
    "pos": "名"
  },
  {
    "word": "eyewitness",
    "meaning": "目撃者",
    "phrase": "an eyewitness account of the accident",
    "pos": "名"
  },
  {
    "word": "serene",
    "meaning": "穏やかな、落ち着いた、平穏な",
    "phrase": "a serene lake at sunrise",
    "pos": "形"
  },
  {
    "word": "fraternity",
    "meaning": "兄弟関係、友愛、兄弟愛",
    "phrase": "the spirit of fraternity among members",
    "pos": "名"
  },
  {
    "word": "ignominious",
    "meaning": "不名誉な、屈辱的な",
    "phrase": "suffer an ignominious defeat",
    "pos": "形"
  },
  {
    "word": "bizarre",
    "meaning": "風変わりな、奇妙な",
    "phrase": "a bizarre incident that no one could explain",
    "pos": "形"
  },
  {
    "word": "phenomenal",
    "meaning": "驚異的な、並はずれた",
    "phrase": "achieve phenomenal success in business",
    "pos": "形"
  },
  {
    "word": "ministry",
    "meaning": "省庁、内閣の一部門",
    "phrase": "the Ministry of Foreign Affairs",
    "pos": "名"
  },
  {
    "word": "intrusive",
    "meaning": "立ち入った、邪魔をする",
    "phrase": "intrusive questions about my private life",
    "pos": "形"
  },
  {
    "word": "graffiti",
    "meaning": "落書き",
    "phrase": "walls covered with colorful graffiti",
    "pos": "名"
  },
  {
    "word": "tenure",
    "meaning": "在職期間、任期",
    "phrase": "during his tenure as president",
    "pos": "名"
  },
  {
    "word": "concur",
    "meaning": "（意見などが）一致する、同意する",
    "phrase": "I concur with your assessment.",
    "pos": "動"
  },
  {
    "word": "idiosyncratic",
    "meaning": "特異な、独特の",
    "phrase": "an idiosyncratic style of painting",
    "pos": "形"
  },
  {
    "word": "inhibit",
    "meaning": "（成長・進展など）を抑制する、阻害する",
    "phrase": "Fear can inhibit creative thinking.",
    "pos": "動"
  },
  {
    "word": "disguise",
    "meaning": "偽装する、隠す",
    "phrase": "disguise one's true feelings with a smile",
    "pos": "動"
  },
  {
    "word": "confidential",
    "meaning": "機密の、秘密の",
    "phrase": "keep the client's data confidential",
    "pos": "形"
  },
  {
    "word": "dismiss",
    "meaning": "（提案・考えなどを）退ける、解雇する",
    "phrase": "dismiss the idea as unrealistic",
    "pos": "動"
  },
  {
    "word": "irrigation",
    "meaning": "水を引くこと、灌漑",
    "phrase": "an efficient irrigation system for crops",
    "pos": "名"
  },
  {
    "word": "confrontational",
    "meaning": "対決的な、挑戦的な",
    "phrase": "avoid a confrontational tone in meetings",
    "pos": "形"
  },
  {
    "word": "hinder",
    "meaning": "（発展・能力など）を妨げる、阻む",
    "phrase": "High interest rates hinder growth.",
    "pos": "動"
  },
  {
    "word": "oversight",
    "meaning": "監視、監督；ミス、見落とし",
    "phrase": "a serious oversight in the contract",
    "pos": "名"
  },
  {
    "word": "skyrocket",
    "meaning": "（価格などが）急騰する",
    "phrase": "Oil prices skyrocketed after the news.",
    "pos": "動"
  },
  {
    "word": "evaporate",
    "meaning": "～を蒸発させる、蒸発する",
    "phrase": "His hopes began to evaporate.",
    "pos": "動"
  },
  {
    "word": "staggering",
    "meaning": "驚くべき、途方もない",
    "phrase": "cost a staggering amount of money",
    "pos": "形"
  },
  {
    "word": "status quo",
    "meaning": "現状（維持）",
    "phrase": "challenge the status quo of the industry",
    "pos": "名"
  },
  {
    "word": "polytheistic",
    "meaning": "多神教の",
    "phrase": "ancient polytheistic religions",
    "pos": "形"
  },
  {
    "word": "domesticate",
    "meaning": "（動物を）飼い慣らす、家庭化する",
    "phrase": "domesticate wild animals for farming",
    "pos": "動"
  },
  {
    "word": "commonplace",
    "meaning": "ありふれたこと、日常的な",
    "phrase": "Smartphones have become commonplace.",
    "pos": "形"
  },
  {
    "word": "unilateral",
    "meaning": "一方的な",
    "phrase": "make a unilateral decision without consulting",
    "pos": "形"
  },
  {
    "word": "philanthropy",
    "meaning": "慈善活動、博愛主義",
    "phrase": "engage in philanthropy to help others",
    "pos": "名"
  },
  {
    "word": "reimburse",
    "meaning": "（人）に返済する、返金する",
    "phrase": "reimburse travel expenses to employees",
    "pos": "動"
  },
  {
    "word": "full-fledged",
    "meaning": "本格的な、一人前の",
    "phrase": "a full-fledged member of the team",
    "pos": "形"
  },
  {
    "word": "psychic",
    "meaning": "精神の、霊的な",
    "phrase": "claims to have psychic abilities",
    "pos": "形"
  },
  {
    "word": "qualm",
    "meaning": "良心の呵責、不安、疑念",
    "phrase": "have no qualms about lying",
    "pos": "名"
  },
  {
    "word": "squeak",
    "meaning": "きしむ音を立てる、きしむような音",
    "phrase": "The door opened with a loud squeak.",
    "pos": "動"
  },
  {
    "word": "laureate",
    "meaning": "受賞者、名誉を受けた人",
    "phrase": "a Nobel Prize laureate in physics",
    "pos": "名"
  },
  {
    "word": "infighting",
    "meaning": "内輪もめ",
    "phrase": "political infighting within the party",
    "pos": "名"
  },
  {
    "word": "foremost",
    "meaning": "第一級の、主要な",
    "phrase": "the foremost expert in the field",
    "pos": "形"
  },
  {
    "word": "allocate",
    "meaning": "～を割り当てる、配分する",
    "phrase": "allocate resources to the project",
    "pos": "動"
  },
  {
    "word": "hostile",
    "meaning": "敵意を持った、反対の",
    "phrase": "be hostile toward new ideas",
    "pos": "形"
  },
  {
    "word": "buildup",
    "meaning": "増加、増強",
    "phrase": "a massive buildup of troops at the border",
    "pos": "名"
  },
  {
    "word": "penalize",
    "meaning": "（人）を罰する",
    "phrase": "be penalized for a late payment",
    "pos": "動"
  },
  {
    "word": "convict",
    "meaning": "に有罪判決を下す",
    "phrase": "convict him of the crime",
    "pos": "動"
  },
  {
    "word": "aftermath",
    "meaning": "余波、結果",
    "phrase": "the aftermath of the economic crisis",
    "pos": "名"
  },
  {
    "word": "hail",
    "meaning": "～を歓迎する、～を賞賛する",
    "phrase": "hail the new law as a victory",
    "pos": "動"
  },
  {
    "word": "merge",
    "meaning": "～を統合する、合併する",
    "phrase": "The two companies decided to merge.",
    "pos": "動"
  },
  {
    "word": "captive",
    "meaning": "捕らわれた、捕虜になった",
    "phrase": "keep birds captive in a cage",
    "pos": "形"
  },
  {
    "word": "complimentary",
    "meaning": "無料で提供される、ただの",
    "phrase": "a complimentary breakfast at the hotel",
    "pos": "形"
  },
  {
    "word": "downfall",
    "meaning": "没落、破滅",
    "phrase": "The scandal led to his downfall.",
    "pos": "名"
  },
  {
    "word": "advent",
    "meaning": "（重要人物・事の）到来、出現",
    "phrase": "the advent of the internet age",
    "pos": "名"
  },
  {
    "word": "shatter",
    "meaning": "（夢・希望など）を打ち砕く、粉々にする",
    "phrase": "The news shattered her dreams.",
    "pos": "動"
  },
  {
    "word": "chaotic",
    "meaning": "混乱した、無秩序な",
    "phrase": "a chaotic scene at the airport",
    "pos": "形"
  },
  {
    "word": "agrarian",
    "meaning": "農業の",
    "phrase": "an agrarian society based on rice farming",
    "pos": "形"
  },
  {
    "word": "uproar",
    "meaning": "大騒ぎ、騒動",
    "phrase": "The decision caused a public uproar.",
    "pos": "名"
  },
  {
    "word": "commence",
    "meaning": "～を始める、始まる",
    "phrase": "The ceremony will commence at noon.",
    "pos": "動"
  },
  {
    "word": "coin",
    "meaning": "（新語などを）作る",
    "phrase": "coin a new term for the phenomenon",
    "pos": "動"
  },
  {
    "word": "exempt",
    "meaning": "～を免除する",
    "phrase": "be exempt from paying taxes",
    "pos": "動"
  },
  {
    "word": "incite",
    "meaning": "（感情などを）刺激する、扇動する",
    "phrase": "incite the crowd to violence",
    "pos": "動"
  },
  {
    "word": "selective",
    "meaning": "選択が厳重な",
    "phrase": "be very selective about who we hire",
    "pos": "形"
  },
  {
    "word": "upheaval",
    "meaning": "大変動、激変",
    "phrase": "political upheaval in the region",
    "pos": "名"
  },
  {
    "word": "eradicate",
    "meaning": "（病気・社会問題など）を根絶する、撲滅する",
    "phrase": "eradicate poverty from the world",
    "pos": "動"
  },
  {
    "word": "verge",
    "meaning": "間際、瀬戸際、へり、境界",
    "phrase": "on the verge of a nervous breakdown",
    "pos": "名"
  },
  {
    "word": "pretense",
    "meaning": "ふり、見せかけ、口実",
    "phrase": "under the pretense of friendship",
    "pos": "名"
  },
  {
    "word": "privileged",
    "meaning": "特権的な、特権を持つ",
    "phrase": "come from a privileged background",
    "pos": "形"
  },
  {
    "word": "tolerance",
    "meaning": "寛容さ、容認",
    "phrase": "promote religious tolerance in society",
    "pos": "名"
  },
  {
    "word": "render",
    "meaning": "（人・もの）を（ある状態に）する",
    "phrase": "The accident rendered the car useless.",
    "pos": "動"
  },
  {
    "word": "outlaw",
    "meaning": "～を違法とする、禁止する",
    "phrase": "outlaw smoking in public places",
    "pos": "動"
  },
  {
    "word": "reassure",
    "meaning": "（人）を安心させる、元気づける",
    "phrase": "reassure her that everything is fine",
    "pos": "動"
  },
  {
    "word": "gigantic",
    "meaning": "巨大な、膨大な",
    "phrase": "a gigantic statue in the park",
    "pos": "形"
  },
  {
    "word": "forcible",
    "meaning": "力ずくの、強制的な",
    "phrase": "prevent the forcible entry of protesters",
    "pos": "形"
  }
];
