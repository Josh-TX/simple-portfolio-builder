<script setup lang="ts">

import { selectedPortfolioService } from '../services/selectedPortfolioService';
import { GetPortfolioSimulationsRequest, HistogramContainer, HistogramDataset, SimulatedPortfolio } from '../models/models';
import BarChart from './BarChart.vue';
import { ref, Ref } from 'vue';
import { callWorker } from '../services/workerCaller';

var histogram: Ref<HistogramContainer | null> = ref(null);

function getHistogram(simulatedPortfolios: SimulatedPortfolio[]): HistogramContainer{
    var tailExcludePercent = 0.5;
    var binCount = 50;

    var allResults = simulatedPortfolios.map(z => z.results).flat();
    allResults.sort((a, b) => a - b);
    var lowerIndex = Math.ceil((tailExcludePercent / 100) * allResults.length);
    var upperIndex = Math.floor(((100 - tailExcludePercent) / 100) * allResults.length) - 1;

    var min = allResults[lowerIndex];
    var max = allResults[upperIndex];
    var binSize = (max - min) / binCount;
    var binAvgs =  Array(binCount).fill(0).map((_, i) => min + (i + 0.5) * binSize);
    var datasets: HistogramDataset[] = [];
    for (var simulatedPortfolio of simulatedPortfolios){
        var bins = Array(binCount).fill(0)
        for (var result of simulatedPortfolio.results){
            if (result >= min && result <= max){
                var binIndex = Math.min(Math.floor((result - min) / binSize), binCount - 1);
                bins[binIndex]++;
            }
        }
        datasets.push({
            name: simulatedPortfolio.name,
            bins: bins
        });
    }
    return {
        binAvgs: binAvgs,
        datasets: datasets
    };
}

async function updateData() {
    var selectedPortfolios = selectedPortfolioService.getPortfolios();
    var simulatedPortfolios: SimulatedPortfolio[] = [];
    for (var selectedPortfolio of selectedPortfolios){
        var request: GetPortfolioSimulationsRequest = {
            portfolio: selectedPortfolio,
            simulationCount: 20000,
            years: 30
        };
        var results = await callWorker(request);
        simulatedPortfolios.push({ ...selectedPortfolio, results: results });
    }
    histogram.value = getHistogram(simulatedPortfolios);
}
updateData();
</script>

<template>
    <BarChart :histogram="histogram" />
</template>

<style scoped></style>
