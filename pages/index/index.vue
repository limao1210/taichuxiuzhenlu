<template>
  <view class="page-wrap">
  <view class="topbar card">
      <view class="topbar-main">
<!--        <text class="eyebrow">文字修仙 · 微信小程序完整基础版</text> -->
        <text class="title">太初修真录</text>
        <!-- <text class="subtitle">已拆分为修仙、探索、炼丹、宗门、宝物五个页面，沿用旧版本地存档。</text> -->
      </view>

      

      <view class="topbar-buttons">
        <button class="ghost-btn mini-btn" @click="openSaves">存档管理</button>
        <button class="ghost-btn mini-btn" @click="goPage('/pages/wiki/wiki', '已打开修真百科')">百科</button>
        <button class="danger-btn mini-btn" @click="openDebug">调试</button>
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
            <text class="stat-value">{{ player.bone }}{{ equipmentBonus.bone > 0 ? ' +' + equipmentBonus.bone : '' }} / {{ getAttributeMax() }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">悟性</text>
            <text class="stat-value">{{ player.comprehension }}{{ equipmentBonus.comprehension > 0 ? ' +' + equipmentBonus.comprehension : '' }} / {{ getAttributeMax() }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">福缘</text>
            <text class="stat-value">{{ player.fortune }}{{ equipmentBonus.fortune > 0 ? ' +' + equipmentBonus.fortune : '' }} / {{ getAttributeMax() }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">功法点</text>
            <text class="stat-value">{{ formatNumber(player.techniquePoints) }}</text>
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
          <text class="small-text">功法点：{{ formatNumber(player.techniquePoints) }}。最多携带 4 个主动功法，灵剑斩常驻可用不占槽位。</text>
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
        <view v-if="player.realmIndex >= 2" class="skill-card dodge-skill-card">
          <view class="recipe-head">
            <view><text class="recipe-name">影遁术</text><text class="recipe-desc">凝神化影，主动闪避下一击。</text></view>
            <view class="small-badge">闪避 · Lv.{{ getBattleSkillLevel({id:'shadowDodge'}) }} · {{ Math.floor(Math.min(15, getBattleSkillLevel({id:'shadowDodge'}) * 1.5)) }}%</view>
          </view>
          <button class="secondary-btn small-btn" :disabled="player.techniquePoints < getBattleSkillUpgradeNeed({id:'shadowDodge'}) || getBattleSkillLevel({id:'shadowDodge'}) >= getBattleSkillMaxLevel({id:'shadowDodge'})" @click="upgradeBattleSkill('shadowDodge')" style="margin-top:10rpx">{{ getBattleSkillLevel({id:'shadowDodge'}) >= getBattleSkillMaxLevel({id:'shadowDodge'}) ? '满级 Lv.' + getBattleSkillMaxLevel({id:'shadowDodge'}) : (player.techniquePoints >= getBattleSkillUpgradeNeed({id:'shadowDodge'}) ? '升级影遁术' : '功法点不足') }}</button>
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
          <text v-if="skill.category === 'dodge'" class="small-text">闪避率 Lv.×1.5%（当前 {{ Math.min(15, getBattleSkillLevel(skill) * 1.5) }}%），升级需 {{ formatNumber(getBattleSkillUpgradeNeed(skill)) }} 功法点</text>
          <text v-else class="small-text">倍率 ×{{ getBattleSkillPowerText(skill) }}，升级需 {{ formatNumber(getBattleSkillUpgradeNeed(skill)) }} 功法点</text>
          <view class="action-row mt-12">
            <template v-if="skill.category === 'dodge'">
              <button class="primary-btn small-btn" :disabled="getBattleSkillLevel(skill) >= getBattleSkillMaxLevel(skill) || player.techniquePoints < getBattleSkillUpgradeNeed(skill)" @click="upgradeBattleSkill(skill.id)">
                {{ getBattleSkillLevel(skill) >= getBattleSkillMaxLevel(skill) ? '满级 Lv.' + getBattleSkillMaxLevel(skill) : (player.techniquePoints >= getBattleSkillUpgradeNeed(skill) ? '升级' : '功法点不足') }}
              </button>
            </template>
            <template v-else>
              <button class="primary-btn small-btn" :disabled="player.battleLoadout.length >= 4 || player.techniquePoints < getBattleSkillUpgradeNeed(skill) || getBattleSkillLevel(skill) >= getBattleSkillMaxLevel(skill)" @click="equipAndUpgradeSkill(skill)">{{ player.battleLoadout.length >= 4 ? '槽位已满' : (player.techniquePoints >= getBattleSkillUpgradeNeed(skill) && getBattleSkillLevel(skill) < getBattleSkillMaxLevel(skill) ? '装备并升级' : '装备') }}</button>
              <button v-if="player.techniquePoints >= getBattleSkillUpgradeNeed(skill) && getBattleSkillLevel(skill) < getBattleSkillMaxLevel(skill)" class="secondary-btn small-btn" @click="upgradeBattleSkill(skill.id)">仅升级</button>
            </template>
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

  <!-- 开发调试面板 -->
  <view v-if="debugVisible" class="debug-mask" @click="closeDebugMask">
    <view class="debug-panel card" @click.stop>
      <view class="debug-head">
        <text class="debug-title">开发者调试</text>
        <button class="ghost-btn mini-btn" @click="debugVisible = false">关闭</button>
      </view>

      <view v-if="!debugAuthed" class="debug-auth">
        <text class="small-text mb-12">请输入调试密码</text>
        <input class="debug-pwd-input" type="password" v-model="debugPwd" placeholder="密码" />
        <button class="primary-btn small-btn mt-12" @click="checkDebugPwd">验证</button>
        <text v-if="debugPwdError" class="small-text mt-12" style="color:#e55">密码错误</text>
      </view>

      <scroll-view v-else scroll-y class="debug-scroll">
        <view class="debug-section">
          <text class="debug-section-title">境界</text>
          <view class="debug-row">
            <text class="small-text">当前：{{ currentRealmName }} {{ player.realmLayer }}层</text>
          </view>
          <view class="debug-btns">
            <button class="secondary-btn small-btn" @click="debugAddLayer">+1层</button>
            <button class="secondary-btn small-btn" @click="debugAddRealm">升一个大境界</button>
            <button class="secondary-btn small-btn" @click="debugSetRealm(8)">到渡劫期</button>
            <button class="secondary-btn small-btn" @click="debugSetRealm(18)">到神尊期</button>
          </view>
        </view>

        <view class="debug-section">
          <text class="debug-section-title">属性</text>
          <view class="debug-input-row">
            <text class="small-text">修为 +</text>
            <input class="debug-num-input" type="number" v-model="debugAmounts.cultivation" />
            <button class="secondary-btn small-btn" @click="debugAdd('cultivation')">加</button>
          </view>
          <view class="debug-input-row">
            <text class="small-text">生命 +</text>
            <input class="debug-num-input" type="number" v-model="debugAmounts.hp" />
            <button class="secondary-btn small-btn" @click="debugAdd('hp')">加</button>
          </view>
          <view class="debug-input-row">
            <text class="small-text">灵力 +</text>
            <input class="debug-num-input" type="number" v-model="debugAmounts.spirit" />
            <button class="secondary-btn small-btn" @click="debugAdd('spirit')">加</button>
          </view>
          <view class="debug-input-row">
            <text class="small-text">灵石 +</text>
            <input class="debug-num-input" type="number" v-model="debugAmounts.spiritStones" />
            <button class="secondary-btn small-btn" @click="debugAdd('spiritStones')">加</button>
          </view>
          <view class="debug-input-row">
            <text class="small-text">仙玉 +</text>
            <input class="debug-num-input" type="number" v-model="debugAmounts.jade" />
            <button class="secondary-btn small-btn" @click="debugAdd('jade')">加</button>
          </view>
          <view class="debug-input-row">
            <text class="small-text">功法点 +</text>
            <input class="debug-num-input" type="number" v-model="debugAmounts.techniquePoints" />
            <button class="secondary-btn small-btn" @click="debugAdd('techniquePoints')">加</button>
          </view>
          <view class="debug-input-row">
            <text class="small-text">突破丹 +</text>
            <input class="debug-num-input" type="number" v-model="debugAmounts.breakthroughPills" />
            <button class="secondary-btn small-btn" @click="debugAdd('breakthroughPills')">加</button>
          </view>
        </view>

        <view class="debug-section">
          <text class="debug-section-title">丹药道具</text>
          <view class="debug-btns">
            <button v-for="pill in cultivationPillDefs" :key="'dbg-pill-' + pill.key" class="secondary-btn small-btn" @click="debugGivePill(pill.key)">{{ pill.name }} +10</button>
          </view>
          <view class="debug-btns mt-12">
            <button class="secondary-btn small-btn" @click="debugAdd('bonePill')">根骨丹 +10</button>
            <button class="secondary-btn small-btn" @click="debugAdd('comprehensionPill')">悟心丹 +10</button>
            <button class="secondary-btn small-btn" @click="debugAdd('fortunePill')">福缘丹 +10</button>
          </view>
        </view>

        <view class="debug-section">
          <text class="debug-section-title">道具</text>
          <view class="debug-btns">
            <button class="secondary-btn small-btn" @click="debugAdd('exploreTalisman')">探索符 +10</button>
            <button class="secondary-btn small-btn" @click="debugAdd('acceleratorCharm')">加速符 +10</button>
            <button class="secondary-btn small-btn" @click="debugAdd('escapeTalisman')">遁走符 +10</button>
          </view>
        </view>

        <view class="debug-section">
          <text class="debug-section-title">材料</text>
          <view class="debug-btns">
            <button class="secondary-btn small-btn" @click="debugAdd('herbs')">药材 +100</button>
            <button class="secondary-btn small-btn" @click="debugAdd('ores')">矿石 +100</button>
            <button class="secondary-btn small-btn" @click="debugAdd('fruits')">灵果 +100</button>
            <button class="secondary-btn small-btn" @click="debugAdd('cores')">内丹 +100</button>
            <button class="secondary-btn small-btn" @click="debugAdd('scrolls')">残卷 +100</button>
            <button class="secondary-btn small-btn" @click="debugAdd('furnaceStones')">炉石 +50</button>
          </view>
        </view>

        <view class="debug-section">
          <text class="debug-section-title">其他</text>
          <view class="debug-btns">
            <button class="secondary-btn small-btn" @click="debugAdd('exploreTimes')">探索次数 +10</button>
            <button class="secondary-btn small-btn" @click="debugFullHeal">满血满灵</button>
            <button class="danger-btn small-btn" @click="debugMaxAll">一键拉满</button>
          </view>
        </view>
      </scroll-view>
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
  const map = { attack: '攻击', buff: '增益', heal: '恢复', dodge: '闪避' }
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

// ===== 开发调试工具 =====
const DEBUG_PASSWORD = 'X9k#7mP$2wQ@5vL'
const debugVisible = ref(false)
const debugAuthed = ref(false)
const debugPwd = ref('')
const debugPwdError = ref(false)
const debugAmounts = reactive({
  cultivation: 1000000,
  hp: 500,
  spirit: 500,
  spiritStones: 10000,
  jade: 10,
  techniquePoints: 50,
  breakthroughPills: 10
})

function openDebug() {
  debugVisible.value = true
  debugPwd.value = ''
  debugPwdError.value = false
}

function closeDebugMask() {
  debugVisible.value = false
}

function checkDebugPwd() {
  if (debugPwd.value === DEBUG_PASSWORD) {
    debugAuthed.value = true
    debugPwdError.value = false
  } else {
    debugPwdError.value = true
  }
}

function debugAdd(type) {
  const amt = Number(debugAmounts[type]) || 0
  if (type === 'cultivation') { player.cultivation += amt }
  else if (type === 'hp') { player.hp = Math.min(battleMaxHp.value, player.hp + amt) }
  else if (type === 'spirit') { player.spirit = Math.min(player.maxSpirit, player.spirit + amt) }
  else if (type === 'spiritStones') { inventory.spiritStones += amt }
  else if (type === 'jade') { inventory.jade = (inventory.jade || 0) + amt }
  else if (type === 'techniquePoints') { player.techniquePoints += amt }
  else if (type === 'breakthroughPills') { player.breakthroughPills += amt }
  else if (type === 'bonePill') { inventory.pills.bone += 10 }
  else if (type === 'comprehensionPill') { inventory.pills.comprehension += 10 }
  else if (type === 'fortunePill') { inventory.pills.fortune += 10 }
  else if (type === 'exploreTalisman') { inventory.items.exploreTalisman += 10 }
  else if (type === 'acceleratorCharm') { inventory.items.acceleratorCharm += 10 }
  else if (type === 'escapeTalisman') { inventory.items.escapeTalisman += 10 }
  else if (type === 'exploreTimes') { player.explorationTimes = Math.min(player.maxExplorationTimes + 10, player.explorationTimes + 10) }
  else if (type === 'herbs') { inventory.herbs += 100 }
  else if (type === 'ores') { inventory.ores += 100 }
  else if (type === 'fruits') { inventory.fruits += 100 }
  else if (type === 'cores') { inventory.cores += 100 }
  else if (type === 'scrolls') { inventory.scrolls += 100 }
  else if (type === 'furnaceStones') { inventory.furnaceStones += 50 }
  saveSilently()
  showFeedback('已增加', 'success')
}

function debugAddLayer() {
  if (player.realmLayer >= 9) {
    if (player.realmIndex >= realmNames.length - 1) { showFeedback('已达最高境界'); return }
    player.realmIndex += 1
    player.realmLayer = 1
  } else {
    player.realmLayer += 1
  }
  player.maxSpirit += 15 + player.realmIndex * 5
  player.spirit = player.maxSpirit
  player.hp = battleMaxHp.value
  saveSilently()
  showFeedback(`已升至${currentRealmName.value} ${player.realmLayer}层`, 'success')
}

function debugAddRealm() {
  if (player.realmIndex >= realmNames.length - 1) { showFeedback('已达最高境界'); return }
  player.realmIndex += 1
  player.realmLayer = 1
  player.maxSpirit += 15 + player.realmIndex * 5
  player.spirit = player.maxSpirit
  player.hp = battleMaxHp.value
  saveSilently()
  showFeedback(`已升至${currentRealmName.value}`, 'success')
}

function debugSetRealm(index) {
  player.realmIndex = Math.min(realmNames.length - 1, index)
  player.realmLayer = 1
  player.maxSpirit = 120 + player.realmIndex * 20
  player.spirit = player.maxSpirit
  player.hp = battleMaxHp.value
  saveSilently()
  showFeedback(`已设置${currentRealmName.value}`, 'success')
}

function debugGivePill(key) {
  inventory.pills[key] = (inventory.pills[key] || 0) + 10
  saveSilently()
  showFeedback('丹药 +10', 'success')
}

function debugFullHeal() {
  player.hp = battleMaxHp.value
  player.spirit = player.maxSpirit
  saveSilently()
  showFeedback('已满血满灵', 'success')
}

function debugMaxAll() {
  player.cultivation += 99999999999
  player.hp = battleMaxHp.value
  player.spirit = player.maxSpirit
  player.techniquePoints += 99999
  player.breakthroughPills += 999
  player.explorationTimes = Math.max(player.explorationTimes, 100)
  inventory.spiritStones += 999999
  inventory.jade = (inventory.jade || 0) + 999
  inventory.herbs += 9999
  inventory.ores += 9999
  inventory.fruits += 9999
  inventory.cores += 9999
  inventory.scrolls += 999
  inventory.furnaceStones += 999
  inventory.items.exploreTalisman += 99
  inventory.items.acceleratorCharm += 99
  inventory.items.escapeTalisman += 99
  cultivationPillDefs.forEach(p => { inventory.pills[p.key] = (inventory.pills[p.key] || 0) + 99 })
  inventory.pills.bone += 99
  inventory.pills.comprehension += 99
  inventory.pills.fortune += 99
  saveSilently()
  showFeedback('一键拉满完成', 'success')
}


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

// 调试面板
.debug-mask {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}
.debug-panel {
  width: 90vw;
  max-width: 640rpx;
  max-height: 85vh;
  padding: 24rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.debug-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.debug-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #f0c66b;
}
.debug-auth {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0;
}
.debug-pwd-input {
  width: 60%;
  height: 72rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  text-align: center;
  font-size: 28rpx;
}
.debug-scroll {
  flex: 1;
  max-height: 65vh;
}
.debug-section {
  margin-bottom: 24rpx;
}
.debug-section-title {
  display: block;
  color: #f0c66b;
  font-size: 26rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
  border-bottom: 2rpx solid rgba(240, 198, 107, 0.3);
  padding-bottom: 8rpx;
}
.debug-row {
  margin-bottom: 12rpx;
}
.debug-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.debug-input-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}
.debug-num-input {
  width: 140rpx;
  height: 56rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  text-align: center;
  font-size: 24rpx;
}
.mb-12 { margin-bottom: 12rpx; }
.mt-12 { margin-top: 12rpx; }
</style>
