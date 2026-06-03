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
        <button class="inner-nav-btn" :class="alchemyView === 'furnace' ? 'active' : ''" @click="switchAlchemyView('furnace')">炼丹炉</button>
        <button class="inner-nav-btn" :class="alchemyView === 'recipe' ? 'active' : ''" @click="switchAlchemyView('recipe')">丹方系统</button>
        <button class="inner-nav-btn" :class="alchemyView === 'batch' ? 'active' : ''" @click="switchAlchemyView('batch')">批量炼丹</button>
      </view>
    </scroll-view>

    <view class="page-grid single-view-grid">
      <view class="card section-card full-width" v-if="alchemyUnlocked && alchemyView === 'furnace'">
        <view class="section-head">
          <text class="section-title">炼丹炉</text>
          <view class="small-badge">炉阶 {{ alchemy.furnaceLevel }}</view>
        </view>

        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-label">当前炉阶</text>
            <text class="stat-value">{{ furnaceName }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">炼丹成功率</text>
            <text class="stat-value">{{ alchemySuccessRate }}%</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">炉石储备</text>
            <text class="stat-value">{{ inventory.furnaceStones }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">宗门加持</text>
            <text class="stat-value">+{{ Math.floor(sectBonus.alchemy * 100) }}%</text>
          </view>
        </view>

        <view class="action-row">
          <button class="primary-btn" @click="upgradeFurnace">升级丹炉</button>
          <button class="secondary-btn" @click="useAcceleratorCharm">使用加速符</button>
        </view>

        <view class="info-box">
          <text class="small-text">升级条件：矿石 {{ nextFurnaceNeed.ores }}、灵石 {{ nextFurnaceNeed.stones }}、炉石 {{ nextFurnaceNeed.furnaceStones }}</text>
          <text class="small-text">金丹期后可批量炼丹，当前批量上限 {{ maxBatchCount }}。</text>
          <text class="small-text">最近结果：{{ alchemy.lastResult }}</text>
        </view>
      </view>
      <view class="card section-card full-width" v-if="!alchemyUnlocked">
        <view class="section-head">
          <text class="section-title">炼丹页面</text>
          <view class="small-badge">待解锁</view>
        </view>
        <view class="info-box">
          <text class="small-text">筑基期后方可开启炼丹。当前需要先提升境界，再来点燃丹火。</text>
        </view>
      </view>

      <view class="card section-card full-width" v-if="alchemyUnlocked && alchemyView === 'recipe'">
        <view class="section-head">
          <text class="section-title">丹方系统</text>
          <view class="small-badge">{{ availableRecipes.length }} 张可用丹方</view>
        </view>

        <view v-for="recipe in availableRecipes" :key="recipe.id" class="recipe-card" :class="alchemy.selectedRecipeId === recipe.id ? 'active' : ''">
          <view class="recipe-head">
            <view>
              <text class="recipe-name">{{ recipe.name }}</text>
              <text class="recipe-desc">{{ recipe.desc }}</text>
            </view>
            <view class="small-badge">{{ recipe.category }}</view>
          </view>
          <view class="recipe-meta">
            <text>{{ getRecipeMaterialText(recipe) }}</text>
            <text>单次产出：{{ recipe.outputText }}</text>
          </view>
          <view class="action-row mt-12">
            <button class="primary-btn small-btn" @click="selectRecipe(recipe.id)">选择丹方</button>
            <button class="secondary-btn small-btn" @click="craftRecipe(1)">炼制 1 次</button>
          </view>
        </view>
      </view>

      <view class="card section-card full-width" v-if="alchemyUnlocked && alchemyView === 'batch'">
        <view class="section-head">
          <text class="section-title">批量炼丹</text>
          <view class="small-badge">当前丹方：{{ selectedRecipe ? selectedRecipe.name : '未选择' }}</view>
        </view>

        <view class="batch-row">
          <button class="secondary-btn small-btn" @click="changeBatchCount(-1)">-</button>
          <view class="batch-display">{{ alchemy.batchCount }}</view>
          <button class="secondary-btn small-btn" @click="changeBatchCount(1)">+</button>
        </view>

        <view class="info-box">
          <text class="small-text">筑基期可单次炼丹，金丹期后可批量。当前批量炼制会按次数独立结算成功与失败。</text>
        </view>

        <view class="action-row">
          <button class="primary-btn" @click="craftRecipe(alchemy.batchCount)">开始炼丹</button>
          <button class="secondary-btn" @click="goPage('/pages/inventory/inventory', '炼丹结果可在宝物页查看')">查看丹药</button>
        </view>
      </view>
    </view>


  </view>
</template>

<script setup>
import { ref } from 'vue'
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
} = useGame('alchemy')

const alchemyView = ref('furnace')

function switchAlchemyView(view) {
  alchemyView.value = view
}
</script>

<style scoped lang="scss">
@import '@/common/styles/game.scss';
</style>
