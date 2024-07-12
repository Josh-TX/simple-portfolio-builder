<script setup lang="ts">
import LogReturnsComp from './components/VisualizeComponent.vue';
import PortfolioBuilderComp from './components/PortfolioBuilderComponent.vue';
import SimulatePortfolioComp from './components/SimulatePortfolioComponent.vue';
import { ref, computed } from 'vue';  

const routes: { [key: string]: any } = {
    '/log-returns': LogReturnsComp,
    '/portfolio-builder': PortfolioBuilderComp,
    '/simulate-portfolio': SimulatePortfolioComp
}

const currentPath = ref(window.location.hash)

window.addEventListener('hashchange', () => {
    currentPath.value = window.location.hash
})

const currentView = computed(() => {
    var comp =  routes[currentPath.value.slice(1)] ;
    if (!comp){
        window.location.hash = "/log-returns"
    }
    return comp || LogReturnsComp;
})


</script>

<template>
    <div style="display: flex;">
        <a href="#/log-returns">Log Returns</a> |
        <a href="#/portfolio-builder">Portfolio Builder</a> |
        <a href="#/simulate-portfolio">Simulate Portfolio</a>
    </div>
    <component :is="currentView" />
</template>

<style scoped></style>
