<script setup lang="ts">
import { Chart, ChartDataset, registerables } from 'chart.js';
import { onMounted, toRaw, watch } from 'vue'
import zoomPlugin from 'chartjs-plugin-zoom';
import { LineChartMode, LineData, LineDataContainer } from '../models/models';

Chart.register(zoomPlugin);
Chart.register(...registerables);

var props = defineProps<{ dataContainer: LineDataContainer | null }>();
var lineDatas: LineData[] = [];
var _chart: Chart<"line", number[], string> | null = null;
var renderedOnce = false;

watch(() => props.dataContainer, async () => {
    if (props.dataContainer) {
        _tryRenderChart();
    }
});

onMounted(() => {
    _tryRenderChart();
});


function _tryRenderChart() {
    if (!props.dataContainer) {
        return;
    }
    lineDatas = toRaw(props.dataContainer.LineDatas);
    var dateStrings = props.dataContainer.dayNumbers.map(z => new Date(z * 86400000).toISOString().split('T')[0]);
    var datasets: ChartDataset<"line", number[]>[] = [];
    var colors = [            
        '#ff5271', //red
        '#51a3ff', //blue
        '#50e991', //green
        '#9269ff', //purple
        '#ff9b3e', //orange
        '#0ac3c3', //turquoise
        '#ff81f4', //pink
        '#ffff35', //yellow
        ];
    var logModes: LineChartMode[] = ["logReturns", "logLosses"];
    var priceModes: LineChartMode[] = ["price", "maxDrawdown"];
    if (lineDatas.length > 1 && lineDatas.some(z => logModes.includes(z.type)) && lineDatas.some(z => z.type == "returns")){
        var lowestVal0 = Math.min(...lineDatas[0].data.flat().filter(x => x !== null) as number[]);
        var lowestVal1 =  Math.min(...lineDatas[1].data.flat().filter(x => x !== null) as number[]);
        if (logModes.includes(lineDatas[0].type)){
            //in this case, lineDatas[1] is return. We're gonna subtract the returns by 1 and multiple by a scalar to align it with the logs
            //I want to use only the negative logs & returns to determine the scalar. 
            var returnLowRange =  Math.abs(1 - lowestVal1);
            var logLowRange =  Math.abs(0 - lowestVal0);
            var scalar = logLowRange / returnLowRange;
            lineDatas[1].data = lineDatas[1].data.map(row => row.map(z => z != null ? (z - 1) * scalar : z));
        } else {
            //in this case, lineDatas[1] is log. We're gonna add 1 to the returns and multiple by a scalar to align it with the returns
            //I want to use only the negative logs & returns to determine the scalar. 
            var returnLowRange =  Math.abs(1 - lowestVal0);
            var logLowRange =  Math.abs(0 - lowestVal1);
            var scalar = returnLowRange / logLowRange;
            lineDatas[1].data = lineDatas[1].data.map(row => row.map(z => z != null ? ((z * scalar) + 1) : z));
        }
    }
    var yAxis2 = (priceModes.includes(lineDatas[0].type) != priceModes.includes(lineDatas[1].type)) ? "y2" : "y1";
    for (var lineData of lineDatas){
        var is2nd = lineData != lineDatas[0];
        for (var i = 0; i < props.dataContainer.seriesLabels.length; i++) {
            var label = props.dataContainer.seriesLabels[i];
            var color = colors[i % colors.length]
            datasets.push({
                label: label,
                data: <number[]>lineData.data[i],
                borderWidth: 2,
                pointRadius: 0,
                stack: i.toString(),
                yAxisID: !is2nd ? 'y1' : yAxis2,
                borderColor: color,
                backgroundColor: color + "11",
                fill: false,
                borderDash: is2nd ? [1,2] : undefined,
            })
        }
    }
    var secondScale: any = {};
    if (yAxis2 == "y2"){
        secondScale.y2 = {
            ticks: {
                callback: props.dataContainer.LineDatas[1].labelCallback
            },
            display: true,
            stacked: false,
            position: 'right',
            title: {
                display: true,
                text: props.dataContainer.LineDatas[1].yAxisTitle + " (dotted line)"
            },
            grid: {
                display: false
            }
        }
    }
    if (_chart) {
        _chart.destroy();
    }
    var datasetsData: any[] = [];
    if (!renderedOnce){
        //for the first render, remoce the data from the datasets. We'll add it later
        //this is needed for performance reasons, since the new Chart() construction blocks the main thread
        datasetsData = datasets.map(z => z.data);
        datasets.forEach(z => z.data = []);
    }
    _chart = new Chart("line-chart-canvas", {
        type: 'line',
        data: {
            labels: dateStrings,
            datasets: <any>datasets
        },
        options: {
            animation: {
                duration: 0
            },
            maintainAspectRatio: false,
            scales: {
                y1: {
                    ticks: {
                        callback: props.dataContainer.LineDatas[0].labelCallback
                    },
                    display: true,
                    stacked: false,
                    position: 'left',
                    title: {
                        display: true,
                        text: props.dataContainer.LineDatas[0].yAxisTitle + (yAxis2 == "y2" ? " (solid line)" : "")
                    },
                    grid: {
                        color: context => {
                            if (lineDatas[0].type == "returns" && context.tick.value == 1){
                                return '#000000';
                            } else if (logModes.includes(lineDatas[0].type) && context.tick.value == 0){
                                return '#000000';
                            }
                            return '#1A1A1A'
                        },
                    }
                },
                ...secondScale
            },
            interaction: {
                mode: 'index',
                intersect: false,
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
                        mode: 'x',
                    },
                    pan: {
                        enabled: true,
                        mode: 'x',
                    }
                },
                // filler: {
                //     propagate: false
                // },
                legend: {
                    labels: {
                        filter: legendItem => legendItem.datasetIndex! < props.dataContainer!.seriesLabels.length
                    },
                    onClick: (_, legendItem, legend) => {
                        var chart = legend.chart;
                        if (chart.isDatasetVisible(legendItem.datasetIndex!)) {
                            console.log("hiding ", legendItem.datasetIndex)
                            chart.hide(legendItem.datasetIndex!);
                            if (props.dataContainer!.LineDatas.length > 1){
                                console.log("and hiding ", legendItem.datasetIndex! + props.dataContainer!.seriesLabels.length)
                                chart.hide(legendItem.datasetIndex! + props.dataContainer!.seriesLabels.length);
                            }
                            console.log("datasets", chart.data.datasets);
                            legendItem.hidden = true;
                        } else {
                            chart.show(legendItem.datasetIndex!);
                            if (props.dataContainer!.LineDatas.length > 1){
                                chart.show(legendItem.datasetIndex! + props.dataContainer!.seriesLabels.length);
                            }
                            legendItem.hidden = false;
                        }
                    }
                },
                tooltip: {
                    filter: tooltipItem => {
                        if (tooltipItem.datasetIndex < props.dataContainer!.seriesLabels.length){
                            return true;
                        }
                        var datasetIndex = tooltipItem.datasetIndex - props.dataContainer!.seriesLabels.length
                        if (props.dataContainer!.LineDatas[0].data[datasetIndex][tooltipItem.dataIndex] == null 
                            && props.dataContainer!.LineDatas[1].data[datasetIndex][tooltipItem.dataIndex] != null){
                            return true;
                        }
                        return false;
                    },
                    callbacks: {
                        label: tooltipItem => {
                            var datasetIndex = tooltipItem.datasetIndex;
                            if (tooltipItem.datasetIndex >= props.dataContainer!.seriesLabels.length){
                                datasetIndex = tooltipItem.datasetIndex - props.dataContainer!.seriesLabels.length;
                            }
                            var label = props.dataContainer!.seriesLabels[datasetIndex];
                            if (props.dataContainer!.LineDatas.length > 1){
                                var data1 =  props.dataContainer!.LineDatas[0].data[datasetIndex][tooltipItem.dataIndex];
                                var data2 =  props.dataContainer!.LineDatas[1].data[datasetIndex][tooltipItem.dataIndex];
                                return label + ": " + props.dataContainer!.LineDatas[0].labelCallback(data1) 
                                    + "  |  " + props.dataContainer!.LineDatas[1].labelCallback(data2)
                            }
                            return label + ": " + props.dataContainer!.LineDatas[0]!.labelCallback(tooltipItem.parsed.y);
                        }
                    }
                }
            }
        }
    })
    if (!renderedOnce){
        //since we removed the data from the datasets, we need to re-add it
        renderedOnce = true;
        setTimeout(() => {
            for (var i = 0; i < _chart!.data.datasets.length; i++){
                _chart!.data.datasets[i].data = datasetsData[i];
            }
            _chart?.update();
        })
    }
}

</script>

<template>
    <canvas id="line-chart-canvas" role="img" style="width: 100%; height: 100%;"></canvas>
</template>

<style scoped></style>
