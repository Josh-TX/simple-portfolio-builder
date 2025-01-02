<script setup lang="ts">
import LineChartPageComponent from './components/LineChartPageComponent.vue';
import ScatterplotPageComponent from './components/ScatterplotPageComponent.vue';
import StatsPageComponent from './components/StatsPageComponent.vue';
import { ref, computed } from 'vue';  

const routes: { [key: string]: any } = {
    '/line-chart': LineChartPageComponent,
    '/scatterplot': ScatterplotPageComponent,
    '/stats': StatsPageComponent
}

const currentPath = ref(window.location.hash)

window.addEventListener('hashchange', () => {
    currentPath.value = window.location.hash
})

const currentView = computed(() => {
    var comp =  routes[currentPath.value.slice(1)] ;
    if (!comp){
        window.location.hash = "/line-chart"
    }
    return comp || LineChartPageComponent;
})


</script>

<template>
    <div style="height: 100%; display: flex; flex-direction: column">
        <div style="display: flex;" class="navbar">
            <a href="#/line-chart">Line Chart</a> 
            <a href="#/scatterplot">Scatterplot</a> 
            <a href="#/stats">Stats</a>
        </div>
        <div style="flex: 1 1 0;">
            <component :is="currentView" />
        </div>
    </div>
</template>

<style scoped>
    .navbar {
        height: 32px;
        line-height: 32px;
        background: rgba(0,0,0,0.1);
        box-shadow: 0 1px 3px rgba(0,0,0,0.5);
    }
    .navbar > a {
        font-weight: 400;
        padding: 0 12px;
    }
</style>
