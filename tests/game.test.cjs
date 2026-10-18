const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('const ROWS =');
const end = html.indexOf('/* ================= sound');
assert.ok(start >= 0 && end > start, 'Campaign and save sections must exist.');
const campaignSource = html.slice(start, end);

function evaluate(expression, saved = null) {
  return JSON.parse(vm.runInNewContext(
    campaignSource + `\nJSON.stringify(${expression});`,
    { localStorage: { getItem: () => saved === null ? null : JSON.stringify(saved) } },
    { timeout: 5000 },
  ));
}

function loadCampaign(saved = null) {
  return evaluate('{ levels: LEVELS, episodes: EPISODES, names: STR.ep, save }', saved);
}

const campaign = loadCampaign();
const { levels, episodes, names } = campaign;

test('the complete inline game script parses', () => {
  const script = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(script);
  assert.doesNotThrow(() => new vm.Script(script[1]));
});

test('the campaign adds exactly 200 levels and 40 five-level chapters', () => {
  assert.equal(levels.length, 260);
  assert.equal(episodes.length, 52);
  assert.deepEqual(episodes, Array.from({ length: 52 }, (_, i) => i * 5));
  assert.equal(names.length, episodes.length);
  assert.equal(new Set(names).size, names.length);
  assert.ok(names.every(name => typeof name === 'string' && name.trim()));
});

test('the original 60 levels remain unchanged', () => {
  const digest = createHash('sha256').update(JSON.stringify(levels.slice(0, 60))).digest('hex');
  assert.equal(digest, '5e560e155a1ffcddbf18a990243bfd52b2d944acb729539592a399a8640192c0');
});

test('all added level definitions are distinct and deterministic', () => {
  assert.equal(new Set(levels.slice(60).map(level => JSON.stringify(level))).size, 200);
  assert.deepEqual(loadCampaign().levels, levels);
});

test('every level has valid board dimensions, obstacles, and star targets', () => {
  for (const [i, level] of levels.entries()) {
    const label = `Level ${i + 1}`;
    assert.ok(Number.isInteger(level.moves) && level.moves > 0, label);
    assert.ok(Number.isInteger(level.colors) && level.colors >= 3 && level.colors <= 6, label);
    assert.equal(level.shape.length, 9, label);
    assert.ok(level.shape.every(row => /^[.xjJ]{9}$/.test(row)), label);
    assert.equal(level.stars.length, 3, label);
    assert.ok(level.stars.every((n, j) => Number.isInteger(n) && n > (level.stars[j - 1] || 0)), label);
    if (level.obs) {
      assert.equal(level.obs.length, 9, label);
      assert.ok(level.obs.every(row => /^[.123cl]{9}$/.test(row)), label);
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
        if (level.obs[r][c] !== '.') assert.notEqual(level.shape[r][c], '.', `${label}: off-board blocker`);
      }
    }
  }
});

test('every objective is supported and has enough available targets', () => {
  for (const [i, level] of levels.entries()) {
    const label = `Level ${i + 1}`;
    assert.ok(['score', 'jelly', 'order', 'ingredients'].includes(level.goal.type), label);
    if (level.goal.type === 'jelly') assert.match(level.shape.join(''), /[jJ]/, label);
    if (level.goal.type === 'ingredients') assert.ok(Number.isInteger(level.goal.n) && level.goal.n > 0, label);
    if (level.goal.type !== 'order') continue;
    assert.ok(level.goal.items.length > 0, label);
    assert.equal(new Set(level.goal.items.map(item => item.k)).size, level.goal.items.length, label);
    for (const item of level.goal.items) {
      assert.ok(Number.isInteger(item.n) && item.n > 0, label);
      assert.match(item.k, /^(c[0-5]|striped|wrapped|bomb|frost|choco)$/, label);
      if (item.k.startsWith('c') && item.k !== 'choco') assert.ok(+item.k[1] < level.colors, label);
      if (item.k === 'frost' || item.k === 'choco') {
        const matches = (level.obs || []).join('').match(item.k === 'frost' ? /[123]/g : /c/g) || [];
        assert.ok(item.n <= matches.length, `${label}: unavailable ${item.k} order`);
      }
    }
  }
});

