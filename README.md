# 伊敷匠夢 ポートフォリオ

ゲームプログラマー志望の伊敷匠夢の作品紹介サイトです。
WRECK RALLY、PLANET SHIELD、および C++ / DirectX 12 による自作ゲームエンジンを掲載しています。

公開URL: https://zinzouningen4-web.github.io/portfolio/

## 公開・更新方法

GitHub のリポジトリ設定で **Settings → Pages → Build and deployment** を開き、Source を **Deploy from a branch**、Branch を **main**、フォルダーを **/(root)** に設定します。

更新時は、このリポジトリ直下の `index.html`、`portfolio.css`、`app.js`、`hero-scene.js` または `assets/` 内のファイルを変更し、`main` ブランチへ反映します。GitHub Pages の公開処理が完了するとサイトに反映されます。ビルド作業は不要です。

ファイルへの参照は相対パスを使っています。ファイル名の大文字・小文字を一致させてください。公開URLやリポジトリ名を変更する場合は、`index.html` の `og:url` と `og:image`、このREADMEの公開URLも更新してください。

## 構成

- `index.html`：ページの内容
- `portfolio.css`：レイアウトとアニメーション
- `app.js`：画像拡大、動画再生、メニューなどの操作
- `hero-scene.js`：ゲーム内モデルを使った3D表示
- `assets/`：画像、動画、ゲーム説明書、3Dモデル
- `vendor/`：Three.js と関連ファイル
- `.nojekyll`：静的ファイルをそのまま公開するための設定

Three.js のライセンスは `vendor/THREE-LICENSE.txt` に保持しています。このREADMEは、ゲーム素材や画像などに新たな利用許諾を付与するものではありません。
