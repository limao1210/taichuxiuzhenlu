<template>
  <view class="page-wrap">
    <view class="topbar card">
      <view class="topbar-main">
        <text class="title">太初修真录</text>
        <text class="subtitle">存档管理 · 新建、切换或删除存档</text>
      </view>
      <view class="topbar-buttons">
        <button class="ghost-btn mini-btn" @click="goBack">返回游戏</button>
      </view>
    </view>

    <view class="card section-card full-width">
      <view class="section-head">
        <text class="section-title">存档列表</text>
        <view class="small-badge">{{ slots.length }} 个存档</view>
      </view>

      <view v-for="slot in slots" :key="slot.id" class="skill-card">
        <view class="recipe-head">
          <view>
            <text class="recipe-name">{{ slot.name }}</text>
            <text class="recipe-desc">
              最近：{{ formatRelative(slot.lastPlayedAt) }} · 创建：{{ formatDay(slot.createdAt) }}
            </text>
            <text v-if="slot.info" class="recipe-desc">{{ slot.info }}</text>
          </view>
          <view class="small-badge">{{ slot.id === activeId ? '当前' : '' }}</view>
        </view>
        <view class="action-row mt-12" style="gap:10rpx">
          <button v-if="slot.id !== activeId" class="primary-btn small-btn" @click="doSwitch(slot)">切换</button>
          <button v-else class="secondary-btn small-btn" disabled>当前</button>
          <button class="secondary-btn small-btn" @click="doRename(slot)">改名</button>
          <button v-if="slots.length > 1" class="danger-btn small-btn" @click="doDelete(slot)">删除</button>
        </view>
      </view>

      <view class="action-row mt-12">
        <button class="primary-btn" @click="doCreate">新建存档</button>
        <button class="secondary-btn" @click="doCreate(true)">空白新档</button>
      </view>
      <view class="info-box mt-12">
        <text class="small-text">新建会复制当前进度；空白新档从炼气一层开始。切换前自动保存。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const META_KEY = '__xiuxian_slot_meta__'
const DATA_PREFIX = '__xiuxian_slot_'
const NAMES = ['炼气','筑基','金丹','元婴','化神','炼虚','合体','大乘','渡劫','真仙','玄仙','金仙','仙王','仙帝','真神','天神','神王','神皇','神尊']
const RATES = [1,2.15,4.8,11.5,27.5,66,158,380,900,2250,5600,14000,35000,88000,220000,550000,1380000,3450000,8600000]

const slots = ref([])
const activeId = ref('')

function loadMeta() {
  try {
    return JSON.parse(uni.getStorageSync(META_KEY) || '{"list":[],"activeId":""}')
  } catch { return { list: [], activeId: '' } }
}

function saveMeta(meta) {
  uni.setStorageSync(META_KEY, JSON.stringify(meta))
}

function loadSlots() {
  const meta = loadMeta()
  activeId.value = meta.activeId
  slots.value = (meta.list || []).map(s => {
    const raw = uni.getStorageSync(DATA_PREFIX + s.id)
    let info = ''
    if (raw) {
      try {
        const d = JSON.parse(raw)
        const p = d.player || {}
        const ri = p.realmIndex || 0
        info = NAMES[ri] + (p.realmLayer || 1) + '层 · 战力≈' + fmtPower(d)
      } catch { info = '数据损坏' }
    } else {
      info = '空存档'
    }
    return { ...s, info }
  })
}

function fmtPower(save) {
  const p = save.player || {}
  const rate = RATES[p.realmIndex || 0] || 1
  const atk = Math.floor((p.attack || 26) * rate * 0.1)
  const hp = Math.floor((p.maxHp || 180) * rate * 0.6)
  const def = Math.floor((p.defense || 8) * rate * 0.3)
  const power = Math.floor((hp + atk * 9 + def * 12) / 100)
  if (power < 10000) return String(power)
  if (power < 100000000) return (power / 10000).toFixed(1) + '万'
  return (power / 100000000).toFixed(2) + '亿'
}

function formatRelative(ts) {
  if (!ts) return '未知'
  const d = Math.floor((Date.now() - ts) / 1000)
  if (d < 60) return '刚刚'
  if (d < 3600) return Math.floor(d / 60) + '分前'
  if (d < 86400) return Math.floor(d / 3600) + '时前'
  return Math.floor(d / 86400) + '天前'
}

function formatDay(ts) {
  if (!ts) return '未知'
  const d = new Date(ts)
  return (d.getMonth() + 1) + '月' + d.getDate() + '日'
}

function buildPayloadFromCurrent() {
  const keys = ['player','inventory','settings','exploration','alchemy','sect','battle','daily','autoCultivationEnabled','lastSaveAt','logs','explorationLogs']
  const keep = ['saveVersion','activeTab','inventoryTab', ...keys]
  const save = {}
  try {
    const raw = uni.getStorageSync(DATA_PREFIX + activeId.value)
    if (raw) {
      const d = JSON.parse(raw)
      keep.forEach(k => { if (d[k] !== undefined) save[k] = d[k] })
    }
  } catch {}
  return save
}

