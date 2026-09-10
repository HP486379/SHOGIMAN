# SHOGIMAN

ファミコン風の将棋ゲームプロトタイプです。

駒をクリックすると、その駒が移動できるマスをエフェクト付きで表示します。飛車・角などの長距離移動は、ボンバーマンの爆風のような見た目で可動範囲を表現することを目指しています。

## 概要

SHOGIMAN は、通常の将棋にゲーム的な視覚演出を加えたブラウザ向けプロトタイプです。

- 9×9 の将棋盤を表示
- 先手・後手の駒を配置
- 駒クリックで選択
- 移動可能マスをハイライト表示
- ハイライトされたマスをクリックして移動
- 飛車・角・香車などの直線移動に対応
- 王・金・銀・桂・歩などの基本移動に対応
- CPU が自律して着手
- CPU レベルを EASY / NORMAL / HARD から選択可能
- ファミコン風のUI、走査線、レトロゲーム風演出
- SE ON/OFF と RESET ボタンを表示
- AI ADVISOR は OpenAI API (`gpt-5.4-mini`) を利用し、失敗時はローカル解析へフォールバック

## CPU レベル

- EASY: ランダムに合法手を選びます
- NORMAL: 駒得を優先しつつ、上位候補からランダムに選びます
- HARD: 駒得、駒損リスク、中央支配、相手の反撃を簡易評価して選びます

## 技術スタック

- React
- TypeScript
- Vite
- Tailwind CSS
- ESLint
- Vercel Functions
- OpenAI Responses API

## セットアップ

```bash
npm install
```

### OpenAI AI ADVISOR

AI ADVISOR の OpenAI API 呼び出しはブラウザから直接行わず、`/api/advice` の Vercel Function を経由します。APIキーをクライアント側の `VITE_*` 変数に入れないでください。

Vercel の Project Settings → Environment Variables に次を登録します。

```text
OPENAI_API_KEY=your_api_key
```

Production と Preview の両方で AI ADVISOR を確認する場合は、両環境でこの変数を有効にしてください。未設定・APIエラー・レート制限時には既存のローカル解析コメントが表示されます。

## 開発サーバー起動

```bash
npm run dev
```

起動後、表示されたローカルURLをブラウザで開いてください。

Vercel Function も含めてローカル確認する場合は Vercel の開発環境を利用してください。

## ビルド

```bash
npm run build
```

## プレビュー

```bash
npm run preview
```

## 型チェック

```bash
npm run typecheck
```

## Lint

```bash
npm run lint
```

## ディレクトリ構成

```text
api/
└─ advice.ts
src/
├─ components/
│  ├─ Board.tsx
│  ├─ BoardCell.tsx
│  ├─ Controls.tsx
│  └─ Header.tsx
├─ hooks/
│  └─ useShogi.ts
├─ types/
│  └─ shogi.ts
├─ utils/
│  ├─ cpuPlayer.ts
│  ├─ initialBoard.ts
│  ├─ moveRules.ts
│  └─ openAiAdvisor.ts
├─ App.tsx
├─ index.css
└─ main.tsx
```

## 現在の状態

現時点ではプロトタイプ段階です。

実装済みの中心機能は、盤面表示、駒選択、移動可能範囲の表示、駒移動、手数カウント、先手・後手ターン切り替え、CPU自動着手、CPUレベル選択です。

## 今後の改善候補

- CPU思考ロジックの強化
- スマホ表示の最適化
- ファミコン風グラフィックの強化
- AI ADVISOR の局面説明精度改善

## ライセンス

未設定です。
