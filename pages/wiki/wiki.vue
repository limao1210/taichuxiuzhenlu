<template>
  <view class="page-wrap fade-page">
    <view class="topbar card">
      <view class="topbar-main">
        <text class="title">修真百科</text>
        <text class="subtitle">收录境界、丹药、装备、材料、道具、地图、技能与商店商品说明。百科仅供查看，不消耗任何资源。</text>
      </view>
      <!-- <view class="topbar-buttons">
        <button class="ghost-btn mini-btn" @click="saveGame">手动存档</button>
        <button class="ghost-btn mini-btn" @click="loadGame">读档</button>
        <button class="danger-btn mini-btn" @click="resetGame">重开</button>
      </view> -->
    </view>

    <scroll-view scroll-x class="inner-nav-scroll">
      <view class="inner-nav card">
        <button class="inner-nav-btn" :class="wikiView === 'realm' ? 'active' : ''" @click="switchWikiView('realm')">境界</button>
        <button class="inner-nav-btn" :class="wikiView === 'pill' ? 'active' : ''" @click="switchWikiView('pill')">丹药</button>
        <button class="inner-nav-btn" :class="wikiView === 'equipment' ? 'active' : ''" @click="switchWikiView('equipment')">装备</button>
        <button class="inner-nav-btn" :class="wikiView === 'material' ? 'active' : ''" @click="switchWikiView('material')">材料</button>
        <button class="inner-nav-btn" :class="wikiView === 'item' ? 'active' : ''" @click="switchWikiView('item')">道具</button>
        <button class="inner-nav-btn" :class="wikiView === 'skill' ? 'active' : ''" @click="switchWikiView('skill')">技能</button>
        <button class="inner-nav-btn" :class="wikiView === 'map' ? 'active' : ''" @click="switchWikiView('map')">地图</button>
        <button class="inner-nav-btn" :class="wikiView === 'recipe' ? 'active' : ''" @click="switchWikiView('recipe')">丹方</button>
        <button class="inner-nav-btn" :class="wikiView === 'shop' ? 'active' : ''" @click="switchWikiView('shop')">商店</button>
      </view>
    </scroll-view>

    <view class="page-grid single-view-grid">
      <view class="card section-card full-width">
        <view class="section-head">
          <text class="section-title">{{ wikiTitle }}</text>
          <view class="small-badge">百科资料</view>
        </view>

        <view v-if="wikiView === 'realm'" class="wiki-list">
          <view v-for="(name, index) in realmNames" :key="name" class="wiki-card">
            <view class="recipe-head">
              <view>
                <text class="recipe-name">{{ name }}</text>
                <text class="recipe-desc">第 {{ index + 1 }} 个大境界，共 1 至 9 层。大境界突破后战斗属性会获得明显跃迁。</text>
              </view>
              <view class="small-badge">{{ index === player.realmIndex ? '当前境界' : '境界' }}</view>
            </view>
            <view class="recipe-meta">
              <text>定位：{{ getRealmIntro(index) }}</text>
            </view>
          </view>
        </view>

        <view v-else-if="wikiView === 'pill'" class="wiki-list">
          <view v-for="pill in cultivationPillDefs" :key="pill.key" class="wiki-card">
            <view class="recipe-head">
              <view>
                <text class="recipe-name">{{ pill.name }}</text>
                <text class="recipe-desc">{{ pill.realmText }}修为丹 · {{ pill.desc }}</text>
              </view>
              <view class="small-badge">固定修为 {{ formatNumber(pill.gain) }}</view>
            </view>
            <view class="recipe-meta">
              <text>规则：可吸收本境界与低阶丹药，不能吸收高阶丹药；低阶丹药跨境吸收会衰减。</text>
            </view>
          </view>
          <view class="wiki-card">
            <view class="recipe-head">
              <view>
                <text class="recipe-name">破障丹</text>
                <text class="recipe-desc">突破辅助丹，只用于增加突破概率，不再作为突破硬性材料。</text>
              </view>
              <view class="small-badge">突破辅助</view>
            </view>
          </view>
          <view v-for="pill in attributePillWiki" :key="pill.name" class="wiki-card">
            <view class="recipe-head">
              <view>
                <text class="recipe-name">{{ pill.name }}</text>
                <text class="recipe-desc">{{ pill.desc }}</text>
              </view>
              <view class="small-badge">属性丹</view>
            </view>
          </view>
        </view>

        <view v-else-if="wikiView === 'equipment'" class="wiki-list">
          <view v-for="item in artifactCatalog" :key="item.id" class="wiki-card artifact-card">
            <view class="recipe-head">
              <view>
                <text class="recipe-name">{{ item.name }} · {{ getEquipmentTypeText(item.type) }}神器</text>
                <text class="recipe-desc">{{ item.desc }}</text>
              </view>
              <view class="small-badge">极低概率</view>
            </view>
            <view class="recipe-meta">
              <text>获取概率：{{ getArtifactDropRateText(item) }}</text>
              <text>规则：拥有自身境界和 1-9 阶，消耗功法点成长，不能超过玩家境界；装备后占用对应普通装备位，不能与同类型普通装备叠加。</text>
            </view>
          </view>
          <view v-for="item in equipmentCatalog" :key="item.id" class="wiki-card">
            <view class="recipe-head">
              <view>
                <text class="recipe-name">{{ item.name }} · {{ getEquipmentTypeText(item.type) }}</text>
                <text class="recipe-desc">{{ item.desc }}</text>
              </view>
              <view class="small-badge">{{ realmNames[item.unlockRealm] }}可装备</view>
            </view>
            <view class="recipe-meta">
              <text>{{ item.effectText }}</text>
              <text>获取概率：{{ getEquipmentDropRateText(item) }}</text>
              <text>限制：未达到对应大境界时无法装备，装备加成不会生效。</text>
            </view>
          </view>
        </view>

        <view v-else-if="wikiView === 'material'" class="wiki-list">
          <view v-for="item in materialWiki" :key="item.name" class="wiki-card">
            <view class="recipe-head">
              <view>
                <text class="recipe-name">{{ item.name }}</text>
                <text class="recipe-desc">{{ item.desc }}</text>
              </view>
              <view class="small-badge">{{ item.type }}</view>
            </view>
            <view class="recipe-meta">
              <text>主要来源：{{ item.source }}</text>
            </view>
          </view>
        </view>

        <view v-else-if="wikiView === 'item'" class="wiki-list">
          <view v-for="item in itemWiki" :key="item.name" class="wiki-card">
            <view class="recipe-head">
              <view>
                <text class="recipe-name">{{ item.name }}</text>
                <text class="recipe-desc">{{ item.desc }}</text>
              </view>
              <view class="small-badge">{{ item.type }}</view>
            </view>
          </view>
        </view>

        <view v-else-if="wikiView === 'skill'" class="wiki-list">
          <view v-for="skill in battleSkills" :key="skill.id" class="wiki-card">
            <view class="recipe-head">
              <view>
                <text class="recipe-name">{{ skill.name }}</text>
                <text class="recipe-desc">{{ skill.desc }}</text>
              </view>
              <view class="small-badge">Lv.{{ getBattleSkillLevel(skill) }} · 灵力 {{ getBattleSkillCost(skill) }}</view>
            </view>
            <view class="recipe-meta">
              <text>伤害倍率 ×{{ getBattleSkillPowerText(skill) }}，升级需功法点 {{ getBattleSkillUpgradeNeed(skill) }}，{{ skill.healRate ? '带有生命回复效果' : '无额外回复' }}</text>
            </view>
          </view>
        </view>

        <view v-else-if="wikiView === 'map'" class="wiki-list">
          <view v-for="map in explorationMaps" :key="map.id" class="wiki-card">
            <view class="recipe-head">
              <view>
                <text class="recipe-name">{{ map.name }}</text>
                <text class="recipe-desc">{{ map.desc }}</text>
              </view>
              <view class="small-badge">{{ map.unlockText }}</view>
            </view>
            <view class="recipe-meta">
              <text>推荐：{{ map.recommend }}</text>
              <text>危险：{{ map.danger }}</text>
              <text>产出：{{ map.rewardHint }}</text>
            </view>
          </view>
        </view>

        <view v-else-if="wikiView === 'recipe'" class="wiki-list">
          <view v-for="recipe in recipes" :key="recipe.id" class="wiki-card">
            <view class="recipe-head">
              <view>
                <text class="recipe-name">{{ recipe.name }}</text>
                <text class="recipe-desc">{{ recipe.category }} · {{ recipe.desc }}</text>
              </view>
              <view class="small-badge">{{ realmNames[recipe.unlockRealm] }}解锁</view>
            </view>
            <view class="recipe-meta">
              <text>{{ getRecipeMaterialText(recipe) }}</text>
              <text>产出：{{ recipe.outputText }}</text>
            </view>
          </view>
        </view>

        <view v-else-if="wikiView === 'shop'" class="wiki-list">
          <view v-for="item in shopGoods" :key="item.id" class="wiki-card">
            <view class="recipe-head">
              <view>
                <text class="recipe-name">{{ item.name }}</text>
                <text class="recipe-desc">{{ item.category }} · {{ item.desc }}</text>
              </view>
              <view class="small-badge">{{ getShopGoodUnlockText(item) }}</view>
            </view>
            <view class="recipe-meta">
              <text>价格：{{ formatNumber(item.cost) }} 灵石</text>
              <text>兑换数量：×{{ item.count }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useGame } from '@/common/game/useGame.js'

