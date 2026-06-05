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
        <button class="primary-btn" @click="doCreate(false)">新建存档</button>
        <button class="secondary-btn" @click="doCreate(true)">空白新档</button>
      </view>
      <view class="info-box mt-12">
        <text class="small-text">新建会复制当前进度；空白新档从炼气一层开始。切换前自动保存。</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      slots: [],
      activeId: '',
      NAMES: ['炼气','筑基','金丹','元婴','化神','炼虚','合体','大乘','渡劫','真仙','玄仙','金仙','仙王','仙帝','真神','天神','神王','神皇','神尊'],
      RATES: [1,2.15,4.8,11.5,27.5,66,158,380,900,2250,5600,14000,35000,88000,220000,550000,1380000,3450000,8600000]
    }
  },
  mounted() {
    this.loadSlots()
  },
  methods: {
    loadMeta() {
      try {
        return JSON.parse(uni.getStorageSync('__xiuxian_slot_meta__') || '{"list":[],"activeId":""}')
      } catch (e) { return { list: [], activeId: '' } }
    },
    saveMeta(meta) {
      uni.setStorageSync('__xiuxian_slot_meta__', JSON.stringify(meta))
    },
    loadSlots() {
      const meta = this.loadMeta()
      this.activeId = meta.activeId
      const self = this
      this.slots = (meta.list || []).map(function(s) {
        var raw = uni.getStorageSync('__xiuxian_slot_' + s.id)
        var info = ''
        if (raw) {
          try {
            var d = JSON.parse(raw)
            var p = d.player || {}
            var ri = p.realmIndex || 0
            info = self.NAMES[ri] + (p.realmLayer || 1) + '层 · 战力≈' + self.fmtPower(d)
          } catch (e) { info = '数据损坏' }
        } else {
          info = '空存档'
        }
        return { id: s.id, name: s.name, createdAt: s.createdAt, lastPlayedAt: s.lastPlayedAt, info: info }
      })
    },
    fmtPower(save) {
      var p = save.player || {}
      var rate = this.RATES[p.realmIndex || 0] || 1
      var atk = Math.floor((p.attack || 26) * rate * 0.1)
      var hp = Math.floor((p.maxHp || 180) * rate * 0.6)
      var def = Math.floor((p.defense || 8) * rate * 0.3)
      var power = Math.floor((hp + atk * 9 + def * 12) / 100)
      if (power < 10000) return String(power)
      if (power < 100000000) return (power / 10000).toFixed(1) + '万'
      return (power / 100000000).toFixed(2) + '亿'
    },
    formatRelative(ts) {
      if (!ts) return '未知'
      var d = Math.floor((Date.now() - ts) / 1000)
      if (d < 60) return '刚刚'
      if (d < 3600) return Math.floor(d / 60) + '分前'
      if (d < 86400) return Math.floor(d / 3600) + '时前'
      return Math.floor(d / 86400) + '天前'
    },
    formatDay(ts) {
      if (!ts) return '未知'
      var d = new Date(ts)
      return (d.getMonth() + 1) + '月' + d.getDate() + '日'
    },
    buildPayloadFromCurrent() {
      var keys = ['player','inventory','settings','exploration','alchemy','sect','battle','daily','autoCultivationEnabled','lastSaveAt','logs','explorationLogs']
      var keep = ['saveVersion','activeTab','inventoryTab'].concat(keys)
      var save = {}
      try {
        var raw = uni.getStorageSync('__xiuxian_slot_' + this.activeId)
        if (raw) {
          var d = JSON.parse(raw)
          keep.forEach(function(k) { if (d[k] !== undefined) save[k] = d[k] })
        }
      } catch (e) {}
      return save
    },
    newSaveData() {
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
    },
    doSwitch(slot) {
      var meta = this.loadMeta()
      if (meta.activeId === slot.id) return
      meta.activeId = slot.id
      this.saveMeta(meta)
      this.activeId = slot.id
      this.goBack()
    },
    doDelete(slot) {
      var self = this
      if (this.slots.length <= 1) return
      uni.showModal({
        title: '删除存档',
        content: '确定删除\u300C' + slot.name + '\u300D？不可撤销。',
        success: function(res) {
          if (!res.confirm) return
          var meta = self.loadMeta()
          meta.list = meta.list.filter(function(s) { return s.id !== slot.id })
          if (meta.activeId === slot.id) meta.activeId = meta.list[0] ? meta.list[0].id : ''
          self.saveMeta(meta)
          uni.removeStorageSync('__xiuxian_slot_' + slot.id)
          self.loadSlots()
        }
      })
    },
    doRename(slot) {
      var self = this
      uni.showModal({
        title: '重命名',
        editable: true,
        placeholderText: slot.name,
        success: function(res) {
          if (!res.confirm || !res.content) return
          var meta = self.loadMeta()
          var s = meta.list.find(function(x) { return x.id === slot.id })
          if (s) s.name = res.content.trim().slice(0, 12)
          self.saveMeta(meta)
          self.loadSlots()
        }
      })
    },
    doCreate(blank) {
      var name = blank ? '空白新档' : '存档 ' + (this.slots.length + 1)
      var meta = this.loadMeta()
      var id = 'slot_' + Date.now().toString(36)
      meta.list.push({ id: id, name: name, createdAt: Date.now(), lastPlayedAt: Date.now() })
      this.saveMeta(meta)
      var data = blank ? this.newSaveData() : this.buildPayloadFromCurrent()
      uni.setStorageSync('__xiuxian_slot_' + id, JSON.stringify(data))
      this.loadSlots()
    },
    goBack() {
      uni.switchTab({ url: '/pages/index/index' })
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/common/styles/game.scss';
</style>