test('new bomb levels retain generous countdowns and bounded spawns', () => {
  for (const level of levels.slice(60).filter(level => level.bombs)) {
    const { start, t, max, p } = level.bombs;
    assert.ok(Number.isInteger(t) && t >= 20);
    assert.ok(start >= 1 && start <= max && max <= 2);
    assert.ok(p > 0 && p <= 0.03);
  }
});

test('later chapters offer all four goals without steep move-budget cuts', () => {
  for (let i = 100; i < levels.length; i += 5) {
    const chapter = levels.slice(i, i + 5);
    assert.equal(new Set(chapter.map(level => level.goal.type)).size, 4);
    assert.ok(chapter.every(level => level.moves >= 26 && level.moves <= 32));
    for (const level of chapter.filter(level => level.goal.type === 'ingredients')) {
      for (let c = 0; c < 9; c++) {
        const rows = level.shape.map((row, r) => row[c] === '.' ? -1 : r).filter(r => r >= 0);
        if (!rows.length) continue;
        assert.equal(level.obs[rows[0]][c], '.', `Level ${levels.indexOf(level) + 1}: blocked entry`);
        assert.equal(level.obs[rows[rows.length - 1]][c], '.', `Level ${levels.indexOf(level) + 1}: blocked exit`);
      }
    }
  }
});

test('a new player still starts at level 1', () => {
  assert.equal(campaign.save.unlocked, 1);
  assert.deepEqual(campaign.save.stars, {});
  assert.equal(campaign.save.run, null);
});

test('old completed saves unlock level 61 without losing progress or upgrades', () => {
  const saved = {
    unlocked: 60, stars: { 1: 3, 59: 2, 60: 1 }, best: { 60: 123456 },
    candy: 4321, hero: 'mage', heroLv: { mage: { a: 3, p: 2 } },
    music: { on: false, vol: 0.3 }, sfx: { on: true, vol: 0.7 },
  };
  const { save } = loadCampaign(saved);
  assert.equal(save.unlocked, 61);
  for (const key of ['stars', 'best', 'candy', 'hero', 'music', 'sfx']) assert.deepEqual(save[key], saved[key]);
  assert.deepEqual(save.heroLv.mage, saved.heroLv.mage);
});

test('unfinished old levels remain locked normally and keep their saved run', () => {
  const saved = { unlocked: 60, stars: { 59: 2 }, run: { i: 59, moves: 7, score: 12345 } };
  const { save } = loadCampaign(saved);
  assert.equal(save.unlocked, 60);
  assert.deepEqual(save.run, saved.run);
});

test('later completion advances normally and the last level caps at 260', () => {
  for (const n of [61, 100, 101, 140, 180, 220, 259, 260]) {
    const { save } = loadCampaign({ unlocked: n, stars: { [n]: 2 } });
    assert.equal(save.unlocked, Math.min(260, n + 1));
  }
});

test('medals reward results, regardless of tool usage or hero casts', () => {
  const results = evaluate(`(() => {
    const run = { L: { goal: { type: 'score' }, stars: [10, 20, 30] }, score: 20, hammer: 0, shuffle: 0, casts: 0 };
    const scorePass = challengeMet(run, 0);
    run.score = 19;
    const scoreFail = challengeMet(run, 10);
    const otherGoals = ['jelly', 'order', 'ingredients'].map(type => {
      run.L.goal.type = type;
      return [challengeMet(run, 3), challengeMet(run, 2)];
    });
    return { scorePass, scoreFail, otherGoals };
  })()`);
  assert.equal(results.scorePass, true);
  assert.equal(results.scoreFail, false);
  assert.deepEqual(results.otherGoals, [[true, false], [true, false], [true, false]]);
});