const {
  goPage,
  realmNames,
  cultivationPillDefs,
  equipmentCatalog,
  artifactCatalog,
  battleSkills,
  getBattleSkillLevel,
  getBattleSkillUpgradeNeed,
  getBattleSkillPowerText,
  getBattleSkillCost,
  explorationMaps,
  recipes,
  shopGoods,
  player,
  alchemyUnlocked,
  sectUnlocked,
  formatNumber,
  getEquipmentTypeText,
  getEquipmentDropRateText,
  getArtifactDropRateText,
  getRecipeMaterialText,
  getShopGoodUnlockText,
  saveGame,
  loadGame,
  resetGame
} = useGame('wiki')

const wikiView = ref('pill')

const wikiTitle = computed(() => {
  const map = {
    realm: '境界百科',
    pill: '丹药百科',
    equipment: '装备百科',
    material: '材料百科',
    item: '道具百科',
    skill: '战斗技能百科',
    map: '探索地图百科',
    recipe: '炼丹丹方百科',
    shop: '商店商品百科'
  }
  return map[wikiView.value] || '修真百科'
})

const attributePillWiki = [
  { name: '洗髓丹', desc: '服用后根骨 +1，提升修炼速度和部分战斗属性。' },
  { name: '悟心丹', desc: '服用后悟性 +1，影响功法领悟、突破成功率与部分收益。' },
  { name: '天缘丹', desc: '服用后福缘 +1，影响探索、炼丹、掉落与机缘收益。' }
]

