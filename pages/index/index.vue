<template>
  <view class="page-wrap">
  <view class="topbar card">
      <view class="topbar-main">
<!--        <text class="eyebrow">文字修仙 · 微信小程序完整基础版</text> -->
        <text class="title">太初修真录</text>
        <!-- <text class="subtitle">已拆分为修仙、探索、炼丹、宗门、宝物五个页面，沿用旧版本地存档。</text> -->
      </view>

      

      <view class="topbar-buttons">
        <!-- <button class="ghost-btn mini-btn" @click="saveGame">手动存档</button>
        <button class="ghost-btn mini-btn" @click="loadGame">读档</button> -->
        <button class="ghost-btn mini-btn" @click="openSaves">存档管理</button>
        <button class="ghost-btn mini-btn" @click="goPage('/pages/wiki/wiki', '已打开修真百科')">百科</button>
        <!-- <button class="danger-btn mini-btn" @click="resetGame">重开</button> -->
      </view>
    </view>

    <scroll-view scroll-x class="inner-nav-scroll">
      <view class="inner-nav card">
        <button class="inner-nav-btn" :class="cultivationView === 'overview' ? 'active' : ''" @click="switchCultivationView('overview')">角色修炼</button>
        <button class="inner-nav-btn" :class="cultivationView === 'battle' ? 'active' : ''" @click="switchCultivationView('battle')">战斗属性</button>
        <button class="inner-nav-btn" :class="cultivationView === 'technique' ? 'active' : ''" @click="switchCultivationView('technique')">功法系统</button>
        <button class="inner-nav-btn" :class="cultivationView === 'breakthrough' ? 'active' : ''" @click="switchCultivationView('breakthrough')">突破</button>
        <button class="inner-nav-btn" :class="cultivationView === 'logs' ? 'active' : ''" @click="switchCultivationView('logs')">修仙日志</button>
      </view>
    </scroll-view>

    <view class="page-grid single-view-grid">
      <view v-if="cultivationView === 'overview'" class="card section-card full-width">
        <view class="section-head">
          <text class="section-title">角色信息</text>
          <view class="status-pill" :class="autoCultivationEnabled ? 'running' : 'paused'">
            {{ autoCultivationEnabled ? '自动修炼中' : '自动修炼已暂停' }}
          </view>
        </view>

        <view class="profile-top">
          <view class="input-block">
            <text class="label">道号</text>
            <input v-model="player.name" class="name-input" placeholder-class="input-placeholder" maxlength="12" @blur="saveSilently" />
          </view>
          <view class="realm-box">
            <text class="label">当前境界</text>
            <text class="realm-title">{{ currentRealmName }} · {{ player.realmLayer }}层</text>
            <text class="small-text">下一次大境界：{{ nextMajorRealmName }}</text>
            <text class="small-text">当前宗门加持：修炼 +{{ Math.floor(sectBonus.cultivation * 100) }}%</text>
          </view>
        </view>

        <view class="info-box">
          <view class="row between">
            <text>本层修为</text>
            <text class="strong-text">{{ formatNumber(player.cultivation) }} / {{ formatNumber(currentLayerNeed) }}</text>
          </view>
          <view class="progress">
            <view class="progress-inner" :style="{ width: progressPercent + '%' }"></view>
          </view>
          <view class="tips-row">
            <text>自动修炼：{{ autoGainText }}/秒</text>
            <text>手动修炼：{{ manualGainText }}/次（今日剩余 {{ manualCultivateLeft }} / {{ dailyManualLimit }}）</text>
          </view>
        </view>

        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-label">生命</text>
            <text class="stat-value">{{ formatNumber(player.hp) }} / {{ formatNumber(battleMaxHp) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">灵力</text>
            <text class="stat-value">{{ formatNumber(player.spirit) }} / {{ formatNumber(player.maxSpirit) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">攻击</text>
            <text class="stat-value">{{ formatNumber(battleAttack) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">防御</text>
            <text class="stat-value">{{ formatNumber(battleDefense) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">根骨</text>
            <text class="stat-value">{{ actualBone }} / {{ getAttributeMax() }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">悟性</text>
            <text class="stat-value">{{ actualComprehension }} / {{ getAttributeMax() }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">福缘</text>
            <text class="stat-value">{{ actualFortune }} / {{ getAttributeMax() }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">功法点</text>
            <text class="stat-value">{{ player.techniquePoints }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">探索次数</text>
            <text class="stat-value">{{ player.explorationTimes }} / {{ player.maxExplorationTimes }}</text>
          </view>
        </view>

        <view class="action-row">
          <button class="primary-btn" @click="manualCultivate">手动修炼</button>
          <button class="secondary-btn" @click="toggleAutoCultivation">
            {{ autoCultivationEnabled ? '暂停自动修炼' : '恢复自动修炼' }}
          </button>
<!--          <button class="secondary-btn" @click="meditateRecover">调息回满</button>
          <button class="secondary-btn" @click="recoverBattleState">战后疗伤</button>
          <button class="secondary-btn test-btn" @click="debugAddRealmLayer">测试：提升一层</button> -->
        </view>

        <view class="info-box">
          <text class="section-mini-title">修炼设置</text>
          <label class="check-item">
            <checkbox :checked="true" color="#f0c66b" disabled />
            <text>本层圆满后仍继续自动修炼，溢出修为突破后折算继承</text>
          </label>
          <checkbox-group class="check-group" @change="handleAutoBreakthroughChange">
            <label class="check-item">
              <checkbox value="autoBreakthrough" :checked="settings.autoBreakthrough" color="#f0c66b" />
              <text>修为圆满时自动突破</text>
            </label>
          </checkbox-group>
          <text class="small-text">已实现：突破成功会继承溢出修为，小境界折算 80%，跨大境界折算 50%；修为圆满不会停止修炼，离线期间也会继续获得自动修炼收益。手动修炼每日 00:00 刷新次数，元婴期标准为 20 次，低境界更多，高境界更少。</text>
        </view>
      </view>

      <view v-if="cultivationView === 'battle'" class="card section-card full-width">
        <view class="section-head">
          <text class="section-title">战斗属性</text>
          <view class="small-badge">{{ battle.mode === 'manual' ? '手动战斗' : '自动战斗' }}</view>
        </view>
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-label">战力评估</text>
            <text class="stat-value">{{ formatNumber(battlePower) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">携带功法</text>
            <text class="stat-value">{{ availableBattleSkills.length }} / 5</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">战斗模式</text>
            <text class="stat-value">{{ battle.mode === 'manual' ? '手动选择' : '自动托管' }}</text>
          </view>
        </view>

        <view class="info-box">
          <text class="small-text">自动战斗会按原逻辑播放完整过程；手动战斗中，每回合由玩家选择技能，灵力不足时高阶技能不可释放。</text>
          <text class="small-text">当前生命 {{ formatNumber(player.hp) }} / {{ formatNumber(battleMaxHp) }}，灵力 {{ formatNumber(player.spirit) }} / {{ formatNumber(player.maxSpirit) }}；战斗结束后生命与灵力都会回满。</text>
          <text class="small-text">功法点：{{ player.techniquePoints }}。最多携带 4 个主动功法，灵剑斩常驻可用不占槽位。</text>
        </view>

        <view class="action-row">
          <button class="primary-btn" :disabled="battle.isBattling" @click="toggleBattleMode">
            {{ battle.mode === 'manual' ? '切换为自动战斗' : '切换为手动战斗' }}
          </button>
          <button class="secondary-btn" @click="recoverBattleState">调息回满</button>
        </view>

        <view class="section-mini-title" style="margin-top:6rpx">已装备功法（{{ player.battleLoadout.length }} / 4）</view>
        <view class="skill-card">
          <view class="recipe-head">
            <view><text class="recipe-name">灵剑斩</text><text class="recipe-desc">基础攻伐术，常驻可用，不占槽位。</text></view>
            <view class="small-badge">常驻 · Lv.{{ getBattleSkillLevel({id:'basic'}) }}</view>
          </view>
          <button class="secondary-btn small-btn" :disabled="player.techniquePoints < getBattleSkillUpgradeNeed({id:'basic'}) || getBattleSkillLevel({id:'basic'}) >= getBattleSkillMaxLevel({id:'basic'})" @click="upgradeBattleSkill('basic')" style="margin-top:10rpx">{{ getBattleSkillLevel({id:'basic'}) >= getBattleSkillMaxLevel({id:'basic'}) ? '已达上限 Lv.' + getBattleSkillMaxLevel({id:'basic'}) : (player.techniquePoints >= getBattleSkillUpgradeNeed({id:'basic'}) ? '升级灵剑斩' : '功法点不足') }}</button>
        </view>
        <view v-for="skill in equippedBattleSkills" :key="'eq-'+skill.id" class="skill-card">
          <view class="recipe-head">
            <view>
              <text class="recipe-name">{{ skill.name }}</text>
              <text class="recipe-desc">{{ skill.desc }}</text>
            </view>
            <view class="small-badge">{{ getSkillCategoryText(skill) }} · Lv.{{ getBattleSkillLevel(skill) }} · 灵力 {{ getBattleSkillCost(skill) }}</view>
          </view>
          <text class="small-text">倍率 ×{{ getBattleSkillPowerText(skill) }}，升级需 {{ getBattleSkillUpgradeNeed(skill) }} 功法点</text>
          <view class="action-row mt-12">
            <button class="secondary-btn small-btn" :disabled="player.techniquePoints < getBattleSkillUpgradeNeed(skill) || getBattleSkillLevel(skill) >= getBattleSkillMaxLevel(skill)" @click="upgradeBattleSkill(skill.id)">{{ getBattleSkillLevel(skill) >= getBattleSkillMaxLevel(skill) ? '已达上限 Lv.' + getBattleSkillMaxLevel(skill) : (player.techniquePoints >= getBattleSkillUpgradeNeed(skill) ? '升级' : '功法点不足') }}</button>
            <button class="danger-btn small-btn" @click="unequipBattleSkill(skill.id)">卸下</button>
          </view>
        </view>

        <view v-if="unequippedBattleSkills.length > 0" class="section-mini-title" style="margin-top:12rpx">可选功法（点击装备）</view>
        <view v-for="skill in unequippedBattleSkills" :key="'av-'+skill.id" class="skill-card">
          <view class="recipe-head">
            <view>
              <text class="recipe-name">{{ skill.name }}</text>
              <text class="recipe-desc">{{ skill.desc }}</text>
            </view>
            <view class="small-badge">{{ getSkillCategoryText(skill) }} · Lv.{{ getBattleSkillLevel(skill) }} · 灵力 {{ getBattleSkillCost(skill) }}</view>
          </view>
          <text class="small-text">倍率 ×{{ getBattleSkillPowerText(skill) }}，升级需 {{ getBattleSkillUpgradeNeed(skill) }} 功法点</text>
          <view class="action-row mt-12">
            <button class="primary-btn small-btn" :disabled="player.battleLoadout.length >= 4 || player.techniquePoints < getBattleSkillUpgradeNeed(skill) || getBattleSkillLevel(skill) >= getBattleSkillMaxLevel(skill)" @click="equipAndUpgradeSkill(skill)">{{ player.battleLoadout.length >= 4 ? '槽位已满' : (player.techniquePoints >= getBattleSkillUpgradeNeed(skill) && getBattleSkillLevel(skill) < getBattleSkillMaxLevel(skill) ? '装备并升级' : '装备') }}</button>
            <button v-if="player.techniquePoints >= getBattleSkillUpgradeNeed(skill) && getBattleSkillLevel(skill) < getBattleSkillMaxLevel(skill)" class="secondary-btn small-btn" @click="upgradeBattleSkill(skill.id)">仅升级</button>
          </view>
        </view>
      </view>

      <view v-if="cultivationView === 'technique'" class="card section-card full-width">
        <view class="section-head">
          <text class="section-title">功法系统</text>
          <view class="small-badge">即时生效</view>
        </view>

        <view v-for="item in techniques" :key="item.id" class="technique-item" :class="player.equippedTechniqueId === item.id ? 'active' : ''">
          <view class="technique-main">
            <view class="technique-left">
              <text class="technique-type">{{ item.type }}</text>
              <text class="technique-name">{{ item.name }}</text>
              <text class="technique-desc">{{ item.description }}</text>
            </view>
            <view class="technique-side">
              <text>等级 Lv.{{ player.techniqueLevels[item.id] }}</text>
              <text>升级需要 {{ getTechniqueUpgradeNeed(item.id) }} 功法点</text>
              <text>自动修炼 ×{{ getTechniqueAutoBonus(item.id).toFixed(2) }}</text>
              <text>手动修炼 ×{{ getTechniqueManualBonus(item.id).toFixed(2) }}</text>
            </view>
          </view>
          <view class="action-row mt-12">
            <button class="primary-btn small-btn" @click="equipTechnique(item.id)">
              {{ player.equippedTechniqueId === item.id ? '已装备' : '切换功法' }}
            </button>
            <button class="secondary-btn small-btn" :disabled="player.techniquePoints < getTechniqueUpgradeNeed(item.id) || (player.techniqueLevels[item.id] || 1) >= getTechniqueMaxLevel()" @click="upgradeTechnique(item.id)">{{ (player.techniqueLevels[item.id] || 1) >= getTechniqueMaxLevel() ? '已达上限 Lv.' + getTechniqueMaxLevel() : (player.techniquePoints >= getTechniqueUpgradeNeed(item.id) ? '升级功法' : '功法点不足') }}</button>
          </view>
        </view>
      </view>

      <view v-if="cultivationView === 'breakthrough'" class="card section-card full-width">
        <view class="section-head">
          <text class="section-title">突破</text>
          <view class="small-badge" :class="canBreakthrough ? 'ready' : ''">{{ canBreakthrough ? '条件已满足' : '尚未圆满' }}</view>
        </view>

        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-label">所需修为</text>
            <text class="stat-value">{{ formatNumber(currentLayerNeed) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">灵力要求</text>
            <text class="stat-value">无</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">破障丹加成</text>
            <text class="stat-value">{{ player.breakthroughPills > 0 ? '+12%' : '无' }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">当前成功率</text>
            <text class="stat-value">{{ breakthroughSuccessRate }}%</text>
          </view>
        </view>

        <view class="info-box">
          <text class="small-text">突破只要求修为圆满。失败会损失部分修为，但不会消耗灵力，也不会跌落大境界。</text>
          <text class="small-text">破障丹只用于提高突破成功率：突破时若持有，会自动消耗 1 枚并获得额外成功率加成。玄冰守一心经、宗门加持也可提高成功率。</text>
          <text v-if="isLastRealm && player.realmLayer === 9" class="gold-text">你已踏入当前版本可达到的巅峰层次。</text>
        </view>

        <view class="action-row">
          <button class="primary-btn" :disabled="!canBreakthrough || (isLastRealm && player.realmLayer === 9)" @click="tryBreakthrough">尝试突破</button>
          <!-- <button class="secondary-btn" @click="gainStarterPill">领取一枚新手突破丹</button> -->
          <button class="secondary-btn" @click="useQiCondensePill">吸收聚气丹</button>
        </view>
      </view>

      <view v-if="cultivationView === 'logs'" class="card section-card full-width">
        <view class="section-head">
          <text class="section-title">修仙日志</text>
          <button class="ghost-btn small-btn" @click="clearLogs">清空日志</button>
        </view>
        <scroll-view scroll-y class="log-scroll">
          <view v-for="(item, index) in logs" :key="index" class="log-item">
            <text class="log-time">{{ item.time }}</text>
            <text class="log-text">{{ item.text }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useGame } from '@/common/game/useGame.js'
const {
  syncCurrentPageType,
  goPage,
  STORAGE_KEY,
  LEGACY_STORAGE_KEYS,
  SAVE_VERSION,
  realmNames,
  furnaceNames,
  techniques,
  explorationMaps,
  difficulties,
  battleSkills,
  enemyNamePools,
  recipes,
  sectTemplates,
  sectTasks,
  sectExchanges,
  equipmentCatalog,
  defaultSave,
  safeGetStorage,
  safeSetStorage,
  safeRemoveStorage,
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
  currentWeaponName,
  currentArmorName,
  currentAccessoryName,
  currentTalismanName,
  equipmentBonus,
  sectBonus,
  actualBone,
  actualComprehension,
  actualFortune,
  getAttributeMax,
  battleMaxHp,
  battleAttack,
  battleDefense,
  battlePower,
  availableBattleSkills,
  getBattleSkillLevel,
  getBattleSkillUpgradeNeed,
  getBattleSkillPowerText,
  getBattleSkillCost,
  getBattleSkillMaxLevel,
  upgradeBattleSkill,
  unlockedBattleSkills,
  equipBattleSkill,
  unequipBattleSkill,
  isSkillEquipped,
  getTechniqueUpgradeNeed,
  getTechniqueMaxLevel,
  battlePlaybackPercent,
  currentBattleStepText,
  currentRealmName,
  nextMajorRealmName,
  isLastRealm,
  alchemyUnlocked,
  sectUnlocked,
  canCreateSect,
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
  saveSilently,
  queueAutoSave,
  formatNumber,
  nowTime,
  showFeedback,
  addLog,
  addExplorationLog,
  addSectLog,
  getTechniqueAutoBonus,
  getTechniqueManualBonus,
  getEquipmentCount,
  getEquipmentTypeText,
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
  toggleAutoBreakthrough,
  equipTechnique,
  upgradeTechnique,
  gainStarterPill,
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
  startExploration,
  clampPlayerHp,
  recoverBattleState,
  setAutoBreakthrough,
  toggleBattleMode,
  setBattleMode,
  getBattleSkillById,
  startManualBattle,
  useManualBattleSkill,
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
  startSectChallenge,
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
  claimSectWelfare,
  isSectTaskDone,
  doSectTask,
  upgradeSectLevel,
  exchangeSectItem,
  equipItem,
  sellMaterial,
  donateHerbs,
  donateOres,
  synthesizeChaosPearl,
  unlockRecipeByFragment,
  clearLogs,
  applyLoadedSaveSilently,
  reloadCurrentSaveSilently,
  saveGame,
  loadGame,
  resetGame,
  startTimer,
  stopTimer
} = useGame('cultivation')

function openSaves() {
  saveSilently()
  uni.navigateTo({
    url: '/pages/saves/saves',
    animationType: 'fade-in',
    animationDuration: 180,
    fail: () => {
      uni.redirectTo({ url: '/pages/saves/saves', animationType: 'fade-in', animationDuration: 180 })
    }
  })
}

const equippedBattleSkills = computed(() => {
  const loadout = player.battleLoadout || []
  return unlockedBattleSkills.value.filter(skill => loadout.includes(skill.id))
})

const unequippedBattleSkills = computed(() => {
  const loadout = player.battleLoadout || []
  return unlockedBattleSkills.value.filter(skill => !loadout.includes(skill.id))
})

function getSkillCategoryText(skill) {
  const map = { attack: '攻击', buff: '增益', heal: '恢复' }
  return map[skill.category] || '攻击'
}

function equipAndUpgradeSkill(skill) {
  if (player.battleLoadout.length >= 4) return
  equipBattleSkill(skill.id)
  if (player.techniquePoints >= getBattleSkillUpgradeNeed(skill) && getBattleSkillLevel(skill.id) < getBattleSkillMaxLevel(skill)) {
    upgradeBattleSkill(skill.id)
  }
}

const cultivationView = ref('overview')


function handleAutoBreakthroughChange(event) {
  const values = event?.detail?.value || []
  setAutoBreakthrough(values.includes('autoBreakthrough'))
}

function switchCultivationView(view) {
  cultivationView.value = view
}
</script>

<style scoped lang="scss">
@import '@/common/styles/game.scss';
</style>
