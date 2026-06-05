<template>
  <view class="page-wrap">
  <view class="topbar card">
      <view class="topbar-main">
<!--        <text class="eyebrow">文字修仙 · 微信小程序完整基础版</text> -->
        <text class="title">太初修真录</text>
        <!-- <text class="subtitle">已拆分为修仙、探索、炼丹、宗门、宝物五个页面，沿用旧版本地存档。</text> -->
      </view>

     

      <!-- <view class="topbar-buttons">
        <button class="ghost-btn mini-btn" @click="saveGame">手动存档</button>
        <button class="ghost-btn mini-btn" @click="loadGame">读档</button>
        <button class="danger-btn mini-btn" @click="resetGame">重开</button>
      </view> -->
    </view>



    <scroll-view scroll-x class="inner-nav-scroll">
      <view class="inner-nav card">
        <button class="inner-nav-btn" :class="exploreView === 'map' ? 'active' : ''" @click="switchExploreView('map')">探索地图</button>
        <button class="inner-nav-btn" :class="exploreView === 'setting' ? 'active' : ''" @click="switchExploreView('setting')">探索设置</button>
        <button class="inner-nav-btn" :class="exploreView === 'record' ? 'active' : ''" @click="switchExploreView('record')">过程记录</button>
      </view>
    </scroll-view>

    <view class="page-grid single-view-grid">
      <view v-if="exploreView === 'map'" class="card section-card full-width">
        <view class="section-head">
          <text class="section-title">探索页面</text>
          <view class="small-badge">文字随机事件</view>
        </view>

        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-label">当前生命</text>
            <text class="stat-value">{{ formatNumber(player.hp) }} / {{ formatNumber(battleMaxHp) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">战斗灵力</text>
            <text class="stat-value">{{ formatNumber(player.spirit) }} / {{ formatNumber(player.maxSpirit) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">攻击 / 防御</text>
            <text class="stat-value">{{ formatNumber(battleAttack) }} / {{ formatNumber(battleDefense) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">探索次数</text>
            <text class="stat-value">{{ player.explorationTimes }} / {{ player.maxExplorationTimes }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">当前福缘</text>
            <text class="stat-value">{{ actualFortune }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">当前地图</text>
            <text class="stat-value">{{ selectedMap.name }}</text>
          </view>
        </view>

        <view class="action-row explore-main-actions">
          <button class="primary-btn" :disabled="isExploring" @click="startExploration">{{ isExploring ? '探索进行中' : '开始探索' }}</button>
          <button class="secondary-btn" :disabled="!isExploring" @click="skipExplorationProcess">跳过过程</button>
          <button class="secondary-btn" @click="useExploreTalisman">使用探索符</button>
          <!-- 暂时隐藏：补充探索次数按钮。保留源码，后续需要时可恢复。
          <button class="secondary-btn" @click="recoverExplorationTimes">补充探索次数</button>
          -->
        </view>

        <view class="world-map">
          <view class="world-map-head">
            <view>
              <text class="section-mini-title">探索地图</text>
              <text class="small-text">点击地图节点可切换探索区域，灰色节点代表尚未解锁。</text>
            </view>
            <view class="small-badge">{{ explorationMaps.length }} 处区域</view>
          </view>
          <view class="world-map-canvas">
            <view class="world-map-route route-one"></view>
            <view class="world-map-route route-two"></view>
            <view
              v-for="map in explorationMaps"
              :key="'node-' + map.id"
              class="map-node"
              :class="getMapCardClass(map)"
              :style="{ left: map.x + '%', top: map.y + '%' }"
              @click="selectMap(map.id)"
            >
              <text class="map-node-dot"></text>
              <text class="map-node-name">{{ map.name }}</text>
            </view>
          </view>
        </view>

        <view class="map-grid">
          <view v-for="map in explorationMaps" :key="map.id" class="map-card" :class="getMapCardClass(map)">
            <view class="map-card-head">
              <view class="map-main">
                <text class="map-name">{{ map.name }}</text>
                <text class="map-desc">{{ map.desc }}</text>
              </view>
              <view class="small-badge">{{ map.unlockText }}</view>
            </view>
            <view class="map-meta">
              <text>主产出：{{ map.rewardHint }}</text>
              <text>推荐境界：{{ map.recommend }}</text>
              <text>危险程度：{{ map.danger }}</text>
            </view>
            <button class="primary-btn small-btn" :disabled="!isMapUnlocked(map)" @click="selectMap(map.id)">
              {{ isMapUnlocked(map) ? '选择地图' : '尚未解锁' }}
            </button>
          </view>
        </view>
      </view>

      <view v-if="exploreView === 'setting'" class="card section-card full-width">
        <view class="section-head">
          <text class="section-title">探索设置</text>
          <!-- 暂时隐藏：补充探索次数按钮。保留源码，后续需要时可恢复。
          <button class="secondary-btn small-btn" @click="recoverExplorationTimes">补充探索次数</button>
          -->
        </view>

        <view class="difficulty-row">
          <button v-for="item in difficulties" :key="item.id" class="difficulty-btn" :class="exploration.selectedDifficulty === item.id ? 'active' : ''" @click="selectDifficulty(item.id)">
            <text>{{ item.name }}</text>
            <text class="difficulty-desc">风险×{{ item.costRate }} · 奖励×{{ item.rewardRate }}</text>
          </button>
        </view>

        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-label">灵力消耗</text>
            <text class="stat-value">无，灵力仅用于战斗</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">成功探索率</text>
            <text class="stat-value">{{ explorationSuccessRate }}%</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">额外修为收益</text>
            <text class="stat-value">约 {{ formatNumber(explorationCultivationReward) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">次数消耗</text>
            <text class="stat-value">1 次</text>
          </view>
        </view>

        <view class="info-box">
          <text class="small-text">当前版本已支持采药、遇兽、敌修拦路、自动战斗、得宝、遇同道、残卷、装备与丹方掉落等事件。</text>
          <text class="small-text">宗门与福缘会提高探索收益；探索产出的资源可直接用于炼丹、捐献、合成。探索次数每日 00:00 自动恢复。</text>
        </view>

        <view class="action-row">
          <button class="secondary-btn" @click="useExploreTalisman">使用探索符</button>
          <button class="secondary-btn" @click="goPage('/pages/inventory/inventory', '已前往宝物页面')">前往宝物页</button>
        </view>
      </view>

      <view v-if="exploreView === 'record'" class="card section-card full-width">
        <view class="section-head">
          <text class="section-title">本次探索结果</text>
          <view class="small-badge">{{ isExploring ? '探索中' : '已结算' }}</view>
        </view>
        <view class="info-box">
          <text class="result-text">{{ exploration.lastResult }}</text>
        </view>

        <view class="section-head second-head">
          <text class="section-title">本次探索过程</text>
          <view class="small-badge">{{ exploration.currentProcess.length }} 段</view>
        </view>
        <scroll-view scroll-y class="log-scroll process-scroll">
          <view v-for="(step, index) in exploration.currentProcess" :key="index" class="log-item process-item">
            <text class="log-time">{{ index + 1 }}</text>
            <text class="log-text">{{ step }}</text>
          </view>
        </scroll-view>

        <view class="section-head second-head">
          <text class="section-title">近期探索记录</text>
          <button class="ghost-btn small-btn" @click="clearExplorationLogs">清空记录</button>
        </view>
        <scroll-view scroll-y class="log-scroll">
          <view v-for="(item, index) in explorationLogs" :key="index" class="log-item">
            <text class="log-time">{{ item.time }}</text>
            <text class="log-text">{{ item.text }}</text>
          </view>
        </scroll-view>
      </view>
    </view>


  </view>

  <view v-if="exploreModalVisible" class="explore-modal-mask fixed-viewport-modal-mask" @touchmove.stop>
    <view class="explore-modal explore-modal--exploration card">
      <view class="explore-modal-head">
        <view>
          <text class="eyebrow">沉浸探索</text>
          <text class="explore-modal-title">{{ selectedMap.name }} · {{ selectedDifficulty.name }}</text>
        </view>
        <view class="small-badge" :class="isExploring ? 'running' : 'ready'">{{ isExploring ? '行进中' : '已结算' }}</view>
      </view>

      <view class="explore-stage">
        <text class="explore-stage-title">{{ isExploring ? '正在经历' : '探索结果' }}</text>
        <text class="explore-stage-text">{{ isExploring ? currentExploreStepText : exploration.lastResult }}</text>
      </view>

      <view class="explore-progress-box">
        <view class="row between">
          <text class="small-text">过程进度</text>
          <text class="small-text">{{ exploration.currentProcess.length }} / {{ totalExploreStepCount }}</text>
        </view>
        <view class="progress">
          <view class="progress-inner" :style="{ width: explorePlaybackPercent + '%' }"></view>
        </view>
      </view>

      <scroll-view scroll-y class="explore-modal-scroll">
        <view v-for="(step, index) in exploration.currentProcess" :key="index" class="explore-modal-step">
          <text class="explore-step-index">第 {{ index + 1 }} 幕</text>
          <text class="explore-step-text">{{ step }}</text>
        </view>
      </scroll-view>

      <view class="action-row modal-actions">
        <button class="secondary-btn" :disabled="!isExploring" @click="skipExplorationProcess">跳过过程</button>
        <button class="primary-btn" :disabled="isExploring" @click="closeExploreModal">关闭</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
  battleMaxHp,
  battleAttack,
  battleDefense,
  battlePower,
  availableBattleSkills,
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
  continueExplorationAfterBattle,
  startExploration,
  clampPlayerHp,
  recoverBattleState,
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
} = useGame('exploration')

const exploreView = ref('map')

function switchExploreView(view) {
  exploreView.value = view
}

onMounted(() => {
  continueExplorationAfterBattle()
})
</script>

<style scoped lang="scss">
@import '@/common/styles/game.scss';
</style>