const materialWiki = [
  { name: '药材', type: '炼丹材料', desc: '基础草药类材料，是多数修为丹和属性丹的核心材料。', source: '探索、宗门任务、商店' },
  { name: '灵果', type: '炼丹材料', desc: '蕴含温和灵气，常用于修为丹与高阶丹药辅材。', source: '探索、宗门任务、商店' },
  { name: '矿石', type: '炼丹/炼器材料', desc: '用于丹炉升级、部分高阶丹方以及装备相关玩法预留。', source: '探索洞窟、商店' },
  { name: '妖兽内丹', type: '高阶材料', desc: '魔物或妖兽体内凝结的灵核，是高阶修为丹的重要材料。', source: '探索战斗、商店' },
  { name: '残卷', type: '悟道材料', desc: '前人遗留的残破经文，可用于丹方、悟性丹和后续功法扩展。', source: '探索、宗门兑换、商店' },
  { name: '炉石', type: '炼丹道具', desc: '蕴含稳定地火之力，用于升级炼丹炉。', source: '探索、宗门兑换、商店' },
  { name: '灵石', type: '货币', desc: '游戏主要流通货币，可用于商店兑换、恢复资源、宗门建设。', source: '探索、战斗、宗门任务、出售材料' },
  { name: '仙玉', type: '稀有货币', desc: '预留高级货币，目前主要作为后续扩展资源。', source: '后续玩法预留' }
]

const itemWiki = [
  { name: '探索符', type: '探索道具', desc: '使用后额外增加探索机会，适合资源紧缺时继续探索。' },
  { name: '加速符', type: '炼丹道具', desc: '用于辅助炼丹，当前使用后可获得额外炉石补给。' },
  { name: '丹方残卷', type: '特殊道具', desc: '可用于解锁高阶丹方，是炼丹成长线的重要资源。' },
  { name: '混沌珠', type: '特殊宝物', desc: '稀有饰品，提升多项属性和综合收益，也可作为创建宗门材料。' }
]

function switchWikiView(view) {
  wikiView.value = view
}

function getRealmIntro(index) {
  const texts = [
    '初入仙途，重在积累修为与熟悉探索。',
    '筑基稳固，经脉扩展，炼丹体系开始发力。',
    '金丹凝成，宗门系统开启，战斗能力显著增强。',
    '元婴出窍，生命与攻击跨越式提升，可挑战更高阶秘境。',
    '神识化灵，战斗与探索开始进入高阶阶段。',
    '以虚炼真，对资源、装备和丹药循环提出更高要求。',
    '身魂合一，适合后续宗门战与高阶玩法扩展。',
    '大道将成，数值成长进入极高阶段。',
    '面临天劫，是当前体系最高阶段。'
  ]
  return texts[index] || '更高仙路，待后续续写。'
}
</script>

<style scoped lang="scss">
@import '@/common/styles/game.scss';
</style>
