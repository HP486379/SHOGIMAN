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

## セットアップ

```bash
npm install
```

## 開発サーバー起動

```bash
npm run dev
```

起動後、表示されたローカルURLをブラウザで開いてください。

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
│  └─ moveRules.ts
├─ App.tsx
├─ index.css
└─ main.tsx
```

## 現在の状態

現時点ではプロトタイプ段階です。

実装済みの中心機能は、盤面表示、駒選択、移動可能範囲の表示、駒移動、手数カウント、先手・後手ターン切り替え、CPU自動着手、CPUレベル選択です。

## 今後の改善候補

- 成りの実装
- 持ち駒の実装
- 王手・詰み判定
- CPU思考ロジックの強化
- 効果音の実装
- スマホ表示の最適化
- ファミコン風グラフィックの強化
- タイトル画面・ゲーム開始演出
- 対局結果表示

## ライセンス

未設定です。
