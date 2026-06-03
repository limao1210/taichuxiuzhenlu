<template>
  <view class="page-wrap battle-page-wrap">
    <view class="topbar card battle-page-topbar">
      <view class="topbar-main">
        <text class="eyebrow">独立战斗场景</text>
        <text class="title">{{ battle.title || '战斗' }}</text>
        <!-- <text class="subtitle">战斗完成后点击返回，会回到原来的宗门页面。</text> -->
      </view>
      <view class="topbar-buttons">
        <button class="ghost-btn mini-btn" :disabled="battle.isBattling" @click="returnFromBattlePage">返回</button>
      </view>
    </view>

    <view class="card section-card battle-page-card">
      <view class="section-head battle-page-head">
        <view>
          <text class="section-title">{{ battle.controlMode === 'manual' ? '手动战斗' : '自动战斗' }}</text>
          <text class="small-text">{{ battle.enemyName || '未知敌人' }} {{ battle.enemyRealmText ? '· ' + battle.enemyRealmText : '' }}</text>
        </view>
        <view class="small-badge" :class="battle.isBattling ? 'running' : 'ready'">
          {{ battle.isBattling ? (battle.waitingForPlayer ? '待出手' : '交战中') : '已结算' }}
        </view>
      </view>

      <view class="battle-vs-board">
        <view class="battle-panel self">
          <text class="battle-panel-title">我方</text>
          <text class="battle-big-value">{{ formatNumber(battle.playerHp || player.hp) }} / {{ formatNumber(battle.playerMaxHp || battleMaxHp) }}</text>
          <view class="mini-progress"><view class="mini-progress-inner hp" :style="{ width: getBattlePercent(battle.playerHp || player.hp, battle.playerMaxHp || battleMaxHp) + '%' }"></view></view>
          <view class="battle-row-line">
            <text>灵力</text>
            <text>{{ formatNumber(battle.playerSpirit || player.spirit) }} / {{ formatNumber(battle.playerMaxSpirit || player.maxSpirit) }}</text>
          </view>
          <view class="mini-progress"><view class="mini-progress-inner spirit" :style="{ width: getBattlePercent(battle.playerSpirit || player.spirit, battle.playerMaxSpirit || player.maxSpirit) + '%' }"></view></view>
          <text class="small-text mt-12">攻 {{ battleAttack }} / 防 {{ battleDefense }}</text>
        </view>

        <view class="battle-vs-word">VS</view>

        <view class="battle-panel enemy">
          <text class="battle-panel-title">敌方</text>
          <text class="battle-big-value">{{ formatNumber(battle.enemyHp) }} / {{ formatNumber(battle.enemyMaxHp) }}</text>
          <view class="mini-progress"><view class="mini-progress-inner enemy" :style="{ width: getBattlePercent(battle.enemyHp, battle.enemyMaxHp) + '%' }"></view></view>
          <view class="battle-row-line">
            <text>境界</text>
            <text>{{ battle.enemyRealmText || '未知' }}</text>
          </view>
          <text class="small-text mt-12">攻 {{ formatNumber(battle.enemyAttack) }} / 防 {{ formatNumber(battle.enemyDefense) }}</text>
        </view>
      </view>

      <view class="explore-stage battle-page-stage">
        <text class="explore-stage-title">{{ battle.isBattling ? (battle.controlMode === 'manual' ? '请选择技能' : '当前回合') : '战斗结果' }}</text>
        <text class="explore-stage-text">{{ battle.isBattling ? currentBattleStepText : battle.lastResult }}</text>
      </view>

      <scroll-view v-if="battle.isBattling && battle.controlMode === 'manual'" scroll-y class="battle-page-skill-scroll">
        <view v-for="skill in availableBattleSkills" :key="skill.id" class="skill-card manual-skill-card" :class="player.spirit < getBattleSkillCost(skill) ? 'disabled-skill' : ''">
          <view class="manual-skill-main">
            <view class="manual-skill-info">
              <view class="manual-skill-title-row">
                <text class="recipe-name manual-skill-name">{{ skill.name }}</text>
                <view class="small-badge manual-skill-cost">Lv.{{ getBattleSkillLevel(skill) }} · 灵力 {{ getBattleSkillCost(skill) }}</view>
              </view>
              <text class="recipe-desc manual-skill-desc">{{ skill.desc }}</text>
              <text class="small-text manual-skill-meta">倍率 ×{{ getBattleSkillPowerText(skill) }} · {{ player.spirit >= getBattleSkillCost(skill) ? '可释放' : '灵力不足' }}</text>
            </view>
            <button class="primary-btn small-btn manual-skill-btn" :disabled="!battle.waitingForPlayer || player.spirit < getBattleSkillCost(skill)" @click="useManualBattleSkill(skill.id)">施展</button>
          </view>
        </view>
      </scroll-view>

      <view v-if="battle.isBattling && battle.controlMode === 'manual' && battle.waitingForPlayer" class="battle-flee-row">
        <text class="small-text">遁走成功率 {{ Math.floor(battleFleeChance * 100) }}%</text>
        <button class="ghost-btn mini-btn" @click="attemptFlee">逃跑</button>
      </view>

      <view class="explore-progress-box" v-else>
        <view class="row between">
          <text class="small-text">战斗进度</text>
          <text class="small-text">{{ battle.currentProcess.length }} / {{ battle.totalSteps }}</text>
        </view>
        <view class="progress">
          <view class="progress-inner" :style="{ width: battlePlaybackPercent + '%' }"></view>
        </view>
      </view>

      <scroll-view scroll-y class="battle-page-log-scroll">
        <view v-for="(step, index) in battle.currentProcess" :key="index" class="explore-modal-step">
          <text class="explore-step-index">第 {{ index + 1 }} 段</text>
          <text class="explore-step-text">{{ step }}</text>
        </view>
      </scroll-view>

      <view class="action-row battle-page-actions">
        <button class="secondary-btn" :disabled="!battle.isBattling" @click="skipBattleProcess">
          {{ battle.controlMode === 'manual' ? '自动托管' : '跳过过程' }}
        </button>
        <button class="primary-btn" :disabled="battle.isBattling" @click="continueBattleChallenge">
          {{ battle.source === 'tower' ? '继续挑战镇妖塔' : '继续宗门试炼' }}
        </button>
        <button class="secondary-btn" :disabled="battle.isBattling" @click="returnFromBattlePage">返回宗门</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useGame } from '@/common/game/useGame.js'

const {
  player,
  battle,
  battleMaxHp,
  battleAttack,
  battleDefense,
  battleFleeChance,
  availableBattleSkills,
  battlePlaybackPercent,
  currentBattleStepText,
  getBattleSkillLevel,
  getBattleSkillPowerText,
  getBattleSkillCost,
  useManualBattleSkill,
  attemptFlee,
  skipBattleProcess,
  startBattleFromRequest,
  returnFromBattlePage,
  continueBattleChallenge,
  formatNumber,
  showFeedback
} = useGame('battle')

const battleStarted = ref(false)

onShow(() => {
  if (battleStarted.value || battle.visible || battle.isBattling) return
  battleStarted.value = true
  const ok = startBattleFromRequest()
  if (!ok) showFeedback('没有待进行的战斗')
})

function getBattlePercent(current, max) {
  const safeMax = Math.max(1, Number(max) || 1)
  return Math.max(0, Math.min(100, Math.floor(((Number(current) || 0) / safeMax) * 100)))
}
</script>

<style scoped lang="scss">
@import '@/common/styles/game.scss';
</style>
