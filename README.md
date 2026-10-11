# 甜蜜传奇 Sweet Saga

一个单文件 HTML 三消游戏（糖果消消乐风格），支持触屏，无广告、无内购，进度保存在本地浏览器。

A single-file HTML match-3 game (Candy Crush Saga style). Touch friendly, no ads, no in-app purchases; progress is saved locally in the browser.

## 玩法 / Features

- 60 个关卡，分为 12 个章节，难度缓慢提升：分数、果冻、收集订单、运送食材四种目标
- 仿照原版逐章引入障碍：糖霜（1–3 层）、甘草锁、会蔓延的巧克力、倒计时糖果炸弹；每关开始时会说明本关出现的障碍
- 条纹糖果、包装糖果、彩色炸弹及其组合
- 6 位英雄（战士、法师、盗贼、牧师、弓箭手、召唤师），每关派出一位，各有主动和被动技能
- 没有金币：消除的每一颗糖果都会存进糖果罐，用来升级英雄技能（升级需要很多糖果，英雄成长较慢）
- 每位英雄都有自己的原创主题音乐和口号；地图和标题界面播放八音盒主题曲
- 英雄释放技能时有全屏华丽特效（盾牌震地、魔法阵与流星、暗影斩击、天堂圣光、箭雨、召唤法阵与小熊飞出）
- 技能充满时，英雄按钮周围出现专属光环：法师烈焰、战士战意雷光、盗贼暗影烟雾、牧师圣光光环、弓箭手疾风落叶、召唤师召唤法阵
- 所有图形、音乐与音效均由代码实时生成，无外部资源

## 在线试玩 / Play online

https://sunliangqin.github.io/sweet-saga-web/

## 运行 / Run

直接用浏览器打开 `index.html` 即可，无需构建或服务器。

Open `index.html` in any modern browser — no build step or server needed.

## 发布 / Publish

本仓库为私有仓库；网页通过公开仓库 [sweet-saga-web](https://github.com/sunliangqin/sweet-saga-web) 的 GitHub Pages 发布。修改 `index.html` 并提交后，运行：

This repo is private; the page is served by GitHub Pages from the public repo `sunliangqin/sweet-saga-web`. After committing changes to `index.html`, run:

```powershell
.\publish.ps1 -Message "描述这次更新"
```
