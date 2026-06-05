import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { onLoad, onShow, onHide } from '@dcloudio/uni-app'

export function useGame(currentPageType = 'cultivation') {
  const CURRENT_PAGE_TYPE = currentPageType

  const TAB_PAGES = [
    '/pages/index/index',
    '/pages/explore/explore',
    '/pages/alchemy/alchemy',
    '/pages/sect/sect',
    '/pages/inventory/inventory'
  ]

  function syncCurrentPageType() {
    activeTab.value = CURRENT_PAGE_TYPE
  }

  function goPage(url, message = '') {
    if (message) showFeedback(message)
    saveSilently()
    if (TAB_PAGES.includes(url)) {
      uni.switchTab({ url })
      return
    }
    uni.navigateTo({
      url,
      animationType: 'fade-in',
      animationDuration: 180,
      fail: () => {
        uni.redirectTo({ url, animationType: 'fade-in', animationDuration: 180 })
      }
    })
  }

  const STORAGE_KEY = 'xianxia-full-save-mp-v7'
  const SAVE_SLOTS_KEY = '__xiuxian_slot_meta__'
  const SLOT_DATA_PREFIX = '__xiuxian_slot_'
  const BATTLE_REQUEST_KEY = 'xianxia-pending-battle-request-v1'
  const LEGACY_STORAGE_KEYS = ['xianxia-full-save-mp-v6', 'xianxia-full-save-mp-v5', 'xianxia-full-save-mp-v4', 'xianxia-full-save-mp-v3', 'xianxia-full-save-mp-v2', 'xianxia-full-save-mp-v1']
  const SAVE_VERSION = 29
  const realmNames = ['炼气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期', '真仙期', '玄仙期', '金仙期', '仙王期', '仙帝期', '真神期', '天神期', '神王期', '神皇期', '神尊期']
  const TOWER_ROOMS_PER_REALM = 9
  const TRUE_IMMORTAL_TOWER_LEVEL = 9 * TOWER_ROOMS_PER_REALM + 1
  const furnaceNames = ['凡炉', '宝炉', '灵炉', '玄炉', '仙炉']

  const techniques = [
    { id: 'qingmu', type: '辅助', name: '青木吐纳诀', description: '以绵长木灵温养经脉，胜在稳健，适合前期积累修为。', autoBase: 1.12, manualBase: 1.08, spiritCostRate: 0.95 },
    { id: 'lieyang', type: '攻击', name: '烈阳焚脉功', description: '引烈阳入体，爆发凶猛，手动修炼收益极高，但耗神亦重。', autoBase: 0.98, manualBase: 1.35, spiritCostRate: 1.15 },
    { id: 'xuanbing', type: '防御', name: '玄冰守一心经', description: '寒息沉静，可稳固心神，提升突破时的成功概率。', autoBase: 1.05, manualBase: 1.10, spiritCostRate: 1.0 }
  ]

  const explorationMaps = [
    { id: 'qingzhu', name: '青竹林', desc: '灵雾浮动，竹影婆娑，适合炼气修士寻觅低阶灵草与基础法器。', unlockText: '炼气三层解锁', rewardHint: '药材、灵果、炼气装备', recommend: '炼气期', danger: '低', x: 12, y: 70, need: { realmIndex: 0, layer: 3 } },
    { id: 'heifeng', name: '黑风山', desc: '山岭阴沉，妖气盘踞，矿脉与筑基妖兽共生。', unlockText: '筑基期解锁', rewardHint: '矿石、内丹、筑基装备', recommend: '筑基期', danger: '中', x: 28, y: 58, need: { realmIndex: 1, layer: 1 } },
    { id: 'lingxi', name: '灵犀谷', desc: '古藤垂落，道韵偶现，常有金丹修士遗留的残卷与法宝。', unlockText: '金丹期解锁', rewardHint: '功法点、残卷、金丹装备', recommend: '金丹期', danger: '中高', x: 44, y: 48, need: { realmIndex: 2, layer: 1 } },
    { id: 'yuanying', name: '元婴秘境', desc: '秘境不定，天象混乱，一念机缘，一念生死。', unlockText: '元婴期解锁', rewardHint: '高额修为、元婴装备、稀有宝物', recommend: '元婴期', danger: '高', x: 58, y: 35, need: { realmIndex: 3, layer: 1 } },
    { id: 'huashen', name: '神识海', desc: '无形神识化作汪洋，心魔与灵光并生，适合化神修士历练神魂。', unlockText: '化神期解锁', rewardHint: '神识材料、化神装备、功法点', recommend: '化神期', danger: '极高', x: 68, y: 22, need: { realmIndex: 4, layer: 1 } },
    { id: 'lianxu', name: '虚空古道', desc: '古道半隐于虚空裂缝之间，虚实交错，非炼虚修士难以立足。', unlockText: '炼虚期解锁', rewardHint: '虚空矿材、炼虚装备、丹方残卷', recommend: '炼虚期', danger: '极高', x: 77, y: 42, need: { realmIndex: 5, layer: 1 } },
    { id: 'heti', name: '归元天阙', desc: '天阙残宫悬于云端，万法归元，合体修士可在此锤炼周身道基。', unlockText: '合体期解锁', rewardHint: '归元宝材、合体装备、大量修为', recommend: '合体期', danger: '仙险', x: 84, y: 28, need: { realmIndex: 6, layer: 1 } },
    { id: 'dacheng', name: '星海仙墟', desc: '星海深处漂浮着旧仙墟残片，残存大道气机足以震慑大乘以下修士。', unlockText: '大乘期解锁', rewardHint: '星海宝材、大乘装备、稀有丹药', recommend: '大乘期', danger: '仙险', x: 90, y: 17, need: { realmIndex: 7, layer: 1 } },
    { id: 'dujie', name: '劫雷天渊', desc: '天渊中劫雷不息，雷痕凝成道纹，是渡劫修士淬炼终极宝物之地。', unlockText: '渡劫期解锁', rewardHint: '劫雷材料、渡劫装备、顶级机缘', recommend: '渡劫期', danger: '天劫', x: 95, y: 8, need: { realmIndex: 8, layer: 1 } },
    { id: 'zhenxian', name: '真仙灵境', desc: '飞升仙界后初临之地，仙灵之气如雾成河，可淬炼真仙根基。', unlockText: '真仙期解锁', rewardHint: '仙灵草、真仙装备、仙丹材料', recommend: '真仙期', danger: '仙威', x: 16, y: 24, need: { realmIndex: 9, layer: 1 } },
    { id: 'xuanxian', name: '玄仙洞天', desc: '洞天中玄光流转，古仙遗阵仍在运转，适合玄仙修士悟法取宝。', unlockText: '玄仙期解锁', rewardHint: '玄仙装备、仙符残卷、功法点', recommend: '玄仙期', danger: '仙威', x: 32, y: 20, need: { realmIndex: 10, layer: 1 } },
    { id: 'jinxian', name: '金仙道台', desc: '道台悬于云海之上，金性不朽之意凝成仙纹，非金仙难以承受。', unlockText: '金仙期解锁', rewardHint: '金仙装备、不朽宝材、高阶仙丹', recommend: '金仙期', danger: '仙压', x: 48, y: 16, need: { realmIndex: 11, layer: 1 } },
    { id: 'xianwang', name: '仙王古庭', desc: '古庭残留仙王法度，庭中一步一阵，胜者可得王庭遗珍。', unlockText: '仙王期解锁', rewardHint: '仙王装备、王庭宝材、神器机缘', recommend: '仙王期', danger: '王庭', x: 64, y: 20, need: { realmIndex: 12, layer: 1 } },
    { id: 'xiandi', name: '仙帝天阙', desc: '天阙高悬九重仙霄，仙帝余威仍可镇压万法。', unlockText: '仙帝期解锁', rewardHint: '仙帝装备、帝阙宝材、顶级仙丹', recommend: '仙帝期', danger: '帝威', x: 80, y: 16, need: { realmIndex: 13, layer: 1 } },
    { id: 'zhenshen', name: '神门古原', desc: '飞升神界后第一处古原，神息厚重，凡灵之器在此尽成尘埃。', unlockText: '真神期解锁', rewardHint: '神源晶、真神器胚、神界丹材', recommend: '真神期', danger: '神威', x: 18, y: 18, need: { realmIndex: 14, layer: 1 } },
    { id: 'tianshen', name: '天神云宫', desc: '云宫横亘九霄，天神遗纹悬于殿柱，可淬炼神魂与神器。', unlockText: '天神期解锁', rewardHint: '天神装备、神魂材料、高阶功法点', recommend: '天神期', danger: '神威', x: 36, y: 12, need: { realmIndex: 15, layer: 1 } },
    { id: 'shenwang', name: '神王战庭', desc: '古神王征伐之庭，残留战意经久不散，适合强者磨炼杀伐。', unlockText: '神王期解锁', rewardHint: '神王装备、战庭宝材、神器机缘', recommend: '神王期', danger: '神战', x: 54, y: 18, need: { realmIndex: 16, layer: 1 } },
    { id: 'shenhuang', name: '神皇天域', desc: '天域中法则如潮，神皇之气垂落，非高阶神修难以久留。', unlockText: '神皇期解锁', rewardHint: '神皇装备、大量修为、稀有神器', recommend: '神皇期', danger: '神战', x: 72, y: 12, need: { realmIndex: 17, layer: 1 } },
    { id: 'shenzun', name: '神尊道墟', desc: '道墟尽头万法归寂，传闻神尊在此观尽纪元兴灭。', unlockText: '神尊期解锁', rewardHint: '神尊装备、终极宝材、顶级神器机缘', recommend: '神尊期', danger: '道劫', x: 90, y: 10, need: { realmIndex: 18, layer: 1 } }
  ]

  const difficulties = [
    { id: 'normal', name: '普通', costRate: 1, rewardRate: 1, successOffset: 8 },
    { id: 'hard', name: '困难', costRate: 1.45, rewardRate: 1.45, successOffset: -2 },
    { id: 'abyss', name: '炼狱', costRate: 2.05, rewardRate: 2.1, successOffset: -14 }
  ]

  const battleSkills = [
    { id: 'basic', category: 'attack', name: '灵剑斩', desc: '基础攻伐术，不消耗灵力，常驻可用。', cost: 0, spiritCostRate: 0, power: 1, unlockRealm: 0 },
    { id: 'fireball', category: 'attack', name: '赤火诀', desc: '凝火为刃，消耗少量灵力，伤害可观。', cost: 15, spiritCostRate: 0.08, power: 1.60, unlockRealm: 0 },
    { id: 'thunder', category: 'attack', name: '奔雷指', desc: '雷光破邪，消耗灵力，爆发强劲。', cost: 22, spiritCostRate: 0.13, power: 2.20, unlockRealm: 1 },
    { id: 'soulFire', category: 'attack', name: '神魂真火', desc: '以神识引动真火，威力绝伦。', cost: 30, spiritCostRate: 0.18, power: 2.40, unlockRealm: 2 },
    { id: 'iceBlade', category: 'attack', name: '冰魄寒光', desc: '寒冰化刃，降低敌方攻击一回合。', cost: 20, spiritCostRate: 0.12, power: 1.75, enemyAtkDown: 0.22, unlockRealm: 2 },
    { id: 'voidShatter', category: 'attack', name: '裂空斩', desc: '撕裂虚空，无视部分防御。', cost: 26, spiritCostRate: 0.15, power: 2.15, armorPen: 0.35, unlockRealm: 3 },
    { id: 'starfall', category: 'attack', name: '星陨术', desc: '引星辰之力，造成巨额伤害。', cost: 36, spiritCostRate: 0.22, power: 2.80, unlockRealm: 5 },
    { id: 'ironSkin', category: 'buff', name: '金刚护体', desc: '凝聚灵力护甲，提升防御三回合。', cost: 18, spiritCostRate: 0.10, buffDef: 0.55, buffTurns: 3, unlockRealm: 1 },
    { id: 'warCry', category: 'buff', name: '天罡战意', desc: '激发战意，提升攻击三回合。', cost: 18, spiritCostRate: 0.10, buffAtk: 0.45, buffTurns: 3, unlockRealm: 2 },
    { id: 'windWalk', category: 'buff', name: '风灵步', desc: '身法如风，回复灵力并提升闪避。', cost: 10, spiritCostRate: 0.05, buffDodge: 0.25, buffTurns: 2, spiritRecover: 0.12, unlockRealm: 3 },
    { id: 'swordShield', category: 'heal', name: '护体剑罡', desc: '剑气护体，造成伤害并恢复生命。', cost: 18, spiritCostRate: 0.10, power: 1.20, healRate: 0.12, unlockRealm: 1 },
    { id: 'springHeal', category: 'heal', name: '回春术', desc: '木灵生机，恢复大量生命。', cost: 22, spiritCostRate: 0.12, healRate: 0.32, unlockRealm: 2 },
    { id: 'soulDrain', category: 'heal', name: '噬灵术', desc: '吸取敌方灵力与生命。', cost: 18, spiritCostRate: 0.10, power: 1.25, healRate: 0.14, spiritDrain: 0.07, unlockRealm: 3 }
  ]

  const cultivationPillDefs = [
    { key: 'qiCondense', name: '聚气丹', realmIndex: 0, realmText: '炼气期', gain: 600, desc: '炼气期修为丹，低阶境界打基础最稳。' },
    { key: 'spiritRecover', name: '培元丹', realmIndex: 1, realmText: '筑基期', gain: 2520, desc: '由旧回灵丹改制而成，直接增进修为。' },
    { key: 'goldCorePill', name: '金元丹', realmIndex: 2, realmText: '金丹期', gain: 9900, desc: '凝炼金元之气，适合金丹修士吸收。' },
    { key: 'nascentSoulPill', name: '元婴丹', realmIndex: 3, realmText: '元婴期', gain: 38500, desc: '温养元婴，修为增长稳定。' },
    { key: 'spiritTransformPill', name: '化神丹', realmIndex: 4, realmText: '化神期', gain: 143000, desc: '助神识化灵，高阶修士方能承受。' },
    { key: 'voidRefinePill', name: '炼虚丹', realmIndex: 5, realmText: '炼虚期', gain: 540000, desc: '以虚炼真，药力深厚绵长。' },
    { key: 'unionPill', name: '合体丹', realmIndex: 6, realmText: '合体期', gain: 2040000, desc: '合元归一，适合合体境吸收。' },
    { key: 'mahayanaPill', name: '大乘丹', realmIndex: 7, realmText: '大乘期', gain: 7980000, desc: '大道气机凝成，非大乘修士难以承载。' },
    { key: 'tribulationPill', name: '渡劫丹', realmIndex: 8, realmText: '渡劫期', gain: 31500000, desc: '蕴含劫雷余韵，可助渡劫修士积累底蕴。' },
    { key: 'trueImmortalPill', name: '真仙丹', realmIndex: 9, realmText: '真仙期', gain: 119600000, desc: '仙界初阶修为丹，可凝练真仙仙元。' },
    { key: 'mysticImmortalPill', name: '玄仙丹', realmIndex: 10, realmText: '玄仙期', gain: 450000000, desc: '玄仙修士常用丹药，药力化作玄光仙气。' },
    { key: 'goldImmortalPill', name: '金仙丹', realmIndex: 11, realmText: '金仙期', gain: 1755000000, desc: '金仙道台秘方，能稳固不朽金性。' },
    { key: 'immortalKingPill', name: '仙王丹', realmIndex: 12, realmText: '仙王期', gain: 6960000000, desc: '仙王古庭流传的高阶仙丹，非仙王不可承受。' },
    { key: 'immortalEmperorPill', name: '仙帝丹', realmIndex: 13, realmText: '仙帝期', gain: 27900000000, desc: '仙帝天阙遗丹，蕴含一缕帝阙仙韵。' },
    { key: 'trueGodPill', name: '真神丹', realmIndex: 14, realmText: '真神期', gain: 171600000, desc: '神界初阶修为丹，可凝练神源之基。' },
    { key: 'heavenGodPill', name: '天神丹', realmIndex: 15, realmText: '天神期', gain: 630000000, desc: '天神修士常用丹药，药力化作天神云气。' },
    { key: 'godKingPill', name: '神王丹', realmIndex: 16, realmText: '神王期', gain: 2405000000, desc: '神王战庭秘方，能稳固神王法相。' },
    { key: 'godEmperorPill', name: '神皇丹', realmIndex: 17, realmText: '神皇期', gain: 9360000000, desc: '神皇天域流传的高阶神丹，非神皇不可承受。' },
    { key: 'godSovereignPill', name: '神尊丹', realmIndex: 18, realmText: '神尊期', gain: 36900000000, desc: '神尊道墟遗丹，蕴含一缕纪元道韵。' }
  ]

  const enemyNamePools = {
    beast: ['青牙狼妖', '赤睛山魈', '黑鳞妖蟒', '裂爪虎妖', '地火蜥妖'],
    cultivator: ['黑袍劫修', '夺宝散修', '血符道人', '阴山剑客', '无面邪修'],
    sect: ['外门执事', '内门精英', '护法弟子', '宗门长老', '闭关真传']
  }

  const recipes = [
    { id: 'qiCondense', name: '聚气丹', desc: '炼气期修为丹，筑基以上也可吸收，但效果会明显衰减。', category: '修为丹', outputText: '聚气丹 ×1', unlockRealm: 0, materials: { herbs: 5, fruits: 2 }, output: { type: 'pill', key: 'qiCondense', count: 1 } },
    { id: 'spiritRecover', name: '培元丹', desc: '筑基期修为丹，由旧回灵丹改制而成，直接增加固定修为。', category: '修为丹', outputText: '培元丹 ×1', unlockRealm: 1, materials: { herbs: 8, fruits: 4 }, output: { type: 'pill', key: 'spiritRecover', count: 1 } },
    { id: 'goldCorePill', name: '金元丹', desc: '金丹期修为丹，药力凝实，低境界不可吸收。', category: '修为丹', outputText: '金元丹 ×1', unlockRealm: 2, materials: { herbs: 10, fruits: 5, cores: 2 }, output: { type: 'pill', key: 'goldCorePill', count: 1 } },
    { id: 'nascentSoulPill', name: '元婴丹', desc: '元婴期修为丹，可温养元婴并增长修为。', category: '修为丹', outputText: '元婴丹 ×1', unlockRealm: 3, materials: { herbs: 14, fruits: 7, cores: 5, scrolls: 3 }, output: { type: 'pill', key: 'nascentSoulPill', count: 1 } },
    { id: 'spiritTransformPill', name: '化神丹', desc: '化神期修为丹，需更高神识方能承载。', category: '修为丹', outputText: '化神丹 ×1', unlockRealm: 4, materials: { herbs: 18, fruits: 10, cores: 8, scrolls: 5 }, output: { type: 'pill', key: 'spiritTransformPill', count: 1 } },
    { id: 'voidRefinePill', name: '炼虚丹', desc: '炼虚期修为丹，以虚炼真，药力厚重。', category: '修为丹', outputText: '炼虚丹 ×1', unlockRealm: 5, materials: { herbs: 23, ores: 8, fruits: 13, cores: 10, scrolls: 5 }, output: { type: 'pill', key: 'voidRefinePill', count: 1 } },
    { id: 'unionPill', name: '合体丹', desc: '合体期修为丹，气机圆融，增长稳定。', category: '修为丹', outputText: '合体丹 ×1', unlockRealm: 6, materials: { herbs: 30, ores: 10, fruits: 15, cores: 13, scrolls: 8 }, output: { type: 'pill', key: 'unionPill', count: 1 } },
    { id: 'mahayanaPill', name: '大乘丹', desc: '大乘期修为丹，蕴含大道气息。', category: '修为丹', outputText: '大乘丹 ×1', unlockRealm: 7, materials: { herbs: 40, ores: 13, fruits: 20, cores: 15, scrolls: 10 }, output: { type: 'pill', key: 'mahayanaPill', count: 1 } },
    { id: 'tribulationPill', name: '渡劫丹', desc: '渡劫期修为丹，内蕴劫雷余韵。', category: '修为丹', outputText: '渡劫丹 ×1', unlockRealm: 8, materials: { herbs: 55, ores: 20, fruits: 25, cores: 20, scrolls: 13 }, output: { type: 'pill', key: 'tribulationPill', count: 1 } },
    { id: 'trueImmortalPill', name: '真仙丹', desc: '真仙期修为丹，凝练真仙仙元。', category: '修为丹', outputText: '真仙丹 ×1', unlockRealm: 9, materials: { herbs: 70, ores: 25, fruits: 30, cores: 25, scrolls: 15 }, output: { type: 'pill', key: 'trueImmortalPill', count: 1 } },
    { id: 'mysticImmortalPill', name: '玄仙丹', desc: '玄仙期修为丹，适合仙界中阶修士。', category: '修为丹', outputText: '玄仙丹 ×1', unlockRealm: 10, materials: { herbs: 90, ores: 35, fruits: 40, cores: 30, scrolls: 20 }, output: { type: 'pill', key: 'mysticImmortalPill', count: 1 } },
    { id: 'goldImmortalPill', name: '金仙丹', desc: '金仙期修为丹，可温养不朽金性。', category: '修为丹', outputText: '金仙丹 ×1', unlockRealm: 11, materials: { herbs: 120, ores: 45, fruits: 55, cores: 40, scrolls: 25 }, output: { type: 'pill', key: 'goldImmortalPill', count: 1 } },
    { id: 'immortalKingPill', name: '仙王丹', desc: '仙王期修为丹，药力极其厚重。', category: '修为丹', outputText: '仙王丹 ×1', unlockRealm: 12, materials: { herbs: 160, ores: 60, fruits: 75, cores: 55, scrolls: 35 }, output: { type: 'pill', key: 'immortalKingPill', count: 1 } },
    { id: 'immortalEmperorPill', name: '仙帝丹', desc: '仙帝期修为丹，蕴含帝阙仙韵。', category: '修为丹', outputText: '仙帝丹 ×1', unlockRealm: 13, materials: { herbs: 220, ores: 85, fruits: 105, cores: 75, scrolls: 50 }, output: { type: 'pill', key: 'immortalEmperorPill', count: 1 } },
    { id: 'trueGodPill', name: '真神丹', desc: '真神期修为丹，凝练神源之基。', category: '修为丹', outputText: '真神丹 ×1', unlockRealm: 14, materials: { herbs: 70, ores: 25, fruits: 30, cores: 25, scrolls: 15 }, output: { type: 'pill', key: 'trueGodPill', count: 1 } },
    { id: 'heavenGodPill', name: '天神丹', desc: '天神期修为丹，适合神界中阶修士。', category: '修为丹', outputText: '天神丹 ×1', unlockRealm: 15, materials: { herbs: 90, ores: 35, fruits: 40, cores: 30, scrolls: 20 }, output: { type: 'pill', key: 'heavenGodPill', count: 1 } },
    { id: 'godKingPill', name: '神王丹', desc: '神王期修为丹，可温养神王法相。', category: '修为丹', outputText: '神王丹 ×1', unlockRealm: 16, materials: { herbs: 120, ores: 45, fruits: 55, cores: 40, scrolls: 25 }, output: { type: 'pill', key: 'godKingPill', count: 1 } },
    { id: 'godEmperorPill', name: '神皇丹', desc: '神皇期修为丹，药力极其厚重。', category: '修为丹', outputText: '神皇丹 ×1', unlockRealm: 17, materials: { herbs: 160, ores: 60, fruits: 75, cores: 55, scrolls: 35 }, output: { type: 'pill', key: 'godEmperorPill', count: 1 } },
    { id: 'godSovereignPill', name: '神尊丹', desc: '神尊期修为丹，蕴含纪元道韵。', category: '修为丹', outputText: '神尊丹 ×1', unlockRealm: 18, materials: { herbs: 220, ores: 85, fruits: 105, cores: 75, scrolls: 50 }, output: { type: 'pill', key: 'godSovereignPill', count: 1 } },
    { id: 'breakthroughPill', name: '破障丹', desc: '用于冲击境界瓶颈，提高突破成功率，不再作为突破硬性材料。', category: '突破丹', outputText: '突破丹 ×1', unlockRealm: 2, materials: { herbs: 10, ores: 5, cores: 3 }, output: { type: 'breakthrough', count: 1 } },
    { id: 'bonePill', name: '洗髓丹', desc: '淬炼根骨，提升修炼速度。', category: '属性丹', outputText: '根骨丹 ×1', unlockRealm: 2, materials: { herbs: 8, fruits: 5, scrolls: 3 }, output: { type: 'pill', key: 'bone', count: 1 } },
    { id: 'comprehensionPill', name: '悟心丹', desc: '清明心神，提升悟性。', category: '属性丹', outputText: '悟心丹 ×1', unlockRealm: 3, materials: { herbs: 8, fruits: 8, scrolls: 3 }, output: { type: 'pill', key: 'comprehension', count: 1 } },
    { id: 'fortunePill', name: '天缘丹', desc: '引来机缘，提升福缘。', category: '属性丹', outputText: '福缘丹 ×1', unlockRealm: 3, materials: { fruits: 10, scrolls: 5, cores: 3 }, output: { type: 'pill', key: 'fortune', count: 1 } }
  ]

  const sectTemplates = [
    { id: 'qingyun', name: '青云宗', desc: '偏重灵气吐纳与稳固根基，适合稳扎稳打之修士。', requireText: '金丹期可加入', needRealmIndex: 2, bonus: { cultivation: 0.08, alchemy: 0.03, explore: 0.04, breakthrough: 4 } },
    { id: 'liehuo', name: '烈火门', desc: '擅长炼丹与炼器，宗门之中地火旺盛。', requireText: '金丹期可加入', needRealmIndex: 2, bonus: { cultivation: 0.04, alchemy: 0.08, explore: 0.03, breakthrough: 2 } },
    { id: 'xingluo', name: '星罗阁', desc: '重视游历与机缘搜集，弟子善于秘境寻宝。', requireText: '金丹期可加入', needRealmIndex: 2, bonus: { cultivation: 0.03, alchemy: 0.03, explore: 0.08, breakthrough: 2 } },
    { id: 'hehuan', name: '合欢宗', desc: '重视双休宗门。', requireText: '元婴期可加入', needRealmIndex: 3, bonus: { cultivation: 0.1, alchemy: 0.03, explore: 0.05, breakthrough: 2 } }
  ]

  const sectTasks = [
    { id: 'patrol', title: '巡山护宗', desc: '巡视宗门山门，获得灵石与贡献。', rewardContribution: 20 },
    { id: 'gather', title: '药圃采药', desc: '协助宗门药圃整备，获得药材与贡献。', rewardContribution: 24 },
    { id: 'lecture', title: '听经悟道', desc: '聆听长老讲道，获得功法点与贡献。', rewardContribution: 18 }
  ]

  const sectExchanges = [
    { id: 'pill', name: '兑换破障丹', desc: '用于突破时提高成功率，不再作为硬性材料。', cost: 50 },
    { id: 'furnace', name: '兑换炉石', desc: '用于升级炼丹炉。', cost: 35 },
    { id: 'explore', name: '兑换探索符', desc: '增加探索次数。', cost: 30 },
    { id: 'fragment', name: '兑换丹方残卷', desc: '用于解锁高阶丹方。', cost: 60 },
    { id: 'chaos', name: '兑换混沌珠', desc: '稀有饰品，提升综合属性。', cost: 120 }
  ]

  const baseEquipmentCatalog = [
    { id: 'sword', type: 'weapon', unlockRealm: 0, name: '修仙剑', desc: '锋锐灵剑，适合以战养修。', effectText: '攻击 +18，手动修炼 +6%，探索成功率 +1%', bonus: { manual: 0.06, explore: 0.01, attack: 18 } },
    { id: 'greenWoodStaff', type: 'weapon', unlockRealm: 0, name: '青木灵杖', desc: '杖身含有木灵生机，适合稳健吐纳与炼丹控火。', effectText: '攻击 +14，自动修炼 +4%，炼丹成功率 +2%', bonus: { auto: 0.04, alchemy: 0.02, attack: 14 } },
    { id: 'cloudRobe', type: 'armor', unlockRealm: 0, name: '踏云法袍', desc: '轻若浮云，可护住经络气海。', effectText: '生命 +70，防御 +14，根骨 +1，突破 +1%', bonus: { bone: 1, breakthrough: 1, defense: 14, hp: 70 } },
    { id: 'jadePendant', type: 'accessory', unlockRealm: 0, name: '灵玉佩', desc: '温养经脉，灵气更易周流。', effectText: '根骨 +1，自动修炼 +3%', bonus: { bone: 1, auto: 0.03 } },
    { id: 'spiritGatheringCharm', type: 'talisman', unlockRealm: 0, name: '聚灵符佩', desc: '符纹缓慢牵引灵气，适合长时间挂机修炼。', effectText: '自动修炼 +5%', bonus: { auto: 0.05 } },

    { id: 'thunderBlade', type: 'weapon', unlockRealm: 1, name: '奔雷刃', desc: '刃光如电，利于短时爆发。', effectText: '攻击 +38，手动修炼 +9%，根骨 +1', bonus: { manual: 0.09, bone: 1, attack: 38 } },
    { id: 'blackIronArmor', type: 'armor', unlockRealm: 1, name: '玄铁甲', desc: '玄铁所铸，厚重稳固，适合抵御秘境冲击。', effectText: '生命 +170，防御 +36，根骨 +2，探索 +2%', bonus: { bone: 2, explore: 0.02, defense: 36, hp: 170 } },
    { id: 'moonRing', type: 'accessory', unlockRealm: 1, name: '月华戒', desc: '戒面含一缕月魄，可定心神。', effectText: '悟性 +1，突破成功率 +2%', bonus: { comprehension: 1, breakthrough: 2 } },
    { id: 'beastSeal', type: 'accessory', unlockRealm: 1, name: '镇兽印', desc: '印中封有微弱兽魂，可震慑低阶妖兽。', effectText: '福缘 +1，探索成功率 +3%', bonus: { fortune: 1, explore: 0.03 } },
    { id: 'windTalisman', type: 'talisman', unlockRealm: 1, name: '御风符', desc: '符力轻盈，行走山野更为从容。', effectText: '探索成功率 +4%', bonus: { explore: 0.04 } },
    { id: 'furnaceToken', type: 'talisman', unlockRealm: 1, name: '控火令', desc: '令牌可稳住丹火，降低炸炉概率。', effectText: '炼丹成功率 +4%', bonus: { alchemy: 0.04 } },

    { id: 'starSword', type: 'weapon', unlockRealm: 2, name: '星陨剑', desc: '剑脊似有星屑流转，可稳住破境气机。', effectText: '攻击 +76，手动修炼 +8%，突破 +2%', bonus: { manual: 0.08, breakthrough: 2, attack: 76 } },
    { id: 'moonSilkRobe', type: 'armor', unlockRealm: 2, name: '月华羽衣', desc: '月华织就，清心凝神，炼丹时尤为安稳。', effectText: '生命 +260，防御 +48，悟性 +1，炼丹 +3%', bonus: { comprehension: 1, alchemy: 0.03, defense: 48, hp: 260 } },
    { id: 'daoHeartMirror', type: 'talisman', unlockRealm: 2, name: '明心镜', desc: '照见心魔，破境时不易迷失。', effectText: '悟性 +1，突破成功率 +4%', bonus: { comprehension: 1, breakthrough: 4 } },
    { id: 'goldScaleArmor', type: 'armor', unlockRealm: 2, name: '金鳞战甲', desc: '甲片如金鳞层叠，可承受金丹境真元冲击。', effectText: '生命 +420，防御 +78，战斗更稳', bonus: { defense: 78, hp: 420 } },
    { id: 'sunsetBlade', type: 'weapon', unlockRealm: 2, name: '落霞刀', desc: '刀光带霞，适合短时压制敌修。', effectText: '攻击 +92，手动修炼 +5%', bonus: { attack: 92, manual: 0.05 } },

    { id: 'nascentSoulFan', type: 'weapon', unlockRealm: 3, name: '元婴灵扇', desc: '扇面绘有婴火灵纹，出手时气机绵延。', effectText: '攻击 +185，悟性 +1', bonus: { attack: 185, comprehension: 1 } },
    { id: 'soulGuardRobe', type: 'armor', unlockRealm: 3, name: '护婴法袍', desc: '可护住元婴本源，降低战斗反噬。', effectText: '生命 +980，防御 +185，突破 +2%', bonus: { hp: 980, defense: 185, breakthrough: 2 } },
    { id: 'chaosPearl', type: 'accessory', unlockRealm: 3, name: '混沌珠', desc: '混沌初开之宝，万法皆受其益。', effectText: '生命 +520，攻击 +95，防御 +90，三维各 +1，综合提升', bonus: { bone: 1, comprehension: 1, fortune: 1, auto: 0.02, manual: 0.02, explore: 0.02, alchemy: 0.02, breakthrough: 3, attack: 95, defense: 90, hp: 520 } },

    { id: 'spiritFlameSword', type: 'weapon', unlockRealm: 4, name: '化神焰剑', desc: '神识可引动剑中真焰，专破护体灵光。', effectText: '攻击 +430，战斗爆发提升', bonus: { attack: 430 } },
    { id: 'divineMindCrown', type: 'accessory', unlockRealm: 4, name: '神念冠', desc: '凝聚神识，令功法参悟更为清明。', effectText: '悟性 +3，自动修炼 +4%', bonus: { comprehension: 3, auto: 0.04 } },
    { id: 'voidPatternRobe', type: 'armor', unlockRealm: 4, name: '神纹玄袍', desc: '袍上神纹流转，可抵御化神境灵压。', effectText: '生命 +2350，防御 +430', bonus: { hp: 2350, defense: 430 } },

    { id: 'voidCuttingBlade', type: 'weapon', unlockRealm: 5, name: '炼虚断空刃', desc: '刃锋似能切开虚空缝隙，威势凌厉。', effectText: '攻击 +980，探索成功率 +3%', bonus: { attack: 980, explore: 0.03 } },
    { id: 'emptyCloudArmor', type: 'armor', unlockRealm: 5, name: '虚云灵甲', desc: '甲胄轻若浮云，受击时可化去部分真元。', effectText: '生命 +5600，防御 +980', bonus: { hp: 5600, defense: 980 } },
    { id: 'voidSeal', type: 'talisman', unlockRealm: 5, name: '炼虚道印', desc: '道印可定住虚实变化，辅助破境。', effectText: '突破 +5%，福缘 +2', bonus: { breakthrough: 5, fortune: 2 } },

    { id: 'unitySpear', type: 'weapon', unlockRealm: 6, name: '合体归元枪', desc: '枪势合元归一，气机贯通周身。', effectText: '攻击 +2250，根骨 +2', bonus: { attack: 2250, bone: 2 } },
    { id: 'heavenUnionRobe', type: 'armor', unlockRealm: 6, name: '天合道袍', desc: '道袍能调和气血与神识，适合久战。', effectText: '生命 +13200，防御 +2250', bonus: { hp: 13200, defense: 2250 } },
    { id: 'unityJade', type: 'accessory', unlockRealm: 6, name: '归元玉', desc: '玉中含一缕归元气，可稳住周天循环。', effectText: '三维各 +2，炼丹 +3%', bonus: { bone: 2, comprehension: 2, fortune: 2, alchemy: 0.03 } },

    { id: 'mahayanaSword', type: 'weapon', unlockRealm: 7, name: '大乘天剑', desc: '剑出如天意垂落，非大乘真元不可久持。', effectText: '攻击 +5400，突破 +4%', bonus: { attack: 5400, breakthrough: 4 } },
    { id: 'starSeaArmor', type: 'armor', unlockRealm: 7, name: '星海仙甲', desc: '甲面似有星河流转，可承受大道冲击。', effectText: '生命 +32000，防御 +5400', bonus: { hp: 32000, defense: 5400 } },
    { id: 'daoFruitPendant', type: 'accessory', unlockRealm: 7, name: '道果佩', desc: '佩中一枚虚幻道果，可增益长期修行。', effectText: '自动修炼 +8%，悟性 +3，福缘 +3', bonus: { auto: 0.08, comprehension: 3, fortune: 3 } },

    { id: 'tribulationThunderSword', type: 'weapon', unlockRealm: 8, name: '渡劫雷剑', desc: '剑身蕴含劫雷余韵，出鞘时雷云隐现。', effectText: '攻击 +12200，手动修炼 +8%', bonus: { attack: 12200, manual: 0.08 } },
    { id: 'thunderTribulationArmor', type: 'armor', unlockRealm: 8, name: '劫雷仙甲', desc: '以雷纹淬炼而成，可暂御天劫余威。', effectText: '生命 +76000，防御 +12200', bonus: { hp: 76000, defense: 12200 } },
    { id: 'heavenFateToken', type: 'talisman', unlockRealm: 8, name: '天命令', desc: '令中封有一线天命，渡劫前尤为珍贵。', effectText: '福缘 +5，突破 +7%，探索 +4%', bonus: { fortune: 5, breakthrough: 7, explore: 0.04 } }
  ]

  const generatedEquipmentCatalog = [
    { id: 'r0_weapon_1', type: 'weapon', unlockRealm: 0, name: '炼气寒铁剑', desc: '攻伐稳健的标准灵兵，适合炼气境界使用。', effectText: '攻击 +18', bonus: { attack: 18, manual: 0.03 } },
    { id: 'r0_weapon_2', type: 'weapon', unlockRealm: 0, name: '炼气破岳枪', desc: '势大力沉，适合正面压制，适合炼气境界使用。', effectText: '攻击 +21，根骨 +1', bonus: { attack: 21, bone: 1 } },
    { id: 'r0_weapon_3', type: 'weapon', unlockRealm: 0, name: '炼气流光刃', desc: '出手迅疾，适合抢占先机，适合炼气境界使用。', effectText: '攻击 +24，悟性 +1', bonus: { attack: 24, comprehension: 1 } },
    { id: 'r0_armor_1', type: 'armor', unlockRealm: 0, name: '炼气玄纹甲', desc: '护住经脉与气海，适合炼气境界使用。', effectText: '生命 +83，防御 +14', bonus: { hp: 83, defense: 14, bone: 1 } },
    { id: 'r0_armor_2', type: 'armor', unlockRealm: 0, name: '炼气云纹袍', desc: '轻灵护体，久战不疲，适合炼气境界使用。', effectText: '生命 +96，防御 +16', bonus: { hp: 96, defense: 16, auto: 0.025 } },
    { id: 'r0_armor_3', type: 'armor', unlockRealm: 0, name: '炼气镇岳铠', desc: '厚重坚实，适合硬抗强敌，适合炼气境界使用。', effectText: '生命 +109，防御 +19，突破 +2% ', bonus: { hp: 109, defense: 19, breakthrough: 2 } },
    { id: 'r0_accessory_1', type: 'accessory', unlockRealm: 0, name: '炼气凝元佩', desc: '温养道基，增强修行底蕴，适合炼气境界使用。', effectText: '生命 +38', bonus: { hp: 38, bone: 1, auto: 0.025 } },
    { id: 'r0_accessory_2', type: 'accessory', unlockRealm: 0, name: '炼气明窍戒', desc: '清明灵台，提高悟性，适合炼气境界使用。', effectText: '生命 +44，攻击 +8', bonus: { hp: 44, comprehension: 1, attack: 8 } },
    { id: 'r0_accessory_3', type: 'accessory', unlockRealm: 0, name: '炼气天缘珠', desc: '牵引机缘，提高福缘，适合炼气境界使用。', effectText: '生命 +51', bonus: { hp: 51, fortune: 1, explore: 0.025 } },
    { id: 'r0_talisman_1', type: 'talisman', unlockRealm: 0, name: '炼气御灵符', desc: '辅助吐纳，提升修炼效率，适合炼气境界使用。', effectText: '防御 +7', bonus: { defense: 7, auto: 0.035 } },
    { id: 'r0_talisman_2', type: 'talisman', unlockRealm: 0, name: '炼气破障令', desc: '稳固心神，提高破境成功率，适合炼气境界使用。', effectText: '防御 +8', bonus: { defense: 8, breakthrough: 2, comprehension: 1 } },
    { id: 'r0_talisman_3', type: 'talisman', unlockRealm: 0, name: '炼气寻宝印', desc: '感应灵机，提升探索收益，适合炼气境界使用。', effectText: '防御 +9，攻击 +11', bonus: { defense: 9, explore: 0.035, attack: 11 } },
    { id: 'r1_weapon_1', type: 'weapon', unlockRealm: 1, name: '筑基寒铁剑', desc: '攻伐稳健的标准灵兵，适合筑基境界使用。', effectText: '攻击 +41', bonus: { attack: 41, manual: 0.033 } },
    { id: 'r1_weapon_2', type: 'weapon', unlockRealm: 1, name: '筑基破岳枪', desc: '势大力沉，适合正面压制，适合筑基境界使用。', effectText: '攻击 +47，根骨 +1', bonus: { attack: 47, bone: 1 } },
    { id: 'r1_weapon_3', type: 'weapon', unlockRealm: 1, name: '筑基流光刃', desc: '出手迅疾，适合抢占先机，适合筑基境界使用。', effectText: '攻击 +54，悟性 +1', bonus: { attack: 54, comprehension: 1 } },
    { id: 'r1_armor_1', type: 'armor', unlockRealm: 1, name: '筑基玄纹甲', desc: '护住经脉与气海，适合筑基境界使用。', effectText: '生命 +186，防御 +32', bonus: { hp: 186, defense: 32, bone: 1 } },
    { id: 'r1_armor_2', type: 'armor', unlockRealm: 1, name: '筑基云纹袍', desc: '轻灵护体，久战不疲，适合筑基境界使用。', effectText: '生命 +216，防御 +37', bonus: { hp: 216, defense: 37, auto: 0.027 } },
    { id: 'r1_armor_3', type: 'armor', unlockRealm: 1, name: '筑基镇岳铠', desc: '厚重坚实，适合硬抗强敌，适合筑基境界使用。', effectText: '生命 +245，防御 +42，突破 +2% ', bonus: { hp: 245, defense: 42, breakthrough: 2 } },
    { id: 'r1_accessory_1', type: 'accessory', unlockRealm: 1, name: '筑基凝元佩', desc: '温养道基，增强修行底蕴，适合筑基境界使用。', effectText: '生命 +86', bonus: { hp: 86, bone: 1, auto: 0.027 } },
    { id: 'r1_accessory_2', type: 'accessory', unlockRealm: 1, name: '筑基明窍戒', desc: '清明灵台，提高悟性，适合筑基境界使用。', effectText: '生命 +100，攻击 +18', bonus: { hp: 100, comprehension: 1, attack: 18 } },
    { id: 'r1_accessory_3', type: 'accessory', unlockRealm: 1, name: '筑基天缘珠', desc: '牵引机缘，提高福缘，适合筑基境界使用。', effectText: '生命 +114', bonus: { hp: 114, fortune: 1, explore: 0.027 } },
    { id: 'r1_talisman_1', type: 'talisman', unlockRealm: 1, name: '筑基御灵符', desc: '辅助吐纳，提升修炼效率，适合筑基境界使用。', effectText: '防御 +16', bonus: { defense: 16, auto: 0.037 } },
    { id: 'r1_talisman_2', type: 'talisman', unlockRealm: 1, name: '筑基破障令', desc: '稳固心神，提高破境成功率，适合筑基境界使用。', effectText: '防御 +18', bonus: { defense: 18, breakthrough: 2, comprehension: 1 } },
    { id: 'r1_talisman_3', type: 'talisman', unlockRealm: 1, name: '筑基寻宝印', desc: '感应灵机，提升探索收益，适合筑基境界使用。', effectText: '防御 +21，攻击 +24', bonus: { defense: 21, explore: 0.037, attack: 24 } },
    { id: 'r2_weapon_1', type: 'weapon', unlockRealm: 2, name: '金丹寒铁剑', desc: '攻伐稳健的标准灵兵，适合金丹境界使用。', effectText: '攻击 +91', bonus: { attack: 91, manual: 0.036 } },
    { id: 'r2_weapon_2', type: 'weapon', unlockRealm: 2, name: '金丹破岳枪', desc: '势大力沉，适合正面压制，适合金丹境界使用。', effectText: '攻击 +105，根骨 +1', bonus: { attack: 105, bone: 1 } },
    { id: 'r2_weapon_3', type: 'weapon', unlockRealm: 2, name: '金丹流光刃', desc: '出手迅疾，适合抢占先机，适合金丹境界使用。', effectText: '攻击 +120，悟性 +1', bonus: { attack: 120, comprehension: 1 } },
    { id: 'r2_armor_1', type: 'armor', unlockRealm: 2, name: '金丹玄纹甲', desc: '护住经脉与气海，适合金丹境界使用。', effectText: '生命 +414，防御 +71', bonus: { hp: 414, defense: 71, bone: 1 } },
    { id: 'r2_armor_2', type: 'armor', unlockRealm: 2, name: '金丹云纹袍', desc: '轻灵护体，久战不疲，适合金丹境界使用。', effectText: '生命 +480，防御 +82', bonus: { hp: 480, defense: 82, auto: 0.029 } },
    { id: 'r2_armor_3', type: 'armor', unlockRealm: 2, name: '金丹镇岳铠', desc: '厚重坚实，适合硬抗强敌，适合金丹境界使用。', effectText: '生命 +545，防御 +93，突破 +3% ', bonus: { hp: 545, defense: 93, breakthrough: 3 } },
    { id: 'r2_accessory_1', type: 'accessory', unlockRealm: 2, name: '金丹凝元佩', desc: '温养道基，增强修行底蕴，适合金丹境界使用。', effectText: '生命 +192', bonus: { hp: 192, bone: 1, auto: 0.029 } },
    { id: 'r2_accessory_2', type: 'accessory', unlockRealm: 2, name: '金丹明窍戒', desc: '清明灵台，提高悟性，适合金丹境界使用。', effectText: '生命 +222，攻击 +41', bonus: { hp: 222, comprehension: 1, attack: 41 } },
    { id: 'r2_accessory_3', type: 'accessory', unlockRealm: 2, name: '金丹天缘珠', desc: '牵引机缘，提高福缘，适合金丹境界使用。', effectText: '生命 +253', bonus: { hp: 253, fortune: 1, explore: 0.029 } },
    { id: 'r2_talisman_1', type: 'talisman', unlockRealm: 2, name: '金丹御灵符', desc: '辅助吐纳，提升修炼效率，适合金丹境界使用。', effectText: '防御 +35', bonus: { defense: 35, auto: 0.039 } },
    { id: 'r2_talisman_2', type: 'talisman', unlockRealm: 2, name: '金丹破障令', desc: '稳固心神，提高破境成功率，适合金丹境界使用。', effectText: '防御 +41', bonus: { defense: 41, breakthrough: 3, comprehension: 1 } },
    { id: 'r2_talisman_3', type: 'talisman', unlockRealm: 2, name: '金丹寻宝印', desc: '感应灵机，提升探索收益，适合金丹境界使用。', effectText: '防御 +47，攻击 +53', bonus: { defense: 47, explore: 0.039, attack: 53 } },
    { id: 'r3_weapon_1', type: 'weapon', unlockRealm: 3, name: '元婴寒铁剑', desc: '攻伐稳健的标准灵兵，适合元婴境界使用。', effectText: '攻击 +209', bonus: { attack: 209, manual: 0.039 } },
    { id: 'r3_weapon_2', type: 'weapon', unlockRealm: 3, name: '元婴破岳枪', desc: '势大力沉，适合正面压制，适合元婴境界使用。', effectText: '攻击 +242，根骨 +2', bonus: { attack: 242, bone: 2 } },
    { id: 'r3_weapon_3', type: 'weapon', unlockRealm: 3, name: '元婴流光刃', desc: '出手迅疾，适合抢占先机，适合元婴境界使用。', effectText: '攻击 +275，悟性 +1', bonus: { attack: 275, comprehension: 1 } },
    { id: 'r3_armor_1', type: 'armor', unlockRealm: 3, name: '元婴玄纹甲', desc: '护住经脉与气海，适合元婴境界使用。', effectText: '生命 +952，防御 +163', bonus: { hp: 952, defense: 163, bone: 2 } },
    { id: 'r3_armor_2', type: 'armor', unlockRealm: 3, name: '元婴云纹袍', desc: '轻灵护体，久战不疲，适合元婴境界使用。', effectText: '生命 +1103，防御 +188', bonus: { hp: 1103, defense: 188, auto: 0.031 } },
    { id: 'r3_armor_3', type: 'armor', unlockRealm: 3, name: '元婴镇岳铠', desc: '厚重坚实，适合硬抗强敌，适合元婴境界使用。', effectText: '生命 +1254，防御 +214，突破 +3% ', bonus: { hp: 1254, defense: 214, breakthrough: 3 } },
    { id: 'r3_accessory_1', type: 'accessory', unlockRealm: 3, name: '元婴凝元佩', desc: '温养道基，增强修行底蕴，适合元婴境界使用。', effectText: '生命 +441', bonus: { hp: 441, bone: 2, auto: 0.031 } },
    { id: 'r3_accessory_2', type: 'accessory', unlockRealm: 3, name: '元婴明窍戒', desc: '清明灵台，提高悟性，适合元婴境界使用。', effectText: '生命 +511，攻击 +94', bonus: { hp: 511, comprehension: 2, attack: 94 } },
    { id: 'r3_accessory_3', type: 'accessory', unlockRealm: 3, name: '元婴天缘珠', desc: '牵引机缘，提高福缘，适合元婴境界使用。', effectText: '生命 +581', bonus: { hp: 581, fortune: 2, explore: 0.031 } },
    { id: 'r3_talisman_1', type: 'talisman', unlockRealm: 3, name: '元婴御灵符', desc: '辅助吐纳，提升修炼效率，适合元婴境界使用。', effectText: '防御 +81', bonus: { defense: 81, auto: 0.041 } },
    { id: 'r3_talisman_2', type: 'talisman', unlockRealm: 3, name: '元婴破障令', desc: '稳固心神，提高破境成功率，适合元婴境界使用。', effectText: '防御 +94', bonus: { defense: 94, breakthrough: 3, comprehension: 1 } },
    { id: 'r3_talisman_3', type: 'talisman', unlockRealm: 3, name: '元婴寻宝印', desc: '感应灵机，提升探索收益，适合元婴境界使用。', effectText: '防御 +107，攻击 +122', bonus: { defense: 107, explore: 0.041, attack: 122 } },
    { id: 'r4_weapon_1', type: 'weapon', unlockRealm: 4, name: '化神寒铁剑', desc: '攻伐稳健的标准灵兵，适合化神境界使用。', effectText: '攻击 +473', bonus: { attack: 473, manual: 0.042 } },
    { id: 'r4_weapon_2', type: 'weapon', unlockRealm: 4, name: '化神破岳枪', desc: '势大力沉，适合正面压制，适合化神境界使用。', effectText: '攻击 +548，根骨 +2', bonus: { attack: 548, bone: 2 } },
    { id: 'r4_weapon_3', type: 'weapon', unlockRealm: 4, name: '化神流光刃', desc: '出手迅疾，适合抢占先机，适合化神境界使用。', effectText: '攻击 +622，悟性 +2', bonus: { attack: 622, comprehension: 2 } },
    { id: 'r4_armor_1', type: 'armor', unlockRealm: 4, name: '化神玄纹甲', desc: '护住经脉与气海，适合化神境界使用。', effectText: '生命 +2153，防御 +368', bonus: { hp: 2153, defense: 368, bone: 2 } },
    { id: 'r4_armor_2', type: 'armor', unlockRealm: 4, name: '化神云纹袍', desc: '轻灵护体，久战不疲，适合化神境界使用。', effectText: '生命 +2494，防御 +426', bonus: { hp: 2494, defense: 426, auto: 0.033 } },
    { id: 'r4_armor_3', type: 'armor', unlockRealm: 4, name: '化神镇岳铠', desc: '厚重坚实，适合硬抗强敌，适合化神境界使用。', effectText: '生命 +2836，防御 +484，突破 +4% ', bonus: { hp: 2836, defense: 484, breakthrough: 4 } },
    { id: 'r4_accessory_1', type: 'accessory', unlockRealm: 4, name: '化神凝元佩', desc: '温养道基，增强修行底蕴，适合化神境界使用。', effectText: '生命 +998', bonus: { hp: 998, bone: 2, auto: 0.033 } },
    { id: 'r4_accessory_2', type: 'accessory', unlockRealm: 4, name: '化神明窍戒', desc: '清明灵台，提高悟性，适合化神境界使用。', effectText: '生命 +1156，攻击 +213', bonus: { hp: 1156, comprehension: 2, attack: 213 } },
    { id: 'r4_accessory_3', type: 'accessory', unlockRealm: 4, name: '化神天缘珠', desc: '牵引机缘，提高福缘，适合化神境界使用。', effectText: '生命 +1314', bonus: { hp: 1314, fortune: 2, explore: 0.033 } },
    { id: 'r4_talisman_1', type: 'talisman', unlockRealm: 4, name: '化神御灵符', desc: '辅助吐纳，提升修炼效率，适合化神境界使用。', effectText: '防御 +184', bonus: { defense: 184, auto: 0.043 } },
    { id: 'r4_talisman_2', type: 'talisman', unlockRealm: 4, name: '化神破障令', desc: '稳固心神，提高破境成功率，适合化神境界使用。', effectText: '防御 +213', bonus: { defense: 213, breakthrough: 4, comprehension: 2 } },
    { id: 'r4_talisman_3', type: 'talisman', unlockRealm: 4, name: '化神寻宝印', desc: '感应灵机，提升探索收益，适合化神境界使用。', effectText: '防御 +242，攻击 +277', bonus: { defense: 242, explore: 0.043, attack: 277 } },
    { id: 'r5_weapon_1', type: 'weapon', unlockRealm: 5, name: '炼虚寒铁剑', desc: '攻伐稳健的标准灵兵，适合炼虚境界使用。', effectText: '攻击 +1091', bonus: { attack: 1091, manual: 0.045 } },
    { id: 'r5_weapon_2', type: 'weapon', unlockRealm: 5, name: '炼虚破岳枪', desc: '势大力沉，适合正面压制，适合炼虚境界使用。', effectText: '攻击 +1264，根骨 +2', bonus: { attack: 1264, bone: 2 } },
    { id: 'r5_weapon_3', type: 'weapon', unlockRealm: 5, name: '炼虚流光刃', desc: '出手迅疾，适合抢占先机，适合炼虚境界使用。', effectText: '攻击 +1436，悟性 +2', bonus: { attack: 1436, comprehension: 2 } },
    { id: 'r5_armor_1', type: 'armor', unlockRealm: 5, name: '炼虚玄纹甲', desc: '护住经脉与气海，适合炼虚境界使用。', effectText: '生命 +4969，防御 +848', bonus: { hp: 4969, defense: 848, bone: 2 } },
    { id: 'r5_armor_2', type: 'armor', unlockRealm: 5, name: '炼虚云纹袍', desc: '轻灵护体，久战不疲，适合炼虚境界使用。', effectText: '生命 +5756，防御 +983', bonus: { hp: 5756, defense: 983, auto: 0.035 } },
    { id: 'r5_armor_3', type: 'armor', unlockRealm: 5, name: '炼虚镇岳铠', desc: '厚重坚实，适合硬抗强敌，适合炼虚境界使用。', effectText: '生命 +6544，防御 +1117，突破 +4% ', bonus: { hp: 6544, defense: 1117, breakthrough: 4 } },
    { id: 'r5_accessory_1', type: 'accessory', unlockRealm: 5, name: '炼虚凝元佩', desc: '温养道基，增强修行底蕴，适合炼虚境界使用。', effectText: '生命 +2303', bonus: { hp: 2303, bone: 2, auto: 0.035 } },
    { id: 'r5_accessory_2', type: 'accessory', unlockRealm: 5, name: '炼虚明窍戒', desc: '清明灵台，提高悟性，适合炼虚境界使用。', effectText: '生命 +2668，攻击 +491', bonus: { hp: 2668, comprehension: 2, attack: 491 } },
    { id: 'r5_accessory_3', type: 'accessory', unlockRealm: 5, name: '炼虚天缘珠', desc: '牵引机缘，提高福缘，适合炼虚境界使用。', effectText: '生命 +3032', bonus: { hp: 3032, fortune: 2, explore: 0.035 } },
    { id: 'r5_talisman_1', type: 'talisman', unlockRealm: 5, name: '炼虚御灵符', desc: '辅助吐纳，提升修炼效率，适合炼虚境界使用。', effectText: '防御 +424', bonus: { defense: 424, auto: 0.045 } },
    { id: 'r5_talisman_2', type: 'talisman', unlockRealm: 5, name: '炼虚破障令', desc: '稳固心神，提高破境成功率，适合炼虚境界使用。', effectText: '防御 +491', bonus: { defense: 491, breakthrough: 4, comprehension: 2 } },
    { id: 'r5_talisman_3', type: 'talisman', unlockRealm: 5, name: '炼虚寻宝印', desc: '感应灵机，提升探索收益，适合炼虚境界使用。', effectText: '防御 +559，攻击 +638', bonus: { defense: 559, explore: 0.045, attack: 638 } },
    { id: 'r6_weapon_1', type: 'weapon', unlockRealm: 6, name: '合体寒铁剑', desc: '攻伐稳健的标准灵兵，适合合体境界使用。', effectText: '攻击 +2545', bonus: { attack: 2545, manual: 0.048 } },
    { id: 'r6_weapon_2', type: 'weapon', unlockRealm: 6, name: '合体破岳枪', desc: '势大力沉，适合正面压制，适合合体境界使用。', effectText: '攻击 +2948，根骨 +3', bonus: { attack: 2948, bone: 3 } },
    { id: 'r6_weapon_3', type: 'weapon', unlockRealm: 6, name: '合体流光刃', desc: '出手迅疾，适合抢占先机，适合合体境界使用。', effectText: '攻击 +3352，悟性 +2', bonus: { attack: 3352, comprehension: 2 } },
    { id: 'r6_armor_1', type: 'armor', unlockRealm: 6, name: '合体玄纹甲', desc: '护住经脉与气海，适合合体境界使用。', effectText: '生命 +11595，防御 +1980', bonus: { hp: 11595, defense: 1980, bone: 3 } },
    { id: 'r6_armor_2', type: 'armor', unlockRealm: 6, name: '合体云纹袍', desc: '轻灵护体，久战不疲，适合合体境界使用。', effectText: '生命 +13432，防御 +2293', bonus: { hp: 13432, defense: 2293, auto: 0.037 } },
    { id: 'r6_armor_3', type: 'armor', unlockRealm: 6, name: '合体镇岳铠', desc: '厚重坚实，适合硬抗强敌，适合合体境界使用。', effectText: '生命 +15268，防御 +2607，突破 +5% ', bonus: { hp: 15268, defense: 2607, breakthrough: 5 } },
    { id: 'r6_accessory_1', type: 'accessory', unlockRealm: 6, name: '合体凝元佩', desc: '温养道基，增强修行底蕴，适合合体境界使用。', effectText: '生命 +5373', bonus: { hp: 5373, bone: 3, auto: 0.037 } },
    { id: 'r6_accessory_2', type: 'accessory', unlockRealm: 6, name: '合体明窍戒', desc: '清明灵台，提高悟性，适合合体境界使用。', effectText: '生命 +6224，攻击 +1147', bonus: { hp: 6224, comprehension: 3, attack: 1147 } },
    { id: 'r6_accessory_3', type: 'accessory', unlockRealm: 6, name: '合体天缘珠', desc: '牵引机缘，提高福缘，适合合体境界使用。', effectText: '生命 +7076', bonus: { hp: 7076, fortune: 3, explore: 0.037 } },
    { id: 'r6_talisman_1', type: 'talisman', unlockRealm: 6, name: '合体御灵符', desc: '辅助吐纳，提升修炼效率，适合合体境界使用。', effectText: '防御 +990', bonus: { defense: 990, auto: 0.047 } },
    { id: 'r6_talisman_2', type: 'talisman', unlockRealm: 6, name: '合体破障令', desc: '稳固心神，提高破境成功率，适合合体境界使用。', effectText: '防御 +1147', bonus: { defense: 1147, breakthrough: 5, comprehension: 2 } },
    { id: 'r6_talisman_3', type: 'talisman', unlockRealm: 6, name: '合体寻宝印', desc: '感应灵机，提升探索收益，适合合体境界使用。', effectText: '防御 +1303，攻击 +1490', bonus: { defense: 1303, explore: 0.047, attack: 1490 } },
    { id: 'r7_weapon_1', type: 'weapon', unlockRealm: 7, name: '大乘寒铁剑', desc: '攻伐稳健的标准灵兵，适合大乘境界使用。', effectText: '攻击 +5908', bonus: { attack: 5908, manual: 0.051 } },
    { id: 'r7_weapon_2', type: 'weapon', unlockRealm: 7, name: '大乘破岳枪', desc: '势大力沉，适合正面压制，适合大乘境界使用。', effectText: '攻击 +6844，根骨 +3', bonus: { attack: 6844, bone: 3 } },
    { id: 'r7_weapon_3', type: 'weapon', unlockRealm: 7, name: '大乘流光刃', desc: '出手迅疾，适合抢占先机，适合大乘境界使用。', effectText: '攻击 +7780，悟性 +2', bonus: { attack: 7780, comprehension: 2 } },
    { id: 'r7_armor_1', type: 'armor', unlockRealm: 7, name: '大乘玄纹甲', desc: '护住经脉与气海，适合大乘境界使用。', effectText: '生命 +26916，防御 +4596', bonus: { hp: 26916, defense: 4596, bone: 3 } },
    { id: 'r7_armor_2', type: 'armor', unlockRealm: 7, name: '大乘云纹袍', desc: '轻灵护体，久战不疲，适合大乘境界使用。', effectText: '生命 +31180，防御 +5324', bonus: { hp: 31180, defense: 5324, auto: 0.039 } },
    { id: 'r7_armor_3', type: 'armor', unlockRealm: 7, name: '大乘镇岳铠', desc: '厚重坚实，适合硬抗强敌，适合大乘境界使用。', effectText: '生命 +35444，防御 +6052，突破 +5% ', bonus: { hp: 35444, defense: 6052, breakthrough: 5 } },
    { id: 'r7_accessory_1', type: 'accessory', unlockRealm: 7, name: '大乘凝元佩', desc: '温养道基，增强修行底蕴，适合大乘境界使用。', effectText: '生命 +12474', bonus: { hp: 12474, bone: 3, auto: 0.039 } },
    { id: 'r7_accessory_2', type: 'accessory', unlockRealm: 7, name: '大乘明窍戒', desc: '清明灵台，提高悟性，适合大乘境界使用。', effectText: '生命 +14450，攻击 +2662', bonus: { hp: 14450, comprehension: 3, attack: 2662 } },
    { id: 'r7_accessory_3', type: 'accessory', unlockRealm: 7, name: '大乘天缘珠', desc: '牵引机缘，提高福缘，适合大乘境界使用。', effectText: '生命 +16426', bonus: { hp: 16426, fortune: 3, explore: 0.039 } },
    { id: 'r7_talisman_1', type: 'talisman', unlockRealm: 7, name: '大乘御灵符', desc: '辅助吐纳，提升修炼效率，适合大乘境界使用。', effectText: '防御 +2298', bonus: { defense: 2298, auto: 0.049 } },
    { id: 'r7_talisman_2', type: 'talisman', unlockRealm: 7, name: '大乘破障令', desc: '稳固心神，提高破境成功率，适合大乘境界使用。', effectText: '防御 +2662', bonus: { defense: 2662, breakthrough: 5, comprehension: 2 } },
    { id: 'r7_talisman_3', type: 'talisman', unlockRealm: 7, name: '大乘寻宝印', desc: '感应灵机，提升探索收益，适合大乘境界使用。', effectText: '防御 +3026，攻击 +3458', bonus: { defense: 3026, explore: 0.049, attack: 3458 } },
    { id: 'r8_weapon_1', type: 'weapon', unlockRealm: 8, name: '渡劫寒铁剑', desc: '攻伐稳健的标准灵兵，适合渡劫境界使用。', effectText: '攻击 +13817', bonus: { attack: 13817, manual: 0.054 } },
    { id: 'r8_weapon_2', type: 'weapon', unlockRealm: 8, name: '渡劫破岳枪', desc: '势大力沉，适合正面压制，适合渡劫境界使用。', effectText: '攻击 +16006，根骨 +3', bonus: { attack: 16006, bone: 3 } },
    { id: 'r8_weapon_3', type: 'weapon', unlockRealm: 8, name: '渡劫流光刃', desc: '出手迅疾，适合抢占先机，适合渡劫境界使用。', effectText: '攻击 +18194，悟性 +3', bonus: { attack: 18194, comprehension: 3 } },
    { id: 'r8_armor_1', type: 'armor', unlockRealm: 8, name: '渡劫玄纹甲', desc: '护住经脉与气海，适合渡劫境界使用。', effectText: '生命 +62943，防御 +10746', bonus: { hp: 62943, defense: 10746, bone: 3 } },
    { id: 'r8_armor_2', type: 'armor', unlockRealm: 8, name: '渡劫云纹袍', desc: '轻灵护体，久战不疲，适合渡劫境界使用。', effectText: '生命 +72914，防御 +12449', bonus: { hp: 72914, defense: 12449, auto: 0.041 } },
    { id: 'r8_armor_3', type: 'armor', unlockRealm: 8, name: '渡劫镇岳铠', desc: '厚重坚实，适合硬抗强敌，适合渡劫境界使用。', effectText: '生命 +82886，防御 +14151，突破 +6% ', bonus: { hp: 82886, defense: 14151, breakthrough: 6 } },
    { id: 'r8_accessory_1', type: 'accessory', unlockRealm: 8, name: '渡劫凝元佩', desc: '温养道基，增强修行底蕴，适合渡劫境界使用。', effectText: '生命 +29169', bonus: { hp: 29169, bone: 3, auto: 0.041 } },
    { id: 'r8_accessory_2', type: 'accessory', unlockRealm: 8, name: '渡劫明窍戒', desc: '清明灵台，提高悟性，适合渡劫境界使用。', effectText: '生命 +33790，攻击 +6224', bonus: { hp: 33790, comprehension: 3, attack: 6224 } },
    { id: 'r8_accessory_3', type: 'accessory', unlockRealm: 8, name: '渡劫天缘珠', desc: '牵引机缘，提高福缘，适合渡劫境界使用。', effectText: '生命 +38410', bonus: { hp: 38410, fortune: 3, explore: 0.041 } },
    { id: 'r8_talisman_1', type: 'talisman', unlockRealm: 8, name: '渡劫御灵符', desc: '辅助吐纳，提升修炼效率，适合渡劫境界使用。', effectText: '防御 +5373', bonus: { defense: 5373, auto: 0.051 } },
    { id: 'r8_talisman_2', type: 'talisman', unlockRealm: 8, name: '渡劫破障令', desc: '稳固心神，提高破境成功率，适合渡劫境界使用。', effectText: '防御 +6224', bonus: { defense: 6224, breakthrough: 6, comprehension: 3 } },
    { id: 'r8_talisman_3', type: 'talisman', unlockRealm: 8, name: '渡劫寻宝印', desc: '感应灵机，提升探索收益，适合渡劫境界使用。', effectText: '防御 +7076，攻击 +8086', bonus: { defense: 7076, explore: 0.051, attack: 8086 } }
  ]


  const immortalEquipmentRealmNames = ['真仙', '玄仙', '金仙', '仙王', '仙帝']
  const immortalEquipmentCatalog = immortalEquipmentRealmNames.flatMap((label, index) => {
    const realmIndex = index + 9
    const rate = Math.pow(3.15, realmIndex)
    const attrLevel = Math.floor(realmIndex / 2) + 3
    return [
      { id: `i${realmIndex}_weapon_1`, type: 'weapon', unlockRealm: realmIndex, name: `${label}仙锋剑`, desc: `${label}境界常见仙兵，剑锋蕴含仙界法则。`, effectText: `攻击 +${Math.floor(138 * rate)}`, bonus: { attack: Math.floor(138 * rate), manual: 0.056 + index * 0.004 } },
      { id: `i${realmIndex}_weapon_2`, type: 'weapon', unlockRealm: realmIndex, name: `${label}破空戟`, desc: `${label}境界重兵，适合正面破阵。`, effectText: `攻击 +${Math.floor(158 * rate)}，根骨 +${attrLevel}`, bonus: { attack: Math.floor(158 * rate), bone: attrLevel } },
      { id: `i${realmIndex}_weapon_3`, type: 'weapon', unlockRealm: realmIndex, name: `${label}流霞仙刃`, desc: `${label}境界快刃，出手如仙霞横空。`, effectText: `攻击 +${Math.floor(178 * rate)}，悟性 +${attrLevel}`, bonus: { attack: Math.floor(178 * rate), comprehension: attrLevel } },
      { id: `i${realmIndex}_armor_1`, type: 'armor', unlockRealm: realmIndex, name: `${label}仙纹战甲`, desc: `${label}境界护具，可抵御仙界威压。`, effectText: `生命 +${Math.floor(650 * rate)}，防御 +${Math.floor(108 * rate)}`, bonus: { hp: Math.floor(650 * rate), defense: Math.floor(108 * rate), bone: attrLevel } },
      { id: `i${realmIndex}_armor_2`, type: 'armor', unlockRealm: realmIndex, name: `${label}云霄仙袍`, desc: `${label}境界法袍，久战时灵息更稳。`, effectText: `生命 +${Math.floor(760 * rate)}，防御 +${Math.floor(124 * rate)}`, bonus: { hp: Math.floor(760 * rate), defense: Math.floor(124 * rate), auto: 0.042 + index * 0.003 } },
      { id: `i${realmIndex}_armor_3`, type: 'armor', unlockRealm: realmIndex, name: `${label}镇界仙铠`, desc: `${label}境界重甲，适合挑战高压试炼。`, effectText: `生命 +${Math.floor(880 * rate)}，防御 +${Math.floor(142 * rate)}`, bonus: { hp: Math.floor(880 * rate), defense: Math.floor(142 * rate), breakthrough: 6 + index } },
      { id: `i${realmIndex}_accessory_1`, type: 'accessory', unlockRealm: realmIndex, name: `${label}凝仙玉`, desc: `${label}境界饰品，温养仙元根基。`, effectText: `生命 +${Math.floor(320 * rate)}`, bonus: { hp: Math.floor(320 * rate), bone: attrLevel, auto: 0.041 + index * 0.003 } },
      { id: `i${realmIndex}_accessory_2`, type: 'accessory', unlockRealm: realmIndex, name: `${label}明法戒`, desc: `${label}境界饰品，可明悟仙界法则。`, effectText: `生命 +${Math.floor(370 * rate)}，攻击 +${Math.floor(65 * rate)}`, bonus: { hp: Math.floor(370 * rate), attack: Math.floor(65 * rate), comprehension: attrLevel } },
      { id: `i${realmIndex}_accessory_3`, type: 'accessory', unlockRealm: realmIndex, name: `${label}天缘珠`, desc: `${label}境界饰品，牵引仙界机缘。`, effectText: `生命 +${Math.floor(420 * rate)}`, bonus: { hp: Math.floor(420 * rate), fortune: attrLevel, explore: 0.042 + index * 0.003 } },
      { id: `i${realmIndex}_talisman_1`, type: 'talisman', unlockRealm: realmIndex, name: `${label}御仙符`, desc: `${label}境界符佩，辅助吐纳仙息。`, effectText: `防御 +${Math.floor(55 * rate)}`, bonus: { defense: Math.floor(55 * rate), auto: 0.052 + index * 0.004 } },
      { id: `i${realmIndex}_talisman_2`, type: 'talisman', unlockRealm: realmIndex, name: `${label}破境令`, desc: `${label}境界符佩，可镇住破境气机。`, effectText: `防御 +${Math.floor(65 * rate)}`, bonus: { defense: Math.floor(65 * rate), breakthrough: 7 + index, comprehension: attrLevel } },
      { id: `i${realmIndex}_talisman_3`, type: 'talisman', unlockRealm: realmIndex, name: `${label}寻道印`, desc: `${label}境界符佩，感应仙界道韵。`, effectText: `防御 +${Math.floor(75 * rate)}，攻击 +${Math.floor(86 * rate)}`, bonus: { defense: Math.floor(75 * rate), attack: Math.floor(86 * rate), explore: 0.052 + index * 0.004 } }
    ]
  })

  const divineEquipmentRealmNames = ['真神', '天神', '神王', '神皇', '神尊']
  const divineEquipmentCatalog = divineEquipmentRealmNames.flatMap((label, index) => {
    const realmIndex = index + 14
    const rate = Math.pow(3.15, realmIndex)
    const attrLevel = Math.floor(realmIndex / 2) + 3
    return [
      { id: `g${realmIndex}_weapon_1`, type: 'weapon', unlockRealm: realmIndex, name: `${label}神锋剑`, desc: `${label}境界常见神兵，剑锋蕴含神界法则。`, effectText: `攻击 +${Math.floor(210 * rate)}`, bonus: { attack: Math.floor(210 * rate), manual: 0.058 + index * 0.004 } },
      { id: `g${realmIndex}_weapon_2`, type: 'weapon', unlockRealm: realmIndex, name: `${label}破界戟`, desc: `${label}境界重兵，适合正面破阵。`, effectText: `攻击 +${Math.floor(240 * rate)}，根骨 +${attrLevel}`, bonus: { attack: Math.floor(240 * rate), bone: attrLevel } },
      { id: `g${realmIndex}_weapon_3`, type: 'weapon', unlockRealm: realmIndex, name: `${label}流火神刃`, desc: `${label}境界快刃，出手如神火横空。`, effectText: `攻击 +${Math.floor(270 * rate)}，悟性 +${attrLevel}`, bonus: { attack: Math.floor(270 * rate), comprehension: attrLevel } },
      { id: `g${realmIndex}_armor_1`, type: 'armor', unlockRealm: realmIndex, name: `${label}神纹战甲`, desc: `${label}境界护具，可抵御神界威压。`, effectText: `生命 +${Math.floor(980 * rate)}，防御 +${Math.floor(165 * rate)}`, bonus: { hp: Math.floor(980 * rate), defense: Math.floor(165 * rate), bone: attrLevel } },
      { id: `g${realmIndex}_armor_2`, type: 'armor', unlockRealm: realmIndex, name: `${label}云霄神袍`, desc: `${label}境界法袍，久战时灵息更稳。`, effectText: `生命 +${Math.floor(1140 * rate)}，防御 +${Math.floor(190 * rate)}`, bonus: { hp: Math.floor(1140 * rate), defense: Math.floor(190 * rate), auto: 0.044 + index * 0.003 } },
      { id: `g${realmIndex}_armor_3`, type: 'armor', unlockRealm: realmIndex, name: `${label}镇界玄铠`, desc: `${label}境界重甲，适合挑战高压试炼。`, effectText: `生命 +${Math.floor(1320 * rate)}，防御 +${Math.floor(215 * rate)}`, bonus: { hp: Math.floor(1320 * rate), defense: Math.floor(215 * rate), breakthrough: 6 + index } },
      { id: `g${realmIndex}_accessory_1`, type: 'accessory', unlockRealm: realmIndex, name: `${label}凝神玉`, desc: `${label}境界饰品，温养神源根基。`, effectText: `生命 +${Math.floor(490 * rate)}`, bonus: { hp: Math.floor(490 * rate), bone: attrLevel, auto: 0.043 + index * 0.003 } },
      { id: `g${realmIndex}_accessory_2`, type: 'accessory', unlockRealm: realmIndex, name: `${label}明法戒`, desc: `${label}境界饰品，可明悟神界法则。`, effectText: `生命 +${Math.floor(560 * rate)}，攻击 +${Math.floor(100 * rate)}`, bonus: { hp: Math.floor(560 * rate), attack: Math.floor(100 * rate), comprehension: attrLevel } },
      { id: `g${realmIndex}_accessory_3`, type: 'accessory', unlockRealm: realmIndex, name: `${label}天缘珠`, desc: `${label}境界饰品，牵引神界机缘。`, effectText: `生命 +${Math.floor(640 * rate)}`, bonus: { hp: Math.floor(640 * rate), fortune: attrLevel, explore: 0.044 + index * 0.003 } },
      { id: `g${realmIndex}_talisman_1`, type: 'talisman', unlockRealm: realmIndex, name: `${label}御神符`, desc: `${label}境界符佩，辅助吐纳神息。`, effectText: `防御 +${Math.floor(85 * rate)}`, bonus: { defense: Math.floor(85 * rate), auto: 0.055 + index * 0.004 } },
      { id: `g${realmIndex}_talisman_2`, type: 'talisman', unlockRealm: realmIndex, name: `${label}破境令`, desc: `${label}境界符佩，可镇住破境气机。`, effectText: `防御 +${Math.floor(100 * rate)}`, bonus: { defense: Math.floor(100 * rate), breakthrough: 7 + index, comprehension: attrLevel } },
      { id: `g${realmIndex}_talisman_3`, type: 'talisman', unlockRealm: realmIndex, name: `${label}寻道印`, desc: `${label}境界符佩，感应神界道韵。`, effectText: `防御 +${Math.floor(115 * rate)}，攻击 +${Math.floor(132 * rate)}`, bonus: { defense: Math.floor(115 * rate), attack: Math.floor(132 * rate), explore: 0.055 + index * 0.004 } }
    ]
  })

  const equipmentCatalog = [
    ...baseEquipmentCatalog,
    ...generatedEquipmentCatalog.filter(item => !baseEquipmentCatalog.some(base => base.id === item.id)),
    ...immortalEquipmentCatalog,
    ...divineEquipmentCatalog
  ]

  const artifactCatalog = [
    { id: 'taichuSword', type: 'weapon', name: '太初神剑', desc: '传说诞生于太初混沌的神兵，会随主人境界成长。装备后占用武器位，不能与普通武器同时生效。', dropRate: 0.0030, base: { attack: 42, hp: 80, defense: 12 }, growth: { attack: 1.62, hp: 1.42, defense: 1.38 }, bonus: { manual: 0.04, breakthrough: 2 } },
    { id: 'xuantianBell', type: 'armor', name: '玄天镇魂钟', desc: '钟声可镇压妖邪神魂，护住肉身与元神，会随主人境界成长。装备后占用护具位，不能与普通护具同时生效。', dropRate: 0.0022, base: { attack: 20, hp: 170, defense: 28 }, growth: { attack: 1.35, hp: 1.62, defense: 1.58 }, bonus: { auto: 0.04, alchemy: 0.02 } },
    { id: 'wanfaMirror', type: 'accessory', name: '万法归元镜', desc: '镜中似有万法流转，可映照修士道基，会随主人境界成长。装备后占用饰品位，不能与普通饰品同时生效。', dropRate: 0.0016, base: { attack: 30, hp: 115, defense: 18 }, growth: { attack: 1.50, hp: 1.48, defense: 1.42 }, bonus: { explore: 0.03, breakthrough: 3, comprehension: 1 } },
    { id: 'kunlunRune', type: 'talisman', name: '昆仑镇界符', desc: '符中封有昆仑界纹，可镇压气海波澜，会随主人境界成长。装备后占用符佩位，不能与普通符佩同时生效。', dropRate: 0.0018, base: { attack: 24, hp: 125, defense: 22 }, growth: { attack: 1.42, hp: 1.52, defense: 1.50 }, bonus: { auto: 0.03, explore: 0.03, fortune: 1 } },
    { id: 'starSlayerBlade', type: 'weapon', name: '斩星古刃', desc: '刃锋可斩星辉，偏重极致杀伐，会随主人境界成长。装备后占用武器位。', dropRate: 0.0012, base: { attack: 58, hp: 60, defense: 8 }, growth: { attack: 1.70, hp: 1.30, defense: 1.25 }, bonus: { manual: 0.06 } },
    { id: 'nineDragonArmor', type: 'armor', name: '九龙玄甲', desc: '九龙纹路盘踞甲身，适合镇妖塔久战，会随主人境界成长。装备后占用护具位。', dropRate: 0.0011, base: { attack: 16, hp: 230, defense: 38 }, growth: { attack: 1.25, hp: 1.72, defense: 1.66 }, bonus: { breakthrough: 2 } },
    { id: 'heavenFateJade', type: 'accessory', name: '天命道玉', desc: '道玉能牵引一线天命，偏重福缘与破境，会随主人境界成长。装备后占用饰品位。', dropRate: 0.0010, base: { attack: 22, hp: 130, defense: 18 }, growth: { attack: 1.38, hp: 1.48, defense: 1.38 }, bonus: { fortune: 2, breakthrough: 4, explore: 0.02 } },
    { id: 'chaosTalisman', type: 'talisman', name: '混沌万象符', desc: '符纹如混沌未开，可小幅增益诸法，会随主人境界成长。装备后占用符佩位。', dropRate: 0.0008, base: { attack: 28, hp: 150, defense: 24 }, growth: { attack: 1.46, hp: 1.55, defense: 1.50 }, bonus: { auto: 0.03, manual: 0.03, alchemy: 0.02, explore: 0.02 } }
  ]


  const baseShopGoods = [
    { id: 'shop_sword', category: '装备', name: '修仙剑', desc: '基础武器，适合前期过渡，提升攻击与手动修炼收益。', cost: 120, unlockRealm: 0, type: 'equipment', target: 'sword', count: 1 },
    { id: 'shop_cloudRobe', category: '装备', name: '踏云法袍', desc: '基础护具，提升生命、防御与根骨。', cost: 130, unlockRealm: 0, type: 'equipment', target: 'cloudRobe', count: 1 },
    { id: 'shop_jadePendant', category: '装备', name: '灵玉佩', desc: '基础饰品，温养经脉，提高自动修炼效率。', cost: 160, unlockRealm: 0, type: 'equipment', target: 'jadePendant', count: 1 },
    { id: 'shop_gatherCharm', category: '装备', name: '聚灵符佩', desc: '挂机修炼向符佩，适合长期积累。', cost: 220, unlockRealm: 0, type: 'equipment', target: 'spiritGatheringCharm', count: 1 },
    { id: 'shop_thunderBlade', category: '装备', name: '奔雷刃', desc: '筑基武器，爆发更强，适合宗门试炼。', cost: 420, unlockRealm: 1, type: 'equipment', target: 'thunderBlade', count: 1 },
    { id: 'shop_blackIronArmor', category: '装备', name: '玄铁甲', desc: '筑基护具，显著提升防御与生命。', cost: 460, unlockRealm: 1, type: 'equipment', target: 'blackIronArmor', count: 1 },
    { id: 'shop_furnaceToken', category: '装备', name: '控火令', desc: '炼丹辅助符佩，可提高炼丹成功率。', cost: 520, unlockRealm: 1, type: 'equipment', target: 'furnaceToken', count: 1 },
    { id: 'shop_starSword', category: '装备', name: '星陨剑', desc: '金丹武器，提升战斗与突破稳定性。', cost: 980, unlockRealm: 2, type: 'equipment', target: 'starSword', count: 1 },
    { id: 'shop_goldScaleArmor', category: '装备', name: '金鳞战甲', desc: '金丹护具，提升生命和防御。', cost: 1060, unlockRealm: 2, type: 'equipment', target: 'goldScaleArmor', count: 1 },
    { id: 'shop_daoMirror', category: '装备', name: '明心镜', desc: '金丹符佩，适合冲击瓶颈前准备。', cost: 1180, unlockRealm: 2, type: 'equipment', target: 'daoHeartMirror', count: 1 },
    { id: 'shop_nascentSoulFan', category: '装备', name: '元婴灵扇', desc: '元婴武器，兼具攻击与悟性。', cost: 2600, unlockRealm: 3, type: 'equipment', target: 'nascentSoulFan', count: 1 },
    { id: 'shop_soulGuardRobe', category: '装备', name: '护婴法袍', desc: '元婴护具，保护元婴本源。', cost: 2850, unlockRealm: 3, type: 'equipment', target: 'soulGuardRobe', count: 1 },
    { id: 'shop_chaosPearl', category: '装备', name: '混沌珠', desc: '元婴饰品，全面提升综合属性。', cost: 3400, unlockRealm: 3, type: 'equipment', target: 'chaosPearl', count: 1 },
    { id: 'shop_spiritFlameSword', category: '装备', name: '化神焰剑', desc: '化神武器，专破护体灵光。', cost: 7600, unlockRealm: 4, type: 'equipment', target: 'spiritFlameSword', count: 1 },
    { id: 'shop_divineMindCrown', category: '装备', name: '神念冠', desc: '化神饰品，提高悟性与自动修炼。', cost: 8200, unlockRealm: 4, type: 'equipment', target: 'divineMindCrown', count: 1 },
    { id: 'shop_voidPatternRobe', category: '装备', name: '神纹玄袍', desc: '化神护具，抵御灵压。', cost: 8800, unlockRealm: 4, type: 'equipment', target: 'voidPatternRobe', count: 1 },
    { id: 'shop_voidCuttingBlade', category: '装备', name: '炼虚断空刃', desc: '炼虚武器，兼具攻击和探索收益。', cost: 21000, unlockRealm: 5, type: 'equipment', target: 'voidCuttingBlade', count: 1 },
    { id: 'shop_emptyCloudArmor', category: '装备', name: '虚云灵甲', desc: '炼虚护具，防御厚重。', cost: 23500, unlockRealm: 5, type: 'equipment', target: 'emptyCloudArmor', count: 1 },
    { id: 'shop_voidSeal', category: '装备', name: '炼虚道印', desc: '炼虚符佩，辅助破境。', cost: 26000, unlockRealm: 5, type: 'equipment', target: 'voidSeal', count: 1 },
    { id: 'shop_unitySpear', category: '装备', name: '合体归元枪', desc: '合体武器，攻击与根骨兼备。', cost: 62000, unlockRealm: 6, type: 'equipment', target: 'unitySpear', count: 1 },
    { id: 'shop_heavenUnionRobe', category: '装备', name: '天合道袍', desc: '合体护具，适合久战。', cost: 68000, unlockRealm: 6, type: 'equipment', target: 'heavenUnionRobe', count: 1 },
    { id: 'shop_unityJade', category: '装备', name: '归元玉', desc: '合体饰品，全面稳定属性。', cost: 72000, unlockRealm: 6, type: 'equipment', target: 'unityJade', count: 1 },
    { id: 'shop_mahayanaSword', category: '装备', name: '大乘天剑', desc: '大乘武器，剑出如天意。', cost: 180000, unlockRealm: 7, type: 'equipment', target: 'mahayanaSword', count: 1 },
    { id: 'shop_starSeaArmor', category: '装备', name: '星海仙甲', desc: '大乘护具，可承受大道冲击。', cost: 195000, unlockRealm: 7, type: 'equipment', target: 'starSeaArmor', count: 1 },
    { id: 'shop_daoFruitPendant', category: '装备', name: '道果佩', desc: '大乘饰品，增益长期修行。', cost: 210000, unlockRealm: 7, type: 'equipment', target: 'daoFruitPendant', count: 1 },
    { id: 'shop_tribulationThunderSword', category: '装备', name: '渡劫雷剑', desc: '渡劫武器，蕴含劫雷余韵。', cost: 520000, unlockRealm: 8, type: 'equipment', target: 'tribulationThunderSword', count: 1 },
    { id: 'shop_thunderTribulationArmor', category: '装备', name: '劫雷仙甲', desc: '渡劫护具，可御天劫余威。', cost: 560000, unlockRealm: 8, type: 'equipment', target: 'thunderTribulationArmor', count: 1 },
    { id: 'shop_heavenFateToken', category: '装备', name: '天命令', desc: '渡劫符佩，增加福缘和突破稳定性。', cost: 620000, unlockRealm: 8, type: 'equipment', target: 'heavenFateToken', count: 1 },
    { id: 'shop_herbs', category: '炼丹材料', name: '药材包', desc: '常用炼丹材料，购买后获得药材 10 份。', cost: 70, unlockRealm: 0, type: 'material', target: 'herbs', count: 10 },
    { id: 'shop_fruits', category: '炼丹材料', name: '灵果匣', desc: '修为丹常用辅材，购买后获得灵果 6 枚。', cost: 90, unlockRealm: 0, type: 'material', target: 'fruits', count: 6 },
    { id: 'shop_ores', category: '炼丹材料', name: '矿石袋', desc: '炼丹炉升级与高阶丹方常用材料，获得矿石 8 份。', cost: 85, unlockRealm: 0, type: 'material', target: 'ores', count: 8 },
    { id: 'shop_cores', category: '炼丹材料', name: '妖兽内丹', desc: '高阶修为丹与突破丹材料，获得内丹 2 枚。', cost: 180, unlockRealm: 1, type: 'material', target: 'cores', count: 2 },
    { id: 'shop_scrolls', category: '炼丹材料', name: '残卷小札', desc: '高阶丹方与悟性丹材料，获得残卷 2 页。', cost: 220, unlockRealm: 2, type: 'material', target: 'scrolls', count: 2 },
    { id: 'shop_furnaceStone', category: '炼丹道具', name: '炉石', desc: '用于升级炼丹炉。', cost: 140, unlockRealm: 0, type: 'material', target: 'furnaceStones', count: 1 },
    { id: 'shop_accelerator', category: '炼丹道具', name: '加速符', desc: '炼丹辅助道具，使用后获得额外炉石补给。', cost: 160, unlockRealm: 0, type: 'item', target: 'acceleratorCharm', count: 1 },
    { id: 'shop_recipeFragment', category: '炼丹道具', name: '丹方残卷', desc: '可用于宝物页解锁高阶丹方。', cost: 360, unlockRealm: 2, type: 'special', target: 'recipeFragment', count: 1 },
    { id: 'shop_techniqueNote', category: '炼丹道具', name: '功法心得', desc: '记载前人斗法体悟，购买后获得功法点 3 点。', cost: 280, unlockRealm: 0, type: 'techniquePoints', target: 'techniquePoints', count: 3 },
    { id: 'shop_techniqueClassic', category: '炼丹道具', name: '高阶功法札记', desc: '高阶修士留下的修炼札记，购买后获得功法点 13 点。', cost: 1200, unlockRealm: 3, type: 'techniquePoints', target: 'techniquePoints', count: 13 },
    { id: 'shop_qiCondense', category: '成品丹药', name: '聚气丹', desc: '炼气期修为丹，直接增加固定修为。', cost: 80, unlockRealm: 0, type: 'cultivationPill', target: 'qiCondense', count: 1 },
    { id: 'shop_spiritRecover', category: '成品丹药', name: '培元丹', desc: '筑基期修为丹，筑基后可吸收。', cost: 180, unlockRealm: 1, type: 'cultivationPill', target: 'spiritRecover', count: 1 },
    { id: 'shop_goldCore', category: '成品丹药', name: '金元丹', desc: '金丹期修为丹，金丹后可吸收。', cost: 520, unlockRealm: 2, type: 'cultivationPill', target: 'goldCorePill', count: 1 },
    { id: 'shop_nascentSoul', category: '成品丹药', name: '元婴丹', desc: '元婴期修为丹，元婴后可吸收。', cost: 1600, unlockRealm: 3, type: 'cultivationPill', target: 'nascentSoulPill', count: 1 },
    { id: 'shop_breakthrough', category: '成品丹药', name: '破障丹', desc: '突破时自动消耗 1 枚，提高成功率，不再作为突破条件。', cost: 420, unlockRealm: 1, type: 'breakthroughPill', target: 'breakthroughPills', count: 1 },
    { id: 'shop_bonePill', category: '成品丹药', name: '洗髓丹', desc: '属性丹，服用后根骨 +1。', cost: 760, unlockRealm: 2, type: 'attributePill', target: 'bone', count: 1 },
    { id: 'shop_comprehensionPill', category: '成品丹药', name: '悟心丹', desc: '属性丹，服用后悟性 +1。', cost: 820, unlockRealm: 3, type: 'attributePill', target: 'comprehension', count: 1 },
    { id: 'shop_fortunePill', category: '成品丹药', name: '天缘丹', desc: '属性丹，服用后福缘 +1。', cost: 880, unlockRealm: 3, type: 'attributePill', target: 'fortune', count: 1 },
    { id: 'shop_trueImmortalPill', category: '成品丹药', name: '真仙丹', desc: '真仙期修为丹，真仙后可吸收。', cost: 4800000, unlockRealm: 9, type: 'cultivationPill', target: 'trueImmortalPill', count: 1 },
    { id: 'shop_mysticImmortalPill', category: '成品丹药', name: '玄仙丹', desc: '玄仙期修为丹，玄仙后可吸收。', cost: 16000000, unlockRealm: 10, type: 'cultivationPill', target: 'mysticImmortalPill', count: 1 },
    { id: 'shop_goldImmortalPill', category: '成品丹药', name: '金仙丹', desc: '金仙期修为丹，金仙后可吸收。', cost: 58000000, unlockRealm: 11, type: 'cultivationPill', target: 'goldImmortalPill', count: 1 },
    { id: 'shop_immortalKingPill', category: '成品丹药', name: '仙王丹', desc: '仙王期修为丹，仙王后可吸收。', cost: 210000000, unlockRealm: 12, type: 'cultivationPill', target: 'immortalKingPill', count: 1 },
    { id: 'shop_immortalEmperorPill', category: '成品丹药', name: '仙帝丹', desc: '仙帝期修为丹，仙帝后可吸收。', cost: 780000000, unlockRealm: 13, type: 'cultivationPill', target: 'immortalEmperorPill', count: 1 },
    { id: 'shop_trueGodPill', category: '成品丹药', name: '真神丹', desc: '真神期修为丹，真神后可吸收。', cost: 4800000, unlockRealm: 14, type: 'cultivationPill', target: 'trueGodPill', count: 1 },
    { id: 'shop_heavenGodPill', category: '成品丹药', name: '天神丹', desc: '天神期修为丹，天神后可吸收。', cost: 16000000, unlockRealm: 15, type: 'cultivationPill', target: 'heavenGodPill', count: 1 },
    { id: 'shop_godKingPill', category: '成品丹药', name: '神王丹', desc: '神王期修为丹，神王后可吸收。', cost: 58000000, unlockRealm: 16, type: 'cultivationPill', target: 'godKingPill', count: 1 },
    { id: 'shop_godEmperorPill', category: '成品丹药', name: '神皇丹', desc: '神皇期修为丹，神皇后可吸收。', cost: 210000000, unlockRealm: 17, type: 'cultivationPill', target: 'godEmperorPill', count: 1 },
    { id: 'shop_godSovereignPill', category: '成品丹药', name: '神尊丹', desc: '神尊期修为丹，神尊后可吸收。', cost: 780000000, unlockRealm: 18, type: 'cultivationPill', target: 'godSovereignPill', count: 1 }
  ]

  const shopRealmCostRates = [1, 2.15, 4.8, 11.5, 27.5, 66, 158, 380, 900, 2250, 5600, 14000, 35000, 88000, 220000, 550000, 1380000, 3450000, 8600000]
  const generatedEquipmentShopGoods = [...generatedEquipmentCatalog, ...immortalEquipmentCatalog, ...divineEquipmentCatalog].map(item => {
    const rate = shopRealmCostRates[item.unlockRealm || 0] || Math.pow(2.1, item.unlockRealm || 0)
    const typeCostRate = item.type === 'weapon' ? 130 : item.type === 'armor' ? 145 : item.type === 'accessory' ? 115 : 105
    return {
      id: `shop_${item.id}`,
      category: '装备',
      name: item.name,
      desc: `${item.desc} ${item.effectText}`,
      cost: Math.max(90, Math.floor(typeCostRate * rate * (1 + (item.unlockRealm || 0) * 0.22))),
      unlockRealm: item.unlockRealm || 0,
      type: 'equipment',
      target: item.id,
      count: 1
    }
  })

  function loadSlotMeta() {
    const raw = safeGetStorage(SAVE_SLOTS_KEY)
    if (!raw) return { list: [], activeId: '' }
    try {
      const parsed = JSON.parse(raw)
      return { list: parsed.list || [], activeId: parsed.activeId || '' }
    } catch { return { list: [], activeId: '' } }
  }

  function saveSlotMeta(list, activeId) {
    safeSetStorage(SAVE_SLOTS_KEY, JSON.stringify({ list, activeId }))
  }

  const slotMeta = loadSlotMeta()

  if (!slotMeta.list.length) {
    slotMeta.list.push({
      id: 'slot_1',
      name: '默认存档',
      createdAt: Date.now(),
      lastPlayedAt: Date.now()
    })
    slotMeta.activeId = 'slot_1'
    saveSlotMeta(slotMeta.list, slotMeta.activeId)
  }

  function getActiveSlot() {
    return slotMeta.list.find(s => s.id === slotMeta.activeId) || slotMeta.list[0]
  }

  function getSlotDataKey(slotId) {
    return SLOT_DATA_PREFIX + slotId
  }

  function refreshSlotMeta() {
    const raw = safeGetStorage(SAVE_SLOTS_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed.activeId && parsed.activeId !== slotMeta.activeId) {
        slotMeta.activeId = parsed.activeId
      }
      if (parsed.list) slotMeta.list = parsed.list
    } catch {}
  }

  function createSaveSlot(name) {
    const id = 'slot_' + Date.now().toString(36)
    slotMeta.list.push({ id, name, createdAt: Date.now(), lastPlayedAt: Date.now() })
    saveSlotMeta(slotMeta.list, slotMeta.activeId)
    safeSetStorage(getSlotDataKey(id), JSON.stringify(buildPayload(Date.now())))
    return id
  }

  function switchSaveSlot(slotId) {
    if (slotMeta.activeId === slotId) return
    saveGame()
    slotMeta.activeId = slotId
    const slot = getActiveSlot()
    slot.lastPlayedAt = Date.now()
    saveSlotMeta(slotMeta.list, slotMeta.activeId)
    reloadCurrentSaveSilently()
  }

  function deleteSaveSlot(slotId) {
    if (slotMeta.list.length <= 1) { showFeedback('至少保留一个存档'); return }
    const idx = slotMeta.list.findIndex(s => s.id === slotId)
    if (idx < 0) return
    slotMeta.list.splice(idx, 1)
    safeRemoveStorage(getSlotDataKey(slotId))
    if (slotMeta.activeId === slotId) {
      slotMeta.activeId = slotMeta.list[0].id
    }
    saveSlotMeta(slotMeta.list, slotMeta.activeId)
    if (slotMeta.activeId === slotId || idx === 0) reloadCurrentSaveSilently()
  }

  function renameSaveSlot(slotId, newName) {
    const slot = slotMeta.list.find(s => s.id === slotId)
    if (!slot || !newName.trim()) return
    slot.name = newName.trim().slice(0, 12)
    saveSlotMeta(slotMeta.list, slotMeta.activeId)
  }

  const shopGoods = [
    ...baseShopGoods,
    ...generatedEquipmentShopGoods.filter(item => !baseShopGoods.some(base => base.target === item.target))
  ]


  const defaultSave = () => ({
    activeTab: 'cultivation',
    inventoryTab: 'pills',
    player: {
      name: '无名散修',
      realmIndex: 0,
      realmLayer: 1,
      cultivation: 0,
      spirit: 120,
      maxSpirit: 120,
      hp: 180,
      maxHp: 180,
      attack: 26,
      defense: 8,
      bone: 12,
      comprehension: 11,
      fortune: 10,
      techniquePoints: 5,
      breakthroughPills: 2,
      explorationTimes: 8,
      maxExplorationTimes: 8,
      equippedTechniqueId: 'qingmu',
      techniqueLevels: { qingmu: 1, lieyang: 1, xuanbing: 1 },
      skillLevels: { basic: 1, fireball: 1, thunder: 1, swordShield: 1, soulFire: 1 },
      battleLoadout: ['fireball', 'thunder', 'swordShield', 'soulFire']
    },
    inventory: {
      herbs: 0,
      ores: 0,
      fruits: 0,
      cores: 0,
      scrolls: 0,
      furnaceStones: 1,
      spiritStones: 80,
      jade: 0,
      pills: { qiCondense: 2, spiritRecover: 2, goldCorePill: 0, nascentSoulPill: 0, spiritTransformPill: 0, voidRefinePill: 0, unionPill: 0, mahayanaPill: 0, tribulationPill: 0, trueImmortalPill: 0, mysticImmortalPill: 0, goldImmortalPill: 0, immortalKingPill: 0, immortalEmperorPill: 0, trueGodPill: 0, heavenGodPill: 0, godKingPill: 0, godEmperorPill: 0, godSovereignPill: 0, bone: 0, comprehension: 0, fortune: 0 },
      items: { exploreTalisman: 1, acceleratorCharm: 1, escapeTalisman: 1 },
      special: { chaosPearl: 0, recipeFragment: 0 },
      artifacts: artifactCatalog.reduce((acc, item) => { acc[item.id] = { owned: false, realmIndex: 0, realmLayer: 1 }; return acc }, {}),
      equipments: { sword: 1, greenWoodStaff: 0, cloudRobe: 1, jadePendant: 1, spiritGatheringCharm: 0, thunderBlade: 0, blackIronArmor: 0, moonRing: 0, beastSeal: 0, windTalisman: 0, furnaceToken: 0, starSword: 0, moonSilkRobe: 0, daoHeartMirror: 0, goldScaleArmor: 0, sunsetBlade: 0, nascentSoulFan: 0, soulGuardRobe: 0, chaosPearl: 0, spiritFlameSword: 0, divineMindCrown: 0, voidPatternRobe: 0, voidCuttingBlade: 0, emptyCloudArmor: 0, voidSeal: 0, unitySpear: 0, heavenUnionRobe: 0, unityJade: 0, mahayanaSword: 0, starSeaArmor: 0, daoFruitPendant: 0, tribulationThunderSword: 0, thunderTribulationArmor: 0, heavenFateToken: 0 },
      equipped: { weapon: '', armor: '', accessory: '', talisman: '', artifact: '', artifacts: { weapon: '', armor: '', accessory: '', talisman: '' } }
    },
    settings: { pauseWhenFull: false, pauseWhenSpiritLow: false, autoBreakthrough: false, settingsUpdatedAt: 0 },
    exploration: {
      selectedMapId: 'qingzhu',
      selectedDifficulty: 'normal',
      lastResult: '你尚未踏入山野，四周一片寂静。',
      currentProcess: ['你尚未踏入山野，四周一片寂静。'],
      totalExploreCount: 0
    },
    alchemy: { furnaceLevel: 1, selectedRecipeId: 'qiCondense', batchCount: 1, recipeUnlocks: [], lastResult: '丹火未起，炉中沉寂。' },
    sect: { joined: false, created: false, id: '', name: '', rank: '散修', level: 1, sectLevel: 1, contributionLevel: 1, contribution: 0, totalContribution: 0, funds: 0, createName: '', challengeLevel: 1, highestChallengeLevel: 1, demonTowerLevel: 1, highestDemonTowerLevel: 1, towerRealmFixHidden: false, logs: [], createdSects: [] },
    battle: {
      visible: false,
      isBattling: false,
      source: '',
      mode: 'auto',
      controlMode: 'auto',
      waitingForPlayer: false,
      title: '战斗',
      enemyName: '',
      enemyRealmText: '',
      enemyHp: 0,
      enemyMaxHp: 0,
      enemyAttack: 0,
      enemyDefense: 0,
      playerHp: 0,
      playerMaxHp: 0,
      playerSpirit: 0,
      playerMaxSpirit: 0,
      round: 1,
      currentProcess: [],
      lastResult: '尚未遭遇战斗。',
      atkBuff: 0,
      atkBuffTurns: 0,
      defBuff: 0,
      defBuffTurns: 0,
      dodgeBuff: 0,
      dodgeBuffTurns: 0,
      enemyAtkDown: 0,
      totalSteps: 1,
      returnUrl: '/pages/sect/sect'
    },
    daily: { dayKey: '', welfareClaimed: false, sectTasksDone: [], manualCultivateUsed: 0, dailyTalismanExchangeUsed: 0 },
    autoCultivationEnabled: true,
    lastSaveAt: Date.now(),
    logs: [],
    explorationLogs: []
  })

  function safeGetStorage(key) {
    try {
      return uni.getStorageSync(key)
    } catch (error) {
      return null
    }
  }

  function safeSetStorage(key, value) {
    try {
      uni.setStorageSync(key, value)
      return true
    } catch (error) {
      return false
    }
  }

  function safeRemoveStorage(key) {
    try {
      uni.removeStorageSync(key)
      return true
    } catch (error) {
      return false
    }
  }

  function readAnySavedStorage() {
    refreshSlotMeta()
    const slotKey = getSlotDataKey(slotMeta.activeId)
    const slotRaw = safeGetStorage(slotKey)
    if (slotRaw) return slotRaw
    const currentRaw = safeGetStorage(STORAGE_KEY)
    if (currentRaw) return currentRaw
    for (let i = 0; i < LEGACY_STORAGE_KEYS.length; i += 1) {
      const legacyRaw = safeGetStorage(LEGACY_STORAGE_KEYS[i])
      if (legacyRaw) return legacyRaw
    }
    return null
  }

  function normalizeArray(value, fallback = []) {
    return Array.isArray(value) ? value : fallback
  }

  function normalizeNumber(value, fallback = 0) {
    const num = Number(value)
    return Number.isFinite(num) ? num : fallback
  }

  function migrateSave(parsed) {
    const merged = defaultSave()
    const source = parsed && typeof parsed === 'object' ? parsed : {}
    const next = {
      ...merged,
      ...source,
      saveVersion: SAVE_VERSION,
      lastSaveAt: normalizeNumber(source.lastSaveAt, Date.now()),
      player: {
        ...merged.player,
        ...(source.player || {}),
        techniqueLevels: { ...merged.player.techniqueLevels, ...(source.player?.techniqueLevels || {}) },
        skillLevels: { ...merged.player.skillLevels, ...(source.player?.skillLevels || {}) },
        battleLoadout: normalizeArray(source.player?.battleLoadout, merged.player.battleLoadout)
      },
      inventory: {
        ...merged.inventory,
        ...(source.inventory || {}),
        pills: { ...merged.inventory.pills, ...(source.inventory?.pills || {}) },
        items: { ...merged.inventory.items, ...(source.inventory?.items || {}) },
        special: { ...merged.inventory.special, ...(source.inventory?.special || {}) },
        equipments: { ...merged.inventory.equipments, ...(source.inventory?.equipments || {}) },
        artifacts: { ...merged.inventory.artifacts, ...(source.inventory?.artifacts || {}) },
        equipped: {
          ...merged.inventory.equipped,
          ...(source.inventory?.equipped || {}),
          artifacts: {
            ...merged.inventory.equipped.artifacts,
            ...(source.inventory?.equipped?.artifacts || {})
          }
        }
      },
      settings: { ...merged.settings, ...(source.settings || {}) },
      exploration: {
        ...merged.exploration,
        ...(source.exploration || {}),
        currentProcess: normalizeArray(source.exploration?.currentProcess, source.exploration?.lastResult ? [source.exploration.lastResult] : merged.exploration.currentProcess),
        totalExploreCount: normalizeNumber(source.exploration?.totalExploreCount, 0)
      },
      alchemy: { ...merged.alchemy, ...(source.alchemy || {}), recipeUnlocks: normalizeArray(source.alchemy?.recipeUnlocks) },
      sect: { ...merged.sect, ...(source.sect || {}), logs: normalizeArray(source.sect?.logs), createdSects: normalizeArray(source.sect?.createdSects) },
      battle: { ...merged.battle, ...(source.battle || {}), currentProcess: normalizeArray(source.battle?.currentProcess, merged.battle.currentProcess) },
      daily: { ...merged.daily, ...(source.daily || {}), sectTasksDone: normalizeArray(source.daily?.sectTasksDone), manualCultivateUsed: normalizeNumber(source.daily?.manualCultivateUsed, 0) },
      logs: normalizeArray(source.logs),
      explorationLogs: normalizeArray(source.explorationLogs)
    }

    // v27 起在渡劫与神界之间补入仙界五大境界；旧 v26 神界存档整体后移 5 个大境界，避免真神被误读为真仙。
    const sourceVersion = normalizeNumber(source.saveVersion, 0)
    if (sourceVersion > 0 && sourceVersion <= 26) {
      if (next.player.realmIndex >= 9) next.player.realmIndex += 5
      if (next.sect.challengeLevel > 9 * 9) next.sect.challengeLevel += 5 * 9
      if (next.sect.highestChallengeLevel > 9 * 9) next.sect.highestChallengeLevel += 5 * 9
      if (next.sect.demonTowerLevel > 9 * 9) next.sect.demonTowerLevel += 5 * 9
      if (next.sect.highestDemonTowerLevel > 9 * 9) next.sect.highestDemonTowerLevel += 5 * 9
      Object.keys(next.inventory.artifacts || {}).forEach(id => {
        const artifactState = next.inventory.artifacts[id]
        if (artifactState && artifactState.realmIndex >= 9) artifactState.realmIndex += 5
      })
    }

    next.player.cultivation = Math.max(0, normalizeNumber(next.player.cultivation, 0))
    next.player.spirit = Math.max(0, normalizeNumber(next.player.spirit, merged.player.spirit))
    next.player.maxSpirit = Math.max(1, normalizeNumber(next.player.maxSpirit, merged.player.maxSpirit))
    next.player.maxHp = Math.max(1, normalizeNumber(next.player.maxHp, merged.player.maxHp))
    next.player.hp = Math.max(1, normalizeNumber(next.player.hp, next.player.maxHp))
    next.player.attack = Math.max(1, normalizeNumber(next.player.attack, merged.player.attack))
    next.player.defense = Math.max(0, normalizeNumber(next.player.defense, merged.player.defense))
    battleSkills.forEach(skill => {
      next.player.skillLevels[skill.id] = Math.max(1, normalizeNumber(next.player.skillLevels?.[skill.id], 1))
    })
    next.player.battleLoadout = (next.player.battleLoadout || []).filter(id => {
      const skill = battleSkills.find(s => s.id === id)
      return skill && skill.id !== 'basic' && next.player.realmIndex >= normalizeNumber(skill.unlockRealm, 0)
    })
    while (next.player.battleLoadout.length > 4) next.player.battleLoadout.pop()
    next.sect.sectLevel = normalizeNumber(next.sect.sectLevel, normalizeNumber(next.sect.level, 1))
    next.sect.contributionLevel = Math.max(1, normalizeNumber(next.sect.contributionLevel, 1))
    next.sect.totalContribution = Math.max(0, normalizeNumber(next.sect.totalContribution, 0))
    next.sect.createdSects = normalizeArray(next.sect.createdSects)
    next.sect.challengeLevel = Math.max(1, normalizeNumber(next.sect.challengeLevel, 1))
    next.sect.highestChallengeLevel = Math.max(next.sect.challengeLevel, normalizeNumber(next.sect.highestChallengeLevel, next.sect.challengeLevel))
    next.sect.demonTowerLevel = Math.max(1, normalizeNumber(next.sect.demonTowerLevel, 1))
    next.sect.highestDemonTowerLevel = Math.max(next.sect.demonTowerLevel, normalizeNumber(next.sect.highestDemonTowerLevel, next.sect.demonTowerLevel))
    next.sect.towerRealmFixHidden = next.sect.towerRealmFixHidden === true
    next.battle.visible = false
    next.battle.isBattling = false
    next.battle.waitingForPlayer = false
    next.battle.mode = next.battle.mode === 'manual' ? 'manual' : 'auto'
    next.battle.controlMode = next.battle.controlMode === 'manual' ? 'manual' : 'auto'
    next.battle.round = Math.max(1, normalizeNumber(next.battle.round, 1))
    next.battle.enemyAttack = Math.max(0, normalizeNumber(next.battle.enemyAttack, 0))
    next.battle.enemyDefense = Math.max(0, normalizeNumber(next.battle.enemyDefense, 0))
    next.battle.enemyRealmText = next.battle.enemyRealmText || ''
    next.battle.returnUrl = next.battle.returnUrl || '/pages/sect/sect'
    next.player.explorationTimes = Math.max(0, normalizeNumber(next.player.explorationTimes, merged.player.explorationTimes))
    if (!explorationMaps.some(map => map.id === next.exploration.selectedMapId)) {
      const fallbackMap = explorationMaps.slice().reverse().find(map => {
        if (next.player.realmIndex > map.need.realmIndex) return true
        if (next.player.realmIndex < map.need.realmIndex) return false
        return next.player.realmLayer >= map.need.layer
      }) || explorationMaps[0]
      next.exploration.selectedMapId = fallbackMap.id
    }
    next.player.maxExplorationTimes = Math.max(1, normalizeNumber(next.player.maxExplorationTimes, merged.player.maxExplorationTimes))
    cultivationPillDefs.forEach(item => {
      next.inventory.pills[item.key] = Math.max(0, normalizeNumber(next.inventory.pills[item.key], 0))
    })
    ;['bone', 'comprehension', 'fortune'].forEach(key => {
      next.inventory.pills[key] = Math.max(0, normalizeNumber(next.inventory.pills[key], 0))
    })
    equipmentCatalog.forEach(item => {
      next.inventory.equipments[item.id] = Math.max(0, normalizeNumber(next.inventory.equipments[item.id], 0))
    })
    if (!next.inventory.equipped.artifacts) {
      next.inventory.equipped.artifacts = { weapon: '', armor: '', accessory: '', talisman: '' }
    }

    artifactCatalog.forEach(item => {
      const current = next.inventory.artifacts?.[item.id] || {}
      next.inventory.artifacts[item.id] = {
        owned: current.owned === true,
        realmIndex: Math.max(0, Math.min(realmNames.length - 1, normalizeNumber(current.realmIndex, 0))),
        realmLayer: Math.max(1, Math.min(9, normalizeNumber(current.realmLayer, 1)))
      }
      if (!next.inventory.artifacts[item.id].owned) {
        Object.keys(next.inventory.equipped.artifacts).forEach(slot => {
          if (next.inventory.equipped.artifacts[slot] === item.id) next.inventory.equipped.artifacts[slot] = ''
        })
        if (next.inventory.equipped.artifact === item.id) next.inventory.equipped.artifact = ''
      }
      const state = next.inventory.artifacts[item.id]
      if (state.realmIndex > next.player.realmIndex || (state.realmIndex === next.player.realmIndex && state.realmLayer > next.player.realmLayer)) {
        state.realmIndex = next.player.realmIndex
        state.realmLayer = next.player.realmLayer
      }
    })

    // 兼容旧存档：旧版只有一个 equipped.artifact 槽，这里迁移到对应类型的神器槽位。
    if (next.inventory.equipped.artifact) {
      const legacyArtifactInfo = artifactCatalog.find(item => item.id === next.inventory.equipped.artifact)
      const legacyState = next.inventory.artifacts?.[next.inventory.equipped.artifact]
      if (legacyArtifactInfo && legacyState?.owned && next.inventory.equipped.artifacts[legacyArtifactInfo.type] !== undefined && !next.inventory.equipped.artifacts[legacyArtifactInfo.type]) {
        next.inventory.equipped.artifacts[legacyArtifactInfo.type] = next.inventory.equipped.artifact
      }
      next.inventory.equipped.artifact = ''
    }

    Object.keys(next.inventory.equipped || {}).forEach(slot => {
      if (slot === 'artifact' || slot === 'artifacts') return
      const equippedId = next.inventory.equipped[slot]
      const equippedInfo = equipmentCatalog.find(item => item.id === equippedId)
      if (!equippedInfo || equippedInfo.unlockRealm > next.player.realmIndex || normalizeNumber(next.inventory.equipments[equippedId], 0) <= 0) {
        next.inventory.equipped[slot] = ''
      }
    })

    Object.keys(next.inventory.equipped.artifacts).forEach(slot => {
      const artifactId = next.inventory.equipped.artifacts[slot]
      if (!artifactId) return
      const artifactInfo = artifactCatalog.find(item => item.id === artifactId)
      const artifactState = next.inventory.artifacts?.[artifactId]
      if (!artifactInfo || artifactInfo.type !== slot || !artifactState || artifactState.owned !== true) {
        next.inventory.equipped.artifacts[slot] = ''
        return
      }
      // 神器占用对应装备位：如果该槽位已装备神器，普通装备自动失效并卸下。
      if (next.inventory.equipped[slot] !== undefined) next.inventory.equipped[slot] = ''
    })

    next.alchemy.batchCount = Math.max(1, normalizeNumber(next.alchemy.batchCount, 1))
    // v5 起：圆满后自动修炼也继续积累溢出修为，旧存档的 pauseWhenFull 不再生效。
    next.settings.pauseWhenFull = false
    next.settings.settingsUpdatedAt = Math.max(0, normalizeNumber(next.settings.settingsUpdatedAt, 0))
    return next
  }

  function loadStorage() {
    const merged = defaultSave()
    try {
      const raw = readAnySavedStorage()
      if (!raw) return migrateSave(merged)
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      return migrateSave(parsed)
    } catch (error) {
      return merged
    }
  }

  const saved = loadStorage()
  const activeTab = ref(saved.activeTab)
  const inventoryTab = ref(saved.inventoryTab)
  const player = reactive(saved.player)
  const inventory = reactive(saved.inventory)
  const settings = reactive(saved.settings)
  const exploration = reactive(saved.exploration)
  const alchemy = reactive(saved.alchemy)
  const sect = reactive(saved.sect)
  const battle = reactive(saved.battle)
  const daily = reactive(saved.daily)
  const autoCultivationEnabled = ref(saved.autoCultivationEnabled)
  const lastOfflineCheckpoint = ref(saved.lastSaveAt || Date.now())
  const logs = ref(saved.logs.length ? saved.logs : [])
  const explorationLogs = ref(saved.explorationLogs.length ? saved.explorationLogs : [])

  function getEquippedArtifactId(type) {
    return inventory.equipped.artifacts?.[type] || ''
  }

  function getEquippedArtifact(type) {
    const id = getEquippedArtifactId(type)
    return artifactCatalog.find(item => item.id === id) || null
  }

  const currentWeaponArtifact = computed(() => getEquippedArtifact('weapon'))
  const currentArmorArtifact = computed(() => getEquippedArtifact('armor'))
  const currentAccessoryArtifact = computed(() => getEquippedArtifact('accessory'))
  const currentTalismanArtifact = computed(() => getEquippedArtifact('talisman'))
  const equippedArtifacts = computed(() => [currentWeaponArtifact.value, currentArmorArtifact.value, currentAccessoryArtifact.value, currentTalismanArtifact.value].filter(Boolean))
  const currentArtifact = computed(() => equippedArtifacts.value[0] || null)
  const currentArtifactType = computed(() => currentArtifact.value?.type || '')
  const currentWeapon = computed(() => currentWeaponArtifact.value ? null : equipmentCatalog.find(item => item.id === inventory.equipped.weapon) || null)
  const currentArmor = computed(() => currentArmorArtifact.value ? null : equipmentCatalog.find(item => item.id === inventory.equipped.armor) || null)
  const currentAccessory = computed(() => currentAccessoryArtifact.value ? null : equipmentCatalog.find(item => item.id === inventory.equipped.accessory) || null)
  const currentTalisman = computed(() => currentTalismanArtifact.value ? null : equipmentCatalog.find(item => item.id === inventory.equipped.talisman) || null)
  const currentWeaponName = computed(() => currentWeaponArtifact.value ? `神器·${currentWeaponArtifact.value.name}` : currentWeapon.value ? currentWeapon.value.name : '未装备')
  const currentArmorName = computed(() => currentArmorArtifact.value ? `神器·${currentArmorArtifact.value.name}` : currentArmor.value ? currentArmor.value.name : '未装备')
  const currentAccessoryName = computed(() => currentAccessoryArtifact.value ? `神器·${currentAccessoryArtifact.value.name}` : currentAccessory.value ? currentAccessory.value.name : '未装备')
  const currentTalismanName = computed(() => currentTalismanArtifact.value ? `神器·${currentTalismanArtifact.value.name}` : currentTalisman.value ? currentTalisman.value.name : '未装备')
  const currentArtifactName = computed(() => {
    if (!equippedArtifacts.value.length) return '未装备'
    return equippedArtifacts.value.map(item => `${getEquipmentTypeText(item.type)}神器·${item.name}`).join('、')
  })

  const equipmentBonus = computed(() => {
    const bonus = { bone: 0, comprehension: 0, fortune: 0, auto: 0, manual: 0, explore: 0, alchemy: 0, breakthrough: 0, attack: 0, defense: 0, hp: 0 }
    const currentDivineRate = Math.pow(3.15, player.realmIndex)
    equipmentCatalog.forEach(item => {
      if (getEquippedArtifactId(item.type)) return
      if (inventory.equipped[item.type] !== item.id) return
      if (player.realmIndex < normalizeNumber(item.unlockRealm, 0)) return
      if (getEquipmentCount(item.id) <= 0) return
      const isDivine = String(item.id).startsWith('g')
      const scale = isDivine ? currentDivineRate / Math.max(1, Math.pow(3.15, normalizeNumber(item.unlockRealm, 14))) : 1
      Object.keys(item.bonus || {}).forEach(key => {
        bonus[key] = (bonus[key] || 0) + Math.floor(item.bonus[key] * scale)
      })
    })
    equippedArtifacts.value.forEach(artifact => {
      if (!artifact || !isArtifactOwned(artifact.id)) return
      const artifactBonus = getArtifactBonus(artifact.id)
      Object.keys(artifactBonus || {}).forEach(key => {
        bonus[key] = (bonus[key] || 0) + artifactBonus[key]
      })
    })
    return bonus
  })

  const sectBonus = computed(() => {
    if (!sect.joined) return { cultivation: 0, alchemy: 0, explore: 0, breakthrough: 0 }
    if (sect.created) {
      const growth = Math.sqrt(Math.max(1, sect.sectLevel))
      return {
        cultivation: Math.min(0.75, 0.05 + growth * 0.035),
        alchemy: Math.min(0.55, 0.04 + growth * 0.026),
        explore: Math.min(0.55, 0.04 + growth * 0.026),
        breakthrough: Math.min(28, 2 + Math.floor(growth * 3.2))
      }
    }
    const found = sectTemplates.find(item => item.id === sect.id)
    if (!found) return { cultivation: 0, alchemy: 0, explore: 0, breakthrough: 0 }
    const growth = Math.sqrt(Math.max(0, sect.sectLevel - 1))
    return {
      cultivation: Math.min(0.65, found.bonus.cultivation + growth * 0.018),
      alchemy: Math.min(0.50, found.bonus.alchemy + growth * 0.014),
      explore: Math.min(0.50, found.bonus.explore + growth * 0.014),
      breakthrough: Math.min(24, found.bonus.breakthrough + Math.floor(growth * 2.4))
    }
  })

  const actualBone = computed(() => player.bone + equipmentBonus.value.bone)
  const actualComprehension = computed(() => player.comprehension + equipmentBonus.value.comprehension)
  const actualFortune = computed(() => player.fortune + equipmentBonus.value.fortune)
  const techniqueBattleBonus = computed(() => {
    const levels = Object.values(player.techniqueLevels || {}).map(v => Math.max(1, normalizeNumber(v, 1)))
    const totalExtra = levels.reduce((sum, level) => sum + Math.max(0, level - 1), 0)
    const equippedExtra = Math.max(0, normalizeNumber(player.techniqueLevels?.[player.equippedTechniqueId], 1) - 1)
    return Math.min(0.9, totalExtra * 0.006 + equippedExtra * 0.035)
  })
  const skillBattleBonus = computed(() => {
    const totalExtra = battleSkills.reduce((sum, skill) => {
      const level = Math.max(1, normalizeNumber(player.skillLevels?.[skill.id], 1))
      return sum + Math.max(0, level - 1) * (1 + normalizeNumber(skill.unlockRealm, 0) * 0.4)
    }, 0)
    return Math.min(0.85, totalExtra * 0.012)
  })
  const battleMaxHp = computed(() => {
    const hpScale = 3 + player.realmIndex * 0.25
    const base = getRealmScaledBattleStats(player.realmIndex, player.realmLayer, { baseHp: player.maxHp, hpScale })
    const trainingBonus = 1 + actualBone.value * 0.006 + actualComprehension.value * 0.002
    return Math.floor((base.maxHp * trainingBonus + equipmentBonus.value.hp * (1 + player.realmIndex * 0.18)) * (1 + techniqueBattleBonus.value * 0.35))
  })
  const battleAttack = computed(() => {
    const base = getRealmScaledBattleStats(player.realmIndex, player.realmLayer, { baseAttack: player.attack })
    const trainingBonus = 1 + actualBone.value * 0.004 + actualComprehension.value * 0.006
    return Math.floor((base.attack * trainingBonus + equipmentBonus.value.attack * (1 + player.realmIndex * 0.2)) * (1 + techniqueBattleBonus.value + skillBattleBonus.value))
  })
  const battleDefense = computed(() => {
    const base = getRealmScaledBattleStats(player.realmIndex, player.realmLayer, { baseDefense: player.defense })
    const trainingBonus = 1 + actualBone.value * 0.004 + actualComprehension.value * 0.002
    return Math.floor((base.defense * trainingBonus + equipmentBonus.value.defense * (1 + player.realmIndex * 0.18)) * (1 + techniqueBattleBonus.value * 0.5))
  })
  const battlePower = computed(() => Math.floor((battleMaxHp.value + battleAttack.value * 9 + battleDefense.value * 12) * (1 + techniqueBattleBonus.value * 0.15 + skillBattleBonus.value * 0.12)))
  const unlockedBattleSkills = computed(() => battleSkills.filter(skill => player.realmIndex >= skill.unlockRealm && skill.id !== 'basic'))
  const availableBattleSkills = computed(() => {
    const loadout = player.battleLoadout || []
    const equipped = battleSkills.filter(skill => loadout.includes(skill.id) && player.realmIndex >= skill.unlockRealm)
    return [battleSkills[0], ...equipped]
  })
  const battleFleeChance = computed(() => {
    const hpRatio = battle.playerHp > 0 ? battle.playerHp / Math.max(1, battle.playerMaxHp) : 0
    const baseChance = 0.25 + actualComprehension.value * 0.01
    const lowHpBonus = hpRatio < 0.3 ? 0.2 : 0
    return Math.min(1, baseChance + lowHpBonus)
  })
  function isSkillEquipped(skillId) {
    return (player.battleLoadout || []).includes(skillId)
  }
  function equipBattleSkill(skillId) {
    const skill = battleSkills.find(item => item.id === skillId)
    if (!skill || skill.id === 'basic') {
      showFeedback('灵剑斩常驻可用，无需装备')
      return
    }
    if (player.realmIndex < normalizeNumber(skill.unlockRealm, 0)) {
      showFeedback('境界不足，尚未领悟')
      return
    }
    const loadout = player.battleLoadout || []
    if (loadout.includes(skillId)) {
      showFeedback('该功法已装备')
      return
    }
    if (loadout.length >= 4) {
      showFeedback('最多装备 4 个功法，请先卸下一个')
      return
    }
    loadout.push(skillId)
    showFeedback(`已装备「${skill.name}」`, 'success')
    addLog(`你将「${skill.name}」纳入战斗功法序列。`)
  }
  function unequipBattleSkill(skillId) {
    const skill = battleSkills.find(item => item.id === skillId)
    if (!skill || skill.id === 'basic') return
    const loadout = player.battleLoadout || []
    const index = loadout.indexOf(skillId)
    if (index < 0) return
    loadout.splice(index, 1)
    showFeedback(`已卸下「${skill.name}」`)
    addLog(`你将「${skill.name}」从战斗功法中移除。`)
  }
  function getBattleSkillLevel(skillOrId) {
    const id = typeof skillOrId === 'string' ? skillOrId : skillOrId?.id
    return Math.max(1, normalizeNumber(player.skillLevels?.[id], 1))
  }
  function getBattleSkillUpgradeNeed(skillOrId) {
    const skill = typeof skillOrId === 'string' ? battleSkills.find(item => item.id === skillOrId) : skillOrId
    if (!skill) return 0
    const level = getBattleSkillLevel(skill.id)
    return Math.max(2, Math.floor((level + 1) * (2 + normalizeNumber(skill.unlockRealm, 0) * 2) * (1 + level * 0.18)))
  }
  function getBattleSkillPower(skillOrId) {
    const skill = typeof skillOrId === 'string' ? battleSkills.find(item => item.id === skillOrId) : skillOrId
    if (!skill) return 1
    const level = getBattleSkillLevel(skill.id)
    const growthRate = skill.id === 'basic' ? 0.04 : 0.07
    return Number((normalizeNumber(skill.power, 1) * (1 + (level - 1) * growthRate)).toFixed(2))
  }
  function getBattleSkillPowerText(skillOrId) {
    return getBattleSkillPower(skillOrId).toFixed(2)
  }
  function getBattleSkillCost(skill) {
    if (!skill || skill.id === 'basic') return 0
    const fixedCost = normalizeNumber(skill.cost, 0)
    const rateCost = Math.floor(player.maxSpirit * normalizeNumber(skill.spiritCostRate, 0))
    return Math.max(fixedCost, rateCost)
  }
  function getBattleSkillMaxLevel(skillOrId) {
    const skill = typeof skillOrId === 'string' ? battleSkills.find(item => item.id === skillOrId) : skillOrId
    if (!skill) return 5
    return 5 + player.realmIndex * 5
  }
  function getAttributeMax() {
    return 50 + player.realmIndex * 30
  }
  function getTechniqueMaxLevel() {
    return 50 + player.realmIndex * 30
  }
  function getAttributeMaxText() {
    return `上限 ${getAttributeMax()}（突破大境界后提升）`
  }
  const battlePlaybackPercent = computed(() => {
    const total = battle.totalSteps || battle.currentProcess.length || 1
    return Math.min(100, Math.floor((battle.currentProcess.length / total) * 100))
  })
  const currentBattleStepText = computed(() => {
    if (!battle.currentProcess.length) return '双方气机交锋，胜负尚未分明。'
    return battle.currentProcess[battle.currentProcess.length - 1]
  })

  // 战斗数值曲线：大境界突破给明显跃迁，小境界稳步成长。
  // 目标：高一大境界大概率压制低境界；低境界圆满高练度有机会挑战高一境界初期。
  const realmBattleRates = [1, 2.15, 4.8, 11.5, 27.5, 66, 158, 380, 900, 2250, 5600, 14000, 35000, 88000, 220000, 550000, 1380000, 3450000, 8600000]

  function getRealmBattleRate(realmIndex, realmLayer = 1) {
    const safeRealmIndex = Math.max(0, Math.min(realmNames.length - 1, normalizeNumber(realmIndex, 0)))
    const safeLayer = Math.max(1, Math.min(9, normalizeNumber(realmLayer, 1)))
    const realmRate = realmBattleRates[safeRealmIndex] || Math.pow(2.05, safeRealmIndex)
    const layerOffset = safeLayer - 1
    const layerRate = 1 + layerOffset * 0.07 + Math.pow(layerOffset, 2) * 0.004
    return realmRate * layerRate
  }

  function getRealmScaledBattleStats(realmIndex, realmLayer = 1, options = {}) {
    const rate = getRealmBattleRate(realmIndex, realmLayer)
    const gradeRate = options.gradeRate || 1
    const baseHp = options.baseHp || 170
    const baseAttack = options.baseAttack || 24
    const baseDefense = options.baseDefense || 8
    const hpScale = options.hpScale || 1
    return {
      maxHp: Math.max(1, Math.floor(baseHp * rate * gradeRate * hpScale)),
      attack: Math.max(1, Math.floor(baseAttack * rate * gradeRate)),
      defense: Math.max(0, Math.floor(baseDefense * rate * gradeRate)),
      rate
    }
  }

  function getRealmScaleForEnemy(realmIndex) {
    return 1.0 + realmIndex * 0.35 + realmIndex * realmIndex * 0.55
  }

  function getDifficultyCombatRate(difficultyId = exploration.selectedDifficulty) {
    const base = (() => {
      if (difficultyId === 'hard') return 1.08
      if (difficultyId === 'abyss') return 1.22
      return 0.94
    })()
    const realmScale = getRealmScaleForEnemy(player.realmIndex)
    return Number((base * realmScale).toFixed(3))
  }

  function getBattlePowerFromStats(stats) {
    return Math.floor((stats.maxHp || 0) + (stats.attack || 0) * 9 + (stats.defense || 0) * 12)
  }

  function getRealmPressure(attackerRealmIndex, defenderRealmIndex) {
    const gap = attackerRealmIndex - defenderRealmIndex
    if (gap >= 2) return 1.35
    if (gap === 1) return 1.15
    if (gap < 0) return 0.82
    return 1
  }

  function getRealmLayerFromChallengeLevel(level) {
    const safeLevel = Math.max(1, normalizeNumber(level, 1))
    const realmIndex = Math.min(realmNames.length - 1, Math.floor((safeLevel - 1) / 9))
    const realmLayer = ((safeLevel - 1) % 9) + 1
    return { realmIndex, realmLayer }
  }

  function getRealmLayerText(realmIndex, realmLayer) {
    const name = realmNames[Math.max(0, Math.min(realmNames.length - 1, normalizeNumber(realmIndex, 0)))] || realmNames[0]
    return `${name}${Math.max(1, Math.min(9, normalizeNumber(realmLayer, 1)))}层`
  }

  const sectChallengeInfo = computed(() => {
    const level = Math.max(1, normalizeNumber(sect.challengeLevel, 1))
    const maxRealmIndex = realmNames.length - 1
    const { realmIndex, realmLayer } = getRealmLayerFromChallengeLevel(level)
    const stageNames = ['外门弟子', '内门弟子', '精英弟子', '执法弟子', '真传弟子', '护法弟子', '宗门长老', '太上长老', '镇宗老祖', '真仙客卿', '玄仙供奉', '金仙化身', '仙王法相', '仙帝投影', '真神客卿', '天神供奉', '神王化身', '神皇法相', '神尊投影']
    const overLevel = Math.max(0, level - realmNames.length * 9)
    const stageName = overLevel > 0 ? `极境${stageNames[stageNames.length - 1]}` : stageNames[Math.min(stageNames.length - 1, realmIndex)]
    const name = `${stageName}·第${realmLayer}席`
    const difficultyRate = Number((getRealmScaleForEnemy(realmIndex) + (realmLayer - 1) * 0.04 + sect.sectLevel * 0.025 + overLevel * 0.08).toFixed(3))
    const stats = getRealmScaledBattleStats(realmIndex, realmLayer, {
      baseHp: 185,
      baseAttack: 26,
      baseDefense: 10,
      gradeRate: difficultyRate,
      hpScale: 3 + realmIndex * 0.25 + overLevel * 0.15
    })
    const maxHp = stats.maxHp
    const attack = stats.attack
    const defense = stats.defense
    const power = getBattlePowerFromStats(stats)
    const nextLevel = getRealmLayerFromChallengeLevel(level + 1)
    const nextOver = Math.max(0, level + 1 - realmNames.length * 9)
    const nextText = nextOver > 0 ? `极境·第${nextLevel.realmLayer}席（难度持续递增）` : getRealmLayerText(nextLevel.realmIndex, nextLevel.realmLayer)
    return {
      level,
      name,
      realmIndex,
      realmLayer,
      overLevel,
      realmText: overLevel > 0 ? `极境${getRealmLayerText(realmIndex, realmLayer)}` : getRealmLayerText(realmIndex, realmLayer),
      maxHp,
      attack,
      defense,
      power,
      difficultyRate,
      displayLevel: level,
      effectiveLevel: level,
      isCapped: false,
      nextText
    }
  })


  function getTowerRealmLayerFromLevel(level) {
    const safeLevel = Math.max(1, normalizeNumber(level, 1))
    const maxLinearLevel = realmNames.length * TOWER_ROOMS_PER_REALM
    const cappedLevel = Math.min(maxLinearLevel, safeLevel)
    const realmIndex = Math.min(realmNames.length - 1, Math.floor((cappedLevel - 1) / TOWER_ROOMS_PER_REALM))
    const realmLayer = ((cappedLevel - 1) % TOWER_ROOMS_PER_REALM) + 1
    const overLevel = Math.max(0, safeLevel - maxLinearLevel)
    return { realmIndex, realmLayer, overLevel }
  }

  function getTowerRealmText(level) {
    const info = getTowerRealmLayerFromLevel(level)
    const baseText = getRealmLayerText(info.realmIndex, info.realmLayer)
    return info.overLevel > 0 ? `${baseText}·极境第${info.overLevel}重` : baseText
  }

  function getTowerFloorText(level) {
    const info = getTowerRealmLayerFromLevel(level)
    return `第 ${info.realmIndex + 1} 层 · ${realmNames[info.realmIndex]}`
  }

  function getTowerRoomText(level) {
    const info = getTowerRealmLayerFromLevel(level)
    if (info.overLevel > 0) return `第 9 间 · 极境第${info.overLevel}重`
    return `第 ${info.realmLayer} 间`
  }

  function getTowerLocationText(level) {
    return `${getTowerFloorText(level)} · ${getTowerRoomText(level)}`
  }

  const demonTowerInfo = computed(() => {
    const level = Math.max(1, normalizeNumber(sect.demonTowerLevel, 1))
    const info = getTowerRealmLayerFromLevel(level)
    const beastTitles = ['青牙狼妖', '黑风妖虎', '金角蟒王', '噬魂狐妖', '九幽魔猿', '虚空骨龙', '归元古兽', '星海鲲妖', '劫雷妖尊', '真仙灵兽', '玄仙云蛟', '金仙战兽', '仙王金乌', '仙帝道兽', '真神荒兽', '天神云蛟', '神王战兽', '神皇金乌', '神尊道兽']
    const name = `${beastTitles[Math.min(beastTitles.length - 1, info.realmIndex)]}·${getTowerRoomText(level)}`
    // 镇妖塔以“大境界为层、每层九间”的方式推进。达到最高境界第九间后，
    // 不再生成不存在的新境界，而是在第九间后追加“极境第X重”，难度继续递增。
    const endlessBoost = Math.pow(1.035, info.overLevel)
    const towerLayerPressure = getRealmScaleForEnemy(info.realmIndex) + (info.realmLayer - 1) * 0.04
    const towerLevelPressure = 1 + Math.max(0, level - 1) * 0.006
    const difficultyRate = Number((towerLayerPressure * towerLevelPressure * endlessBoost).toFixed(3))
    const stats = getRealmScaledBattleStats(info.realmIndex, info.realmLayer, {
      baseHp: 195,
      baseAttack: 27,
      baseDefense: 10,
      gradeRate: difficultyRate,
      hpScale: 3 + info.realmIndex * 0.25 + info.overLevel * 0.15
    })
    const power = getBattlePowerFromStats(stats)
    const nextText = info.overLevel > 0 ? `极境第${info.overLevel + 1}重` : getTowerLocationText(level + 1)
    return {
      level,
      name,
      realmIndex: info.realmIndex,
      realmLayer: info.realmLayer,
      overLevel: info.overLevel,
      realmText: getTowerRealmText(level),
      floorText: getTowerFloorText(level),
      roomText: getTowerRoomText(level),
      locationText: getTowerLocationText(level),
      maxHp: stats.maxHp,
      attack: stats.attack,
      defense: stats.defense,
      power,
      difficultyRate,
      isCapped: false,
      nextText
    }
  })

  const showDemonTowerRealmFix = computed(() => {
    return sect.joined && !sect.towerRealmFixHidden && normalizeNumber(sect.demonTowerLevel, 1) > TRUE_IMMORTAL_TOWER_LEVEL
  })

  const currentRealmName = computed(() => realmNames[player.realmIndex])
  const nextMajorRealmName = computed(() => realmNames[player.realmIndex + 1] || '暂无更高境界')
  const isLastRealm = computed(() => player.realmIndex >= realmNames.length - 1)
  const alchemyUnlocked = computed(() => player.realmIndex >= 1)
  const sectUnlocked = computed(() => player.realmIndex >= 2)
  const canCreateSect = computed(() => player.realmIndex >= 3)
  const getSectCreateMaterials = computed(() => {
    if (!canCreateSect.value) return null
    return {
      spiritStones: 200,
      ores: 10 * player.realmIndex,
      herbs: 5 * player.realmIndex
    }
  })
  const dailyExchangeCap = computed(() => 10 + sect.contributionLevel * 5)
  const furnaceName = computed(() => furnaceNames[Math.max(0, Math.min(furnaceNames.length - 1, alchemy.furnaceLevel - 1))])
  const maxBatchCount = computed(() => player.realmIndex >= 2 ? 10 : 1)
  const selectedMap = computed(() => explorationMaps.find(item => item.id === exploration.selectedMapId) || explorationMaps[0])
  const selectedDifficulty = computed(() => difficulties.find(item => item.id === exploration.selectedDifficulty) || difficulties[0])
  const equippedTechnique = computed(() => techniques.find(item => item.id === player.equippedTechniqueId) || techniques[0])
  const selectedRecipe = computed(() => availableRecipes.value.find(item => item.id === alchemy.selectedRecipeId) || availableRecipes.value[0] || null)

  const currentLayerNeed = computed(() => {
    // 温和递增公式：同一大境界内逐层增加，下一大境界 1 层也一定高于上一大境界 9 层。
    // 旧版 1.55^全局层数 后期数值膨胀过快，会导致升级体验断崖式变慢。
    const safeRealmIndex = Math.max(0, Math.min(realmNames.length - 1, normalizeNumber(player.realmIndex, 0)))
    const safeLayer = Math.max(1, Math.min(9, normalizeNumber(player.realmLayer, 1)))
    const layerOffset = safeLayer - 1
    const realmBaseNeed = 500 * Math.pow(3.2, safeRealmIndex)
    const layerMultiplier = 1 + layerOffset * 0.12 + Math.pow(layerOffset, 2) * 0.014
    return Math.floor(realmBaseNeed * layerMultiplier)
  })

  const progressPercent = computed(() => {
    return Math.min(100, Number(((player.cultivation / currentLayerNeed.value) * 100).toFixed(2)))
  })

  const breakthroughSpiritNeed = computed(() => 0)
  const breakthroughPillNeed = computed(() => 0)

  const breakthroughSuccessRate = computed(() => {
    const base = 16
    const comprehensionBonus = actualComprehension.value * 0.95
    const fortuneBonus = actualFortune.value * 0.65
    const pillBonus = player.breakthroughPills > 0 ? 24 : 0
    const techniqueBonus = player.equippedTechniqueId === 'xuanbing' ? player.techniqueLevels.xuanbing * 2.1 : player.techniqueLevels[player.equippedTechniqueId] * 0.8
    const realmPenalty = player.realmIndex * 8 + player.realmLayer * 2.4
    const raw = base + comprehensionBonus + fortuneBonus + techniqueBonus + pillBonus + sectBonus.value.breakthrough + equipmentBonus.value.breakthrough - realmPenalty
    return Math.min(82, Math.max(8, Math.floor(raw)))
  })

  const canBreakthrough = computed(() => {
    return player.cultivation >= currentLayerNeed.value
  })

  const autoGain = computed(() => {
    const base = 5 + actualBone.value * 0.55 + player.realmIndex * 2.2
    const techniquePart = getTechniqueAutoBonus(player.equippedTechniqueId)
    const extra = 1 + Math.min(0.28, equipmentBonus.value.auto + sectBonus.value.cultivation)
    return Math.max(1, Math.floor(base * techniquePart * extra))
  })

  const manualGain = computed(() => {
    const base = 18 + actualBone.value * 0.95 + actualComprehension.value * 0.6 + player.realmIndex * 4
    const techniquePart = getTechniqueManualBonus(player.equippedTechniqueId)
    const extra = 1 + Math.min(0.3, equipmentBonus.value.manual + sectBonus.value.cultivation)
    return Math.max(1, Math.floor(base * techniquePart * extra))
  })

  const manualSpiritCost = computed(() => 0)
  const dailyManualLimit = computed(() => 8 + player.realmIndex * 4)
  const manualCultivateLeft = computed(() => Math.max(0, dailyManualLimit.value - normalizeNumber(daily.manualCultivateUsed, 0)))

  const dailyTalismanExchangeLimit = computed(() => 10 + (normalizeNumber(sect.contributionLevel, 0) * 5))
  const dailyTalismanExchangeLeft = computed(() => Math.max(0, dailyTalismanExchangeLimit.value - normalizeNumber(daily.dailyTalismanExchangeUsed, 0)))

  const autoGainText = computed(() => formatNumber(autoGain.value))
  const manualGainText = computed(() => formatNumber(manualGain.value))

  const explorationSpiritCost = computed(() => 0)

  const explorationSuccessRate = computed(() => {
    const base = 66 + actualFortune.value * 1.05 + actualComprehension.value * 0.5
    const realmPenalty = Math.max(0, selectedMap.value.need.realmIndex - player.realmIndex) * 20
    return Math.max(35, Math.min(92, Math.floor(base + selectedDifficulty.value.successOffset + equipmentBonus.value.explore * 100 + sectBonus.value.explore * 100 - realmPenalty)))
  })

  const explorationCultivationReward = computed(() => {
    // 探索收益按地图境界计算，避免高境界回低级图刷出过高收益，同时保证高境界地图产出跟得上炼丹需求。
    const mapRealm = normalizeNumber(selectedMap.value.need?.realmIndex, 0)
    const layerPart = Math.min(9, Math.max(1, player.realmLayer)) * 14
    const base = 52 + mapRealm * 72 + layerPart
    return Math.floor(base * selectedDifficulty.value.rewardRate * (1 + sectBonus.value.explore) * 1.35)
  })


  const totalExploreStepCount = computed(() => pendingExplorationOutcome.value?.steps?.length || exploration.currentProcess.length || 1)
  const currentExploreStepText = computed(() => {
    if (!exploration.currentProcess.length) return '你立在秘境入口，风声从远处传来。'
    return exploration.currentProcess[exploration.currentProcess.length - 1]
  })
  const explorePlaybackPercent = computed(() => {
    if (explorationFlow.active) {
      const total = explorationFlow.eventCount || 1
      return Math.min(100, Math.floor((explorationFlow.eventIndex / total) * 100))
    }
    const total = totalExploreStepCount.value || 1
    return Math.min(100, Math.floor((exploration.currentProcess.length / total) * 100))
  })

  const alchemySuccessRate = computed(() => {
    const base = 48 + alchemy.furnaceLevel * 5 + actualFortune.value * 0.9 + actualComprehension.value * 0.65 + sectBonus.value.alchemy * 100 + equipmentBonus.value.alchemy * 100
    return Math.max(35, Math.min(90, Math.floor(base)))
  })

  const nextFurnaceNeed = computed(() => {
    const level = alchemy.furnaceLevel
    return { ores: 4 + level * 2, stones: 40 + level * 20, furnaceStones: 1 + Math.floor(level / 2) }
  })

  const availableRecipes = computed(() => {
    return recipes.filter(recipe => player.realmIndex >= recipe.unlockRealm || alchemy.recipeUnlocks.includes(recipe.id))
  })

  let autoTimer = null
  let saveTimer = null
  let explorationPlaybackTimer = null
  let battlePlaybackTimer = null
  let exploreEventTimer = null
  const isExploring = ref(false)
  const pendingExplorationOutcome = ref(null)
  const pendingBattleOutcome = ref(null)
  const exploreModalVisible = ref(false)
  const explorationFlow = reactive({
    active: false,
    mapId: '',
    difficultyId: '',
    steps: [],
    rewards: [],
    events: [],
    eventIndex: 0,
    eventCount: 0,
    rewardBase: 1,
    afterCostState: null,
    successRollPassed: false
  })

  function getDayKey() {
    const date = new Date()
    const y = String(date.getFullYear())
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  function ensureDailyState() {
    const nowKey = getDayKey()
    if (daily.dayKey !== nowKey) {
      daily.dayKey = nowKey
      daily.welfareClaimed = false
      daily.sectTasksDone = []
      daily.manualCultivateUsed = 0
      daily.dailyTalismanExchangeUsed = 0
      player.explorationTimes = player.maxExplorationTimes
    }
  }

  function buildPayload(timestamp = Date.now()) {
    return {
      saveVersion: SAVE_VERSION,
      activeTab: activeTab.value,
      inventoryTab: inventoryTab.value,
      player: JSON.parse(JSON.stringify(player)),
      inventory: JSON.parse(JSON.stringify(inventory)),
      settings: JSON.parse(JSON.stringify(settings)),
      exploration: JSON.parse(JSON.stringify(exploration)),
      alchemy: JSON.parse(JSON.stringify(alchemy)),
      sect: JSON.parse(JSON.stringify(sect)),
      battle: JSON.parse(JSON.stringify(battle)),
      daily: JSON.parse(JSON.stringify(daily)),
      autoCultivationEnabled: autoCultivationEnabled.value,
      lastSaveAt: timestamp,
      logs: logs.value.slice(-200),
      explorationLogs: explorationLogs.value.slice(-200)
    }
  }

  function getLatestStoredPayload() {
    try {
      const raw = safeGetStorage(STORAGE_KEY)
      if (!raw) return null
      return typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch (error) {
      return null
    }
  }

  function protectFreshSettingsBeforeSave() {
    const latest = getLatestStoredPayload()
    if (!latest || !latest.settings) return
    const latestSettingsTime = normalizeNumber(latest.settings.settingsUpdatedAt, 0)
    const localSettingsTime = normalizeNumber(settings.settingsUpdatedAt, 0)
    if (latestSettingsTime > localSettingsTime) {
      Object.assign(settings, { ...settings, ...latest.settings })
    }
  }

  function markSettingsChanged() {
    settings.settingsUpdatedAt = Date.now()
  }

  function saveSilently() {
    refreshSlotMeta()
    protectFreshSettingsBeforeSave()
    const now = Date.now()
    lastOfflineCheckpoint.value = now
    saved.lastSaveAt = now
    const slot = getActiveSlot()
    if (slot) {
      slot.lastPlayedAt = now
      saveSlotMeta(slotMeta.list, slotMeta.activeId)
    }
    safeSetStorage(getSlotDataKey(slotMeta.activeId), JSON.stringify(buildPayload(now)))
  }

  function queueAutoSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveSilently()
    }, 400)
  }

  function formatNumber(num) {
    const value = Math.floor(Number(num) || 0)
    if (value < 10000) return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    if (value < 100000000) {
      const wan = (value / 10000).toFixed(2)
      return wan.replace(/\.?0+$/, '') + '万'
    }
    const yi = (value / 100000000).toFixed(2)
    return yi.replace(/\.?0+$/, '') + '亿'
  }

  function formatEquipmentEffect(item) {
    if (!item || !item.effectText) return ''
    let text = item.effectText
    const isDivine = String(item.id).startsWith('g')
    if (isDivine) {
      const scale = player.realmIndex >= normalizeNumber(item.unlockRealm, 14)
        ? Math.pow(3.15, player.realmIndex) / Math.max(1, Math.pow(3.15, normalizeNumber(item.unlockRealm, 14)))
        : 1
      if (scale > 1) {
        text = text.replace(/[\d,]+/g, (match) => {
          const num = parseInt(match.replace(/,/g, ''), 10)
          if (!num) return match
          return formatNumber(Math.floor(num * scale))
        })
        return text + '（随境界成长）'
      }
    }
    return text.replace(/[\d,]+/g, (match) => {
      const num = parseInt(match.replace(/,/g, ''), 10)
      if (!num) return match
      return formatNumber(num)
    })
  }

  function getEquippedDivineScale() {
    return Math.pow(3.15, player.realmIndex) / Math.pow(3.15, Math.max(1, (() => {
      const equipped = Object.values(inventory.equipped).find(id => String(id).startsWith('g'))
      if (!equipped) return 14
      const item = equipmentCatalog.find(e => e.id === equipped)
      return item ? normalizeNumber(item.unlockRealm, 14) : 14
    })()))
  }

  function nowTime() {
    const date = new Date()
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    const s = String(date.getSeconds()).padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  function showFeedback(title, icon = 'none') {
    uni.showToast({ title, icon, duration: 1200 })
  }

  function addLog(text) {
    logs.value.unshift({ time: nowTime(), text })
    if (logs.value.length > 120) logs.value.length = 120
  }

  function addExplorationLog(text) {
    explorationLogs.value.unshift({ time: nowTime(), text })
    if (explorationLogs.value.length > 100) explorationLogs.value.length = 100
  }

  function addSectLog(text) {
    sect.logs.unshift({ time: nowTime(), text })
    if (sect.logs.length > 50) sect.logs.length = 50
  }

  function addSectContribution(amount) {
    sect.contribution += amount
    sect.totalContribution += amount
    sect.contributionLevel = 1 + Math.floor(sect.totalContribution / 100)
  }

  function getTechniqueAutoBonus(id) {
    const level = player.techniqueLevels[id] || 1
    const found = techniques.find(item => item.id === id)
    if (!found) return 1
    return Number((found.autoBase + (level - 1) * 0.07).toFixed(2))
  }

  function getTechniqueManualBonus(id) {
    const level = player.techniqueLevels[id] || 1
    const found = techniques.find(item => item.id === id)
    if (!found) return 1
    return Number((found.manualBase + (level - 1) * 0.09).toFixed(2))
  }

  function getEquipmentCount(id) {
    return inventory.equipments[id] || inventory.special[id] || 0
  }

  function getEquipmentTypeText(type) {
    const map = { weapon: '武器', armor: '护具', accessory: '饰品', talisman: '符佩', artifact: '神器' }
    return map[type] || '装备'
  }

  function getEquipmentUnlockText(itemOrId) {
    const info = typeof itemOrId === 'string' ? equipmentCatalog.find(item => item.id === itemOrId) : itemOrId
    if (!info) return '未知境界'
    const realmIndex = Math.max(0, Math.min(realmNames.length - 1, normalizeNumber(info.unlockRealm, 0)))
    return realmIndex <= 0 ? '炼气期可装备' : `${realmNames[realmIndex]}可装备`
  }

  function getEquipmentDropRateText(itemOrId) {
    const info = typeof itemOrId === 'string' ? equipmentCatalog.find(item => item.id === itemOrId) : itemOrId
    if (!info) return '未知'
    const realmIndex = Math.max(0, Math.min(realmNames.length - 1, normalizeNumber(info.unlockRealm, 0)))
    const mapPoolCount = equipmentCatalog.filter(item => item.unlockRealm <= realmIndex && item.id !== 'chaosPearl').length || 1
    const equipmentEventWeight = realmIndex <= 0 ? 2 : realmIndex <= 1 ? 3 : 4
    const estimatedPoolWeight = 13 + realmIndex * 2 + equipmentEventWeight
    const normalEventCount = 3
    const equipmentEventRate = 1 - Math.pow(1 - equipmentEventWeight / estimatedPoolWeight, normalEventCount)
    const rate = equipmentEventRate / mapPoolCount
    return `对应境界普通探索单次约 ${(rate * 100).toFixed(3)}%`
  }

  function getArtifactDropRateText(itemOrId) {
    const info = typeof itemOrId === 'string' ? artifactCatalog.find(item => item.id === itemOrId) : itemOrId
    if (!info) return '未知'
    return `神器机缘基础 ${(normalizeNumber(info.dropRate, 0) * 100).toFixed(3)}%，受地图境界和福缘微调`
  }

  function getArtifactState(id) {
    return inventory.artifacts?.[id] || { owned: false, realmIndex: 0, realmLayer: 1 }
  }

  function isArtifactOwned(id) {
    return getArtifactState(id).owned === true
  }

  function getArtifactRealmText(id) {
    const state = getArtifactState(id)
    return getRealmLayerText(state.realmIndex, state.realmLayer)
  }

  function getArtifactBonus(id) {
    const info = artifactCatalog.find(item => item.id === id)
    const state = getArtifactState(id)
    if (!info || !state.owned) return {}
    const realmRate = getRealmBattleRate(state.realmIndex, state.realmLayer)
    const layerBoost = 1 + (state.realmLayer - 1) * 0.055
    return {
      attack: Math.floor(info.base.attack * realmRate * info.growth.attack * layerBoost),
      hp: Math.floor(info.base.hp * realmRate * info.growth.hp * layerBoost),
      defense: Math.floor(info.base.defense * realmRate * info.growth.defense * layerBoost),
      ...(info.bonus || {})
    }
  }

  function getArtifactEffectText(id) {
    const bonus = getArtifactBonus(id)
    const parts = []
    if (bonus.attack) parts.push(`攻击 +${formatNumber(bonus.attack)}`)
    if (bonus.hp) parts.push(`生命 +${formatNumber(bonus.hp)}`)
    if (bonus.defense) parts.push(`防御 +${formatNumber(bonus.defense)}`)
    if (bonus.breakthrough) parts.push(`突破 +${bonus.breakthrough}%`)
    if (bonus.auto) parts.push(`自动修炼 +${Math.floor(bonus.auto * 100)}%`)
    if (bonus.manual) parts.push(`手动修炼 +${Math.floor(bonus.manual * 100)}%`)
    if (bonus.explore) parts.push(`探索 +${Math.floor(bonus.explore * 100)}%`)
    if (bonus.alchemy) parts.push(`炼丹 +${Math.floor(bonus.alchemy * 100)}%`)
    if (bonus.comprehension) parts.push(`悟性 +${bonus.comprehension}`)
    return parts.join('，') || '神器尚未苏醒'
  }

  function getArtifactUpgradeNeed(id) {
    const state = getArtifactState(id)
    const globalLevel = state.realmIndex * 9 + state.realmLayer
    return Math.max(8, Math.floor(8 + globalLevel * 3.2 + Math.pow(globalLevel, 1.35) * 1.2))
  }

  function canUpgradeArtifact(id) {
    const state = getArtifactState(id)
    if (!state.owned) return false
    if (state.realmIndex > player.realmIndex) return false
    if (state.realmIndex === player.realmIndex && state.realmLayer >= player.realmLayer) return false
    return player.techniquePoints >= getArtifactUpgradeNeed(id)
  }

  function upgradeArtifact(id) {
    const info = artifactCatalog.find(item => item.id === id)
    const state = getArtifactState(id)
    if (!info || !state.owned) {
      showFeedback('尚未获得该神器')
      return
    }
    if (state.realmIndex === player.realmIndex && state.realmLayer >= player.realmLayer) {
      showFeedback('神器境界不能超过自身')
      addLog(`《${info.name}》已成长至你当前境界上限，需自身继续突破后方可温养。`)
      return
    }
    const need = getArtifactUpgradeNeed(id)
    if (player.techniquePoints < need) {
      showFeedback('功法点不足')
      addLog(`温养《${info.name}》需要功法点 ${need}，当前仅有 ${player.techniquePoints}。`)
      return
    }
    player.techniquePoints -= need
    if (state.realmLayer < 9) state.realmLayer += 1
    else {
      state.realmIndex = Math.min(realmNames.length - 1, state.realmIndex + 1)
      state.realmLayer = 1
    }
    showFeedback('神器成长成功', 'success')
    addLog(`你以功法点 ${need} 温养《${info.name}》，神器成长至 ${getArtifactRealmText(id)}。`)
  }

  function equipArtifact(id) {
    const info = artifactCatalog.find(item => item.id === id)
    if (!info || !isArtifactOwned(id)) {
      showFeedback('尚未获得该神器')
      return
    }
    const slot = info.type || 'weapon'
    if (!inventory.equipped.artifacts) inventory.equipped.artifacts = { weapon: '', armor: '', accessory: '', talisman: '' }
    inventory.equipped.artifacts[slot] = id
    inventory.equipped.artifact = ''
    if (inventory.equipped[slot] !== undefined) inventory.equipped[slot] = ''
    showFeedback('神器已装备', 'success')
    addLog(`你祭起${getEquipmentTypeText(slot)}神器《${info.name}》，对应普通${getEquipmentTypeText(slot)}已自动卸下。其他类型神器不会被替换。`)
  }

  function isArtifactEquipped(id) {
    const info = artifactCatalog.find(item => item.id === id)
    if (!info) return false
    return getEquippedArtifactId(info.type) === id
  }

  function canEquipItem(id) {
    const info = equipmentCatalog.find(item => item.id === id)
    if (!info) return false
    return getEquipmentCount(id) > 0 && player.realmIndex >= normalizeNumber(info.unlockRealm, 0)
  }

  function isEquipmentEquipped(id) {
    const info = equipmentCatalog.find(item => item.id === id)
    return !!info && canEquipItem(id) && !getEquippedArtifactId(info.type) && inventory.equipped[info.type] === id
  }

  function getMapCardClass(map) {
    let className = ''
    if (exploration.selectedMapId === map.id) className += ' active'
    if (!isMapUnlocked(map)) className += ' locked'
    return className.trim()
  }

  function getRecipeMaterialText(recipe) {
    const parts = []
    Object.keys(recipe.materials).forEach(key => {
      const map = {
        herbs: '药材',
        ores: '矿石',
        fruits: '灵果',
        cores: '内丹',
        scrolls: '残卷'
      }
      parts.push(`${map[key]} ${recipe.materials[key]}`)
    })
    return `所需材料：${parts.join('、')}`
  }

  function switchTab(tab, tip) {
    if (tab === 'alchemy' && !alchemyUnlocked.value) {
      showFeedback('需筑基后开启')
      return
    }
    if (tab === 'sect' && !sectUnlocked.value) {
      showFeedback('需金丹后开启')
      return
    }
    activeTab.value = tab
    showFeedback(tip)
  }

  function switchInventoryTab(tab) {
    inventoryTab.value = tab
    showFeedback('分类已切换')
  }

  function cultivateByAuto() {
    ensureDailyState()
    if (!autoCultivationEnabled.value) return
    player.cultivation += autoGain.value
    if (settings.autoBreakthrough) {
      runAutoBreakthrough('auto')
    }
  }

  function manualCultivate() {
    ensureDailyState()
    if (manualCultivateLeft.value <= 0) {
      showFeedback('今日手动修炼次数已尽')
      addLog(`今日手动修炼已达上限 ${dailyManualLimit.value} 次，待每日 00:00 后恢复。`)
      return
    }
    daily.manualCultivateUsed = normalizeNumber(daily.manualCultivateUsed, 0) + 1
    player.cultivation += manualGain.value
    showFeedback(`手动修炼 ${daily.manualCultivateUsed}/${dailyManualLimit.value}`, 'success')
    addLog(`你凝神闭目，催动 ${equippedTechnique.value.name}，修为增长 ${manualGain.value} 点。本日剩余手动修炼 ${manualCultivateLeft.value} 次。`)
    if (settings.autoBreakthrough) runAutoBreakthrough('manual')
  }

  function meditateRecover() {
    const recover = battleMaxHp.value - player.hp
    player.hp = battleMaxHp.value
    player.spirit = player.maxSpirit
    showFeedback('调息完成', 'success')
    addLog(recover > 0 ? `你盘膝调息，生命恢复 ${recover} 点。灵力仅用于战斗，已归于充盈。` : '你静心调息片刻，生命与灵力皆已圆满。')
  }

  function debugAddRealmLayer() {
    if (isLastRealm.value && player.realmLayer >= 9) {
      showFeedback('已达测试上限')
      addLog('测试按钮触发：当前已达版本最高境界，无法继续提升。')
      return
    }

    if (player.realmLayer < 9) {
      player.realmLayer += 1
    } else {
      player.realmIndex += 1
      player.realmLayer = 1
      player.maxSpirit += 15 + player.realmIndex * 5
      player.maxExplorationTimes += 1
      player.explorationTimes = Math.min(player.maxExplorationTimes, player.explorationTimes + 1)
    }

    player.cultivation = 0
    player.spirit = player.maxSpirit
    autoCultivationEnabled.value = true
    showFeedback('测试提升成功', 'success')
    addLog(`测试按钮触发：境界已提升至 ${currentRealmName.value}${player.realmLayer}层，生命与灵力已回满。`)
  }

  function toggleAutoCultivation() {
    autoCultivationEnabled.value = !autoCultivationEnabled.value
    showFeedback(autoCultivationEnabled.value ? '自动修炼已开启' : '自动修炼已暂停')
    addLog(autoCultivationEnabled.value ? '你再度放开心神，开始自动吐纳天地灵气。' : '你收敛神念，暂停了自动修炼。')
  }

  function togglePauseWhenFull() {
    settings.pauseWhenFull = false
    markSettingsChanged()
    saveSilently()
    showFeedback('圆满后会继续自动修炼')
  }

  function togglePauseWhenSpiritLow() {
    settings.pauseWhenSpiritLow = !settings.pauseWhenSpiritLow
    markSettingsChanged()
    saveSilently()
    showFeedback('灵力现仅用于战斗，此设置已不再影响修炼')
  }

  function setAutoBreakthrough(enabled) {
    const nextValue = !!enabled
    if (settings.autoBreakthrough === nextValue) {
      saveSilently()
      return
    }
    settings.autoBreakthrough = nextValue
    markSettingsChanged()
    showFeedback(settings.autoBreakthrough ? '已开启自动突破' : '已关闭自动突破')
    addLog(settings.autoBreakthrough ? '你立下破境心念：修为圆满时，将自动冲击瓶颈；若持有破障丹，会自动消耗以提高成功率。' : '你暂缓破境心念，后续将手动选择突破时机。')
    saveSilently()
    if (settings.autoBreakthrough) {
      runAutoBreakthrough('setting')
      saveSilently()
    }
  }

  function toggleAutoBreakthrough() {
    setAutoBreakthrough(!settings.autoBreakthrough)
  }

  function equipTechnique(id) {
    if (player.equippedTechniqueId === id) {
      showFeedback('该功法已装备')
      addLog('该功法已在运转，无需重复切换。')
      return
    }
    player.equippedTechniqueId = id
    const found = techniques.find(item => item.id === id)
    showFeedback('功法已切换')
    addLog(`你心念一转，改修《${found?.name || '无名功法'}》，灵息流转方式随之改变。`)
  }

  function getTechniqueUpgradeNeed(id) {
    const currentLevel = player.techniqueLevels[id] || 1
    return currentLevel * 2
  }

  function upgradeTechnique(id) {
    const currentLevel = player.techniqueLevels[id] || 1
    const maxLevel = getTechniqueMaxLevel()
    if (currentLevel >= maxLevel) {
      showFeedback(`已达${currentRealmName.value}上限 Lv.${maxLevel}`)
      addLog(`《${techniques.find(item => item.id === id)?.name || '功法'}》已达当前境界上限，突破后上限提升。`)
      return
    }
    const need = getTechniqueUpgradeNeed(id)
    if (player.techniquePoints < need) {
      showFeedback('功法点不足')
      addLog(`功法点不足，升级需要 ${need} 点。`)
      return
    }
    player.techniquePoints -= need
    player.techniqueLevels[id] = currentLevel + 1
    const found = techniques.find(item => item.id === id)
    showFeedback('功法升级成功', 'success')
    addLog(`你参悟《${found?.name || '功法'}》更深一层，已提升至 Lv.${player.techniqueLevels[id]}。`)
  }

  function upgradeBattleSkill(id) {
    const skill = battleSkills.find(item => item.id === id)
    if (!skill) {
      showFeedback('技能不存在')
      return
    }
    if (player.realmIndex < normalizeNumber(skill.unlockRealm, 0)) {
      showFeedback('境界不足，尚未领悟')
      return
    }
    const maxLevel = getBattleSkillMaxLevel(skill)
    if (getBattleSkillLevel(skill.id) >= maxLevel) {
      showFeedback(`已达${currentRealmName.value}上限 Lv.${maxLevel}，请突破后再升级`)
      addLog(`「${skill.name}」已达当前境界等级上限 Lv.${maxLevel}，突破至下一大境界后上限提升。`)
      return
    }
    const need = getBattleSkillUpgradeNeed(skill)
    if (player.techniquePoints < need) {
      showFeedback('功法点不足')
      addLog(`升级「${skill.name}」需要功法点 ${need}，当前仅有 ${player.techniquePoints}。`)
      return
    }
    player.techniquePoints -= need
    player.skillLevels[skill.id] = getBattleSkillLevel(skill.id) + 1
    showFeedback('技能升级成功', 'success')
    addLog(`你消耗功法点 ${need}，将「${skill.name}」提升至 Lv.${player.skillLevels[skill.id]}。`)
  }


  function gainStarterPill() {
    player.breakthroughPills += 1
    showFeedback('已获得突破丹', 'success')
    addLog('你从储物袋角落翻出一枚新手突破丹，或可在关键时刻助你破境。')
  }

  function getCultivationPillDef(key) {
    return cultivationPillDefs.find(item => item.key === key) || cultivationPillDefs[0]
  }

  function getCultivationPillGain(key) {
    const pill = getCultivationPillDef(key)
    if (!pill) return 0
    if (pill.realmIndex > player.realmIndex) return 0
    const realmGap = Math.max(0, player.realmIndex - pill.realmIndex)
    const baseLayerCost = 500 * Math.pow(3.2, pill.realmIndex)
    const sameRealmGain = Math.floor(baseLayerCost * 0.10)
    return Math.max(1, Math.floor(sameRealmGain * Math.pow(0.10, realmGap)))
  }

  function canUseCultivationPill(key) {
    const pill = getCultivationPillDef(key)
    return pill && pill.realmIndex <= player.realmIndex
  }

  function useCultivationPill(key, qty = 1) {
    const pill = getCultivationPillDef(key)
    if (!pill) {
      showFeedback('丹药不存在')
      return
    }
    const amount = Math.max(1, Math.min(normalizeNumber(qty, 1), inventory.pills[key] || 0))
    if ((inventory.pills[key] || 0) <= 0) {
      showFeedback(`${pill.name}不足`)
      return
    }
    if (!canUseCultivationPill(key)) {
      showFeedback('境界不足，不能吸收高阶丹药')
      addLog(`你试图吸收${pill.name}，却觉药力过盛。高阶丹药需达到${pill.realmText}后方可服用。`)
      return
    }
    const gainPer = getCultivationPillGain(key)
    const totalGain = gainPer * amount
    inventory.pills[key] -= amount
    player.cultivation += totalGain
    showFeedback('修为提升', 'success')
    const lowText = pill.realmIndex < player.realmIndex ? '低阶丹药药力折损，' : ''
    if (amount > 1) {
      addLog(`你批量服下 ${amount} 枚${pill.name}，${lowText}修为固定增长 ${formatNumber(totalGain)} 点。`)
    } else {
      addLog(`你服下一枚${pill.name}，${lowText}修为固定增长 ${formatNumber(totalGain)} 点。`)
    }
    if (settings.autoBreakthrough) runAutoBreakthrough('pill')
  }

  function useQiCondensePill() {
    useCultivationPill('qiCondense')
  }

  function useSpiritRecoverPill() {
    useCultivationPill('spiritRecover')
  }

  function useAttributePill(type, qty = 1) {
    if (inventory.pills[type] <= 0) {
      showFeedback('丹药不足')
      return
    }
    const cap = getAttributeMax()
    const nameMap = { bone: '洗髓丹', comprehension: '悟心丹', fortune: '天缘丹' }
    let maxCanUse = 0
    if (type === 'bone') maxCanUse = Math.max(0, cap - player.bone)
    if (type === 'comprehension') maxCanUse = Math.max(0, cap - player.comprehension)
    if (type === 'fortune') maxCanUse = Math.max(0, cap - player.fortune)
    if (maxCanUse <= 0) {
      showFeedback(`${type === 'bone' ? '根骨' : type === 'comprehension' ? '悟性' : '福缘'}已达${currentRealmName.value}上限 ${cap}`)
      return
    }
    const amount = Math.max(1, Math.min(normalizeNumber(qty, 1), inventory.pills[type], maxCanUse))
    inventory.pills[type] -= amount
    const attrMap = { bone: '根骨', comprehension: '悟性', fortune: '福缘' }
    if (type === 'bone') player.bone += amount
    if (type === 'comprehension') player.comprehension += amount
    if (type === 'fortune') player.fortune += amount
    showFeedback('属性已提升', 'success')
    addLog(`你批量服下 ${amount} 枚${nameMap[type]}，${attrMap[type]}提升 ${amount} 点。`)
  }

  function getBreakthroughCarryRate(willCrossMajor) {
    return willCrossMajor ? 0.5 : 0.8
  }

  function applyBreakthroughSuccess(beforeRealmIndex, beforeRealmLayer, beforeNeed, beforeCultivation) {
    const willCrossMajor = beforeRealmLayer >= 9 && beforeRealmIndex < realmNames.length - 1
    const overflow = Math.max(0, beforeCultivation - beforeNeed)
    const carryRate = getBreakthroughCarryRate(willCrossMajor)
    const carriedCultivation = Math.floor(overflow * carryRate)

    player.techniquePoints += 2 + beforeRealmIndex
    player.maxSpirit += 15 + beforeRealmIndex * 5
    player.spirit = player.maxSpirit
    autoCultivationEnabled.value = true

    if (beforeRealmLayer < 9) {
      player.realmLayer += 1
      player.cultivation = carriedCultivation
      addLog(`灵台震颤，气海轰鸣——你突破成功，已踏入 ${currentRealmName.value}${player.realmLayer}层！溢出修为按小境界 80% 折算，带入 ${formatNumber(carriedCultivation)} 点。`)
      return true
    }

    if (!isLastRealm.value) {
      player.realmIndex += 1
      player.realmLayer = 1
      player.cultivation = carriedCultivation
      // 大境界突破应有明显肉身与法力跃迁，避免战斗数值只靠显示公式变化。
      player.maxHp = Math.floor(player.maxHp * 1.32 + 45 + player.realmIndex * 28)
      player.hp = player.maxHp
      player.attack = Math.floor(player.attack * 1.28 + 8 + player.realmIndex * 5)
      player.defense = Math.floor(player.defense * 1.24 + 4 + player.realmIndex * 3)
      player.bone = Math.min(getAttributeMax(), player.bone + 2)
      player.comprehension = Math.min(getAttributeMax(), player.comprehension + 2)
      player.fortune = Math.min(getAttributeMax(), player.fortune + 1)
      player.maxExplorationTimes += 1
      player.explorationTimes = Math.min(player.maxExplorationTimes, player.explorationTimes + 1)
      addLog(`天光垂落，雷音隐鸣，你成功跨越大境界，迈入 ${realmNames[player.realmIndex]}！溢出修为按大境界 50% 折算，带入 ${formatNumber(carriedCultivation)} 点。`)
      return true
    }

    player.cultivation = Math.max(0, beforeCultivation)
    addLog('你已触及当前版本所能达到的极境，后续仙路待后续继续续写。')
    return false
  }

  function tryBreakthrough(options = {}) {
    const silent = options.silent === true
    if (!canBreakthrough.value) {
      if (!silent) {
        showFeedback('突破条件不足')
        addLog('突破条件尚未满足，强行为之只会损伤根基。')
      }
      return false
    }

    const beforeRealmIndex = player.realmIndex
    const beforeRealmLayer = player.realmLayer
    const beforeNeed = currentLayerNeed.value
    const beforeCultivation = player.cultivation

    const successRateBeforeRoll = breakthroughSuccessRate.value
    const usedBreakthroughPill = player.breakthroughPills > 0
    if (usedBreakthroughPill) player.breakthroughPills -= 1

    const roll = Math.random() * 100
    if (roll <= successRateBeforeRoll) {
      const advanced = applyBreakthroughSuccess(beforeRealmIndex, beforeRealmLayer, beforeNeed, beforeCultivation)
      if (!silent) showFeedback(advanced ? '突破成功' : '已达巅峰', advanced ? 'success' : 'none')
      if (usedBreakthroughPill) addLog('本次突破消耗破障丹 1 枚，突破成功率获得额外加成。')
      return advanced
    }

    const loss = Math.floor(beforeNeed * 0.2)
    player.cultivation = Math.max(0, player.cultivation - loss)
    if (!silent) showFeedback('突破失败')
    addLog(`你强冲玄关，却被反震而回。突破失败，损失修为 ${loss} 点。${usedBreakthroughPill ? '本次已消耗破障丹 1 枚用于提高成功率。' : ''}`)
    return false
  }

  function runAutoBreakthrough(source = 'auto') {
    let successCount = 0
    let attemptCount = 0
    while (settings.autoBreakthrough && canBreakthrough.value && !(isLastRealm.value && player.realmLayer >= 9) && attemptCount < 12) {
      attemptCount += 1
      const success = tryBreakthrough({ silent: true })
      if (!success) break
      successCount += 1
    }
    if (successCount > 0) {
      showFeedback(successCount === 1 ? '自动突破完成' : `连续自动突破 ${successCount} 次`, 'success')
    } else if (attemptCount > 0 && source !== 'auto') {
      showFeedback('自动突破失败')
    }
    if (attemptCount > 0 && source === 'offline') addLog(`离线修炼期间，资源满足条件，已自动尝试突破 ${attemptCount} 次，成功 ${successCount} 次。`)
  }

  function applyOfflineCultivation(reason = '进入游戏') {
    if (!autoCultivationEnabled.value) return
    const lastSaveAt = normalizeNumber(lastOfflineCheckpoint.value, Date.now())
    const now = Date.now()
    const elapsedSeconds = Math.floor((now - lastSaveAt) / 1000)
    if (elapsedSeconds < 10) return

    const cappedSeconds = Math.min(elapsedSeconds, 12 * 60 * 60)
    const gain = cappedSeconds * autoGain.value
    if (gain <= 0) {
      lastOfflineCheckpoint.value = now
      saved.lastSaveAt = now
      saveSilently()
      return
    }

    player.cultivation += gain
    addLog(`${reason}结算：离线 ${formatOfflineDuration(elapsedSeconds)}，获得修为 ${formatNumber(gain)} 点。`)
    if (settings.autoBreakthrough) runAutoBreakthrough('offline')
    lastOfflineCheckpoint.value = now
    saved.lastSaveAt = now
    saveSilently()
  }

  function formatOfflineDuration(seconds) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}小时${m}分钟`
    if (m > 0) return `${m}分钟${s}秒`
    return `${s}秒`
  }

  function isMapUnlocked(map) {
    if (player.realmIndex > map.need.realmIndex) return true
    if (player.realmIndex < map.need.realmIndex) return false
    return player.realmLayer >= map.need.layer
  }

  function selectMap(id) {
    const map = explorationMaps.find(item => item.id === id)
    if (!map || !isMapUnlocked(map)) {
      showFeedback('该地图尚未解锁')
      return
    }
    exploration.selectedMapId = id
    showFeedback(`已选择${map.name}`)
  }

  function selectDifficulty(id) {
    exploration.selectedDifficulty = id
    const found = difficulties.find(item => item.id === id)
    showFeedback(`难度切换为${found?.name || '普通'}`)
  }

  function recoverExplorationTimes() {
    const cost = 20
    if (inventory.spiritStones < cost) {
      showFeedback('灵石不足')
      return
    }
    if (player.explorationTimes >= player.maxExplorationTimes) {
      showFeedback('探索次数已满')
      return
    }
    inventory.spiritStones -= cost
    player.explorationTimes = Math.min(player.maxExplorationTimes, player.explorationTimes + 3)
    showFeedback('次数已恢复', 'success')
    addLog(`你以 ${cost} 枚灵石整备行囊，探索次数恢复 3 次。`)
  }

  function useExploreTalisman(qty = 1) {
    if (inventory.items.exploreTalisman <= 0) {
      showFeedback('探索符不足')
      return
    }
    const amount = Math.max(1, Math.min(normalizeNumber(qty, 1), inventory.items.exploreTalisman))
    inventory.items.exploreTalisman -= amount
    const extra = amount * 2
    player.explorationTimes = Math.min(player.maxExplorationTimes + extra, player.explorationTimes + extra)
    showFeedback('次数增加', 'success')
    if (amount > 1) {
      addLog(`你批量使用 ${amount} 张探索符，额外获得 ${extra} 次探索机会。`)
    } else {
      addLog('你使用一张探索符，额外获得 2 次探索机会。')
    }
  }

  function grantEquipment(id, count = 1) {
    if (id === 'chaosPearl') {
      inventory.special.chaosPearl += count
      inventory.equipments.chaosPearl += count
      return
    }
    inventory.equipments[id] = (inventory.equipments[id] || 0) + count
  }

  function grantArtifact(id) {
    const info = artifactCatalog.find(item => item.id === id)
    if (!info) return false
    const state = getArtifactState(id)
    if (state.owned) return false
    inventory.artifacts[id] = { owned: true, realmIndex: 0, realmLayer: 1 }
    addLog(`天地异象一闪而逝，你竟获得神器《${info.name}》。此物可消耗功法点成长，但不能超过你的自身境界。`)
    return true
  }

  function tryGrantRandomArtifact(sourceRealmIndex = player.realmIndex) {
    const candidates = artifactCatalog.filter(item => !isArtifactOwned(item.id))
    if (!candidates.length) return ''
    const realmFactor = 1 + Math.max(0, sourceRealmIndex) * 0.18
    const fortuneFactor = 1 + actualFortune.value * 0.015
    const found = candidates.find(item => Math.random() < item.dropRate * realmFactor * fortuneFactor)
    if (!found) return ''
    grantArtifact(found.id)
    return `神器《${found.name}》 +1`
  }

  function grantRecipeFragment(count = 1) {
    inventory.special.recipeFragment += count
  }

  function maybeUnlockRecipeFromEvent() {
    const locked = recipes.filter(item => !availableRecipes.value.find(v => v.id === item.id))
    if (!locked.length) return ''
    const one = locked[Math.floor(Math.random() * locked.length)]
    if (one.unlockRealm > player.realmIndex) {
      const substitutePoints = Math.max(3, Math.floor((one.unlockRealm - player.realmIndex) * 4 + Math.random() * 6))
      player.techniquePoints += substitutePoints
      return `获得一份高境界丹方，暂时无法参悟，转化为功法点 +${substitutePoints}`
    }
    alchemy.recipeUnlocks.push(one.id)
    return `并意外解锁丹方《${one.name}》`
  }

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)]
  }


  function getMapSceneTexts(mapId) {
    const scenes = {
      qingzhu: ['青竹林中雾色如纱，竹叶承露，细碎灵光在叶脉间流转。', '你听见竹海深处有泉声叮咚，似在引你绕开凡尘路径。', '林间有白鹿足迹一闪而逝，留下淡淡草木清香。'],
      heifeng: ['黑风山阴云低垂，岩缝中渗出冷意，妖气与矿脉气息纠缠不散。', '山道两侧兽骨半埋，偶有黑风卷起砂石，拍在护体灵光上。', '你沿着矿脉震动前行，远处山腹传来沉闷回响。'],
      lingxi: ['灵犀谷古藤垂落，谷底灵雾如潮，偶有符文在石壁上一闪即灭。', '你踏入谷中，耳畔似有前人低语，字句破碎却暗含道韵。', '一条溪流横过山道，水面倒映出的却不是你的影子。'],
      yuanying: ['元婴秘境天象反复，上一息星河垂落，下一息雷火横空。', '秘境深处空间折叠，脚下一步，仿佛跨过百里山川。', '你以神识探路，却见远处浮现残破仙宫的轮廓。'],
      huashen: ['神识海上无波无浪，却有万千心念在水下游走。', '你放出一缕神识，远处雾中立刻回荡起自己的声音。', '海面浮现破碎符文，似是前人化神时遗留的心印。'],
      lianxu: ['虚空古道半截悬于裂隙之上，脚下星屑缓缓倒流。', '你每踏出一步，周围景象便虚实转换，似有百重空间重叠。', '远方古碑只剩影子，却仍散发出足以割裂神识的锋芒。'],
      heti: ['归元天阙残宫高悬云端，宫门两侧仍有道火未灭。', '你听见殿中钟声一响，周身真元仿佛被牵引着归入一点。', '破碎玉阶上浮现合体修士留下的周天纹路。'],
      dacheng: ['星海仙墟中残星沉浮，旧日仙宫碎片像岛屿般漂在虚空。', '大道气机自废墟深处溢出，令你的护体灵光微微震颤。', '一块星碑横卧前方，碑面每一道裂纹都像一门残缺神通。'],
      dujie: ['劫雷天渊雷云倒悬，紫白雷光在深渊中凝成树状纹路。', '你屏息走过雷痕石桥，耳边全是天劫余音。', '天渊深处一缕雷火不灭，仿佛在等待渡劫者前来取走。']
    }
    return scenes[mapId] || scenes.qingzhu
  }


  function getExploreEventPool() {
    const mapEventPools = {
      qingzhu: ['herb', 'herb', 'traveler', 'shrine', 'spiritSpring', 'equipment'],
      heifeng: ['beast', 'beast', 'cave', 'trap', 'treasure', 'equipment'],
      lingxi: ['scroll', 'shrine', 'epiphany', 'equipment', 'hiddenRealm', 'bandit'],
      yuanying: ['storm', 'hiddenRealm', 'equipment', 'oldTomb', 'daoStorm', 'bandit'],
      huashen: ['daoStorm', 'meteorite', 'hiddenRealm', 'equipment', 'storm', 'oldTomb'],
      lianxu: ['meteorite', 'hiddenRealm', 'daoStorm', 'equipment', 'oldTomb', 'storm'],
      heti: ['daoStorm', 'hiddenRealm', 'equipment', 'oldTomb', 'meteorite', 'storm'],
      dacheng: ['daoStorm', 'equipment', 'oldTomb', 'hiddenRealm', 'meteorite', 'storm'],
      dujie: ['daoStorm', 'meteorite', 'equipment', 'oldTomb', 'hiddenRealm', 'storm']
    }
    const base = ['herb', 'treasure', 'traveler', 'scroll', 'shrine', 'trap', 'cave', 'market', 'wanderingCultivator', 'spiritEruption']
    if (selectedMap.value.need.realmIndex >= 1) base.push('beast', 'equipment', 'spiritSpring', 'hiddenCave', 'spiritStoneRich')
    if (selectedMap.value.need.realmIndex >= 2) base.push('epiphany', 'hiddenRealm', 'oldTomb', 'bandit', 'tempBuff', 'fragmentComprehend')
    if (selectedMap.value.need.realmIndex >= 3) base.push('storm', 'daoStorm', 'meteorite', 'pillFind', 'ancientRuin')
    base.push('combat')
    return base.concat(mapEventPools[selectedMap.value.id] || [])
  }


  function pushExploreStep(steps, text) {
    steps.push(text)
  }

  function buildExploreSummary(steps, rewards) {
    const rewardText = rewards.length ? rewards.join('、') : '并无明显收获'
    return `本次探索共经历 ${steps.length} 段行程，最终获得：${rewardText}。`
  }

  function snapshotExploreMutableState() {
    return {
      player: JSON.parse(JSON.stringify(player)),
      inventory: JSON.parse(JSON.stringify(inventory)),
      alchemy: JSON.parse(JSON.stringify(alchemy))
    }
  }

  function restoreExploreMutableState(state) {
    Object.assign(player, state.player)
    Object.assign(inventory, state.inventory)
    Object.assign(alchemy, state.alchemy)
  }

  function clearExplorationPlaybackTimer() {
    if (explorationPlaybackTimer) {
      clearInterval(explorationPlaybackTimer)
      explorationPlaybackTimer = null
    }
  }

  function revealNextExploreStep() {
    const outcome = pendingExplorationOutcome.value
    if (!outcome) return
    const step = outcome.steps[outcome.nextIndex]
    if (!step) {
      finishExplorationPlayback(false)
      return
    }
    exploration.currentProcess.push(step)
    addExplorationLog(step)
    outcome.nextIndex += 1
    if (outcome.nextIndex >= outcome.steps.length) {
      finishExplorationPlayback(false)
    }
  }

  function beginExplorationPlayback(outcome) {
    clearExplorationPlaybackTimer()
    exploreModalVisible.value = true
    pendingExplorationOutcome.value = { ...outcome, nextIndex: 0 }
    isExploring.value = true
    exploration.currentProcess = []
    exploration.lastResult = '探索进行中……请观看过程，结束后将统一显示探索结果。'
    revealNextExploreStep()
    explorationPlaybackTimer = setInterval(() => {
      revealNextExploreStep()
    }, 900)
  }

  function finishExplorationPlayback(skipped) {
    const outcome = pendingExplorationOutcome.value
    if (!outcome) return
    clearExplorationPlaybackTimer()

    if (skipped) {
      const hiddenSteps = outcome.steps.slice(outcome.nextIndex)
      hiddenSteps.forEach(step => addExplorationLog(step))
      exploration.currentProcess = outcome.steps.slice()
    }

    restoreExploreMutableState(outcome.finalState)
    exploration.lastResult = outcome.summary
    addExplorationLog(outcome.summary)
    addLog(outcome.logText)
    pendingExplorationOutcome.value = null
    isExploring.value = false
    showFeedback(skipped ? '已跳过并结算' : '探索完成', 'success')
  }

  function skipExplorationProcess() {
    if (!isExploring.value) return
    // 实时模式下直接完成所有剩余事件
    if (explorationFlow.active) {
      clearExploreEventTimer()
      // 快速处理剩余事件
      while (explorationFlow.active && explorationFlow.eventIndex < explorationFlow.eventCount) {
        const event = pickRandom(explorationFlow.events)
        applyExploreEvent(event, explorationFlow, true)
        explorationFlow.eventIndex++
      }
      finishExplorationFlow()
      return
    }
    finishExplorationPlayback(true)
  }

  function closeExploreModal() {
    if (isExploring.value) {
      showFeedback('探索尚未结束，可先跳过过程')
      return
    }
    exploreModalVisible.value = false
  }

  function clearExploreEventTimer() {
    if (exploreEventTimer) {
      clearTimeout(exploreEventTimer)
      exploreEventTimer = null
    }
  }

  function applyExploreEvent(event, flow, skipBattle = false) {
    const rewardBase = flow.rewardBase
    const steps = flow.steps
    const rewards = flow.rewards

    // 战斗事件：暂停并跳转战斗页（跳过模式则直接跳过）
    if (event === 'beast' || event === 'bandit' || event === 'combat') {
      if (skipBattle) {
        pushExploreStep(steps, '远处隐现敌影，你趁其不备快速绕过，未与之纠缠。')
        return 'ok'
      }
      const enemyType = event === 'bandit' ? 'cultivator' : 'beast'
      const enemy = createBattleEnemy(enemyType, {
        rewardRate: selectedDifficulty.value.rewardRate,
        combatRate: getDifficultyCombatRate(selectedDifficulty.value.id)
      })
      pushExploreStep(steps, `${enemyType === 'cultivator' ? '树后闪出一名' : '忽闻一声咆哮，'}${enemy.name}（${enemy.realmText || '未知境界'}）${enemyType === 'cultivator' ? '拦住了你的去路！' : '从暗处窜出拦住去路！'}`)
      exploration.currentProcess = steps.slice()
      exploration.lastResult = '战斗触发中……'
      explorationFlow.active = false
      clearExploreEventTimer()
      saveSilently()
      safeSetStorage('__xiuxian_pending_explore__', JSON.stringify({
        mapId: flow.mapId,
        difficultyId: flow.difficultyId,
        steps,
        rewards,
        events: flow.events,
        eventIndex: flow.eventIndex + 1,
        eventCount: flow.eventCount,
        rewardBase,
        afterCostState: flow.afterCostState,
        successRollPassed: flow.successRollPassed,
        createdAt: Date.now()
      }))
      goBattlePage(enemy, { source: 'exploration', returnUrl: '/pages/explore/explore' })
      return 'battle'
    }

    if (event === 'herb') {
      const herbs = Math.max(1, Math.floor((2 + actualFortune.value * 0.15 + Math.random() * 2) * rewardBase))
      const fruits = Math.max(0, Math.floor((Math.random() + actualFortune.value * 0.05) * rewardBase))
      inventory.herbs += herbs
      inventory.fruits += fruits
      rewards.push(`药材 +${herbs}`)
      if (fruits > 0) rewards.push(`灵果 +${fruits}`)
      pushExploreStep(steps, `你拨开乱石旁的藤蔓，发现数株带露灵草，采得药材 ${herbs} 份${fruits > 0 ? `、灵果 ${fruits} 枚` : ''}。`)
    } else if (event === 'treasure') {
      const stoneGain = Math.max(12, Math.floor((18 + actualFortune.value * 1.2 + Math.random() * 10) * rewardBase))
      inventory.spiritStones += stoneGain
      rewards.push(`灵石 +${stoneGain}`)
      pushExploreStep(steps, `你发现一处隐蔽石匣，内藏灵石 ${stoneGain} 枚。`)
    } else if (event === 'scroll') {
      const scrolls = Math.max(1, Math.floor((1 + actualFortune.value * 0.1 + Math.random()) * rewardBase))
      inventory.scrolls += scrolls
      rewards.push(`残卷 +${scrolls}`)
      pushExploreStep(steps, `你在断碑旁拾得残卷 ${scrolls} 页，上面记载着残缺古法。`)
    } else if (event === 'equipment') {
      const candidates = equipmentCatalog.filter(item => item.type !== 'artifact' && item.unlockRealm <= player.realmIndex + 1)
      if (candidates.length > 0) {
        const eq = pickRandom(candidates)
        grantEquipment(eq.id, 1)
        rewards.push(`装备《${eq.name}》 +1`)
        pushExploreStep(steps, `你在一处遗迹中发现了${eq.name}，品相尚佳收了起来。`)
      } else {
        pushExploreStep(steps, '你找到一处残破遗器，但品相太差，随手弃之。')
      }
    } else {
      const genericReward = Math.max(5, Math.floor((10 + actualFortune.value * 0.5) * rewardBase))
      inventory.spiritStones += genericReward
      rewards.push(`灵石 +${genericReward}`)
      pushExploreStep(steps, `探索中略有收获，获得灵石 ${genericReward} 枚。`)
    }
    return 'ok'
  }

  function scheduleNextExploreEvent() {
    clearExploreEventTimer()
    exploreEventTimer = setTimeout(() => {
      processNextExploreEvent()
    }, 1100)
  }

  function processNextExploreEvent() {
    if (!explorationFlow.active) return
    const flow = explorationFlow

    if (flow.eventIndex >= flow.eventCount) {
      finishExplorationFlow()
      return
    }

    const event = pickRandom(flow.events)
    const result = applyExploreEvent(event, flow)

    if (result === 'battle') return

    exploration.currentProcess = flow.steps.slice()
    exploration.lastResult = `探索进行中（${flow.eventIndex + 1}/${flow.eventCount}）`
    flow.eventIndex++
    addExplorationLog(flow.steps[flow.steps.length - 1])

    scheduleNextExploreEvent()
  }

  function finishExplorationFlow() {
    const flow = explorationFlow
    if (!flow.active) return
    clearExploreEventTimer()

    const steps = flow.steps
    const rewards = flow.rewards
    const mapName = (explorationMaps.find(m => m.id === flow.mapId) || selectedMap.value).name
    const difficultyId = flow.difficultyId

    // 应用血量损失
    const hpLossPerEventBase = difficultyId === 'abyss' ? 0.30 : difficultyId === 'hard' ? 0.18 : 0.07
    const totalHpLossPercent = Math.min(0.9, hpLossPerEventBase * flow.eventCount + Math.random() * 0.12)
    const totalHpLoss = Math.floor(battleMaxHp.value * totalHpLossPercent)
    const remainingHp = battleMaxHp.value - totalHpLoss

    if (remainingHp <= 0) {
      const hasEscapeTalisman = normalizeNumber(inventory.items.escapeTalisman, 0) > 0
      if (hasEscapeTalisman) {
        inventory.items.escapeTalisman -= 1
        pushExploreStep(steps, '你身负重伤，危急之中捏碎遁走符，灵光一闪侥幸逃脱。')
      } else {
        const lossRateMap = { normal: 0.05, hard: 0.10, abyss: 0.18 }
        const lossRate = lossRateMap[difficultyId] || 0.05
        const cultivationLoss = Math.floor(player.cultivation * lossRate)
        player.cultivation = Math.max(0, player.cultivation - cultivationLoss)
        rewards.push(`修为因重伤散失 -${cultivationLoss}`)
        pushExploreStep(steps, `你力竭倒地、真元溃散，醒来时修为已散去 ${cultivationLoss} 点，只得忍痛撤离。`)
      }
    } else {
      player.hp = Math.max(1, remainingHp)
    }

    pushExploreStep(steps, `天色渐晚，你收束气息离开${mapName}，将所得一一收入储物袋。`)
    const summary = buildExploreSummary(steps, rewards)

    // 恢复扣费前状态，再应用最终 HP
    const savedAfterCost = flow.afterCostState
    if (savedAfterCost) {
      restoreExploreMutableState(savedAfterCost)
      if (remainingHp > 0) player.hp = Math.max(1, remainingHp)
    }

    exploration.lastResult = summary
    exploration.currentProcess = steps.slice()
    isExploring.value = false
    explorationFlow.active = false
    showFeedback('探索完成', 'success')
    addLog(`你完成了一次${mapName}探索，共经历 ${steps.length} 段随机过程。`)
    addExplorationLog(summary)
    saveSilently()
  }

  function continueExplorationAfterBattle() {
    // 仅在确实有未完成的战斗探索时才处理
    const raw = safeGetStorage('__xiuxian_pending_explore__')
    if (!raw) return false
    // 如果探索流已活跃则忽略（防止重复恢复）
    if (explorationFlow.active) return false
    safeRemoveStorage('__xiuxian_pending_explore__')
    let pending = null
    try {
      pending = typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch (e) { return false }
    if (!pending || !pending.steps) return false
    if (pending.createdAt && Date.now() - pending.createdAt > 5 * 60 * 1000) return false

    const steps = pending.steps || []
    const rewards = pending.rewards || []
    const battleWon = battle.enemyHp <= 0 && battle.playerHp > 0
    const battleFled = battle.currentProcess && battle.currentProcess.some(s => s.includes('遁走') || s.includes('逃跑成功'))

    // 恢复探索流
    Object.assign(explorationFlow, {
      active: true,
      mapId: pending.mapId || selectedMap.value.id,
      difficultyId: pending.difficultyId || selectedDifficulty.value.id,
      steps,
      rewards,
      events: pending.events || [],
      eventIndex: pending.eventIndex || 0,
      eventCount: pending.eventCount || 0,
      rewardBase: pending.rewardBase || (selectedDifficulty.value.rewardRate * (1 + sectBonus.value.explore) * 1.75),
      afterCostState: pending.afterCostState || snapshotExploreMutableState(),
      successRollPassed: pending.successRollPassed !== false
    })

    if (battleFled) {
      pushExploreStep(steps, '你虚晃一记，借着余波遁入林中，暂时脱离战斗。')
      exploration.currentProcess = steps.slice()
      exploration.lastResult = '战斗中逃跑，探索中断。'
      finishExplorationFlow()
      return true
    }

    if (battleWon) {
      pushExploreStep(steps, '战斗结束，你搜刮敌人遗物，继续深入探索。')
      if (battle.lastResult) rewards.push(battle.lastResult)
    } else {
      pushExploreStep(steps, '力战之后负伤不轻，你决定暂避锋芒，收拾行装返回。')
      exploration.currentProcess = steps.slice()
      exploration.lastResult = '战斗失利，探索中断。'
      finishExplorationFlow()
      return true
    }

    // 战斗胜利，继续探索
    isExploring.value = true
    exploreModalVisible.value = true
    explorationFlow.active = true
    exploration.currentProcess = steps.slice()
    exploration.lastResult = `探索进行中（${explorationFlow.eventIndex}/${explorationFlow.eventCount}）`
    scheduleNextExploreEvent()
    return true
  }

  function startExploration() {
    if (isExploring.value) {
      showFeedback('探索正在进行')
      return
    }
    if (!isMapUnlocked(selectedMap.value)) {
      showFeedback('地图尚未解锁')
      exploration.lastResult = '你望向远方山野，只觉禁制未开，暂时无法踏足。'
      exploration.currentProcess = [exploration.lastResult]
      return
    }
    if (player.explorationTimes <= 0) {
      showFeedback('探索次数不足')
      exploration.lastResult = '你今日脚程已尽，暂时无法继续远行。'
      exploration.currentProcess = [exploration.lastResult]
      return
    }
    player.explorationTimes -= 1
    exploration.totalExploreCount += 1
    const afterCostState = snapshotExploreMutableState()
    showFeedback('探索开始')

    const steps = []
    const rewards = []
    const mapName = selectedMap.value.name
    const diffName = selectedDifficulty.value.name
    const rewardBase = selectedDifficulty.value.rewardRate * (1 + sectBonus.value.explore) * 1.75

    pushExploreStep(steps, `你整备行囊，踏入${mapName}。本次选择${diffName}难度，山中气机比往日更难捉摸。`)
    getMapSceneTexts(selectedMap.value.id).sort(() => Math.random() - 0.5).slice(0, 2).forEach(text => pushExploreStep(steps, text))

    const successRoll = Math.random() * 100
    if (successRoll > explorationSuccessRate.value) {
      pushExploreStep(steps, '你误触残破禁制，乱流震荡神识，险些迷失方向。')
      pushExploreStep(steps, '你不再贪功，沿原路退回，记下此处方位，待修为更深时再来。')
      restoreExploreMutableState(afterCostState)
      exploreModalVisible.value = true
      exploration.currentProcess = steps.slice()
      exploration.lastResult = '探索失利：误入险地，虽及时退回，但未能带出更多收获。'
      isExploring.value = false
      showFeedback('探索失利', 'none')
      addLog(`你在${mapName}探索失利，受了些许反噬。`)
      return
    }

    const cultivationReward = Math.floor(explorationCultivationReward.value + Math.random() * 25)
    player.cultivation += cultivationReward
    rewards.push(`修为 +${cultivationReward}`)
    pushExploreStep(steps, `你顺势运转周天，将沿途灵气炼入气海，修为增长 ${cultivationReward} 点。`)

    const eventCount = selectedDifficulty.value.id === 'abyss' ? 5 : selectedDifficulty.value.id === 'hard' ? 4 : 3
    const events = getExploreEventPool()

    Object.assign(explorationFlow, {
      active: true,
      mapId: selectedMap.value.id,
      difficultyId: selectedDifficulty.value.id,
      steps,
      rewards,
      events,
      eventIndex: 0,
      eventCount,
      rewardBase,
      afterCostState,
      successRollPassed: true
    })

    isExploring.value = true
    exploreModalVisible.value = true
    exploration.currentProcess = steps.slice()
    exploration.lastResult = '探索进行中（0/' + eventCount + '）'
    scheduleNextExploreEvent()
  }

  function clampPlayerHp() {
    player.hp = Math.max(1, Math.min(battleMaxHp.value, normalizeNumber(player.hp, battleMaxHp.value)))
  }

  function syncBattleVitalsAfterLoad() {
    const maxHp = Math.max(1, normalizeNumber(battleMaxHp.value, player.maxHp || 1))
    const hp = normalizeNumber(player.hp, maxHp)
    // 现在战斗结束会自动回满血量；切换页面时重新读档不应把生命裁回旧的 player.maxHp。
    // 因此非战斗状态下统一按当前计算生命上限校正，避免探索页显示 180 / 600 这类异常。
    if (!battle.isBattling) {
      player.hp = maxHp
      player.spirit = Math.max(0, Math.min(player.maxSpirit, normalizeNumber(player.spirit, player.maxSpirit)))
      return
    }
    player.hp = Math.max(1, Math.min(maxHp, hp))
    player.spirit = Math.max(0, Math.min(player.maxSpirit, normalizeNumber(player.spirit, player.maxSpirit)))
  }

  function recoverBattleState() {
    const hpGain = battleMaxHp.value - player.hp
    player.hp = battleMaxHp.value
    player.spirit = player.maxSpirit
    showFeedback('调息完成', 'success')
    addLog(hpGain > 0 ? `你盘膝调息，恢复生命 ${hpGain} 点；灵力作为战斗资源已回满。` : '你略作调息，生命与灵力皆处于圆满。')
  }


  function toggleBattleMode() {
    if (battle.isBattling) {
      showFeedback('战斗中不可切换模式')
      return
    }
    battle.mode = battle.mode === 'manual' ? 'auto' : 'manual'
    showFeedback(battle.mode === 'manual' ? '已切换为手动战斗' : '已切换为自动战斗')
    addLog(battle.mode === 'manual'
      ? '你收回托管心念，后续独立战斗将由你手动选择技能。'
      : '你放开心神，后续独立战斗将由系统自动演算。')
  }

  function setBattleMode(mode) {
    if (battle.isBattling) {
      showFeedback('战斗中不可切换模式')
      return
    }
    battle.mode = mode === 'manual' ? 'manual' : 'auto'
    showFeedback(battle.mode === 'manual' ? '已切换为手动战斗' : '已切换为自动战斗')
  }

  function pickBattleSkill(round, availableSpirit = player.spirit, currentHpPercent = 1) {
    const usable = availableBattleSkills.value.filter(skill => getBattleSkillCost(skill) <= availableSpirit)
    if (!usable.length) return battleSkills[0]
    const buffs = usable.filter(skill => skill.category === 'buff')
    const heals = usable.filter(skill => skill.category === 'heal')
    const attacks = usable.filter(skill => skill.category === 'attack')
    if (round === 1 && buffs.length) return buffs[0]
    if (currentHpPercent < 0.45 && heals.length) return heals[0]
    if (round % 4 === 0 && buffs.length) return buffs[0]
    if (attacks.length) return attacks[Math.min(attacks.length - 1, round % attacks.length)]
    return usable[Math.min(usable.length - 1, round % usable.length)] || battleSkills[0]
  }

  function createBattleEnemy(type = 'beast', options = {}) {
    const rewardRate = options.rewardRate || options.difficultyRate || selectedDifficulty.value.rewardRate || 1
    const combatRate = options.combatRate || getDifficultyCombatRate(selectedDifficulty.value.id)
    const realmGap = normalizeNumber(options.realmOffset, 0)
    const enemyRealmIndex = options.realmIndex !== undefined
      ? normalizeNumber(options.realmIndex, player.realmIndex)
      : Math.max(0, Math.min(player.realmIndex + 2, player.realmIndex + Math.floor(Math.random() * 5) - 2))
    const enemyRealmLayer = options.realmLayer !== undefined ? normalizeNumber(options.realmLayer, player.realmLayer) : Math.max(1, Math.min(9, player.realmLayer + realmGap))
    const namePool = enemyNamePools[type] || enemyNamePools.beast
    const name = options.name || pickRandom(namePool)
    const titlePrefix = type === 'sect' ? '宗门试炼' : type === 'cultivator' ? '敌修拦路' : '魔物袭来'
    const baseStats = getRealmScaledBattleStats(enemyRealmIndex, enemyRealmLayer, {
      baseHp: type === 'beast' ? 165 : 155,
      baseAttack: type === 'beast' ? 22 : 21,
      baseDefense: type === 'beast' ? 7 : 7,
      gradeRate: combatRate,
      hpScale: 3 + enemyRealmIndex * 0.25
    })
    const realmVsPlayer = enemyRealmIndex - player.realmIndex
    return {
      type,
      name,
      title: options.title || `${titlePrefix} · ${name}`,
      realmIndex: enemyRealmIndex,
      realmLayer: enemyRealmLayer,
      realmText: getRealmLayerText(enemyRealmIndex, enemyRealmLayer),
      maxHp: options.maxHp || baseStats.maxHp,
      attack: options.attack || baseStats.attack,
      defense: options.defense || baseStats.defense,
      rewardRate,
      combatRate,
      realmVsPlayer
    }
  }

  function resolveBattleRewards(enemy, win, source = 'explore') {
    const rewards = []
    if (!win) return rewards
    const rate = enemy.rewardRate || 1
    const cultivationGain = Math.max(25, Math.floor((28 + player.realmIndex * 32 + player.realmLayer * 9) * rate))
    const stoneGain = Math.max(8, Math.floor((12 + actualFortune.value * 0.8 + player.realmIndex * 6) * rate))
    player.cultivation += cultivationGain
    inventory.spiritStones += stoneGain
    rewards.push(`修为 +${cultivationGain}`, `灵石 +${stoneGain}`)

    if (enemy.type === 'beast') {
      const coreChance = 0.35 + player.realmIndex * 0.06
      if (Math.random() < coreChance) {
        inventory.cores += 1
        rewards.push('妖兽内丹 +1')
      }
      const ores = Math.max(1, Math.floor((1 + Math.random() * 2) * rate))
      inventory.ores += ores
      rewards.push(`矿石 +${ores}`)
    }

    if (enemy.type === 'cultivator') {
      const scrollGain = Math.random() < 0.5 ? 1 : 0
      if (scrollGain) {
        inventory.scrolls += scrollGain
        rewards.push('残卷 +1')
      }
      const artifactReward = tryGrantRandomArtifact(source === 'explore' ? selectedMap.value.need.realmIndex : player.realmIndex)
      if (artifactReward) {
        rewards.push(artifactReward)
      } else if (Math.random() < 0.22 + actualFortune.value * 0.006) {
        const pool = equipmentCatalog.filter(item => item.unlockRealm <= (source === 'explore' ? selectedMap.value.need.realmIndex : player.realmIndex) && item.id !== 'chaosPearl')
        const eqId = pickRandom(pool).id
        grantEquipment(eqId, 1)
        rewards.push(`${equipmentCatalog.find(item => item.id === eqId)?.name || '装备'} +1`)
      }
    }

    if (source === 'sect') {
      const contribution = Math.max(18, Math.floor((22 + sect.sectLevel * 8 + player.realmIndex * 6) * rate))
      const pointGain = Math.max(1, Math.floor(1 + enemy.realmIndex * 1.1 + Math.sqrt(sect.sectLevel) * 0.8))
      addSectContribution(contribution)
      sect.funds += Math.floor(contribution * 0.6)
      player.techniquePoints += pointGain
      rewards.push(`宗门贡献 +${contribution}`, `功法点 +${pointGain}`)
    }

    if (source === 'tower') {
      const towerLevel = Math.max(1, normalizeNumber(sect.demonTowerLevel, 1))
      const contribution = Math.max(12, Math.floor((14 + sect.sectLevel * 4 + Math.sqrt(towerLevel) * 6) * rate))
      const coreGain = Math.max(1, Math.floor(1 + towerLevel / 18))
      addSectContribution(contribution)
      sect.funds += Math.floor(contribution * 0.45)
      inventory.cores += coreGain
      rewards.push(`宗门贡献 +${contribution}`, `妖兽内丹 +${coreGain}`)
      const pointGain = Math.max(1, Math.floor(1 + enemy.realmIndex * 0.75 + towerLevel / 18)) + (towerLevel % 5 === 0 ? 2 + Math.floor(towerLevel / 35) : 0)
      player.techniquePoints += pointGain
      rewards.push(`功法点 +${pointGain}`)
      if (towerLevel % 9 === 0) {
        inventory.items.exploreTalisman += 1
        rewards.push('探索符 +1')
      }
    }
    return rewards
  }

  function resetBattleBuffs() {
    battle.atkBuff = 0
    battle.atkBuffTurns = 0
    battle.defBuff = 0
    battle.defBuffTurns = 0
    battle.dodgeBuff = 0
    battle.dodgeBuffTurns = 0
    battle.enemyAtkDown = 0
  }

  function tickBattleBuffs() {
    if (battle.atkBuffTurns > 0) { battle.atkBuffTurns--; if (battle.atkBuffTurns <= 0) battle.atkBuff = 0 }
    if (battle.defBuffTurns > 0) { battle.defBuffTurns--; if (battle.defBuffTurns <= 0) battle.defBuff = 0 }
    if (battle.dodgeBuffTurns > 0) { battle.dodgeBuffTurns--; if (battle.dodgeBuffTurns <= 0) battle.dodgeBuff = 0 }
    battle.enemyAtkDown = 0
  }

  function applySkillBuff(skill) {
    if (skill.buffAtk) { battle.atkBuff = skill.buffAtk; battle.atkBuffTurns = skill.buffTurns || 3 }
    if (skill.buffDef) { battle.defBuff = skill.buffDef; battle.defBuffTurns = skill.buffTurns || 3 }
    if (skill.buffDodge) { battle.dodgeBuff = skill.buffDodge; battle.dodgeBuffTurns = skill.buffTurns || 2 }
    if (skill.enemyAtkDown) { battle.enemyAtkDown = skill.enemyAtkDown }
    if (skill.spiritRecover) {
      const recover = Math.floor(player.maxSpirit * skill.spiritRecover)
      player.spirit = Math.min(player.maxSpirit, player.spirit + recover)
    }
  }

  function getBuffStatusText() {
    const parts = []
    if (battle.atkBuffTurns > 0) parts.push(`攻击+${Math.floor(battle.atkBuff * 100)}%(${battle.atkBuffTurns}回合)`)
    if (battle.defBuffTurns > 0) parts.push(`防御+${Math.floor(battle.defBuff * 100)}%(${battle.defBuffTurns}回合)`)
    if (battle.dodgeBuffTurns > 0) parts.push(`闪避${Math.floor(battle.dodgeBuff * 100)}%(${battle.dodgeBuffTurns}回合)`)
    if (battle.enemyAtkDown > 0) parts.push(`敌方降攻${Math.floor(battle.enemyAtkDown * 100)}%`)
    return parts.join(' ')
  }


  function getBattleSkillById(skillId) {
    return availableBattleSkills.value.find(skill => skill.id === skillId) || battleSkills[0]
  }

  function calculatePlayerBattleDamage(skill, enemy) {
    const fluctuation = 0.9 + Math.random() * 0.2
    const realmPressure = getRealmPressure(player.realmIndex, enemy.realmIndex)
    const atkBuff = Number(battle.atkBuff) || 0
    const armorPen = normalizeNumber(skill.armorPen, 0)
    const effectiveEnemyDef = enemy.defense * (1 - armorPen)
    const rawDamage = battleAttack.value * (1 + atkBuff) * getBattleSkillPower(skill) * fluctuation * realmPressure - effectiveEnemyDef * 0.62
    return Math.max(6, Math.floor(rawDamage))
  }

  function calculateEnemyBattleDamage(enemy, shield = 0) {
    const enemyRealmPressure = getRealmPressure(enemy.realmIndex, player.realmIndex)
    const defBuff = Number(battle.defBuff) || 0
    const enemyAtkDown = Number(battle.enemyAtkDown) || 0
    const baseDodge = actualComprehension.value * 0.004
    const dodgeBuff = Number(battle.dodgeBuff) || 0
    const totalDodge = Math.min(1, baseDodge + dodgeBuff)
    if (totalDodge > 0 && Math.random() < totalDodge) return 0
    return Math.max(5, Math.floor(enemy.attack * (1 - enemyAtkDown) * (0.88 + Math.random() * 0.24) * enemyRealmPressure - battleDefense.value * (1 + defBuff) * 0.68 - shield))
  }

  function startManualBattle(enemy, options = {}) {
    clearBattlePlaybackTimer()
    clampPlayerHp()
    resetBattleBuffs()
    battle.visible = true
    battle.isBattling = true
    battle.waitingForPlayer = true
    battle.controlMode = 'manual'
    battle.source = options.source || 'sect'
    battle.returnUrl = options.returnUrl || '/pages/sect/sect'
    battle.title = options.title || enemy.title || '手动战斗'
    battle.enemyName = enemy.name
    battle.enemyRealmText = enemy.realmText || ''
    battle.enemyHp = enemy.maxHp
    battle.enemyMaxHp = enemy.maxHp
    battle.enemyAttack = enemy.attack
    battle.enemyDefense = enemy.defense
    battle.playerHp = Math.min(player.hp, battleMaxHp.value)
    battle.playerMaxHp = battleMaxHp.value
    battle.playerSpirit = player.spirit
    battle.playerMaxSpirit = player.maxSpirit
    battle.round = 1
    battle.currentProcess = [
      `你遭遇${enemy.name}${enemy.realmText ? `（${enemy.realmText}）` : ''}。对方生命 ${enemy.maxHp}，攻击 ${enemy.attack}，防御 ${enemy.defense}。请选择技能应战。`
    ]
    battle.totalSteps = 12
    battle.lastResult = '战斗进行中，请选择技能。'
    pendingBattleOutcome.value = {
      enemy,
      source: options.source || 'sect',
      title: battle.title,
      sectChallengeLevel: options.sectChallengeLevel || 0,
      towerLevel: options.towerLevel || 0,
      rewards: [],
      win: false,
      manual: true
    }
  }

  function finishManualBattle(win, reasonText = '') {
    const session = pendingBattleOutcome.value
    const enemy = session?.enemy || {
      name: battle.enemyName || '对手',
      type: battle.source === 'sect' ? 'sect' : 'beast',
      rewardRate: 1
    }
    const source = session?.source || battle.source || 'sect'
    const rewards = []
    if (win) {
      rewards.push(...resolveBattleRewards(enemy, true, source))
      if (source === 'sect') {
        const baseLevel = Math.max(1, normalizeNumber(session?.sectChallengeLevel, sect.challengeLevel))
        sect.challengeLevel = Math.min(realmNames.length * 9, baseLevel + 1)
        sect.highestChallengeLevel = Math.max(normalizeNumber(sect.highestChallengeLevel, 1), sect.challengeLevel)
        addSectLog(`你挑战${enemy.name}获胜，宗门试炼难度提升至第 ${sect.challengeLevel} 阶。`)
        addLog(`宗门试炼中，你手动击败了${enemy.name}，下一战将迎来更高境界对手。`)
      }
      if (source === 'tower') {
        const baseLevel = Math.max(1, normalizeNumber(session?.towerLevel, sect.demonTowerLevel))
        sect.demonTowerLevel = baseLevel + 1
        sect.highestDemonTowerLevel = Math.max(normalizeNumber(sect.highestDemonTowerLevel, 1), sect.demonTowerLevel)
        addSectLog(`你镇压${enemy.name}，镇妖塔推进至第 ${sect.demonTowerLevel} 层。`)
        addLog(`镇妖塔中，你手动击败了${enemy.name}，下一层妖兽气息更盛。`)
      }
      if (settings.autoBreakthrough) runAutoBreakthrough('battle')
    } else if (source === 'sect') {
      addSectLog(`你挑战${enemy.name}失利，仍有所悟。`)
      addLog(`宗门试炼中，你败于${enemy.name}，但保住根基。`)
    } else if (source === 'tower') {
      addSectLog(`你在镇妖塔第 ${normalizeNumber(session?.towerLevel, sect.demonTowerLevel)} 层失利，妖气反扑，所幸根基未损。`)
      addLog(`镇妖塔中，你败于${enemy.name}，暂且退回塔外调息。`)
    }

    player.hp = battleMaxHp.value
    player.spirit = player.maxSpirit
    battle.playerHp = player.hp
    battle.playerMaxHp = battleMaxHp.value
    battle.playerSpirit = player.spirit
    battle.playerMaxSpirit = player.maxSpirit
    rewards.push('生命与灵力已回满')
    const summary = win
      ? `战斗胜利，获得：${rewards.join('、') || '无额外战利品'}。`
      : `战斗失利，${rewards.join('、')}。`
    if (reasonText) battle.currentProcess.push(reasonText)
    battle.currentProcess.push(summary)
    battle.lastResult = summary
    battle.isBattling = false
    battle.waitingForPlayer = false
    battle.enemyHp = Math.max(0, battle.enemyHp)
    battle.totalSteps = Math.max(battle.totalSteps, battle.currentProcess.length)
    pendingBattleOutcome.value = null
    showFeedback(win ? '战斗胜利' : '战斗结束', win ? 'success' : 'none')
  }

  function useManualBattleSkill(skillId) {
    if (!battle.isBattling || battle.controlMode !== 'manual') {
      showFeedback('当前没有手动战斗')
      return
    }
    if (!battle.waitingForPlayer) return
    const session = pendingBattleOutcome.value
    const enemy = session?.enemy
    if (!enemy) {
      finishManualBattle(false, '战斗气机紊乱，你暂且退开。')
      return
    }

    const skill = getBattleSkillById(skillId)
    const cost = getBattleSkillCost(skill)
    if (cost > player.spirit) {
      showFeedback('灵力不足')
      battle.currentProcess.push(`灵力不足，无法施展「${skill.name}」。`)
      return
    }

    battle.waitingForPlayer = false
    if (cost > 0) player.spirit = Math.max(0, player.spirit - cost)
    battle.playerSpirit = player.spirit
    battle.playerMaxSpirit = player.maxSpirit

    const isBuffOnly = skill.category === 'buff' && !skill.power
    const isHealOnly = skill.category === 'heal' && !skill.power

    if (isBuffOnly) {
      applySkillBuff(skill)
      const buffText = getBuffStatusText()
      battle.currentProcess.push(`第 ${battle.round} 回合，你施展「${skill.name}」${cost ? `，消耗灵力 ${cost}` : ''}。${buffText ? `当前状态：${buffText}` : ''}`)
    } else if (isHealOnly) {
      const healAmount = Math.floor(battleMaxHp.value * (skill.healRate || 0.2) + battleDefense.value * 0.3)
      player.hp = Math.min(battleMaxHp.value, player.hp + healAmount)
      battle.playerHp = player.hp
      battle.playerMaxHp = battleMaxHp.value
      battle.currentProcess.push(`第 ${battle.round} 回合，你施展「${skill.name}」${cost ? `，消耗灵力 ${cost}` : ''}，恢复生命 ${formatNumber(healAmount)} 点。`)
    } else {
      const enemyDodgeChance = 0.025 + (enemy.realmIndex || 0) * 0.01
      if (Math.random() < enemyDodgeChance) {
        applySkillBuff(skill)
        let line = `第 ${battle.round} 回合，你施展「${skill.name}」${cost ? `，消耗灵力 ${cost}` : ''}，但被${enemy.name}灵巧闪避。`
        const buffText = getBuffStatusText()
        if (buffText) line += ` ${buffText}`
        battle.currentProcess.push(line)
      } else {
        const damage = calculatePlayerBattleDamage(skill, enemy)
        battle.enemyHp = Math.max(0, battle.enemyHp - damage)
        let line = `第 ${battle.round} 回合，你施展「${skill.name}」${cost ? `，消耗灵力 ${cost}` : ''}，造成 ${formatNumber(damage)} 点伤害。`
        let shield = 0
        applySkillBuff(skill)
        if (skill.healRate) {
          const heal = Math.floor(damage * skill.healRate + battleDefense.value * 0.25)
          player.hp = Math.min(battleMaxHp.value, player.hp + heal)
          battle.playerHp = player.hp
          battle.playerMaxHp = battleMaxHp.value
          shield = Math.floor(battleDefense.value * 0.45)
          line += `生命恢复 ${formatNumber(heal)} 点。`
        }
        if (skill.spiritDrain) {
          const drainAmount = Math.floor(enemy.maxHp * skill.spiritDrain)
          player.spirit = Math.min(player.maxSpirit, player.spirit + drainAmount)
          battle.playerSpirit = player.spirit
          line += `吸取灵力 ${formatNumber(drainAmount)} 点。`
        }
        const buffText = getBuffStatusText()
        if (buffText) line += ` ${buffText}`
        battle.currentProcess.push(line)
      }
    }

    if (battle.enemyHp <= 0) {
      finishManualBattle(true, `${enemy.name}气机溃散，你取得胜利。`)
      return
    }

    tickBattleBuffs()
    const enemyDamage = calculateEnemyBattleDamage(enemy, 0)
    if (enemyDamage === 0) {
      battle.currentProcess.push(`灵巧闪避！你躲开了${enemy.name}的攻击。`)
    } else {
      player.hp = Math.max(0, player.hp - enemyDamage)
      battle.playerHp = player.hp
      battle.playerMaxHp = battleMaxHp.value
      battle.currentProcess.push(`${enemy.name}反击而来，你承受 ${formatNumber(enemyDamage)} 点伤害，剩余生命 ${formatNumber(Math.max(0, player.hp))} / ${formatNumber(battleMaxHp.value)}。`)
    }

    if (player.hp <= 0) {
      finishManualBattle(false, '你护体灵光破碎，只得以遁术脱离战场。')
      return
    }

    battle.round += 1
    if (battle.round > 12) {
      const enemyPower = getBattlePowerFromStats(enemy)
      const compare = battlePower.value * (0.9 + Math.random() * 0.25) - enemyPower
      finishManualBattle(compare >= 0, compare >= 0 ? '双方鏖战良久，你凭更深根基压过对手。' : '久战不下，你不愿恋战，抽身退走。')
      return
    }
    battle.waitingForPlayer = true
    battle.lastResult = '战斗进行中，请继续选择技能。'
  }

  function attemptFlee() {
    if (!battle.isBattling || battle.controlMode !== 'manual') {
      showFeedback('当前无法逃跑')
      return
    }
    if (!battle.waitingForPlayer) return

    const session = pendingBattleOutcome.value
    const enemy = session?.enemy
    if (!enemy) {
      finishManualBattle(false, '战斗气机紊乱，你暂且退开。')
      return
    }

    const fleeChance = battleFleeChance.value
    const success = Math.random() < fleeChance

    battle.waitingForPlayer = false

    if (success) {
      battle.currentProcess.push('你成功遁走，脱离了战斗。')
      player.hp = battleMaxHp.value
      player.spirit = player.maxSpirit
      battle.visible = false
      battle.isBattling = false
      battle.waitingForPlayer = false
      battle.lastResult = '你成功遁走，脱离了战斗。'
      pendingBattleOutcome.value = null
      const source = session?.source || battle.source || 'sect'
      if (source === 'sect') {
        addSectLog(`你在战斗中遁走，脱离了${enemy.name}。`)
        addLog(`宗门试炼中，你从${enemy.name}面前遁走。`)
      } else if (source === 'tower') {
        addSectLog(`你在镇妖塔中遁走，脱离了${enemy.name}。`)
        addLog(`镇妖塔中，你从${enemy.name}面前遁走。`)
      }
      showFeedback('遁走成功', 'success')
      return
    }

    battle.currentProcess.push('遁走失败！敌人紧追不舍。')
    tickBattleBuffs()
    const enemyDamage = calculateEnemyBattleDamage(enemy, 0)
    if (enemyDamage === 0) {
      battle.currentProcess.push(`灵巧闪避！你躲开了${enemy.name}的攻击。`)
    } else {
      player.hp = Math.max(0, player.hp - enemyDamage)
      battle.playerHp = player.hp
      battle.playerMaxHp = battleMaxHp.value
      battle.currentProcess.push(`${enemy.name}反击而来，你承受 ${formatNumber(enemyDamage)} 点伤害，剩余生命 ${formatNumber(Math.max(0, player.hp))} / ${formatNumber(battleMaxHp.value)}。`)
    }
    if (player.hp <= 0) {
      finishManualBattle(false, '遁走失败，你护体灵光破碎，只得以遁术脱离战场。')
      return
    }
    battle.round += 1
    if (battle.round > 12) {
      const enemyPower = getBattlePowerFromStats(enemy)
      const compare = battlePower.value * (0.9 + Math.random() * 0.25) - enemyPower
      finishManualBattle(compare >= 0, compare >= 0 ? '双方鏖战良久，你凭更深根基压过对手。' : '久战不下，你不愿恋战，抽身退走。')
      return
    }
    battle.waitingForPlayer = true
    battle.lastResult = '战斗进行中，请继续选择技能。'
  }

  function autoFinishManualBattle() {
    if (!battle.isBattling || battle.controlMode !== 'manual') return
    let guard = 0
    while (battle.isBattling && battle.controlMode === 'manual' && guard < 20) {
      guard += 1
      const skill = pickBattleSkill(battle.round || guard)
      useManualBattleSkill(skill.id)
    }
  }

  function runBattleSimulation(enemy, options = {}) {
    clampPlayerHp()
    resetBattleBuffs()
    const steps = []
    const frames = []
    const rewards = []
    let enemyHp = enemy.maxHp
    let playerHp = Math.min(player.hp, battleMaxHp.value)
    let playerSpirit = Math.min(player.spirit, player.maxSpirit)
    let simShield = 0
    let simAtkBuff = 0
    let simAtkBuffTurns = 0
    let simDefBuff = 0
    let simDefBuffTurns = 0
    let simDodgeBuff = 0
    let simDodgeBuffTurns = 0
    let simEnemyAtkDown = 0
    let win = false

    function tickSimBuffs() {
      if (simAtkBuffTurns > 0) { simAtkBuffTurns--; if (simAtkBuffTurns <= 0) simAtkBuff = 0 }
      if (simDefBuffTurns > 0) { simDefBuffTurns--; if (simDefBuffTurns <= 0) simDefBuff = 0 }
      if (simDodgeBuffTurns > 0) { simDodgeBuffTurns--; if (simDodgeBuffTurns <= 0) simDodgeBuff = 0 }
      simEnemyAtkDown = 0
    }

    function simApplyBuff(skill) {
      if (skill.buffAtk) { simAtkBuff = skill.buffAtk; simAtkBuffTurns = skill.buffTurns || 3 }
      if (skill.buffDef) { simDefBuff = skill.buffDef; simDefBuffTurns = skill.buffTurns || 3 }
      if (skill.buffDodge) { simDodgeBuff = skill.buffDodge; simDodgeBuffTurns = skill.buffTurns || 2 }
      if (skill.enemyAtkDown) { simEnemyAtkDown = skill.enemyAtkDown }
      if (skill.spiritRecover) { playerSpirit = Math.min(player.maxSpirit, playerSpirit + Math.floor(player.maxSpirit * skill.spiritRecover)) }
    }

    function simPlayerDamage(skill, enemy) {
      const enemyDodgeChance = 0.025 + (enemy.realmIndex || 0) * 0.01
      if (Math.random() < enemyDodgeChance) return 0
      const fluctuation = 0.9 + Math.random() * 0.2
      const realmPressure = getRealmPressure(player.realmIndex, enemy.realmIndex)
      const armorPen = normalizeNumber(skill.armorPen, 0)
      const effectiveEnemyDef = enemy.defense * (1 - armorPen)
      const rawDamage = battleAttack.value * (1 + simAtkBuff) * getBattleSkillPower(skill) * fluctuation * realmPressure - effectiveEnemyDef * 0.62
      return Math.max(6, Math.floor(rawDamage))
    }

    function simEnemyDamage(enemy, shield) {
      const enemyRealmPressure = getRealmPressure(enemy.realmIndex, player.realmIndex)
      const baseDodge = actualComprehension.value * 0.004
      const totalDodge = Math.min(1, baseDodge + simDodgeBuff)
      if (totalDodge > 0 && Math.random() < totalDodge) return 0
      return Math.max(5, Math.floor(enemy.attack * (1 - simEnemyAtkDown) * (0.88 + Math.random() * 0.24) * enemyRealmPressure - battleDefense.value * (1 + simDefBuff) * 0.68 - shield))
    }

    function pushBattleStep(text) {
      steps.push(text)
      frames.push({
        playerHp: Math.max(0, Math.floor(playerHp)),
        playerMaxHp: battleMaxHp.value,
        playerSpirit: Math.max(0, Math.floor(playerSpirit)),
        playerMaxSpirit: player.maxSpirit,
        enemyHp: Math.max(0, Math.floor(enemyHp)),
        enemyMaxHp: enemy.maxHp
      })
    }

    const enemyPower = getBattlePowerFromStats(enemy)
    const powerRatio = battlePower.value / Math.max(1, enemyPower)
    pushBattleStep(`你遭遇${enemy.name}${enemy.realmText ? `（${enemy.realmText}）` : ''}。对方生命 ${formatNumber(enemy.maxHp)}，攻击 ${formatNumber(enemy.attack)}，防御 ${formatNumber(enemy.defense)}，战力约 ${formatNumber(enemyPower)}。你的战力约 ${formatNumber(battlePower.value)}，战力比 ${powerRatio.toFixed(2)}。战斗自动开始。`)

    for (let round = 1; round <= 12; round += 1) {
      const skill = pickBattleSkill(round, playerSpirit, playerHp / Math.max(1, battleMaxHp.value))
      const cost = getBattleSkillCost(skill)
      if (cost > 0) playerSpirit = Math.max(0, playerSpirit - cost)

      if (skill.category === 'buff' && !skill.power) {
        simApplyBuff(skill)
        const buffs = []
        if (simAtkBuff > 0) buffs.push(`攻击+${Math.floor(simAtkBuff*100)}%`)
        if (simDefBuff > 0) buffs.push(`防御+${Math.floor(simDefBuff*100)}%`)
        if (simDodgeBuff > 0) buffs.push(`闪避${Math.floor(simDodgeBuff*100)}%`)
        pushBattleStep(`第 ${round} 回合，你施展「${skill.name}」${cost ? `，消耗灵力 ${cost}` : ''}。${buffs.length ? '当前增益：' + buffs.join(' ') : ''}`)
      } else if (skill.category === 'heal' && !skill.power) {
        const healAmount = Math.floor(battleMaxHp.value * (skill.healRate || 0.2) + battleDefense.value * 0.3)
        playerHp = Math.min(battleMaxHp.value, playerHp + healAmount)
        pushBattleStep(`第 ${round} 回合，你施展「${skill.name}」${cost ? `，消耗灵力 ${cost}` : ''}，恢复生命 ${formatNumber(healAmount)} 点。`)
      } else {
        const damage = simPlayerDamage(skill, enemy)
        if (damage === 0) {
          simApplyBuff(skill)
          pushBattleStep(`第 ${round} 回合，你施展「${skill.name}」${cost ? `，消耗灵力 ${cost}` : ''}，但被${enemy.name}灵巧闪避。`)
        } else {
          enemyHp = Math.max(0, enemyHp - damage)
          let line = `第 ${round} 回合，你施展「${skill.name}」${cost ? `，消耗灵力 ${cost}` : ''}，造成 ${formatNumber(damage)} 点伤害。`
          simApplyBuff(skill)
          if (skill.healRate) {
            const heal = Math.floor(damage * skill.healRate + battleDefense.value * 0.25)
            playerHp = Math.min(battleMaxHp.value, playerHp + heal)
            simShield = Math.floor(battleDefense.value * 0.45)
            line += `剑罡回护，生命恢复 ${formatNumber(heal)} 点。`
          }
          if (skill.spiritDrain) {
            playerSpirit = Math.min(player.maxSpirit, playerSpirit + Math.floor(enemy.maxHp * skill.spiritDrain))
            line += `吸取灵力 ${formatNumber(Math.floor(enemy.maxHp * skill.spiritDrain))} 点。`
          }
          pushBattleStep(line)
        }
      }

      if (enemyHp <= 0) {
        win = true
        pushBattleStep(`${enemy.name}气机溃散，你取得胜利。`)
        break
      }

      if (enemy.realmVsPlayer !== undefined && enemy.realmVsPlayer < 0 && round >= 2 && round <= 3 && Math.random() < 0.40) {
        win = true
        pushBattleStep(`${enemy.name}见势不妙，竟转身遁逃而去。`)
        break
      }

      const enemyDamage = simEnemyDamage(enemy, simShield)
      simShield = 0
      if (enemyDamage === 0) {
        pushBattleStep(`灵巧闪避！你躲开了${enemy.name}的攻击。`)
      } else {
        playerHp = Math.max(0, playerHp - enemyDamage)
        pushBattleStep(`${enemy.name}反击而来，你承受 ${formatNumber(enemyDamage)} 点伤害，剩余生命 ${formatNumber(Math.max(0, playerHp))} / ${formatNumber(battleMaxHp.value)}。`)
      }
      tickSimBuffs()
      if (playerHp <= 0) {
        win = false
        pushBattleStep('你护体灵光破碎，只得以遁术脱离战场。')
        break
      }
    }

    if (!win && enemyHp > 0 && playerHp > 0) {
      const compare = battlePower.value * (0.9 + Math.random() * 0.25) - enemyPower
      win = compare >= 0
      pushBattleStep(win ? '双方鏖战良久，你凭更深根基压过对手。' : '久战不下，你不愿恋战，抽身退走。')
    }

    if (win) {
      rewards.push(...resolveBattleRewards(enemy, true, options.source || 'explore'))
      if (settings.autoBreakthrough) runAutoBreakthrough('battle')
    }
    player.hp = battleMaxHp.value
    player.spirit = player.maxSpirit
    rewards.push('生命与灵力已回满')

    const summary = win ? `战斗胜利，获得：${rewards.join('、') || '无额外战利品'}。` : `战斗失利，${rewards.join('、')}。`
    playerHp = battleMaxHp.value
    playerSpirit = player.maxSpirit
    pushBattleStep(summary)
    return { win, steps, frames, rewards, summary, enemyHp: Math.max(0, enemyHp), playerHp: battleMaxHp.value, playerSpirit: player.maxSpirit }
  }

  function appendBattleToExplore(steps, rewards, enemyType = 'beast', loopState = {}) {
    const enemy = createBattleEnemy(enemyType, {
      rewardRate: selectedDifficulty.value.rewardRate,
      combatRate: getDifficultyCombatRate(selectedDifficulty.value.id)
    })
    pushExploreStep(steps, `${enemyType === 'cultivator' ? '树后闪出一名' : '忽闻一声咆哮，'}${enemy.name}（${enemy.realmText || '未知境界'}）${enemyType === 'cultivator' ? '拦住了你的去路！' : '从暗处窜出拦住去路！'}`)
    saveSilently()
    const pendingExplore = {
      mapId: selectedMap.value.id,
      difficultyId: selectedDifficulty.value.id,
      steps,
      rewards,
      eventCount: loopState.eventCount || 0,
      eventIndex: loopState.eventIndex || 0,
      remainingEvents: loopState.remainingEvents || [],
      rewardBase: loopState.rewardBase || (selectedDifficulty.value.rewardRate * (1 + sectBonus.value.explore) * 1.75),
      hpLossDone: false,
      createdAt: Date.now()
    }
    safeSetStorage('__xiuxian_pending_explore__', JSON.stringify(pendingExplore))
    goBattlePage(enemy, { source: 'exploration', returnUrl: '/pages/explore/explore' })
    return true
  }

  function clearBattlePlaybackTimer() {
    if (battlePlaybackTimer) {
      clearInterval(battlePlaybackTimer)
      battlePlaybackTimer = null
    }
  }

  function applyBattlePlaybackFrame(frame) {
    if (!frame) return
    battle.playerHp = Math.max(0, normalizeNumber(frame.playerHp, battle.playerHp || battleMaxHp.value))
    battle.playerMaxHp = Math.max(1, normalizeNumber(frame.playerMaxHp, battle.playerMaxHp || battleMaxHp.value))
    battle.playerSpirit = Math.max(0, normalizeNumber(frame.playerSpirit, battle.playerSpirit || player.spirit))
    battle.playerMaxSpirit = Math.max(1, normalizeNumber(frame.playerMaxSpirit, battle.playerMaxSpirit || player.maxSpirit))
    battle.enemyHp = Math.max(0, normalizeNumber(frame.enemyHp, battle.enemyHp))
    battle.enemyMaxHp = Math.max(1, normalizeNumber(frame.enemyMaxHp, battle.enemyMaxHp || 1))
  }

  function beginBattlePlayback(outcome) {
    clearBattlePlaybackTimer()
    pendingBattleOutcome.value = outcome
    battle.visible = true
    battle.isBattling = true
    battle.waitingForPlayer = false
    battle.controlMode = 'auto'
    battle.source = outcome.source || 'sect'
    battle.returnUrl = outcome.returnUrl || '/pages/sect/sect'
    battle.title = outcome.title || '自动战斗'
    battle.enemyName = outcome.enemyName || ''
    battle.enemyRealmText = outcome.enemyRealmText || ''
    battle.enemyMaxHp = outcome.enemyMaxHp || 0
    battle.enemyAttack = outcome.enemyAttack || 0
    battle.enemyDefense = outcome.enemyDefense || 0
    battle.playerHp = Math.min(player.hp, battleMaxHp.value)
    battle.playerMaxHp = battleMaxHp.value
    battle.playerSpirit = player.spirit
    battle.playerMaxSpirit = player.maxSpirit
    battle.enemyHp = outcome.enemyMaxHp || outcome.enemyHp || 0
    battle.currentProcess = []
    battle.totalSteps = outcome.steps.length || 1
    battle.lastResult = '战斗进行中……'
    let index = 0
    const reveal = () => {
      const step = outcome.steps[index]
      if (!step) {
        finishBattlePlayback(outcome, false)
        return
      }
      applyBattlePlaybackFrame(outcome.frames?.[index])
      battle.currentProcess.push(step)
      index += 1
      if (index >= outcome.steps.length) finishBattlePlayback(outcome, false)
    }
    reveal()
    battlePlaybackTimer = setInterval(reveal, 850)
  }

  function finishBattlePlayback(outcome, skipped) {
    clearBattlePlaybackTimer()
    if (skipped && outcome && outcome.steps) {
      battle.currentProcess = outcome.steps.slice()
      applyBattlePlaybackFrame(outcome.frames?.[outcome.frames.length - 1])
    } else if (outcome?.frames?.length) {
      applyBattlePlaybackFrame(outcome.frames[outcome.frames.length - 1])
    }
    battle.isBattling = false
    battle.lastResult = outcome?.summary || battle.lastResult
    pendingBattleOutcome.value = null
    showFeedback(skipped ? '已跳过并结算' : '战斗完成', outcome?.win ? 'success' : 'none')
  }

  function skipBattleProcess() {
    if (!battle.isBattling) return
    if (battle.controlMode === 'manual') {
      autoFinishManualBattle()
      return
    }
    const outcome = pendingBattleOutcome.value
    if (outcome && outcome.steps) {
      battle.currentProcess = outcome.steps.slice()
      applyBattlePlaybackFrame(outcome.frames?.[outcome.frames.length - 1])
      battle.lastResult = outcome.summary
    } else {
      battle.currentProcess = battle.currentProcess.length ? battle.currentProcess : ['你不再细看战局，以神识快速掠过战斗过程。']
    }
    battle.isBattling = false
    pendingBattleOutcome.value = null
    clearBattlePlaybackTimer()
    showFeedback('已跳过战斗过程', 'success')
  }

  function closeBattleModal() {
    if (battle.isBattling) {
      skipBattleProcess()
      return
    }
    battle.visible = false
  }


  function buildBattlePageRequest(enemy, options = {}) {
    return {
      enemy: JSON.parse(JSON.stringify(enemy)),
      options: JSON.parse(JSON.stringify({
        source: options.source || 'sect',
        title: options.title || enemy.title || '战斗',
        sectChallengeLevel: options.sectChallengeLevel || 0,
        towerLevel: options.towerLevel || 0,
        returnUrl: options.returnUrl || '/pages/sect/sect'
      })),
      mode: battle.mode === 'manual' ? 'manual' : 'auto',
      createdAt: Date.now()
    }
  }

  function goBattlePage(enemy, options = {}) {
    const request = buildBattlePageRequest(enemy, options)
    safeSetStorage(BATTLE_REQUEST_KEY, JSON.stringify(request))
    saveSilently()
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
    const current = pages[pages.length - 1]
    const isBattlePage = current && current.route === 'pages/battle/battle'
    const navOptions = {
      url: '/pages/battle/battle',
      animationType: 'fade-in',
      animationDuration: 180,
      fail: () => {
        uni.redirectTo({
          url: '/pages/battle/battle',
          animationType: 'fade-in',
          animationDuration: 180
        })
      }
    }
    if (isBattlePage) {
      // 已在独立战斗页时不再 redirect/reload，直接读取新战斗请求并开战，避免连续挑战时白屏闪烁。
      startBattleFromRequest()
      return
    }
    uni.navigateTo(navOptions)
  }

  function applyAutoBattleProgress(enemy, outcome, options = {}) {
    const source = options.source || 'sect'
    if (outcome.win && source === 'sect') {
      const baseLevel = Math.max(1, normalizeNumber(options.sectChallengeLevel, sect.challengeLevel))
      sect.challengeLevel = Math.min(realmNames.length * 9, baseLevel + 1)
      sect.highestChallengeLevel = Math.max(normalizeNumber(sect.highestChallengeLevel, 1), sect.challengeLevel)
      addSectLog(`你挑战${enemy.name}获胜，宗门试炼难度提升至第 ${sect.challengeLevel} 阶。`)
      addLog(`宗门试炼中，你击败了${enemy.name}，下一战将迎来更高境界对手。`)
      return
    }
    if (!outcome.win && source === 'sect') {
      addSectLog(`你挑战${enemy.name}失利，仍有所悟。`)
      addLog(`宗门试炼中，你败于${enemy.name}，但保住根基。`)
      return
    }
    if (outcome.win && source === 'tower') {
      const baseLevel = Math.max(1, normalizeNumber(options.towerLevel, sect.demonTowerLevel))
      sect.demonTowerLevel = baseLevel + 1
      sect.highestDemonTowerLevel = Math.max(normalizeNumber(sect.highestDemonTowerLevel, 1), sect.demonTowerLevel)
      addSectLog(`你镇压${enemy.name}，镇妖塔推进至第 ${sect.demonTowerLevel} 层。`)
      addLog(`镇妖塔中，你击败了${enemy.name}，下一层妖兽气息更盛。`)
      return
    }
    if (!outcome.win && source === 'tower') {
      addSectLog(`你在镇妖塔第 ${normalizeNumber(options.towerLevel, sect.demonTowerLevel)} 层失利，妖气反扑，所幸根基未损。`)
      addLog(`镇妖塔中，你败于${enemy.name}，暂且退回塔外调息。`)
    }
  }

  function startBattleFromRequest() {
    const raw = safeGetStorage(BATTLE_REQUEST_KEY)
    if (!raw) {
      battle.visible = false
      battle.isBattling = false
      battle.lastResult = '没有找到待进行的战斗。'
      return false
    }
    safeRemoveStorage(BATTLE_REQUEST_KEY)
    let request = null
    try {
      request = typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch (error) {
      battle.lastResult = '战斗请求损坏，已取消。'
      return false
    }
    const enemy = request?.enemy
    const options = request?.options || {}
    if (!enemy || !enemy.name) {
      battle.lastResult = '战斗对象不存在，已取消。'
      return false
    }
    battle.mode = request.mode === 'manual' ? 'manual' : 'auto'
    battle.returnUrl = options.returnUrl || '/pages/sect/sect'
    if (battle.mode === 'manual') {
      startManualBattle(enemy, options)
      return true
    }
    const outcome = runBattleSimulation(enemy, { source: options.source || 'sect' })
    applyAutoBattleProgress(enemy, outcome, options)
    beginBattlePlayback({
      ...outcome,
      source: options.source || 'sect',
      title: options.title || enemy.title || '自动战斗',
      enemyName: enemy.name,
      enemyRealmText: enemy.realmText,
      enemyMaxHp: enemy.maxHp,
      enemyHp: outcome.enemyHp,
      enemyAttack: enemy.attack,
      enemyDefense: enemy.defense,
      returnUrl: options.returnUrl
    })
    return true
  }

  function returnFromBattlePage() {
    if (battle.isBattling) {
      showFeedback('战斗尚未结束')
      return
    }
    const url = battle.returnUrl || '/pages/sect/sect'
    battle.visible = false
    battle.waitingForPlayer = false
    saveSilently()
    if (TAB_PAGES.includes(url)) {
      uni.switchTab({ url })
    } else {
      uni.redirectTo({
        url,
        animationType: 'fade-in',
        animationDuration: 180
      })
    }
  }

  function continueBattleChallenge() {
    if (battle.isBattling) {
      showFeedback('战斗尚未结束')
      return
    }
    const source = battle.source || 'sect'
    battle.visible = false
    battle.waitingForPlayer = false
    saveSilently()
    if (source === 'tower') {
      startDemonTowerChallenge()
      return
    }
    if (source === 'sect') {
      startSectChallenge()
      return
    }
    // exploration 或其他来源，返回原页面
    returnFromBattlePage()
  }

  function startSectChallenge() {
    if (!sect.joined) {
      showFeedback('尚未加入宗门')
      return
    }
    if (battle.isBattling) {
      showFeedback('战斗正在进行')
      return
    }
    if (player.hp <= 5) {
      showFeedback('生命过低，请先调息')
      return
    }
    const info = sectChallengeInfo.value
    if (info.isCapped) {
      addSectLog(`宗门试炼已达当前境界上限(${realmNames[Math.min(player.realmIndex + 1, realmNames.length - 1)] || '更高境界'})，请突破至更高境界后方可继续提升试炼阶位。`)
    }
    const enemy = createBattleEnemy('sect', {
      name: info.name,
      title: `宗门试炼 · ${info.name}`,
      difficultyRate: info.difficultyRate,
      realmIndex: info.realmIndex,
      realmLayer: info.realmLayer,
      maxHp: info.maxHp,
      attack: info.attack,
      defense: info.defense
    })
    const title = `宗门试炼 · ${enemy.name}`
    addSectLog(`你向${enemy.name}发起${battle.mode === 'manual' ? '手动' : '自动'}挑战。`)
    goBattlePage(enemy, { source: 'sect', title, sectChallengeLevel: info.level, returnUrl: '/pages/sect/sect' })
  }


  function startDemonTowerChallenge() {
    if (!sect.joined) {
      showFeedback('尚未加入宗门')
      return
    }
    if (battle.isBattling) {
      showFeedback('战斗正在进行')
      return
    }
    if (player.hp <= 5) {
      showFeedback('生命过低，请先调息')
      return
    }
    const info = demonTowerInfo.value
    if (info.isCapped) {
      addSectLog(`镇妖塔已达当前境界上限(${realmNames[Math.min(player.realmIndex + 1, realmNames.length - 1)] || '更高境界'})，请突破至更高境界后方可继续推进。`)
    }
    const enemy = createBattleEnemy('beast', {
      name: info.name,
      title: `镇妖塔 · ${info.locationText}`,
      rewardRate: 1 + Math.min(2.8, info.level * 0.025),
      difficultyRate: info.difficultyRate,
      realmIndex: info.realmIndex,
      realmLayer: info.realmLayer,
      maxHp: info.maxHp,
      attack: info.attack,
      defense: info.defense
    })
    enemy.realmText = info.realmText
    enemy.rewardRate = 1 + Math.min(2.8, info.level * 0.025)
    const title = `镇妖塔 · ${info.locationText}`
    addSectLog(`你踏入镇妖塔${info.locationText}，${battle.mode === 'manual' ? '手动' : '自动'}挑战${enemy.name}。`)
    goBattlePage(enemy, { source: 'tower', title, towerLevel: info.level, returnUrl: '/pages/sect/sect' })
  }

  function repairDemonTowerToTrueImmortal() {
    if (sect.towerRealmFixHidden) {
      showFeedback('修正入口已隐藏')
      return
    }
    uni.showModal({
      title: '修正镇妖塔层数',
      content: '此操作会把当前镇妖塔进度调整到真仙期起点：第10层·真仙期·第1间。按钮点击后将永久隐藏。确定继续吗？',
      success: (res) => {
        if (!res.confirm) return
        sect.demonTowerLevel = TRUE_IMMORTAL_TOWER_LEVEL
        sect.highestDemonTowerLevel = Math.max(TRUE_IMMORTAL_TOWER_LEVEL, normalizeNumber(sect.highestDemonTowerLevel, TRUE_IMMORTAL_TOWER_LEVEL))
        sect.towerRealmFixHidden = true
        addSectLog('你已将镇妖塔异常层数修正至真仙期起点，此修正入口永久隐藏。')
        addLog('镇妖塔层数已修正至真仙期第1间。')
        showFeedback('层数已修正', 'success')
        saveSilently()
      }
    })
  }

  function clearExplorationLogs() {
    explorationLogs.value = []
    exploration.lastResult = '探索记录已清空，山野重新归于沉寂。'
    showFeedback('探索记录已清空')
  }

  function selectRecipe(id) {
    alchemy.selectedRecipeId = id
    showFeedback('丹方已选择')
  }

  function changeBatchCount(step) {
    const next = alchemy.batchCount + step
    alchemy.batchCount = Math.max(1, Math.min(maxBatchCount.value, next))
  }

  function useAcceleratorCharm(qty = 1) {
    if (inventory.items.acceleratorCharm <= 0) {
      showFeedback('加速符不足')
      return
    }
    const amount = Math.max(1, Math.min(normalizeNumber(qty, 1), inventory.items.acceleratorCharm))
    inventory.items.acceleratorCharm -= amount
    inventory.furnaceStones += amount
    alchemy.lastResult = '你催动加速符，炉火更盛，下一次炼丹的成丹率心境更稳。'
    showFeedback('丹火加速', 'success')
    if (amount > 1) {
      addLog(`你批量使用 ${amount} 张加速符，获得 ${amount} 块炉石。`)
    } else {
      addLog('你使用一张加速符，获得 1 块炉石。')
    }
  }

  function hasRecipeMaterials(recipe, times = 1) {
    const mats = recipe.materials
    if (mats.herbs && inventory.herbs < mats.herbs * times) return false
    if (mats.ores && inventory.ores < mats.ores * times) return false
    if (mats.fruits && inventory.fruits < mats.fruits * times) return false
    if (mats.cores && inventory.cores < mats.cores * times) return false
    if (mats.scrolls && inventory.scrolls < mats.scrolls * times) return false
    return true
  }

  function costRecipeMaterials(recipe, times = 1) {
    const mats = recipe.materials
    if (mats.herbs) inventory.herbs -= mats.herbs * times
    if (mats.ores) inventory.ores -= mats.ores * times
    if (mats.fruits) inventory.fruits -= mats.fruits * times
    if (mats.cores) inventory.cores -= mats.cores * times
    if (mats.scrolls) inventory.scrolls -= mats.scrolls * times
  }

  function grantRecipeOutput(output, successCount) {
    if (output.type === 'pill') inventory.pills[output.key] += output.count * successCount
    if (output.type === 'breakthrough') player.breakthroughPills += output.count * successCount
  }

  function craftRecipe(times) {
    if (!alchemyUnlocked.value) {
      showFeedback('需筑基后开启')
      return
    }
    if (!selectedRecipe.value) {
      showFeedback('请先选择丹方')
      return
    }
    if (times > 1 && player.realmIndex < 2) {
      showFeedback('金丹后可批量')
      return
    }
    if (!hasRecipeMaterials(selectedRecipe.value, times)) {
      showFeedback('材料不足')
      addLog(`炼制《${selectedRecipe.value.name}》失败，材料尚未备齐。`)
      return
    }

    costRecipeMaterials(selectedRecipe.value, times)
    let successCount = 0
    for (let i = 0; i < times; i += 1) {
      if (Math.random() * 100 <= alchemySuccessRate.value) successCount += 1
    }
    const failCount = times - successCount
    if (successCount > 0) {
      grantRecipeOutput(selectedRecipe.value.output, successCount)
    }
    alchemy.lastResult = `你催动丹火炼制《${selectedRecipe.value.name}》${times} 次，成功 ${successCount} 次，失败 ${failCount} 次。`
    showFeedback(successCount > 0 ? '炼丹完成' : '炼丹失利', successCount > 0 ? 'success' : 'none')
    addLog(alchemy.lastResult)
  }

  function upgradeFurnace() {
    if (!alchemyUnlocked.value) {
      showFeedback('需筑基后开启')
      return
    }
    if (alchemy.furnaceLevel >= 5) {
      showFeedback('丹炉已满级')
      return
    }
    const need = nextFurnaceNeed.value
    if (inventory.ores < need.ores || inventory.spiritStones < need.stones || inventory.furnaceStones < need.furnaceStones) {
      showFeedback('升级材料不足')
      return
    }
    inventory.ores -= need.ores
    inventory.spiritStones -= need.stones
    inventory.furnaceStones -= need.furnaceStones
    alchemy.furnaceLevel += 1
    alchemy.lastResult = `丹炉已提升至 ${furnaceNames[alchemy.furnaceLevel - 1]}。`
    showFeedback('丹炉升级成功', 'success')
    addLog(`你以诸多材料温养丹炉，如今已晋升为${furnaceNames[alchemy.furnaceLevel - 1]}。`)
  }

  function canJoinSect(item) {
    return player.realmIndex >= item.needRealmIndex
  }

  function joinSect(id) {
    const found = sectTemplates.find(item => item.id === id)
    if (!found || !canJoinSect(found)) {
      showFeedback('境界不足')
      return
    }
    sect.joined = true
    sect.created = false
    sect.id = found.id
    sect.name = found.name
    sect.rank = '普通成员'
    sect.sectLevel = 1
    sect.contributionLevel = 1
    sect.contribution = 0
    sect.funds = 0
    sect.logs = []
    addSectLog(`你已加入${found.name}。`)
    addLog(`你正式加入${found.name}，自此有宗门依靠。`)
    showFeedback('加入宗门成功', 'success')
  }

  function createSect() {
    if (!canCreateSect.value) {
      showFeedback('需元婴后创建')
      return
    }
    const name = (sect.createName || '').trim()
    if (!name) {
      showFeedback('请输入宗门名')
      return
    }
    const spiritStonesNeed = 200
    const oresNeed = 10 * player.realmIndex
    const herbsNeed = 5 * player.realmIndex
    if (inventory.spiritStones < spiritStonesNeed || inventory.ores < oresNeed || inventory.herbs < herbsNeed) {
      showFeedback(`创建材料不足（需灵石${spiritStonesNeed}、矿石${oresNeed}、药材${herbsNeed}）`)
      return
    }
    inventory.spiritStones -= spiritStonesNeed
    inventory.ores -= oresNeed
    inventory.herbs -= herbsNeed
    sect.joined = true
    sect.created = true
    sect.id = 'custom_' + Date.now()
    sect.name = name
    sect.rank = '宗主'
    sect.sectLevel = 1
    sect.contributionLevel = 1
    sect.contribution = 60
    sect.funds = 80
    sect.logs = []
    sect.createdSects.push({
      id: sect.id,
      name: sect.name,
      sectLevel: sect.sectLevel,
      contributionLevel: sect.contributionLevel,
      contribution: sect.contribution,
      totalContribution: sect.totalContribution,
      funds: sect.funds,
      challengeLevel: sect.challengeLevel,
      highestChallengeLevel: sect.highestChallengeLevel,
      demonTowerLevel: sect.demonTowerLevel,
      highestDemonTowerLevel: sect.highestDemonTowerLevel
    })
    addSectLog(`你创立了宗门“${name}”。`)
    addLog(`你以元婴之威开山立派，宗门“${name}”正式建立。`)
    showFeedback('宗门创建成功', 'success')
  }

  function rejoinSect(createdSectId) {
    const found = sect.createdSects.find(item => item.id === createdSectId)
    if (!found) {
      showFeedback('宗门数据异常')
      return
    }
    sect.joined = true
    sect.created = true
    sect.id = found.id
    sect.name = found.name
    sect.rank = '宗主'
    sect.sectLevel = normalizeNumber(found.sectLevel, 1)
    sect.contributionLevel = normalizeNumber(found.contributionLevel, 1)
    sect.contribution = normalizeNumber(found.contribution, 0)
    sect.totalContribution = normalizeNumber(found.totalContribution, 0)
    sect.funds = normalizeNumber(found.funds, 0)
    sect.challengeLevel = normalizeNumber(found.challengeLevel, 1)
    sect.highestChallengeLevel = normalizeNumber(found.highestChallengeLevel, 1)
    sect.demonTowerLevel = normalizeNumber(found.demonTowerLevel, 1)
    sect.highestDemonTowerLevel = normalizeNumber(found.highestDemonTowerLevel, 1)
    sect.logs = []
    addSectLog(`你重返宗门"${found.name}"。`)
    addLog(`你重返自创宗门"${found.name}"，重掌大局。`)
    showFeedback('重返宗门成功', 'success')
  }

  function leaveSect() {
    if (sect.created) {
      const idx = sect.createdSects.findIndex(item => item.id === sect.id)
      const storeData = {
        id: sect.id,
        name: sect.name,
        sectLevel: sect.sectLevel,
        contributionLevel: sect.contributionLevel,
        contribution: sect.contribution,
        totalContribution: sect.totalContribution,
        funds: sect.funds,
        challengeLevel: sect.challengeLevel,
        highestChallengeLevel: sect.highestChallengeLevel,
        demonTowerLevel: sect.demonTowerLevel,
        highestDemonTowerLevel: sect.highestDemonTowerLevel
      }
      if (idx >= 0) {
        sect.createdSects[idx] = storeData
      } else {
        sect.createdSects.push(storeData)
      }
    }
    sect.joined = false
    sect.created = false
    sect.id = ''
    sect.name = ''
    sect.rank = '散修'
    sect.sectLevel = 1
    sect.contribution = 0
    sect.funds = 0
    sect.logs = []
    showFeedback('已离开宗门')
    addLog('你暂离宗门，再度成为自在散修。')
  }

  function claimSectWelfare() {
    ensureDailyState()
    if (!sect.joined) {
      showFeedback('尚未加入宗门')
      return
    }
    if (daily.welfareClaimed) {
      showFeedback('今日已领取')
      return
    }
    daily.welfareClaimed = true
    const stones = 30 + sect.sectLevel * 15
    const herbs = 2 + sect.sectLevel
    const pillKey = player.realmIndex >= 1 ? 'spiritRecover' : 'qiCondense'
    inventory.spiritStones += stones
    inventory.herbs += herbs
    inventory.pills[pillKey] = (inventory.pills[pillKey] || 0) + 1
    const pillName = getCultivationPillDef(pillKey).name
    showFeedback('福利已领取', 'success')
    addLog(`你领取宗门福利：灵石 ${stones}、药材 ${herbs}、${pillName} 1 枚。`)
    addSectLog('今日宗门福利已发放。')
  }

  function isSectTaskDone(id) {
    ensureDailyState()
    return daily.sectTasksDone.includes(id)
  }

  function doSectTask(id) {
    ensureDailyState()
    if (isSectTaskDone(id)) {
      showFeedback('今日已完成')
      return
    }
    const task = sectTasks.find(item => item.id === id)
    if (!task) return
    if (id === 'patrol') {
      inventory.spiritStones += 35 + sect.sectLevel * 8
      player.techniquePoints += 1 + Math.floor(sect.sectLevel / 4)
    }
    if (id === 'gather') {
      inventory.herbs += 4 + sect.sectLevel
      inventory.fruits += 2
      player.techniquePoints += 1 + Math.floor(sect.sectLevel / 5)
    }
    if (id === 'lecture') {
      player.techniquePoints += 2 + Math.floor(sect.sectLevel / 2)
    }
    daily.sectTasksDone.push(id)
    addSectContribution(task.rewardContribution)
    sect.funds += 20 + sect.sectLevel * 5
    showFeedback('任务完成', 'success')
    addLog(`你完成宗门任务「${task.title}」，获得贡献 ${task.rewardContribution} 点，并获得少量功法点。`)
    addSectLog(`任务「${task.title}」已完成。`)
  }

  function getSectUpgradeNeed() {
    return Math.floor(160 + sect.sectLevel * 95 + Math.pow(sect.sectLevel, 1.45) * 38)
  }

  function upgradeSectLevel() {
    if (!sect.joined) {
      showFeedback('尚未加入宗门')
      return
    }
    const needFunds = getSectUpgradeNeed()
    if (sect.funds < needFunds) {
      showFeedback('宗门资金不足')
      addSectLog(`宗门升级需要资金 ${needFunds}，当前仅有 ${sect.funds}。`)
      return
    }
    sect.funds -= needFunds
    sect.sectLevel += 1
    showFeedback('宗门升级成功', 'success')
    addLog(`宗门「${sect.name}」提升至 ${sect.sectLevel} 级，加持进一步增强。`)
    addSectLog(`宗门已晋升至 ${sect.sectLevel} 级。`)
  }

  function exchangeSectItem(id) {
    const item = sectExchanges.find(v => v.id === id)
    if (!item) return
    if (sect.contribution < item.cost) {
      showFeedback('贡献不足')
      return
    }
    if (id === 'explore') {
      const dailyCap = 10 + (normalizeNumber(sect.contributionLevel, 0) * 5)
      const used = normalizeNumber(daily.dailyTalismanExchangeUsed, 0)
      if (used >= dailyCap) {
        showFeedback(`今日探索符兑换已达上限（${dailyCap}/${dailyCap}）`)
        return
      }
      daily.dailyTalismanExchangeUsed = used + 1
    }
    sect.contribution -= item.cost
    if (id === 'pill') player.breakthroughPills += 1
    if (id === 'furnace') inventory.furnaceStones += 1
    if (id === 'explore') inventory.items.exploreTalisman += 1
    if (id === 'fragment') inventory.special.recipeFragment += 1
    if (id === 'chaos') {
      inventory.special.chaosPearl += 1
      inventory.equipments.chaosPearl += 1
    }
    showFeedback('兑换成功', 'success')
    addLog(`你在宗门中兑换了「${item.name}」。`)
  }

  function equipItem(id) {
    const info = equipmentCatalog.find(item => item.id === id)
    if (!info) return
    if (getEquipmentCount(id) <= 0) {
      showFeedback('未持有该装备')
      return
    }
    if (!canEquipItem(id)) {
      showFeedback('境界不足，无法装备')
      addLog(`你取出《${info.name}》，却觉灵压沉重。该装备需${getEquipmentUnlockText(info).replace('可装备', '')}后方可驾驭。`)
      return
    }
    if (inventory.equipped.artifacts && inventory.equipped.artifacts[info.type]) inventory.equipped.artifacts[info.type] = ''
    inventory.equipped.artifact = ''
    inventory.equipped[info.type] = id
    showFeedback('装备成功', 'success')
    addLog(`你装备了${getEquipmentTypeText(info.type)}《${info.name}》。`)
  }

  function sellMaterial(type, qty = 5) {
    const map = { herbs: 5, ores: 4 }
    const amount = Math.max(1, Math.min(normalizeNumber(qty, 5), inventory[type] || 0))
    if ((inventory[type] || 0) < amount) {
      showFeedback('材料不足')
      return
    }
    inventory[type] -= amount
    const gain = amount * (map[type] || 4)
    inventory.spiritStones += gain
    showFeedback('出售成功', 'success')
    addLog(`你出售了 ${amount} 份材料，换得 ${gain} 灵石。`)
  }

  function getEquipmentSellPrice(id) {
    const info = equipmentCatalog.find(item => item.id === id)
    if (!info) return 0
    const realmIndex = Math.max(0, normalizeNumber(info.unlockRealm, 0))
    const base = 55 * Math.pow(2.85, realmIndex)
    const typeRate = info.type === 'weapon' ? 1.12 : info.type === 'armor' ? 1.08 : 0.95
    return Math.max(20, Math.floor(base * typeRate))
  }

  function canSellEquipment(id) {
    const info = equipmentCatalog.find(item => item.id === id)
    if (!info) return false
    const count = getEquipmentCount(id)
    if (count <= 0) return false
    if (inventory.equipped[info.type] === id && count <= 1) return false
    return true
  }

  function sellEquipment(id) {
    const info = equipmentCatalog.find(item => item.id === id)
    if (!info) return
    if (!canSellEquipment(id)) {
      showFeedback('已装备的唯一装备不能出售')
      return
    }
    const price = getEquipmentSellPrice(id)
    if (inventory.equipments[id] > 0) inventory.equipments[id] -= 1
    else if (inventory.special[id] > 0) inventory.special[id] -= 1
    inventory.spiritStones += price
    showFeedback('装备已出售', 'success')
    addLog(`你出售多余${getEquipmentTypeText(info.type)}《${info.name}》，获得灵石 ${price}。`)
  }

  function donateHerbs(qty = 5) {
    if (!sect.joined) {
      showFeedback('尚未加入宗门')
      return
    }
    const amount = Math.max(1, Math.min(normalizeNumber(qty, 5), inventory.herbs))
    if (inventory.herbs < amount) {
      showFeedback('药材不足')
      return
    }
    inventory.herbs -= amount
    const contribution = Math.floor(amount * 2.4)
    const funds = Math.floor(amount * 3.6)
    addSectContribution(contribution)
    sect.funds += funds
    showFeedback('捐献成功', 'success')
    addLog(`你向宗门捐献药材 ${amount} 份，获得贡献 ${contribution}。`)
  }

  function donateOres(qty = 4) {
    if (!sect.joined) {
      showFeedback('尚未加入宗门')
      return
    }
    const amount = Math.max(1, Math.min(normalizeNumber(qty, 4), inventory.ores))
    if (inventory.ores < amount) {
      showFeedback('矿石不足')
      return
    }
    inventory.ores -= amount
    const contribution = Math.floor(amount * 3.5)
    const funds = Math.floor(amount * 5.5)
    addSectContribution(contribution)
    sect.funds += funds
    showFeedback('捐献成功', 'success')
    addLog(`你向宗门捐献矿石 ${amount} 份，获得贡献 ${contribution}。`)
  }

  function synthesizeChaosPearl() {
    if (inventory.scrolls < 3 || inventory.ores < 5 || inventory.spiritStones < 80) {
      showFeedback('合成材料不足')
      return
    }
    inventory.scrolls -= 3
    inventory.ores -= 5
    inventory.spiritStones -= 80
    inventory.special.chaosPearl += 1
    inventory.equipments.chaosPearl += 1
    showFeedback('混沌珠已合成', 'success')
    addLog('你以残卷与矿石凝练出一枚混沌珠。')
  }

  function canBuyShopGood(item, amount = 1) {
    const qty = Math.max(1, Math.floor(normalizeNumber(amount, 1)))
    return !!item && player.realmIndex >= normalizeNumber(item.unlockRealm, 0) && inventory.spiritStones >= normalizeNumber(item.cost, 0) * qty
  }

  function getShopGoodUnlockText(item) {
    if (!item) return ''
    const realmIndex = Math.max(0, Math.min(realmNames.length - 1, normalizeNumber(item.unlockRealm, 0)))
    return realmIndex <= 0 ? '炼气期可购' : `${realmNames[realmIndex]}可购`
  }

  function buyShopGood(id, amount = 1) {
    const item = shopGoods.find(v => v.id === id)
    if (!item) {
      showFeedback('商品不存在')
      return
    }
    const buyAmount = Math.max(1, Math.min(999, Math.floor(normalizeNumber(amount, 1))))
    if (player.realmIndex < normalizeNumber(item.unlockRealm, 0)) {
      showFeedback('境界不足，暂不可购')
      addLog(`你查看「${item.name}」，但此物至少需${getShopGoodUnlockText(item).replace('可购', '')}后方可兑换。`)
      return
    }
    const totalCost = normalizeNumber(item.cost, 0) * buyAmount
    if (inventory.spiritStones < totalCost) {
      showFeedback('灵石不足')
      return
    }

    inventory.spiritStones -= totalCost
    const count = Math.max(1, normalizeNumber(item.count, 1)) * buyAmount

    if (item.type === 'equipment') {
      grantEquipment(item.target, count)
    } else if (item.type === 'material') {
      inventory[item.target] = normalizeNumber(inventory[item.target], 0) + count
    } else if (item.type === 'item') {
      inventory.items[item.target] = normalizeNumber(inventory.items[item.target], 0) + count
    } else if (item.type === 'special') {
      inventory.special[item.target] = normalizeNumber(inventory.special[item.target], 0) + count
    } else if (item.type === 'cultivationPill') {
      inventory.pills[item.target] = normalizeNumber(inventory.pills[item.target], 0) + count
    } else if (item.type === 'breakthroughPill') {
      player.breakthroughPills += count
    } else if (item.type === 'attributePill') {
      inventory.pills[item.target] = normalizeNumber(inventory.pills[item.target], 0) + count
    } else if (item.type === 'techniquePoints') {
      player.techniquePoints += count
    }

    showFeedback('兑换成功', 'success')
    addLog(`你在商店花费 ${formatNumber(totalCost)} 枚灵石，兑换「${item.name}」${buyAmount} 次，共获得 ×${count}。`)
  }

  function unlockRecipeByFragment() {
    const locked = recipes.filter(item => !availableRecipes.value.find(v => v.id === item.id))
    if (!locked.length) {
      showFeedback('丹方已全部解锁')
      return
    }
    if (inventory.special.recipeFragment <= 0) {
      showFeedback('残卷不足')
      return
    }
    inventory.special.recipeFragment -= 1
    const one = locked[0]
    alchemy.recipeUnlocks.push(one.id)
    showFeedback('丹方已解锁', 'success')
    addLog(`你参悟高阶丹方残卷，解锁《${one.name}》。`)
  }

  function clearLogs() {
    logs.value = []
    addLog('你拂去旧日记录，灵台再归清明。')
    showFeedback('日志已清空')
  }


  function applyLoadedSaveSilently(save) {
    inventoryTab.value = save.inventoryTab
    Object.assign(player, save.player)
    Object.assign(inventory, save.inventory)
    Object.assign(settings, save.settings)
    Object.assign(exploration, save.exploration)
    Object.assign(alchemy, save.alchemy)
    Object.assign(sect, save.sect)
    Object.assign(battle, save.battle)
    battle.visible = false
    battle.isBattling = false
    Object.assign(daily, save.daily)
    autoCultivationEnabled.value = save.autoCultivationEnabled
    saved.lastSaveAt = save.lastSaveAt || Date.now()
    lastOfflineCheckpoint.value = saved.lastSaveAt
    logs.value = save.logs.length ? save.logs : []
    explorationLogs.value = save.explorationLogs.length ? save.explorationLogs : []
    syncBattleVitalsAfterLoad()
  }

  function readSlotStorage() {
    refreshSlotMeta()
    const slotKey = getSlotDataKey(slotMeta.activeId)
    const slotRaw = safeGetStorage(slotKey)
    if (slotRaw) return slotRaw
    return null
  }

  function readStorageForSlot(slotId) {
    const key = getSlotDataKey(slotId)
    return safeGetStorage(key)
  }

  function reloadCurrentSaveSilently() {
    const raw = readSlotStorage()
    if (!raw) {
      const merged = defaultSave()
      applyLoadedSaveSilently(merged)
      syncCurrentPageType()
      return
    }
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      const save = migrateSave(parsed)
      applyLoadedSaveSilently(save)
    } catch {
      applyLoadedSaveSilently(defaultSave())
    }
    syncCurrentPageType()
  }

  function saveGame() {
    saveSilently()
    showFeedback('存档成功', 'success')
    addLog('灵识烙印已落下，本地存档保存成功。')
  }

  function loadGame() {
    const save = loadStorage()
    activeTab.value = save.activeTab
    syncCurrentPageType()
    inventoryTab.value = save.inventoryTab
    Object.assign(player, save.player)
    Object.assign(inventory, save.inventory)
    Object.assign(settings, save.settings)
    Object.assign(exploration, save.exploration)
    Object.assign(alchemy, save.alchemy)
    Object.assign(sect, save.sect)
    Object.assign(battle, save.battle)
    battle.visible = false
    battle.isBattling = false
    Object.assign(daily, save.daily)
    autoCultivationEnabled.value = save.autoCultivationEnabled
    saved.lastSaveAt = save.lastSaveAt || Date.now()
    lastOfflineCheckpoint.value = saved.lastSaveAt
    logs.value = save.logs.length ? save.logs : []
    explorationLogs.value = save.explorationLogs.length ? save.explorationLogs : []
    syncBattleVitalsAfterLoad()
    showFeedback('读档完成', 'success')
    addLog('你循着灵识回溯前尘，读档完成。')
    applyOfflineCultivation('读档')
  }

  function resetGame() {
    uni.showModal({
      title: '提示',
      content: '确定要清空当前本地存档并重新开始吗？',
      success: (res) => {
        if (!res.confirm) return
        safeRemoveStorage(getSlotDataKey(slotMeta.activeId))
        safeRemoveStorage(STORAGE_KEY)
        LEGACY_STORAGE_KEYS.forEach(key => safeRemoveStorage(key))
        const fresh = defaultSave()
        activeTab.value = fresh.activeTab
        syncCurrentPageType()
        inventoryTab.value = fresh.inventoryTab
        Object.assign(player, fresh.player)
        Object.assign(inventory, fresh.inventory)
        Object.assign(settings, fresh.settings)
        Object.assign(exploration, fresh.exploration)
        Object.assign(alchemy, fresh.alchemy)
        Object.assign(sect, fresh.sect)
        Object.assign(battle, fresh.battle)
        Object.assign(daily, fresh.daily)
        autoCultivationEnabled.value = fresh.autoCultivationEnabled
        saved.lastSaveAt = Date.now()
        lastOfflineCheckpoint.value = saved.lastSaveAt
        logs.value = []
        explorationLogs.value = []
        addLog('你斩去旧因果，从炼气一层重新踏上仙途。')
        showFeedback('已重新开始', 'success')
      }
    })
  }

  watch(
    [player, inventory, settings, exploration, alchemy, sect, battle, daily, activeTab, inventoryTab, autoCultivationEnabled, logs, explorationLogs],
    () => {
      queueAutoSave()
    },
    { deep: true }
  )

  function startTimer() {
    if (autoTimer) clearInterval(autoTimer)
    autoTimer = setInterval(() => {
      cultivateByAuto()
    }, 1000)
  }

  function stopTimer() {
    if (autoTimer) {
      clearInterval(autoTimer)
      autoTimer = null
    }
  }

  onLoad(() => {
    syncCurrentPageType()
    ensureDailyState()
    applyOfflineCultivation('上线')
    if (!logs.value.length) addLog('你于山门外醒来，灵根初显，自此踏上漫漫仙途。')
    if (!explorationLogs.value.length) addExplorationLog('山风微动，远处秘境未明，新的探索尚待启程。')
    startTimer()
  })

  onShow(() => {
    reloadCurrentSaveSilently()
    ensureDailyState()
    applyOfflineCultivation('回到洞府')
    startTimer()
  })

  onHide(() => {
    if (isExploring.value) finishExplorationPlayback(true)
    if (battle.isBattling) skipBattleProcess()
    saveSilently()
    stopTimer()
  })

  onUnmounted(() => {
    if (isExploring.value) finishExplorationPlayback(true)
    clearExplorationPlaybackTimer()
    clearBattlePlaybackTimer()
    stopTimer()
    if (saveTimer) clearTimeout(saveTimer)
  })

  return {
    syncCurrentPageType,
    goPage,
    STORAGE_KEY,
    BATTLE_REQUEST_KEY,
    LEGACY_STORAGE_KEYS,
    SAVE_VERSION,
    realmNames,
    furnaceNames,
    techniques,
    explorationMaps,
    difficulties,
    battleSkills,
    cultivationPillDefs,
    shopGoods,
    enemyNamePools,
    recipes,
    sectTemplates,
    sectTasks,
    sectExchanges,
    equipmentCatalog,
    artifactCatalog,
    defaultSave,
    safeGetStorage,
    safeSetStorage,
    safeRemoveStorage,
    slotMeta,
    saveSlotMeta,
    createSaveSlot,
    switchSaveSlot,
    deleteSaveSlot,
    renameSaveSlot,
    readAnySavedStorage,
    normalizeArray,
    normalizeNumber,
    migrateSave,
    loadStorage,
    saved,
    activeTab,
    inventoryTab,
    player,
    inventory,
    settings,
    exploration,
    alchemy,
    sect,
    battle,
    daily,
    autoCultivationEnabled,
    lastOfflineCheckpoint,
    logs,
    explorationLogs,
    currentWeapon,
    currentArmor,
    currentAccessory,
    currentTalisman,
    currentArtifact,
    currentArtifactType,
    currentWeaponArtifact,
    currentArmorArtifact,
    currentAccessoryArtifact,
    currentTalismanArtifact,
    equippedArtifacts,
    currentWeaponName,
    currentArmorName,
    currentAccessoryName,
    currentTalismanName,
    currentArtifactName,
    equipmentBonus,
    sectBonus,
    actualBone,
    actualComprehension,
    actualFortune,
    battleMaxHp,
    battleAttack,
    battleDefense,
    battlePower,
    battleFleeChance,
    techniqueBattleBonus,
    skillBattleBonus,
    availableBattleSkills,
    getBattleSkillLevel,
    getBattleSkillUpgradeNeed,
    getBattleSkillMaxLevel,
    getBattleSkillPower,
    getBattleSkillPowerText,
    getBattleSkillCost,
    upgradeBattleSkill,
    unlockedBattleSkills,
    equipBattleSkill,
    unequipBattleSkill,
    isSkillEquipped,
    getAttributeMax,
    getAttributeMaxText,
    getBuffStatusText,
    getTechniqueUpgradeNeed,
    getTechniqueMaxLevel,
    battlePlaybackPercent,
    currentBattleStepText,
    getRealmBattleRate,
    getRealmScaledBattleStats,
    getDifficultyCombatRate,
    getBattlePowerFromStats,
    getRealmPressure,
    getRealmLayerFromChallengeLevel,
    getRealmLayerText,
    sectChallengeInfo,
    getTowerRealmLayerFromLevel,
    getTowerRealmText,
    demonTowerInfo,
    showDemonTowerRealmFix,
    getTowerFloorText,
    getTowerRoomText,
    getTowerLocationText,
    currentRealmName,
    nextMajorRealmName,
    isLastRealm,
    alchemyUnlocked,
    sectUnlocked,
    canCreateSect,
    getSectCreateMaterials,
    dailyExchangeCap,
    furnaceName,
    maxBatchCount,
    selectedMap,
    selectedDifficulty,
    equippedTechnique,
    selectedRecipe,
    currentLayerNeed,
    progressPercent,
    breakthroughSpiritNeed,
    breakthroughPillNeed,
    breakthroughSuccessRate,
    canBreakthrough,
    autoGain,
    manualGain,
    manualSpiritCost,
    dailyManualLimit,
    manualCultivateLeft,
    dailyTalismanExchangeLimit,
    dailyTalismanExchangeLeft,
    autoGainText,
    manualGainText,
    explorationSpiritCost,
    explorationSuccessRate,
    explorationCultivationReward,
    totalExploreStepCount,
    currentExploreStepText,
    explorePlaybackPercent,
    alchemySuccessRate,
    nextFurnaceNeed,
    availableRecipes,
    autoTimer,
    saveTimer,
    explorationPlaybackTimer,
    battlePlaybackTimer,
    isExploring,
    pendingExplorationOutcome,
    pendingBattleOutcome,
    exploreModalVisible,
    getDayKey,
    ensureDailyState,
    buildPayload,
    getLatestStoredPayload,
    protectFreshSettingsBeforeSave,
    markSettingsChanged,
    saveSilently,
    queueAutoSave,
    formatNumber,
    formatEquipmentEffect,
    nowTime,
    showFeedback,
    addLog,
    addExplorationLog,
    addSectLog,
    addSectContribution,
    getTechniqueAutoBonus,
    getTechniqueManualBonus,
    getEquipmentCount,
    getEquipmentTypeText,
    getEquipmentUnlockText,
    getEquipmentDropRateText,
    getArtifactDropRateText,
    getEquipmentSellPrice,
    canSellEquipment,
    getEquippedArtifactId,
    getEquippedArtifact,
    getArtifactState,
    isArtifactOwned,
    getArtifactRealmText,
    getArtifactBonus,
    getArtifactEffectText,
    getArtifactUpgradeNeed,
    canUpgradeArtifact,
    upgradeArtifact,
    equipArtifact,
    isArtifactEquipped,
    canEquipItem,
    isEquipmentEquipped,
    getMapCardClass,
    getRecipeMaterialText,
    switchTab,
    switchInventoryTab,
    cultivateByAuto,
    manualCultivate,
    meditateRecover,
    debugAddRealmLayer,
    toggleAutoCultivation,
    togglePauseWhenFull,
    togglePauseWhenSpiritLow,
    setAutoBreakthrough,
    toggleAutoBreakthrough,
    equipTechnique,
    upgradeTechnique,
    gainStarterPill,
    getCultivationPillDef,
    getCultivationPillGain,
    canUseCultivationPill,
    useCultivationPill,
    useQiCondensePill,
    useSpiritRecoverPill,
    useAttributePill,
    getBreakthroughCarryRate,
    applyBreakthroughSuccess,
    tryBreakthrough,
    runAutoBreakthrough,
    applyOfflineCultivation,
    formatOfflineDuration,
    isMapUnlocked,
    selectMap,
    selectDifficulty,
    recoverExplorationTimes,
    useExploreTalisman,
    grantEquipment,
    grantArtifact,
    tryGrantRandomArtifact,
    grantRecipeFragment,
    maybeUnlockRecipeFromEvent,
    pickRandom,
    getMapSceneTexts,
    getExploreEventPool,
    pushExploreStep,
    buildExploreSummary,
    snapshotExploreMutableState,
    restoreExploreMutableState,
    clearExplorationPlaybackTimer,
    revealNextExploreStep,
    beginExplorationPlayback,
    finishExplorationPlayback,
    skipExplorationProcess,
    closeExploreModal,
    continueExplorationAfterBattle,
    startExploration,
    clampPlayerHp,
    syncBattleVitalsAfterLoad,
    recoverBattleState,
    toggleBattleMode,
    setBattleMode,
    getBattleSkillById,
    startManualBattle,
    useManualBattleSkill,
    attemptFlee,
    autoFinishManualBattle,
    pickBattleSkill,
    createBattleEnemy,
    resolveBattleRewards,
    runBattleSimulation,
    appendBattleToExplore,
    clearBattlePlaybackTimer,
    beginBattlePlayback,
    finishBattlePlayback,
    skipBattleProcess,
    closeBattleModal,
    buildBattlePageRequest,
    goBattlePage,
    applyAutoBattleProgress,
    startBattleFromRequest,
    returnFromBattlePage,
    continueBattleChallenge,
    startSectChallenge,
    startDemonTowerChallenge,
    repairDemonTowerToTrueImmortal,
    clearExplorationLogs,
    selectRecipe,
    changeBatchCount,
    useAcceleratorCharm,
    hasRecipeMaterials,
    costRecipeMaterials,
    grantRecipeOutput,
    craftRecipe,
    upgradeFurnace,
    canJoinSect,
    joinSect,
    createSect,
    leaveSect,
    rejoinSect,
    claimSectWelfare,
    isSectTaskDone,
    doSectTask,
    getSectUpgradeNeed,
    upgradeSectLevel,
    exchangeSectItem,
    equipItem,
    sellMaterial,
    sellEquipment,
    donateHerbs,
    donateOres,
    synthesizeChaosPearl,
    canBuyShopGood,
    getShopGoodUnlockText,
    buyShopGood,
    unlockRecipeByFragment,
    clearLogs,
    applyLoadedSaveSilently,
    reloadCurrentSaveSilently,
    saveGame,
    loadGame,
    resetGame,
    startTimer,
    stopTimer
  }
}
