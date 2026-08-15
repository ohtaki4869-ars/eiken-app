// 毎日の表現トレーニング用の構文/語彙ストック（初期ドラフト、36項目）。
// エッセイ・要約で頻出の論説文構文を中心に、1級レベル語彙も含める。
// 追加・編集は自由。ローテーション出題は app/api/writing/daily/route.ts が
// 直近の出題履歴（writing:daily:dates）を除外プールとして選定する。

export type ExpressionCategory =
  | 'concession'  // 譲歩
  | 'causation'   // 因果
  | 'contrast'    // 対比
  | 'paraphrase'  // 言い換え・論理展開
  | 'vocabulary'; // 1級レベル語彙

export interface ExpressionStockItem {
  id: string;
  category: ExpressionCategory;
  label: string;
  example?: string;
}

export const EXPRESSION_STOCK: ExpressionStockItem[] = [
  // ── 譲歩 ──
  { id: 'concession-01', category: 'concession', label: 'Although / While + S+V', example: 'Although the plan is costly, it is worth pursuing.' },
  { id: 'concession-02', category: 'concession', label: 'Even though ~', example: 'Even though the risks are well known, few act on them.' },
  { id: 'concession-03', category: 'concession', label: 'Granted that ~', example: 'Granted that the policy has flaws, it remains a step forward.' },
  { id: 'concession-04', category: 'concession', label: 'It is true that A; however, B', example: 'It is true that automation cuts costs; however, it also displaces workers.' },
  { id: 'concession-05', category: 'concession', label: 'Despite / In spite of + 名詞句', example: 'Despite growing criticism, the program continues to expand.' },
  { id: 'concession-06', category: 'concession', label: 'That said, ~', example: 'That said, the long-term benefits outweigh the initial cost.' },
  { id: 'concession-07', category: 'concession', label: 'Admittedly, ~', example: 'Admittedly, the transition will not be easy.' },

  // ── 因果 ──
  { id: 'causation-01', category: 'causation', label: 'A leads to / results in B', example: 'Prolonged drought leads to widespread crop failure.' },
  { id: 'causation-02', category: 'causation', label: 'A is attributable to B', example: 'The decline in sales is attributable to shifting consumer habits.' },
  { id: 'causation-03', category: 'causation', label: 'This is largely due to the fact that ~', example: 'This is largely due to the fact that funding was cut.' },
  { id: 'causation-04', category: 'causation', label: 'As a consequence of ~, ~', example: 'As a consequence of rapid urbanization, green spaces have shrunk.' },
  { id: 'causation-05', category: 'causation', label: 'A gives rise to B', example: 'Unequal access to education gives rise to social division.' },
  { id: 'causation-06', category: 'causation', label: 'A is a contributing factor to B', example: 'Poor infrastructure is a contributing factor to the delays.' },

  // ── 対比 ──
  { id: 'contrast-01', category: 'contrast', label: 'In contrast to ~, ~', example: 'In contrast to rural areas, cities offer more job opportunities.' },
  { id: 'contrast-02', category: 'contrast', label: 'Whereas / While A, B', example: 'Whereas older workers value stability, younger ones prize flexibility.' },
  { id: 'contrast-03', category: 'contrast', label: 'On the other hand, ~', example: 'On the other hand, remote work can erode team cohesion.' },
  { id: 'contrast-04', category: 'contrast', label: 'Unlike A, B', example: 'Unlike traditional classrooms, online courses allow self-paced learning.' },
  { id: 'contrast-05', category: 'contrast', label: 'By comparison, ~', example: 'By comparison, renewable energy costs have fallen sharply.' },
  { id: 'contrast-06', category: 'contrast', label: 'Conversely, ~', example: 'Conversely, excessive regulation can stifle innovation.' },

  // ── 言い換え・論理展開 ──
  { id: 'paraphrase-01', category: 'paraphrase', label: 'In other words, ~', example: 'In other words, the reform addresses the symptom, not the cause.' },
  { id: 'paraphrase-02', category: 'paraphrase', label: 'That is to say, ~', example: 'That is to say, growth alone does not guarantee well-being.' },
  { id: 'paraphrase-03', category: 'paraphrase', label: 'To put it differently, ~', example: 'To put it differently, the policy trades efficiency for equity.' },
  { id: 'paraphrase-04', category: 'paraphrase', label: 'This essentially means that ~', example: 'This essentially means that smaller firms bear a disproportionate burden.' },
  { id: 'paraphrase-05', category: 'paraphrase', label: 'Not only A but also B', example: 'The measure not only reduces emissions but also creates jobs.' },
  { id: 'paraphrase-06', category: 'paraphrase', label: 'It goes without saying that ~', example: 'It goes without saying that access to clean water is essential.' },
  { id: 'paraphrase-07', category: 'paraphrase', label: 'This is not to say that ~', example: 'This is not to say that regulation is always harmful.' },
  { id: 'paraphrase-08', category: 'paraphrase', label: 'There is no denying that ~', example: 'There is no denying that the workforce is aging rapidly.' },
  { id: 'paraphrase-09', category: 'paraphrase', label: 'All things considered, ~', example: 'All things considered, the benefits justify the expense.' },

  // ── 1級レベル語彙 ──
  { id: 'vocabulary-01', category: 'vocabulary', label: 'exacerbate（～を悪化させる）', example: 'The new tariffs exacerbate tensions between the two countries.' },
  { id: 'vocabulary-02', category: 'vocabulary', label: 'mitigate（～を緩和する）', example: 'Stricter building codes help mitigate earthquake damage.' },
  { id: 'vocabulary-03', category: 'vocabulary', label: 'underscore（～を強調する）', example: 'The report underscores the urgency of the water shortage.' },
  { id: 'vocabulary-04', category: 'vocabulary', label: 'detrimental（有害な）', example: 'Chronic stress can be detrimental to long-term health.' },
  { id: 'vocabulary-05', category: 'vocabulary', label: 'pervasive（広く浸透した）', example: 'Misinformation has become pervasive on social media.' },
  { id: 'vocabulary-06', category: 'vocabulary', label: 'curtail（～を削減する）', example: 'The city plans to curtail traffic in the historic district.' },
  { id: 'vocabulary-07', category: 'vocabulary', label: 'ambivalent（相反する感情を持つ）', example: 'Many residents feel ambivalent about the new development.' },
  { id: 'vocabulary-08', category: 'vocabulary', label: 'unprecedented（前例のない）', example: 'The region faced unprecedented levels of rainfall this year.' },
];