function newSaveData() {
  return {
    saveVersion:29, activeTab:'cultivation', inventoryTab:'pills',
    player:{name:'无名散修',realmIndex:0,realmLayer:1,cultivation:0,spirit:120,maxSpirit:120,hp:180,maxHp:180,attack:26,defense:8,bone:12,comprehension:11,fortune:10,techniquePoints:5,breakthroughPills:2,explorationTimes:8,maxExplorationTimes:8,equippedTechniqueId:'qingmu',techniqueLevels:{qingmu:1,lieyang:1,xuanbing:1},skillLevels:{basic:1,fireball:1,thunder:1,swordShield:1,soulFire:1},battleLoadout:['fireball','thunder','swordShield','soulFire']},
    inventory:{herbs:0,ores:0,fruits:0,cores:0,scrolls:0,furnaceStones:1,spiritStones:80,jade:0,pills:{qiCondense:2,spiritRecover:2,goldCorePill:0,nascentSoulPill:0,spiritTransformPill:0,voidRefinePill:0,unionPill:0,mahayanaPill:0,tribulationPill:0,trueImmortalPill:0,mysticImmortalPill:0,goldImmortalPill:0,immortalKingPill:0,immortalEmperorPill:0,trueGodPill:0,heavenGodPill:0,godKingPill:0,godEmperorPill:0,godSovereignPill:0,bone:0,comprehension:0,fortune:0},items:{exploreTalisman:1,acceleratorCharm:1},special:{chaosPearl:0,recipeFragment:0},artifacts:{},equipments:{},equipped:{weapon:'',armor:'',accessory:'',talisman:'',artifact:'',artifacts:{weapon:'',armor:'',accessory:'',talisman:''}}},
    settings:{autoBreakthrough:false,autoBreakthroughMaxRealm:0,autoCultivate:true,autoCultivateRate:1,exploreDifficulty:'normal'},
    exploration:{selectedMap:'qingzhu',selectedDifficulty:'normal',isExploring:false,currentProcess:[],lastResult:'',totalSteps:6,exploreSpeedMs:1600},
    alchemy:{selectedRecipe:'qiCondense',batchCount:1,furnaceLevel:0,crafting:false,currentProcess:[],lastResult:'',totalSteps:8},
    sect:{joined:false,name:'',level:1,contribution:0,funds:0,rank:'散修',challengeLevel:1,demonTowerLevel:1},
    battle:{visible:false,isBattling:false,source:'',mode:'auto',controlMode:'auto',waitingForPlayer:false,title:'战斗',enemyName:'',enemyRealmText:'',enemyHp:0,enemyMaxHp:0,enemyAttack:0,enemyDefense:0,playerHp:0,playerMaxHp:0,playerSpirit:0,playerMaxSpirit:0,round:1,currentProcess:[],lastResult:'尚未遭遇战斗。',atkBuff:0,atkBuffTurns:0,defBuff:0,defBuffTurns:0,dodgeBuff:0,dodgeBuffTurns:0,enemyAtkDown:0,totalSteps:1,returnUrl:'/pages/sect/sect'},
    daily:{sectTasksDone:[],manualCultivateUsed:0},
    autoCultivationEnabled:true,
    lastSaveAt:Date.now(),
    logs:[],explorationLogs:[]
  }
}

function doSwitch(slot) {
  const meta = loadMeta()
  if (meta.activeId === slot.id) return
  meta.activeId = slot.id
  saveMeta(meta)
  activeId.value = slot.id
  goBack()
}

function doDelete(slot) {
  if (slots.value.length <= 1) return
  uni.showModal({
    title: '删除存档',
    content: '确定删除「' + slot.name + '」？不可撤销。',
    success: (res) => {
      if (!res.confirm) return
      const meta = loadMeta()
      meta.list = meta.list.filter(s => s.id !== slot.id)
      if (meta.activeId === slot.id) meta.activeId = meta.list[0]?.id || ''
      saveMeta(meta)
      uni.removeStorageSync(DATA_PREFIX + slot.id)
      loadSlots()
    }
  })
}

function doRename(slot) {
  uni.showModal({
    title: '重命名',
    editable: true,
    placeholderText: slot.name,
    success: (res) => {
      if (!res.confirm || !res.content) return
      const meta = loadMeta()
      const s = meta.list.find(x => x.id === slot.id)
      if (s) s.name = res.content.trim().slice(0, 12)
      saveMeta(meta)
      loadSlots()
    }
  })
}

function doCreate(blank) {
  const name = blank ? '空白新档' : '存档 ' + (slots.value.length + 1)
  const meta = loadMeta()
  const id = 'slot_' + Date.now().toString(36)
  meta.list.push({ id, name, createdAt: Date.now(), lastPlayedAt: Date.now() })
  saveMeta(meta)
  const data = blank ? newSaveData() : buildPayloadFromCurrent()
  uni.setStorageSync(DATA_PREFIX + id, JSON.stringify(data))
  loadSlots()
}

function goBack() {
  uni.switchTab({ url: '/pages/index/index' })
}

loadSlots()
</script>

<style scoped lang="scss">
@import '@/common/styles/game.scss';
</style>
