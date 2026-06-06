<template>
    <view class="page-wrap">
  <view class="topbar card">
      <view class="topbar-main">
<!--        <text class="eyebrow">文字修仙 · 微信小程序完整基础版</text> -->
        <text class="title">太初修真录</text>
        <text class="subtitle">宝物页面</text>
      </view>

      

    </view>


    <scroll-view scroll-x class="inner-nav-scroll">
      <view class="inner-nav card">
        <button class="inner-nav-btn" :class="inventoryTab === 'pills' ? 'active' : ''" @click="switchInventoryTab('pills')">丹药</button>
        <button class="inner-nav-btn" :class="inventoryTab === 'equipment' ? 'active' : ''" @click="switchInventoryTab('equipment')">装备</button>
        <button class="inner-nav-btn" :class="inventoryTab === 'materials' ? 'active' : ''" @click="switchInventoryTab('materials')">材料</button>
        <button class="inner-nav-btn" :class="inventoryTab === 'items' ? 'active' : ''" @click="switchInventoryTab('items')">道具</button>
        <button class="inner-nav-btn" :class="inventoryTab === 'special' ? 'active' : ''" @click="switchInventoryTab('special')">特殊</button>
        <button class="inner-nav-btn" :class="inventoryTab === 'shop' ? 'active' : ''" @click="switchInventoryTab('shop')">商店</button>
      </view>
    </scroll-view>

    <view class="page-grid single-view-grid">
      <view class="card section-card full-width">
        <view class="section-head">
          <text class="section-title">宝物页面</text>
          <view class="small-badge">资源管理</view>
        </view>
        <view class="info-box compact-box">
          <text class="small-text">当前功法点：{{ formatNumber(player.techniquePoints) }}。功法点可用于升级功法、战斗技能和温养神器。</text>
        </view>

        <view v-if="inventoryTab === 'pills'" class="section-card-inner">
          <view class="info-box">
            <text class="small-text">这里只显示当前已经拥有的丹药；未拥有丹药已隐藏，完整说明可在百科页查看。</text>
            <text class="small-text">修为丹只能吸收本境界或低阶丹药，高阶丹药无法提前吸收；破障丹只提升突破概率。</text>
          </view>

          <view v-if="ownedCultivationPills.length === 0 && ownedSpecialPills.length === 0" class="empty-card">
            <text class="section-mini-title">暂无丹药</text>
            <text class="small-text">当前没有可显示的丹药，可通过炼丹、探索、宗门或商店获取。</text>
          </view>

          <view v-if="ownedCultivationPills.length > 0" class="pill-list">
            <view v-for="pill in ownedCultivationPills" :key="pill.key" class="pill-card">
              <view class="recipe-head">
                <view>
                  <text class="recipe-name">{{ pill.name }}</text>
                  <text class="recipe-desc">{{ pill.realmText }}修为丹 · {{ pill.desc }}</text>
                </view>
                <view class="small-badge">拥有 {{ inventory.pills[pill.key] || 0 }}</view>
              </view>
              <view class="info-box compact-box">
                <text class="small-text">当前吸收：{{ canUseCultivationPill(pill.key) ? formatNumber(getCultivationPillGain(pill.key)) + ' 修为' : '境界不足，不能吸收' }}</text>
                <text class="small-text">同阶固定修为：{{ formatNumber(pill.gain) }}</text>
              </view>
              <button class="primary-btn small-btn" :disabled="!canUseCultivationPill(pill.key)" @click="useCultivationPill(pill.key)">
                {{ canUseCultivationPill(pill.key) ? '吸收丹药' : '高阶不可吸收' }}
              </button>
            </view>
          </view>

          <view v-if="ownedSpecialPills.length > 0" class="stats-grid mt-12">
            <view v-for="pill in ownedSpecialPills" :key="pill.key" class="stat-item">
              <text class="stat-label">{{ pill.name }}</text>
              <text class="stat-value">{{ pill.count }}</text>
            </view>
          </view>
          <view v-if="ownedSpecialPills.length > 0" class="action-row">
            <button v-if="inventory.pills.bone > 0" class="secondary-btn" @click="useAttributePill('bone')">使用根骨丹</button>
            <button v-if="inventory.pills.comprehension > 0" class="secondary-btn" @click="useAttributePill('comprehension')">使用悟心丹</button>
            <button v-if="inventory.pills.fortune > 0" class="secondary-btn" @click="useAttributePill('fortune')">使用福缘丹</button>
          </view>
        </view>

        <view v-else-if="inventoryTab === 'equipment'" class="section-card-inner">
          <view class="info-box">
            <text class="small-text">装备只显示当前已拥有的物品；未获得的装备已隐藏，完整图鉴可在百科页查看。</text>
            <text class="small-text">装备存在境界限制，未达到对应大境界时即使持有也无法装备且不会生效。</text>
            <text class="small-text">已装备：武器「{{ currentWeaponName }}」、护具「{{ currentArmorName }}」、饰品「{{ currentAccessoryName }}」、符佩「{{ currentTalismanName }}」。当前神器：{{ currentArtifactName }}。四个装备位可分别装备对应神器。</text>
          </view>

          <scroll-view scroll-x class="equipment-filter-scroll">
            <view class="equipment-filter-row card">
              <button class="inner-nav-btn" :class="equipmentView === 'artifact' ? 'active' : ''" @click="switchEquipmentView('artifact')">神器</button>
              <button class="inner-nav-btn" :class="equipmentView === 'weapon' ? 'active' : ''" @click="switchEquipmentView('weapon')">武器</button>
              <button class="inner-nav-btn" :class="equipmentView === 'armor' ? 'active' : ''" @click="switchEquipmentView('armor')">护具</button>
              <button class="inner-nav-btn" :class="equipmentView === 'accessory' ? 'active' : ''" @click="switchEquipmentView('accessory')">饰品</button>
              <button class="inner-nav-btn" :class="equipmentView === 'talisman' ? 'active' : ''" @click="switchEquipmentView('talisman')">符佩</button>
            </view>
          </scroll-view>

          <view class="equipment-equipped-box">
            <view class="stat-item">
              <text class="stat-label">当前分类</text>
              <text class="stat-value">{{ getEquipmentTypeText(equipmentView) }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-label">已拥有数量</text>
              <text class="stat-value">{{ equipmentView === 'artifact' ? filteredOwnedArtifacts.length : filteredOwnedEquipments.length }}</text>
            </view>
          </view>

          <view v-if="(equipmentView !== 'artifact' && filteredOwnedEquipments.length === 0) || (equipmentView === 'artifact' && filteredOwnedArtifacts.length === 0)" class="empty-card">
            <text class="section-mini-title">暂无{{ getEquipmentTypeText(equipmentView) }}</text>
            <text class="small-text">当前分类下没有已获得装备或神器。未拥有内容不会在这里显示。</text>
          </view>

          <view v-if="equipmentView !== 'artifact'">
            <view v-for="item in filteredOwnedEquipments" :key="item.id" class="equipment-card owned-equipment-card" :class="isEquipmentEquipped(item.id) ? 'active' : ''">
              <view class="recipe-head">
                <view>
                  <text class="recipe-name">{{ item.name }} · {{ getEquipmentTypeText(item.type) }}</text>
                  <text class="recipe-desc">{{ item.desc }}</text>
                </view>
                <view class="small-badge">持有 {{ getEquipmentCount(item.id) }}</view>
              </view>
              <view class="recipe-meta">
                <text>{{ formatEquipmentEffect(item) }}</text>
                <text>限制：{{ getEquipmentUnlockText(item) }}</text>
              </view>
              <view class="action-row mt-12">
                <button class="primary-btn small-btn" :disabled="!canEquipItem(item.id) || isEquipmentEquipped(item.id)" @click="equipItem(item.id)">
                  {{ isEquipmentEquipped(item.id) ? '已装备' : canEquipItem(item.id) ? '装备' : '境界不足' }}
                </button>
                <button class="secondary-btn small-btn" :disabled="!canSellEquipment(item.id)" @click="sellEquipment(item.id)">
                  出售 +{{ formatNumber(getEquipmentSellPrice(item.id)) }} 灵石
                </button>
              </view>
            </view>
          </view>

          <view v-else>
            <view v-for="item in filteredOwnedArtifacts" :key="item.id" class="equipment-card owned-equipment-card artifact-card" :class="isArtifactEquipped(item.id) ? 'active' : ''">
              <view class="recipe-head">
                <view>
                  <text class="recipe-name">{{ item.name }} · {{ getEquipmentTypeText(item.type) }}神器</text>
                  <text class="recipe-desc">{{ item.desc }}</text>
                </view>
                <view class="small-badge">{{ getArtifactRealmText(item.id) }}</view>
              </view>
              <view class="recipe-meta">
                <text>{{ getArtifactEffectText(item.id) }}</text>
                <text>成长：消耗功法点 {{ getArtifactUpgradeNeed(item.id) }}，当前拥有 {{ player.techniquePoints }}，不能超过自身境界。</text>
              </view>
              <view class="action-row mt-12">
                <button class="primary-btn small-btn" :disabled="isArtifactEquipped(item.id)" @click="equipArtifact(item.id)">
                  {{ isArtifactEquipped(item.id) ? '已装备' : '装备神器' }}
                </button>
                <button class="secondary-btn small-btn" :disabled="!canUpgradeArtifact(item.id)" @click="upgradeArtifact(item.id)">
                  {{ canUpgradeArtifact(item.id) ? '温养成长' : '暂不可成长' }}
                </button>
              </view>
            </view>
          </view>
        </view>

        <view v-else-if="inventoryTab === 'materials'" class="section-card-inner">
          <view v-if="ownedMaterialStats.length === 0" class="empty-card">
            <text class="section-mini-title">暂无材料</text>
            <text class="small-text">未拥有的材料已隐藏，可通过探索、宗门或商店获取。</text>
          </view>
          <view v-else class="stats-grid">
            <view v-for="item in ownedMaterialStats" :key="item.key" class="stat-item">
              <text class="stat-label">{{ item.name }}</text>
              <text class="stat-value">{{ item.count }}</text>
            </view>
          </view>
          <view v-if="ownedMaterialStats.length > 0">
            <view v-if="inventory.herbs > 0" class="shop-buy-row mt-12">
              <view class="shop-amount-box">
                <text class="small-text">出售药材</text>
                <input class="shop-amount-input" type="number" v-model="materialSellQty.herbs" />
                <text class="small-text">×5灵石</text>
              </view>
              <button class="secondary-btn small-btn" :disabled="inventory.herbs < (materialSellQty.herbs||1)" @click="sellMaterial('herbs', materialSellQty.herbs)">出售</button>
            </view>
            <view v-if="inventory.ores > 0" class="shop-buy-row mt-12">
              <view class="shop-amount-box">
                <text class="small-text">出售矿石</text>
                <input class="shop-amount-input" type="number" v-model="materialSellQty.ores" />
                <text class="small-text">×4灵石</text>
              </view>
              <button class="secondary-btn small-btn" :disabled="inventory.ores < (materialSellQty.ores||1)" @click="sellMaterial('ores', materialSellQty.ores)">出售</button>
            </view>
            <view v-if="sect.joined && inventory.herbs > 0" class="shop-buy-row mt-12">
              <view class="shop-amount-box">
                <text class="small-text">捐献药材</text>
                <input class="shop-amount-input" type="number" v-model="materialDonateQty.herbs" />
                <text class="small-text">贡献×2.4</text>
              </view>
              <button class="primary-btn small-btn" :disabled="inventory.herbs < (materialDonateQty.herbs||1)" @click="donateHerbs(materialDonateQty.herbs)">捐献</button>
            </view>
            <view v-if="sect.joined && inventory.ores > 0" class="shop-buy-row mt-12">
              <view class="shop-amount-box">
                <text class="small-text">捐献矿石</text>
                <input class="shop-amount-input" type="number" v-model="materialDonateQty.ores" />
                <text class="small-text">贡献×3.5</text>
              </view>
              <button class="primary-btn small-btn" :disabled="inventory.ores < (materialDonateQty.ores||1)" @click="donateOres(materialDonateQty.ores)">捐献</button>
            </view>
          </view>
        </view>

        <view v-else-if="inventoryTab === 'items'" class="section-card-inner">
          <view v-if="ownedItemStats.length === 0" class="empty-card">
            <text class="section-mini-title">暂无道具</text>
            <text class="small-text">未拥有的道具已隐藏，灵石等货币可在商店页查看。</text>
          </view>
          <view v-else class="stats-grid">
            <view v-for="item in ownedItemStats" :key="item.key" class="stat-item">
              <text class="stat-label">{{ item.name }}</text>
              <text class="stat-value">{{ item.count }}</text>
            </view>
          </view>
          <view v-if="ownedItemStats.length > 0" class="action-row">
            <button v-if="inventory.items.exploreTalisman > 0" class="primary-btn" @click="useExploreTalisman">使用探索符</button>
            <button v-if="inventory.items.acceleratorCharm > 0" class="secondary-btn" @click="useAcceleratorCharm">使用加速符</button>
          </view>
        </view>

        <view v-else-if="inventoryTab === 'special'" class="section-card-inner">
          <view v-if="ownedSpecialStats.length === 0" class="empty-card">
            <text class="section-mini-title">暂无特殊物品</text>
            <text class="small-text">未拥有的特殊物品已隐藏。</text>
          </view>
          <view v-else class="stats-grid">
            <view v-for="item in ownedSpecialStats" :key="item.key" class="stat-item">
              <text class="stat-label">{{ item.name }}</text>
              <text class="stat-value">{{ item.count }}</text>
            </view>
          </view>
          <view v-if="ownedSpecialStats.length > 0" class="info-box">
            <text class="small-text">混沌珠可作为饰品装备；丹方残卷可用于解锁高阶丹方。</text>
          </view>
          <view v-if="ownedSpecialStats.length > 0" class="action-row">
            <button v-if="inventory.scrolls >= 3 && inventory.ores >= 5 && inventory.spiritStones >= 80" class="primary-btn" @click="synthesizeChaosPearl">合成混沌珠</button>
            <button v-if="inventory.special.recipeFragment > 0" class="secondary-btn" @click="unlockRecipeByFragment">消耗残卷解锁丹方</button>
          </view>
        </view>

        <view v-else-if="inventoryTab === 'shop'" class="section-card-inner">
          <view class="section-head compact-head">
            <text class="section-title">灵石商店</text>
            <view class="small-badge">灵石 {{ formatNumber(inventory.spiritStones) }}</view>
          </view>
          <view class="info-box">
            <text class="small-text">可用灵石兑换装备、炼丹材料、炼丹道具和成品丹药。商店只显示当前境界已开放的商品，暂不可购买的内容已隐藏。</text>
            <text class="small-text">破障丹只用于提高突破概率；修为丹仍遵循规则：只能吸收本境界或低阶丹药，不能吸收高阶丹药。</text>
          </view>

          <scroll-view scroll-x class="equipment-filter-scroll">
            <view class="equipment-filter-row card shop-filter-row">
              <button v-for="tab in shopTabs" :key="tab.key" class="inner-nav-btn" :class="shopView === tab.key ? 'active' : ''" @click="switchShopView(tab.key)">
                {{ tab.name }}
              </button>
            </view>
          </scroll-view>

          <view class="equipment-equipped-box">
            <view class="stat-item">
              <text class="stat-label">当前分类</text>
              <text class="stat-value">{{ currentShopTabName }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-label">可兑换商品</text>
              <text class="stat-value">{{ filteredShopGoods.length }}</text>
            </view>
          </view>

          <view v-if="filteredShopGoods.length === 0" class="empty-card">
            <text class="section-mini-title">暂无可兑换商品</text>
            <text class="small-text">当前境界下，此分类暂未开放商品；提升境界后会逐步显示。</text>
          </view>

          <view v-else class="shop-list">
            <view v-for="item in filteredShopGoods" :key="item.id" class="exchange-card shop-card" :class="canBuyShopGood(item) ? '' : 'locked'">
              <view class="recipe-head">
                <view>
                  <text class="recipe-name">{{ item.name }}</text>
                  <text class="recipe-desc">{{ item.category }} · {{ item.desc }}</text>
                </view>
                <view class="small-badge">{{ getShopGoodUnlockText(item) }}</view>
              </view>
              <view class="recipe-meta shop-meta">
                <text>单价：{{ formatNumber(item.cost) }} 灵石</text>
                <text>单次数量：×{{ item.count }}</text>
                <text>合计：{{ formatNumber(item.cost * getShopBuyAmount(item.id)) }} 灵石</text>
              </view>
              <view class="shop-buy-row mt-12">
                <view class="shop-amount-box">
                  <text class="small-text">购买次数</text>
                  <input class="shop-amount-input" type="number" :value="getShopBuyAmount(item.id)" @input="onShopAmountInput(item.id, $event)" />
                </view>
                <button class="primary-btn small-btn" :disabled="!canBuyShopGood(item, getShopBuyAmount(item.id))" @click="buyShopGood(item.id, getShopBuyAmount(item.id))">
                  {{ player.realmIndex < item.unlockRealm ? '境界不足' : inventory.spiritStones < item.cost * getShopBuyAmount(item.id) ? '灵石不足' : '兑换' }}
                </button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
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
  getEquipmentUnlockText,
  formatEquipmentEffect,
  getEquipmentSellPrice,
  canSellEquipment,
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
  toggleAutoBreakthrough,
  equipTechnique,
  upgradeTechnique,
  gainStarterPill,
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
} = useGame('inventory')

const equipmentView = ref('weapon')
const shopView = ref('equipment')
const shopBuyAmounts = reactive({})
const materialSellQty = reactive({ herbs: 5, ores: 4 })
const materialDonateQty = reactive({ herbs: 5, ores: 4 })

const shopTabs = [
  { key: 'equipment', name: '装备', category: '装备' },
  { key: 'material', name: '材料', category: '炼丹材料' },
  { key: 'tool', name: '道具', category: '炼丹道具' },
  { key: 'pill', name: '成品', category: '成品丹药' }
]

const currentShopTabName = computed(() => {
  const found = shopTabs.find(item => item.key === shopView.value)
  return found ? found.name : '装备'
})

const filteredShopGoods = computed(() => {
  const found = shopTabs.find(item => item.key === shopView.value) || shopTabs[0]
  return shopGoods.filter(item => item.category === found.category && player.realmIndex >= item.unlockRealm)
})

const filteredOwnedEquipments = computed(() => {
  if (equipmentView.value === 'artifact') return []
  return equipmentCatalog.filter(item => item.type === equipmentView.value && getEquipmentCount(item.id) > 0)
})

const filteredOwnedArtifacts = computed(() => {
  return artifactCatalog.filter(item => isArtifactOwned(item.id))
})

const ownedCultivationPills = computed(() => {
  return cultivationPillDefs.filter(pill => (inventory.pills[pill.key] || 0) > 0)
})

const ownedSpecialPills = computed(() => {
  const list = []
  if (player.breakthroughPills > 0) list.push({ key: 'breakthrough', name: '破障丹', count: player.breakthroughPills })
  if (inventory.pills.bone > 0) list.push({ key: 'bone', name: '根骨丹', count: inventory.pills.bone })
  if (inventory.pills.comprehension > 0) list.push({ key: 'comprehension', name: '悟心丹', count: inventory.pills.comprehension })
  if (inventory.pills.fortune > 0) list.push({ key: 'fortune', name: '福缘丹', count: inventory.pills.fortune })
  return list
})

const ownedMaterialStats = computed(() => {
  return [
    { key: 'herbs', name: '药材', count: inventory.herbs },
    { key: 'ores', name: '矿石', count: inventory.ores },
    { key: 'fruits', name: '灵果', count: inventory.fruits },
    { key: 'cores', name: '内丹', count: inventory.cores },
    { key: 'furnaceStones', name: '炉石', count: inventory.furnaceStones },
    { key: 'scrolls', name: '残卷', count: inventory.scrolls }
  ].filter(item => item.count > 0)
})

const ownedItemStats = computed(() => {
  return [
    { key: 'exploreTalisman', name: '探索符', count: inventory.items.exploreTalisman },
    { key: 'acceleratorCharm', name: '加速符', count: inventory.items.acceleratorCharm }
  ].filter(item => item.count > 0)
})

const ownedSpecialStats = computed(() => {
  return [
    { key: 'chaosPearl', name: '混沌珠', count: inventory.special.chaosPearl },
    { key: 'recipeFragment', name: '高阶丹方残卷', count: inventory.special.recipeFragment }
  ].filter(item => item.count > 0)
})



function getShopBuyAmount(id) {
  const value = Number(shopBuyAmounts[id])
  return Number.isFinite(value) && value > 0 ? Math.max(1, Math.min(999, Math.floor(value))) : 1
}

function onShopAmountInput(id, event) {
  const raw = event?.detail?.value
  const value = Math.max(1, Math.min(999, Math.floor(Number(raw) || 1)))
  shopBuyAmounts[id] = value
}

function switchEquipmentView(type) {
  equipmentView.value = type
  showFeedback(`已切换到${getEquipmentTypeText(type)}`)
}

function switchShopView(type) {
  shopView.value = type
  showFeedback(`商店分类已切换到${currentShopTabName.value}`)
}
</script>

<style scoped lang="scss">
@import '@/common/styles/game.scss';
</style>