test('three first-time wins award exactly one streak chest and three medals', () => {
  const result = evaluate(`(() => {
    const progress = defaultSave(), rewards = [];
    for (let i = 0; i < 3; i++) {
      rewards.push(awardWinRewards(progress, { i, L: { goal: { type: 'jelly' } } }, 3));
      progress.stars[i + 1] = 1;
    }
    const replay = awardWinRewards(progress, { i: 2, L: { goal: { type: 'jelly' } } }, 3);
    return { progress, rewards, replay, expected: 3 * MEDAL_REWARD + STREAK_REWARD };
  })()`);
  assert.equal(result.progress.candy, result.expected);
  assert.equal(result.progress.winStreak, 0);
  assert.equal(Object.keys(result.progress.medals).length, 3);
  assert.deepEqual(result.rewards.map(reward => reward.chest), [false, false, true]);
  assert.deepEqual(result.replay, { medal: false, chest: false, bonus: 0 });
});

test('replays can earn a missing medal once but never advance the streak', () => {
  const result = evaluate(`(() => {
    const progress = defaultSave();
    progress.stars[4] = 2; progress.winStreak = 2;
    const run = { i: 3, L: { goal: { type: 'ingredients' } } };
    const first = awardWinRewards(progress, run, 3);
    const second = awardWinRewards(progress, run, 3);
    return { progress, first, second, expected: MEDAL_REWARD };
  })()`);
  assert.equal(result.progress.candy, result.expected);
  assert.equal(result.progress.winStreak, 2);
  assert.equal(result.first.medal, true);
  assert.equal(result.first.chest, false);
  assert.equal(result.second.bonus, 0);
});

test('a normal win still advances the streak when its optional medal is missed', () => {
  const result = evaluate(`(() => {
    const progress = defaultSave();
    const reward = awardWinRewards(progress, { i: 60, L: { goal: { type: 'order' } } }, 2);
    return { progress, reward };
  })()`);
  assert.equal(result.progress.winStreak, 1);
  assert.deepEqual(result.progress.medals, {});
  assert.deepEqual(result.reward, { medal: false, chest: false, bonus: 0 });
});

test('old saves default new rewards safely and existing rewards survive reload', () => {
  const old = loadCampaign({ unlocked: 10 });
  assert.deepEqual(old.save.medals, {});
  assert.equal(old.save.winStreak, 0);
  const existing = loadCampaign({ medals: { 1: true, 3: true }, winStreak: 2 });
  assert.deepEqual(existing.save.medals, { 1: true, 3: true });
  assert.equal(existing.save.winStreak, 2);
  const malformed = loadCampaign({ medals: [], winStreak: -1 });
  assert.deepEqual(malformed.save.medals, {});
  assert.equal(malformed.save.winStreak, 0);
});

const heroes = evaluate(`({
  max: MAXLV, upgrades: UPG, hp: HP,
  list: HERO_LIST.map(h => ({
    id: h.id, cost: h.cost,
    descriptions: Array.from({ length: MAXLV }, (_, i) => [h.active.desc(i + 1), h.passive.desc(i + 1)]),
  })),
})`);

test('all six heroes have complete ten-level stats and descriptions', () => {
  assert.equal(heroes.max, 10);
  assert.equal(heroes.list.length, 6);
  for (const [key, values] of Object.entries(heroes.hp)) {
    assert.equal(values.length, 10, key);
    if (key === 'bless') {
      assert.ok(values.every(pair => pair.length === 2 && pair.every(Number.isInteger)));
      assert.ok(values.every((pair, i) => !i || pair[0] + 2 * pair[1] > values[i - 1][0] + 2 * values[i - 1][1]));
    } else {
      assert.ok(values.every((value, i) => Number.isInteger(value) && value >= 0 && (!i || value >= values[i - 1])), key);
    }
  }
  for (const hero of heroes.list) {
    assert.equal(hero.cost.length, 10, hero.id);
    assert.ok(hero.cost.every((cost, i) => cost > 0 && (!i || cost < hero.cost[i - 1])), hero.id);
    assert.ok(hero.descriptions.flat().every(text => typeof text === 'string' && !/undefined|NaN/.test(text)), hero.id);
    assert.equal(new Set(hero.descriptions.map(pair => pair[1])).size, 10, `${hero.id}: every passive upgrade should improve its effect`);
  }
  for (const key of ['spark', 'crit', 'sneak', 'quick']) assert.ok(heroes.hp[key].every(n => n < 100));
  assert.ok(heroes.hp.arrows.every(n => n <= 9));
});

