# 把 BigGhost AI Notes 发布到 GitHub Pages

这是一个无需安装 Node.js、无需构建的纯静态网站。GitHub Actions 会在每次推送到 `main` 后，将 `site/` 中的文件发布到 GitHub Pages。网站运行后，你的电脑可以关机。

本文中的 `YOUR-USERNAME` 都需要替换为你的 **GitHub 登录用户名**。本地项目目录是 `~/AIProjects/bigghost-ai-notes`。

## 1. 先在本地预览

在 Mac 的终端中运行：

```sh
cd ~/AIProjects/bigghost-ai-notes
python3 -m http.server 8000 --bind 127.0.0.1 --directory site
```

浏览器打开 [本地首页](http://127.0.0.1:8000/)，点击笔记卡片，确认正文正常显示。终端需要保持运行；按 `Control + C` 停止预览。如果 8000 端口被占用，把命令和网址里的端口一起改为 8001。

也可以直接打开 `site/index.html` 阅读，页面不依赖外部服务。本地预览地址不能分享给其他人，公网地址将在部署后生成。

## 2. 在 GitHub 创建空仓库

1. 登录 GitHub，打开 [创建仓库页面](https://github.com/new)。
2. Repository name 填写 `bigghost-ai-notes`。
3. 选择 **Public**。GitHub Free 的 Pages 支持公开仓库，因此仓库中的源文件也将公开。
4. **不要**勾选添加 README、`.gitignore` 或 License；本地项目已经准备好文件。
5. 点击 **Create repository**。

仓库地址将是 `https://github.com/YOUR-USERNAME/bigghost-ai-notes`。这是代码仓库地址，还不是网站地址。[官方导入步骤](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)

## 3. 设置 Pages 发布来源

进入仓库的 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。项目已经自带 `.github/workflows/deploy-pages.yml`，无需点击模板生成第二份工作流。

优先在首次推送前设置。如果空仓库暂时没有显示这一选项，先完成第 4 步，再回来选择 GitHub Actions，然后按第 5 步重新运行工作流。[官方设置说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 4. 首次提交并同步到 GitHub

打开新的终端窗口，进入项目并检查状态：

```sh
cd ~/AIProjects/bigghost-ai-notes
git status
```

本项目应已初始化为 `main` 分支。如果你是从压缩包解压得到项目，且提示 `not a git repository`，先运行：

```sh
git init -b main
```

如果这是你第一次使用 Git，提交时提示作者身份未知，在**这个项目里**设置自己的提交署名和邮箱，再重新提交：

```sh
git config user.name "你的提交署名"
git config user.email "你的提交邮箱"
```

邮箱可使用 GitHub **Settings → Emails** 中提供的 `noreply` 邮箱。署名和邮箱是提交记录信息，不是登录凭证。

首次提交：

```sh
git add .
git commit -m "Create BigGhost AI Notes website"
```

把下面地址中的 `YOUR-USERNAME` 替换为你的 GitHub 用户名，再运行：

```sh
git remote add origin https://github.com/YOUR-USERNAME/bigghost-ai-notes.git
git push -u origin main
```

HTTPS 推送时，如果 Git 要求输入密码，应输入 **个人访问令牌（PAT）**，而不是 GitHub 登录密码。令牌选择此仓库，并允许写入内容；上传本项目中的工作流文件还需要工作流写入权限。令牌只用于本机登录，不要填进上述网址或项目文件。已经配置 GitHub SSH 登录的人，也可以使用仓库的 SSH 地址。[GitHub 身份验证说明](https://docs.github.com/en/get-started/git-basics/about-remote-repositories)、[PAT 说明](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

Pages 工作流会使用 GitHub 自动提供的令牌，**无需为网站部署另外创建或配置 Secrets**。

## 5. 查看部署结果

1. 在仓库打开 **Actions → Deploy GitHub Pages**。
2. 打开最新运行记录，等待 `deploy` 任务完成并显示绿色勾。
3. 点击部署记录中的网站链接，或者到 **Settings → Pages** 查找 **Visit site**。

默认情况下，你的网站地址是：

```text
首页：https://YOUR-USERNAME.github.io/bigghost-ai-notes/
笔记：https://YOUR-USERNAME.github.io/bigghost-ai-notes/notes/compatibility-layers/
```

如果此前已经为账户或仓库配置自定义域名，以 GitHub 的 **Visit site** 地址为准。初次发布可能需要几分钟。

如果首次运行发生在 Pages 设置完成之前，可以在 **Actions → Deploy GitHub Pages → Run workflow** 中选择 `main` 并运行；也可以打开失败记录，选择 **Re-run all jobs**。该工作流只允许 `main` 分支发布，避免手动运行其他分支时覆盖网站。

## 6. 日常更新

编辑 `site/` 中的网页，在本地预览，然后提交并推送：

```sh
cd ~/AIProjects/bigghost-ai-notes
git status
git add site
git commit -m "Update knowledge notes"
git push
```

每次推送到 `main` 都会自动发布。如果同时修改了 README 或部署配置，把相应文件也加入 `git add`。仅保存文件不会同步；`commit` 保存本地版本，`push` 才会上传 GitHub。

新增笔记可以创建 `site/notes/新笔记英文短名/index.html`，再在 `site/index.html` 中新增相应卡片。网页内使用相对链接，例如 `./notes/compatibility-layers/index.html`；不要写成 `/notes/compatibility-layers/`，因为项目站的网址包含 `/bigghost-ai-notes/` 这一层。现有笔记路径尽量保持不变，避免分享过的链接失效。

## 7. 常见问题

| 现象 | 检查与处理 |
| --- | --- |
| 网站 404 | 确认访问的是 `用户名.github.io/bigghost-ai-notes/`；检查 Actions 是否成功、Pages 来源是否为 GitHub Actions，以及 `site/index.html` 是否已提交。 |
| 首页正常，笔记或资源 404 | 检查文件名大小写和相对路径。GitHub 的文件路径区分大小写；项目站链接需要保留仓库路径。 |
| Actions 提示 Pages 未启用或获取站点失败 | 进入 Settings → Pages，选择 GitHub Actions，再重新运行。 |
| Actions 不运行或提示 action 不被允许 | 检查 Settings → Actions → General 中允许使用 GitHub Actions，并允许本项目使用的 `actions/*` 官方操作；组织仓库还可能受组织策略限制。 |
| 部署提示权限或环境限制 | 保留工作流内的 `contents: read`、`pages: write`、`id-token: write` 权限；检查 Settings → Environments → github-pages 是否允许 `main` 部署。无需把整个仓库的默认工作流权限改成完全写入。 |
| `remote origin already exists` | 用 `git remote -v` 检查已配置地址；只有确认地址不对时，才用 `git remote set-url origin 正确仓库地址` 修正。 |
| 推送认证失败或拒绝修改 workflow | 确认账号有仓库写入权限，并检查 PAT 的内容与工作流权限；SSH 地址则需要已配置对应 SSH 公钥。 |
| 推送提示 `non-fast-forward` | 远程存在本地没有的提交。先检查 GitHub 上的内容；如果两边本来属于同一份历史，可 `git pull --rebase origin main` 后再推送。若误在空仓库初始化了 README 而形成独立历史，应先保留并整合双方内容，不要直接强制推送。 |
| 更新后仍看到旧内容 | 先确认最新 Actions 已成功，再刷新页面；必要时使用无痕窗口检查。 |

## 工作流说明与官方参考

工作流只上传 `site/`，不会把部署说明和仓库其他文件作为网站页面发布。它不运行 Jekyll，也不需要 `gh-pages` 分支。GitHub 仓库本身仍为公开仓库。

配置按 2026-09-13 查阅的 GitHub 官方示例整理：`checkout@v6`、`configure-pages@v5`、`upload-pages-artifact@v4`、`deploy-pages@v4`。同一时间保留一个部署执行，不中断已经开始的部署。

- [GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pages 自动部署入门](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically)
- [GitHub Pages 发布来源配置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [把本地项目导入 GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
