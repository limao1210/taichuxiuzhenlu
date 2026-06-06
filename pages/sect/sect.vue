<template>
    <view class="page-wrap">
    <view class="topbar card">
      <view class="topbar-main">
        <text class="title">太初修真录</text>
        <text class="subtitle">宗门试炼、任务、兑换与宗门加持。</text>
      </view>

      <!-- <view class="topbar-buttons">
        <button class="ghost-btn mini-btn" @click="saveGame">手动存档</button>
        <button class="ghost-btn mini-btn" @click="loadGame">读档</button>
        <button class="danger-btn mini-btn" @click="resetGame">重开</button>
      </view> -->
    </view>

    <scroll-view scroll-x class="inner-nav-scroll">
      <view class="inner-nav card">
        <button class="inner-nav-btn" :class="sectView === 'main' ? 'active' : ''" @click="switchSectView('main')">宗门信息</button>
        <button class="inner-nav-btn" :class="sectView === 'task' ? 'active' : ''" @click="switchSectView('task')">宗门任务</button>
        <button class="inner-nav-btn" :class="sectView === 'challenge' ? 'active' : ''" @click="switchSectView('challenge')">宗门试炼</button>
        <button class="inner-nav-btn" :class="sectView === 'tower' ? 'active' : ''" @click="switchSectView('tower')">镇妖塔</button>
        <button class="inner-nav-btn" :class="sectView === 'exchange' ? 'active' : ''" @click="switchSectView('exchange')">宗门兑换</button>
      </view>
    </scroll-view>

    <view class="page-grid single-view-grid">
      <view class="card section-card full-width" v-if="!sectUnlocked">
        <view class="section-head">
          <text class="section-title">宗门页面</text>
          <view class="small-badge">待解锁</view>
        </view>
        <view class="info-box">
          <text class="small-text">金丹期后方可开启宗门。当前先继续修炼，待金丹凝成再来广纳同道。</text>
        </view>
      </view>

      <view class="card section-card full-width" v-if="sectUnlocked && sectView === 'main'">
        <view class="section-head">
          <text class="section-title">宗门页面</text>
          <view class="small-badge">单机模式</view>
        </view>

        <view v-if="!sect.joined" class="section-card-inner">
          <view class="info-box">
            <text class="small-text">当前你仍是散修。金丹期后可加入宗门，元婴期后可自建宗门。</text>
          </view>

          <view v-for="item in sectTemplates" :key="item.id" class="sect-card">
            <view class="recipe-head">
              <view>
                <text class="recipe-name">{{ item.name }}</text>
                <text class="recipe-desc">{{ item.desc }}</text>
              </view>
              <view class="small-badge">{{ item.requireText }}</view>
            </view>
            <view class="recipe-meta">
              <text>修炼 +{{ Math.floor(item.bonus.cultivation * 100) }}%，炼丹 +{{ Math.floor(item.bonus.alchemy * 100) }}%，探索 +{{ Math.floor(item.bonus.explore * 100) }}%</text>
            </view>
            <view class="action-row mt-12">
              <button class="primary-btn small-btn" :disabled="!canJoinSect(item)" @click="joinSect(item.id)">
                {{ canJoinSect(item) ? '加入宗门' : '境界不足' }}
              </button>
            </view>
          </view>

          <view class="info-box" v-if="canCreateSect">
            <text class="section-mini-title">创建宗门</text>
            <text class="small-text" v-if="getSectCreateMaterials">所需材料：灵石 {{ formatNumber(getSectCreateMaterials.spiritStones || 0) }}、矿石 {{ formatNumber(getSectCreateMaterials.ores || 0) }}、药材 {{ formatNumber(getSectCreateMaterials.herbs || 0) }}</text>
            <input v-model="sect.createName" class="name-input" placeholder-class="input-placeholder" maxlength="12" placeholder="请输入宗门名称" />
            <view class="action-row mt-12">
              <button class="primary-btn" @click="createSect">创建宗门</button>
            </view>
          </view>

          <view v-if="sect.createdSects && sect.createdSects.length > 0 && !sect.joined" class="section-card-inner">
            <text class="section-mini-title">你的宗门</text>
            <view v-for="cs in sect.createdSects" :key="cs.id" class="sect-card">
              <view class="recipe-head">
                <view>
                  <text class="recipe-name">{{ cs.name }}</text>
                  <text class="recipe-desc">宗门等级 {{ cs.sectLevel }} · 贡献等级 {{ cs.contributionLevel }}</text>
                </view>
              </view>
              <view class="recipe-meta">
                <text>贡献 {{ formatNumber(cs.contribution) }} · 资金 {{ formatNumber(cs.funds) }}</text>
              </view>
              <view class="action-row mt-12">
                <button class="primary-btn small-btn" @click="rejoinSect(cs.id)">重返宗门</button>
              </view>
            </view>
          </view>
        </view>

        <view v-else>
          <view class="stats-grid">
            <view class="stat-item">
              <text class="stat-label">宗门名称</text>
              <text class="stat-value">{{ sect.name }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-label">宗门等级</text>
              <text class="stat-value">{{ sect.sectLevel || sect.level }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-label">贡献等级</text>
              <text class="stat-value">{{ sect.contributionLevel }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-label">宗门贡献</text>
              <text class="stat-value">{{ formatNumber(sect.contribution) }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-label">宗门资金</text>
              <text class="stat-value">{{ formatNumber(sect.funds) }}</text>
            </view>
          </view>

          <view class="info-box">
            <text class="small-text">当前身份：{{ sect.rank }}</text>
            <text class="small-text">宗门加持：修炼 +{{ Math.floor(sectBonus.cultivation * 100) }}%，炼丹 +{{ Math.floor(sectBonus.alchemy * 100) }}%，探索 +{{ Math.floor(sectBonus.explore * 100) }}%</text>
            <text class="small-text">贡献等级 {{ sect.contributionLevel }}：每日兑换上限 {{ dailyExchangeCap }}（探索符可兑换次数）</text>
          </view>

          <view class="action-row">
            <button class="primary-btn" @click="claimSectWelfare">领取每日福利</button>
            <button class="secondary-btn" @click="upgradeSectLevel">升级宗门 需{{ formatNumber(getSectUpgradeNeed()) }}</button>
            <button class="secondary-btn" @click="leaveSect">离开宗门</button>
          </view>
        </view>
      </view>

      <view class="card section-card full-width" v-if="sectUnlocked && sect.joined && sectView === 'task'">
        <view class="section-head">
          <text class="section-title">宗门任务</text>
          <view class="small-badge">每日刷新</view>
        </view>

        <view v-for="task in sectTasks" :key="task.id" class="task-card">
          <view class="recipe-head">
            <view>
              <text class="recipe-name">{{ task.title }}</text>
              <text class="recipe-desc">{{ task.desc }}</text>
            </view>
            <view class="small-badge">贡献 +{{ task.rewardContribution }}</view>
          </view>
          <view class="action-row mt-12">
            <button class="primary-btn small-btn" :disabled="isSectTaskDone(task.id)" @click="doSectTask(task.id)">
              {{ isSectTaskDone(task.id) ? '今日已完成' : '执行任务' }}
            </button>
          </view>
        </view>
      </view>

      <view class="card section-card full-width" v-if="sectUnlocked && sect.joined && sectView === 'challenge'">
        <view class="section-head">
          <text class="section-title">宗门试炼</text>
          <view class="small-badge">{{ battle.mode === 'manual' ? '手动演武' : '自动演武' }}</view>
        </view>

        <view class="battle-versus">
          <view class="versus-card self">
            <text class="versus-title">我方</text>
            <text class="versus-name">{{ currentRealmName }}{{ player.realmLayer }}层</text>
            <text class="small-text">生命 {{ formatNumber(player.hp) }} / {{ formatNumber(battleMaxHp) }}</text>
            <text class="small-text">灵力 {{ formatNumber(player.spirit) }} / {{ formatNumber(player.maxSpirit) }}</text>
            <text class="small-text">攻 {{ formatNumber(battleAttack) }} / 防 {{ formatNumber(battleDefense) }}</text>
            <text class="gold-text">战力 {{ formatNumber(battlePower) }}</text>
          </view>

          <view class="versus-mark">VS</view>

          <view class="versus-card enemy">
            <text class="versus-title">当前试炼对象</text>
            <text class="versus-name">{{ sectChallengeInfo.name }}</text>
            <text class="small-text">境界 {{ sectChallengeInfo.realmText }}</text>
            <text class="small-text">生命 {{ formatNumber(sectChallengeInfo.maxHp) }}</text>
            <text class="small-text">攻 {{ formatNumber(sectChallengeInfo.attack) }} / 防 {{ formatNumber(sectChallengeInfo.defense) }}</text>
            <text class="gold-text">战力 {{ formatNumber(sectChallengeInfo.power) }}</text>
          </view>
        </view>

        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-label">当前阶位</text>
            <text class="stat-value">第 {{ sectChallengeInfo.level }} 阶</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">胜后进阶</text>
            <text class="stat-value">{{ sectChallengeInfo.nextText }}</text>
          </view>
        </view>

        <view class="info-box">
          <text class="small-text">进行宗门试炼可选择自动战斗或手动战斗。胜利可获得修为、灵石、功法点和宗门贡献，并自动提升下一次试炼难度。</text>
          <text class="small-text">战斗结束后生命与灵力都会自动回满。</text>
        </view>

        <view class="action-row">
          <button class="primary-btn" :disabled="battle.isBattling" @click="startSectChallenge">{{ battle.isBattling ? '挑战进行中' : '开始试炼' }}</button>
          <button class="secondary-btn" :disabled="battle.isBattling" @click="toggleBattleMode">{{ battle.mode === 'manual' ? '改为自动' : '改为手动' }}</button>
          <button class="secondary-btn" @click="recoverBattleState">调息疗伤</button>
        </view>

        <view class="skill-list compact-skill-list">
          <view v-for="skill in availableBattleSkills" :key="skill.id" class="skill-card compact-skill-card">
            <view class="recipe-head">
              <view>
                <text class="recipe-name">{{ skill.name }}</text>
                <text class="recipe-desc">{{ skill.desc }}</text>
              </view>
              <view class="small-badge">Lv.{{ getBattleSkillLevel(skill) }} · 灵力 {{ getBattleSkillCost(skill) }}</view>
            </view>
            <text class="small-text">伤害倍率 ×{{ getBattleSkillPowerText(skill) }}</text>
          </view>
        </view>
      </view>


      <view class="card section-card full-width" v-if="sectUnlocked && sect.joined && sectView === 'tower'">
        <view class="section-head">
          <text class="section-title">镇妖塔</text>
          <view class="small-badge">无限挑战</view>
        </view>

        <view class="battle-versus">
          <view class="versus-card self">
            <text class="versus-title">我方</text>
            <text class="versus-name">{{ currentRealmName }}{{ player.realmLayer }}层</text>
            <text class="small-text">生命 {{ formatNumber(player.hp) }} / {{ formatNumber(battleMaxHp) }}</text>
            <text class="small-text">灵力 {{ formatNumber(player.spirit) }} / {{ formatNumber(player.maxSpirit) }}</text>
            <text class="small-text">攻 {{ formatNumber(battleAttack) }} / 防 {{ formatNumber(battleDefense) }}</text>
            <text class="gold-text">战力 {{ formatNumber(battlePower) }}</text>
          </view>

          <view class="versus-mark">VS</view>

          <view class="versus-card enemy">
            <text class="versus-title">当前妖兽</text>
            <text class="versus-name">{{ demonTowerInfo.name }}</text>
            <text class="small-text">境界 {{ demonTowerInfo.realmText }}</text>
            <text class="small-text">生命 {{ formatNumber(demonTowerInfo.maxHp) }}</text>
            <text class="small-text">攻 {{ formatNumber(demonTowerInfo.attack) }} / 防 {{ formatNumber(demonTowerInfo.defense) }}</text>
            <text class="gold-text">战力 {{ formatNumber(demonTowerInfo.power) }}</text>
          </view>
        </view>

        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-label">当前塔层</text>
            <text class="stat-value">{{ demonTowerInfo.floorText }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">当前间数</text>
            <text class="stat-value">{{ demonTowerInfo.roomText }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">胜后位置</text>
            <text class="stat-value">{{ demonTowerInfo.nextText }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">历史最高</text>
            <text class="stat-value">{{ getTowerLocationText(sect.highestDemonTowerLevel || 1) }}</text>
          </view>
        </view>

        <view class="info-box">
          <text class="small-text">镇妖塔为宗门长期试炼，现按“大境界为塔层、每层九间”推进。到达最高境界第九间后，不再虚构新境界，而是在第九间后追加“极境重数”，难度继续提高。</text>
          <text class="small-text">胜利可获得修为、灵石、妖兽内丹、宗门贡献；每 5 层额外获得功法点，每 9 层额外获得探索符。战斗结束后生命与灵力自动回满。</text>
        </view>

        <view class="action-row">
          <button class="primary-btn" :disabled="battle.isBattling" @click="startDemonTowerChallenge">{{ battle.isBattling ? '挑战进行中' : '挑战镇妖塔' }}</button>
          <button class="secondary-btn" :disabled="battle.isBattling" @click="toggleBattleMode">{{ battle.mode === 'manual' ? '改为自动' : '改为手动' }}</button>
          <button class="secondary-btn" @click="recoverBattleState">调息疗伤</button>
        </view>
      </view>

      <view class="card section-card full-width" v-if="sectUnlocked && sect.joined && sectView === 'exchange'">
        <view class="section-head">
          <text class="section-title">宗门兑换</text>
          <view class="small-badge">消耗贡献</view>
        </view>

        <view v-for="item in sectExchanges" :key="item.id" class="exchange-card">
          <view class="recipe-head">
            <view>
              <text class="recipe-name">{{ item.name }}</text>
              <text class="recipe-desc">{{ item.desc }}</text>
            </view>
            <view class="small-badge">{{ formatNumber(item.cost) }} 贡献</view>
          </view>
          <view class="action-row mt-12">
            <button class="primary-btn small-btn" :disabled="sect.contribution < item.cost" @click="exchangeSectItem(item.id)">
              {{ sect.contribution >= item.cost ? '立即兑换' : '贡献不足' }}
            </button>
          </view>
        </view>
      </view>
      </view>
    </view>

</template>

<script setup>
import { ref } from 'vue'
import { useGame } from '@/common/game/useGame.js'
const {
  goPage,
  player,
  alchemyUnlocked,
  sectUnlocked,
  canCreateSect,
  sectTemplates,
  sectTasks,
  sectExchanges,
  sect,
  battle,
  sectBonus,
  currentRealmName,
  battleMaxHp,
  battleAttack,
  battleDefense,
  battlePower,
  availableBattleSkills,
  getBattleSkillLevel,
  getBattleSkillPowerText,
  getBattleSkillCost,
    sectChallengeInfo,
  demonTowerInfo,
  showDemonTowerRealmFix,
  getTowerLocationText,
  saveGame,
  loadGame,
  resetGame,
  formatNumber,
  showFeedback,
  canJoinSect,
  joinSect,
  createSect,
  leaveSect,
  rejoinSect,
  getSectCreateMaterials,
  dailyExchangeCap,
  claimSectWelfare,
  isSectTaskDone,
  doSectTask,
  getSectUpgradeNeed,
  upgradeSectLevel,
  exchangeSectItem,
  recoverBattleState,
  toggleBattleMode,
  startSectChallenge,
  startDemonTowerChallenge,
  repairDemonTowerToTrueImmortal
} = useGame('sect')

const sectView = ref('main')

function switchSectView(view) {
  if (!sect.joined && view !== 'main') {
    sectView.value = 'main'
    showFeedback('加入宗门后开启该功能')
    return
  }
  sectView.value = view
}

</script>

<style scoped lang="scss">
@import '@/common/styles/game.scss';
</style>
