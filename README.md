# 甜蜜传奇 Sweet Saga

一个单文件 HTML 三消游戏（糖果消消乐风格），支持触屏，无广告、无内购，进度保存在本地浏览器。

A single-file HTML match-3 game (Candy Crush Saga style). Touch friendly, no ads, no in-app purchases; progress is saved locally in the browser.

## 玩法 / Features

- 260 个关卡，分为 52 个章节，难度缓慢提升：分数、果冻、收集订单、运送食材四种目标
- 新增第 61–260 关、40 个章节，沿用原有障碍与特殊糖果组合；前 60 关保持不变，已通关的旧存档会自动解锁后续关卡
- 可选挑战勋章：分数关达到二星，其余目标在至少剩 3 步时完成；英雄和道具可自由使用，首次达成各奖励 100 颗糖果，可以重玩补齐，不影响正常通关
- 连胜宝箱：连续首次通关 3 个新关卡，自动奖励 250 颗糖果；失败会清空连胜，重玩已通关的关卡不会增加进度
- 仿照原版逐章引入障碍：糖霜（1–3 层）、甘草锁、会蔓延的巧克力、倒计时糖果炸弹；每关开始时会说明本关出现的障碍
- 关卡开始弹窗默认只展示目标、步数和英雄选择，点选英雄即显示其技能，关卡说明仍收进「详细说明」；小屏幕和横屏可滑动查看，底部操作按钮始终可见
- 条纹糖果、包装糖果、彩色炸弹及其组合
- 6 位英雄（战士、法师、盗贼、牧师、弓箭手、召唤师），每关派出一位，各有主动和被动技能
- 每位英雄的主动、被动技能均可升至 10 级；1–5 级降低前期强度、放慢充能，6–10 级逐步增强技能、被动效果或充能速度，升级费用递增，原有升级费用保持不变
- 1–10 级平滑成长：每次升级的充能消耗降幅不超过 10%，数量型效果每级最多增加 1，概率型效果每级最多增加 10 个百分点，避免跨级强度突变
- 没有金币：消除的每一颗糖果都会存进糖果罐，用来升级英雄技能（升级需要很多糖果，英雄成长较慢）
- 每位英雄都有自己的原创主题音乐和口号；地图和标题界面播放八音盒主题曲
- 设置：背景音乐、音效与英雄口号可分别开关并调节音量（标题界面的「设置」按钮，或地图、游戏中的喇叭按钮）
- 英雄释放技能时有全屏华丽特效（盾牌震地、魔法阵与流星、暗影斩击、天堂圣光、箭雨、召唤法阵与小熊飞出）
- 技能充满时，英雄按钮周围出现专属光环：法师烈焰、战士战意雷光、盗贼暗影烟雾、牧师圣光光环、弓箭手疾风落叶、召唤师召唤法阵
- 所有图形、音乐与音效均由代码实时生成，无外部资源

The campaign has 260 levels across 52 chapters, adding 200 levels to the original 60. Levels 61–100 are handcrafted; levels 101–260 use fixed per-level layouts, themed blocker combinations, and gradually increasing targets. New bomb levels retain generous countdowns. Levels 1–60 are unchanged, and existing saves automatically unlock the next level after the last one cleared.

Level intro dialogs show goals, moves, and hero selection first. Selecting a hero reveals their skills and scrolls them into view without expanding the obstacle explanations, star targets, or challenges. Start, Upgrade Heroes, and Map stay visible on small and landscape screens while the content above them scrolls.

Optional mastery medals add replay goals without blocking normal wins. Each medal pays 100 candies once: reach two-star score, or finish any other goal with at least three moves left. Heroes and tools can be used freely and never affect medal eligibility. Three consecutive first-time level wins open a 250-candy chest automatically; a loss resets the streak, and replays do not advance it. Medals, streaks, and unfinished runs are saved locally.

All six heroes have independently upgradeable active and passive skills up to level 10. Levels 1–5 are intentionally weaker, with slower charging and reduced early combat bonuses; their upgrade prices are unchanged. Levels 6–10 improve skill power, passive benefits, or charging speed; each skill's successive upgrade costs are 1,000, 2,000, 3,200, 5,000, 7,500, 10,500, 14,000, 18,000, and 23,000 candies. Existing hero levels and candy balances are preserved.

## 在线试玩 / Play online

https://sunliangqin.github.io/sweet-saga/

## 运行 / Run

直接用浏览器打开 `index.html` 即可，无需构建或服务器。

Open `index.html` in any modern browser — no build step or server needed.

## 发布 / Publish

网页直接通过本仓库的 GitHub Pages 发布，发布源为 `main` 分支的根目录。每次推送到 `main` 后，网站会自动更新，无需单独的网页仓库。

GitHub Pages serves this repository directly from the root of `main`. Every push to `main` automatically updates the site; no separate web repository is needed.

修改并提交后，在 `main` 分支运行以下脚本，将已提交的更改推送到本仓库：

After committing your changes on `main`, run the script to push those commits to this repository:

```powershell
.\publish.ps1
```

脚本不会自动创建提交；旧的 `-Message` 参数已不再使用。GitHub Pages 通常需要几分钟完成部署。

The script does not create commits; the old `-Message` parameter is no longer used. Allow a few minutes for GitHub Pages to finish deploying.

## 验证 / Tests

安装 Node.js 后可运行关卡与存档兼容性检查，无需安装依赖：

With Node.js installed, run the level and save-compatibility checks without installing dependencies:

```powershell
node --test .\tests\game.test.cjs
```
