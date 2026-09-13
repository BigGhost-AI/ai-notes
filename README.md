# BigGhost AI Notes

个人知识网站，记录技术原理、AI 探索与日常思考。纯 HTML、CSS 与 JavaScript，无需安装 npm 依赖，也不需要数据库或后端服务器。

## 项目结构

```text
bigghost-ai-notes/
├── site/                              # 仅这个目录会发布到公网
│   ├── index.html                     # 知识站首页
│   └── notes/
│       └── compatibility-layers/
│           └── index.html             # 关于适配性的层次化学习
├── .github/workflows/deploy-pages.yml  # GitHub Pages 自动发布
├── .gitignore
├── README.md
└── DEPLOYMENT.md                       # 从本地同步到 GitHub 的完整指引
```

现有笔记从原单 HTML 文件直接复制，正文、样式、动效和交互均保留。首页使用相对链接，既适用于 `用户名.github.io/bigghost-ai-notes/`，也适用于以后绑定的独立域名。首页和笔记均不依赖外部字体或素材，可以直接双击打开；文件内指向外部资料的链接需要联网。

## 本地预览

在终端运行：

```bash
cd ~/AIProjects/bigghost-ai-notes
python3 -m http.server 8000 --bind 127.0.0.1 --directory site
```

浏览器打开 <http://127.0.0.1:8000/>。保持这个终端运行，按 `Control + C` 停止服务。如果 8000 端口已占用，把命令与网址中的端口同时改为 8001。

## 发布网站

按 [部署指引](DEPLOYMENT.md) 创建 GitHub 公开仓库，开启 Pages 的 GitHub Actions 发布方式，再推送本地文件。配置完成后，每次向 `main` 分支推送更新都会自动部署。

预计网址形式为 `https://你的GitHub用户名.github.io/bigghost-ai-notes/`。实际网址以仓库的 Settings → Pages 或部署任务输出为准。

## 添加一篇笔记

1. 在 `site/notes/` 下新建一个稳定的英文目录，例如 `model-inference`。
2. 把笔记保存为该目录的 `index.html`。如果有单独素材，也放在该笔记目录内。
3. 编辑 `site/index.html`：复制一个完整的 `<article>...</article>`，更新标题、简介、日期、标签和链接，例如 `notes/model-inference/index.html`。
4. 更新首页两处笔记总数（`.hero-count b` 与 `#notes-title span`）；装饰性封面编号按需要调整。
5. 本地预览并点击新入口，确认能正常打开，然后提交和推送。

站内文件链接使用相对路径。笔记里如需添加首页入口，链接应为 `../../index.html`。避免写成 `/notes/...` 或 `/index.html`，因为 GitHub 项目站的网址带有 `/bigghost-ai-notes/` 前缀。原笔记当前未加入首页按钮，以保留原文件；可使用浏览器返回功能。

建议保持已经分享出去的笔记目录名不变。网站文件和文章数量增长后，可以再引入 Astro 等生成器，无需提前改写这些独立 HTML 笔记。

## 维护约定

- `site/` 是唯一发布目录。部署指引和项目说明不会被上传到 Pages 网站，但公开仓库中的文件仍可被查看。
- 页面保持响应式布局，动效尊重系统的“减少动态效果”设置。
- 首页使用独立的深浅色偏好设置，笔记保留原有设置。
- 原笔记是完整的可交付 HTML。项目没有依赖原工作目录中的构建脚本。

更多操作见 [DEPLOYMENT.md](DEPLOYMENT.md)。