test('hero levels 1-5 charge more slowly than before and early powers are reduced', () => {
  const oldCosts = {
    warrior: [170, 160, 160, 155, 150], mage: [210, 200, 190, 180, 170],
    rogue: [145, 137, 129, 121, 113], priest: [115, 108, 100, 92, 85],
    archer: [200, 186, 172, 158, 145], summoner: [225, 215, 205, 195, 185],
  };
  for (const hero of heroes.list) {
    assert.ok(hero.cost.slice(0, 5).every((cost, i) => cost > oldCosts[hero.id][i]), hero.id);
  }
  assert.equal(heroes.hp.meteors[0], 1);
  assert.equal(heroes.hp.ambush[0], 2);
  assert.equal(heroes.hp.heal[0], 1);
  assert.equal(heroes.hp.arrows[0], 1);
  assert.equal(heroes.hp.bears[0], 1);
  assert.equal(heroes.hp.lsSmash[1], 1);
});

test('hero progression is smooth across all ten levels, including the level 5-6 boundary', () => {
  for (const hero of heroes.list) {
    assert.ok(hero.cost.every((cost, i) => !i || cost >= hero.cost[i - 1] * 0.9), `${hero.id}: charging jump`);
  }
  for (const key of ['slamArea', 'slamRows', 'slamCols', 'lastStand', 'lsSmash', 'meteors', 'ambush', 'heal', 'arrows', 'bears', 'bearMoves', 'pet']) {
    assert.ok(heroes.hp[key].every((value, i, values) => !i || value - values[i - 1] <= 1), `${key}: power jump`);
  }
  for (const key of ['spark', 'crit', 'sneak', 'quick']) {
    assert.ok(heroes.hp[key].every((value, i, values) => !i || value - values[i - 1] <= 10), `${key}: probability jump`);
  }
  const blessingPower = heroes.hp.bless.map(([stripes, wrapped]) => stripes + 2 * wrapped);
  assert.deepEqual(blessingPower, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('warrior line upgrades hit the stated number of rows or columns even at board edges', () => {
  const lines = evaluate(`Array.from({ length: 4 }, (_, count) =>
    Array.from({ length: 9 }, (_, at) => skillLines(count, at, 9)))`);
  for (const [count, positions] of lines.entries()) for (const [at, selected] of positions.entries()) {
    assert.equal(selected.length, count);
    assert.equal(new Set(selected).size, count);
    assert.ok(selected.every(n => n >= 0 && n < 9));
    if (count) assert.ok(selected.includes(at));
  }
});

test('upgrade prices cover all nine upgrades and retain the original early costs', () => {
  assert.equal(heroes.upgrades.length, heroes.max - 1);
  assert.deepEqual(heroes.upgrades.slice(0, 4), [1000, 2000, 3200, 5000]);
  assert.ok(heroes.upgrades.every((cost, i) => Number.isInteger(cost) && cost > (heroes.upgrades[i - 1] || 0)));
});

test('saved hero levels and candy balances survive the increased level cap', () => {
  for (const level of [1, 5, 6, 9, 10]) {
    const heroLv = Object.fromEntries(heroes.list.map(hero => [hero.id, { a: level, p: level }]));
    const { save } = loadCampaign({ heroLv, candy: 12345 });
    assert.deepEqual(save.heroLv, heroLv);
    assert.equal(save.candy, 12345);
  }
});
