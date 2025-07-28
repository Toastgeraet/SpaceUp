<script setup lang="ts">
import { RouterView } from 'vue-router'
import NotificationCenter from '@/components/NotificationCenter.vue'
</script>

<template>
  <RouterView />
  <NotificationCenter />
</template>

<style scoped>
#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
</style>
