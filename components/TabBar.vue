<template>
  <view class="tab-bar">
    <view
      v-for="item in tabs"
      :key="item.key"
      class="tab-item"
      :class="activeTab === item.key ? 'active' : ''"
      @click="switchTab(item)"
    >
      <text class="tab-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeTab: { type: String, default: 'cultivation' }
})

const emit = defineEmits(['switch'])

const tabs = [
  { key: 'cultivation', text: '修仙', url: '/pages/index/index' },
  { key: 'exploration', text: '探索', url: '/pages/explore/explore' },
  { key: 'alchemy', text: '炼丹', url: '/pages/alchemy/alchemy' },
  { key: 'sect', text: '宗门', url: '/pages/sect/sect' },
  { key: 'inventory', text: '宝物', url: '/pages/inventory/inventory' }
]

function switchTab(item) {
  if (item.key === props.activeTab) return
  emit('switch', item)
}
</script>

<style scoped>
.tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: calc(98rpx + env(safe-area-inset-bottom));
  padding-bottom: calc(env(safe-area-inset-bottom));
  background: rgba(13, 19, 37, 0.97);
  border-top: 2rpx solid rgba(255, 255, 255, 0.06);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 98rpx;
}

.tab-text {
  font-size: 24rpx;
  color: #8899aa;
  transition: color 120ms;
}

.tab-item.active .tab-text {
  color: #f0c66b;
  font-weight: 700;
  font-size: 26rpx;
}
</style>
