<script setup lang="ts">
import { Chart, registerables, ScatterDataPoint } from 'chart.js';
import { onMounted, toRaw, watch } from 'vue'
import zoomPlugin from 'chartjs-plugin-zoom';
import {  ScatterplotDataContainer, ScatterplotPoint } from '../models/models';
import * as MathHelpers from '../services/math-helpers';

Chart.register(zoomPlugin);
Chart.register(...registerables);

var props = defineProps<{ dataContainer: ScatterplotDataContainer | null, highlightedIndexes: number[] }>();
var emits = defineEmits(['point-clicked'])
var _chart: Chart<"scatter", ScatterDataPoint[], string> | null = null;
var selectedPointWeights: number[][] = [];
var selectedPointTickers: string[] = [];

var _points: ScatterplotPoint[][] = [];

watch(() => props.dataContainer, async () => {
    if (props.dataContainer) {
        if (JSON.stringify(selectedPointTickers) != JSON.stringify(props.dataContainer.seriesLabels)){
            selectedPointWeights = [];
        }
        else if (selectedPointWeights.length && MathHelpers.getSum(selectedPointWeights[0]) != MathHelpers.getSum(props.dataContainer.points[0].weights)){
            selectedPointWeights = [];
        }
        selectedPointTickers = props.dataContainer.seriesLabels;
        _tryRenderChart();
    }
});

watch(() => props.highlightedIndexes, async () => {
    if (_chart) {
        updateDatasetData();
    }
});

onMounted(() => {
    _tryRenderChart();
});

function getDisplayValue(value: string | number, axis: "x" | "y"): string{
    var mode = axis == "x" ? props.dataContainer!.axisInputsX.mode : props.dataContainer!.axisInputsY.mode;
    if (mode == "maxDrawdown"){
        return Math.round((value as number) * 1000) / 10 + "%";
    } else {
        var dec = Math.pow(2, value as number) - 1
        return Math.round(dec * 1000) / 10 + "%";
    }
}

function clickHandler(event: MouseEvent) {
    var clickedPoints = _chart!.getElementsAtEventForMode(event, "nearest", { intersect: true }, true);
    if (clickedPoints.length) {
        if (event.ctrlKey){
            clickedPoints.forEach(z => {
                var point = _points[z.datasetIndex][z.index];
                selectedPointWeights.push(point.weights);
            });
        } else {
            selectedPointWeights = clickedPoints.map(z => {
                var point = _points[z.datasetIndex][z.index];
                return point.weights;
            });
        }
        emits('point-clicked', selectedPointWeights);
        updateDatasetData();
    } else {
        if (selectedPointWeights.length && !event.ctrlKey) {
            selectedPointWeights = [];
            emits('point-clicked', null);
            updateDatasetData();
        }
    }

}

type ChartPoint = {
    x: number, y: number
}

function updateDatasetData(){
    var datasetsData = getDatasetsData();
    _chart!.data.datasets[0].data = datasetsData.selected;
    _chart!.data.datasets[1].data = datasetsData.highlighted;
    _chart!.data.datasets[2].data = datasetsData.main;
    _chart!.update();
}

function getMatchIndexOf(selectedPointWeights: number[][], weights: number[]): number{
    if (!selectedPointWeights.length){
        return -1;
    }
    for (var i = 0; i < selectedPointWeights.length; i++){
        var match = true;
        for (var j = 0; j < weights.length; j++){
            if (selectedPointWeights[i][j] != weights[j]){
                match = false;
                break;
            }
        }
        if (match){
            return i;
        }
    }
    return -1;
}

function getDatasetsData(): {main: ChartPoint[], highlighted: ChartPoint[], selected: ChartPoint[]}{
    var main: ChartPoint[] = [];
    var highlighted: ChartPoint[] = [];
    var selected: ChartPoint[] = [];
    _points = [[],[],[]];
    var remainingSelectedPointWeights = [...selectedPointWeights]
    for (var i = 0; i < props.dataContainer!.points.length; i++){
        var point = toRaw(props.dataContainer!.points[i]);
        var selectedIndex = getMatchIndexOf(remainingSelectedPointWeights, point.weights)
        if (selectedIndex >= 0){
            selected.push({x: point.x, y: point.y});
            _points[0].push(point);
            remainingSelectedPointWeights.splice(selectedIndex, 1)
        } else if (props.highlightedIndexes.includes(i)){
            highlighted.push({x: point.x, y: point.y});
            _points[1].push(point);
        } else {
            main.push({x: point.x, y: point.y});
            _points[2].push(point);
        }
    }
    return {
        main,
        highlighted,
        selected
    }
}

function _tryRenderChart() {
    if (!props.dataContainer) {
        return;
    }
    if (_chart) {
        _chart.destroy();
    }
    const ctx: HTMLCanvasElement = <any>document.getElementById("test-canvas");
    ctx.onclick = clickHandler;
    var datasetsData = getDatasetsData();
    console.log("datasetsData", datasetsData)
    _chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: "selected",
                    data: datasetsData.selected,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    backgroundColor: "#00bb4f",
                },
                {
                    label: "highlighted",
                    data: datasetsData.highlighted,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    backgroundColor: "#c7c100BB"
                },
                {
                    label: "main",
                    data: datasetsData.main,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    backgroundColor: "#0077fdBB"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            scales: {
                x: {
                    ticks: {
                        callback: function (value) {
                            return getDisplayValue(value, "x");
                        }
                    },
                },
                y: {
                    ticks: {
                        callback: function (value) {
                            return getDisplayValue(value, "y");
                        }
                    },
                }
            },
            plugins: {
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                            modifierKey: "ctrl"
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy',
                    },
                    limits: {
                        x: {min: 'original', max: 'original'},
                        y: {min: 'original', max: 'original'}
                    }
                },
                filler: {
                    propagate: false
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            var label = "";
                            var weights = _points[context.datasetIndex][context.dataIndex].weights;
                            var series = props.dataContainer!.seriesLabels;
                            for (var i = 0; i < props.dataContainer!.seriesLabels.length; i++){
                                if (weights[i] > 0){
                                    label += series[i] + ": " + weights[i] + ", ";
                                }
                            }
                            label = label.substring(0, label.length - 2);
                            props.dataContainer?.seriesLabels
                            return [
                                "X: " + getDisplayValue(context.parsed.x, "x"), 
                                "Y: " + getDisplayValue(context.parsed.y, "y"),
                                label
                            ];
                        }
                    }
                }
            }
        }
    });
}

</script>

<template>
    <canvas id="test-canvas" role="img" style="width: 100%; height: 100%;"></canvas>
</template>

<style scoped></style>
