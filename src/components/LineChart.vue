<script setup lang="ts">
import { Chart, ChartDataset, registerables } from 'chart.js';
import { onMounted, watch } from 'vue'
import zoomPlugin from 'chartjs-plugin-zoom';
import { LineData, LineDataContainer } from '../models/models';

Chart.register(zoomPlugin);
Chart.register(...registerables);

var props = defineProps<{ dataContainer: LineDataContainer | null }>();
var lineDatas: LineData[] = [];
var _chart: Chart<"line", number[], string> | null = null;

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
    lineDatas =  props.dataContainer.LineDatas.map(z => ({...z}));
    var timestampStrings = props.dataContainer.timestamps.map(z => new Date(z * 1000).toISOString().split('T')[0]);
    var datasets: ChartDataset<any, number[]>[] = [];
    var colors = [            
        '#ff5271', //red
        '#51a3ff', //blue
        '#50e991', //green
        '#9269ff', //purple
        '#ff9b3e', //orange
        '#0ac3c3', //turquoise
        '#ff81f4', //pink
        '#ffff35', //yellow
        ]
    if (lineDatas.length > 1 && lineDatas.some(z => z.type == "log") && lineDatas.some(z => z.type == "return")){
        var lowestVal0 = Math.min(...lineDatas[0].data.flat().filter(x => x !== null));
        var lowestVal1 =  Math.min(...lineDatas[1].data.flat().filter(x => x !== null));
        if (lineDatas[0].type == "log"){
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
            console.log(lowestVal0, lowestVal1, returnLowRange, logLowRange, "scalar", scalar)
            lineDatas[1].data = lineDatas[1].data.map(row => row.map(z => z != null ? ((z * scalar) + 1) : z));
            console.log("newLowestRange", Math.min(...lineDatas[1].data.flat().filter(x => x !== null)));
        }
    }
    for (var lineData of lineDatas){
        var is2nd = lineData != lineDatas[0];
        for (var i = 0; i < props.dataContainer.seriesLabels.length; i++) {
            datasets.push({
                label: props.dataContainer.seriesLabels[i],
                data: lineData.data[i],
                borderWidth: 1,
                pointRadius: 0,
                yAxisID: 'y',
                borderColor: colors[i % colors.length],
                backgroundColor: colors[i % colors.length],
                borderDash: is2nd ? [1,2] : undefined,
            })
        }
    }
    console.log("datasets", datasets);
    if (_chart) {
        _chart.destroy();
    }
    _chart = new Chart("line-chart-canvas", {
        type: 'line',
        data: {
            labels: timestampStrings,
            datasets: datasets
        },
        options: {
            animation: {
                duration: 0
            },
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: {
                        // callback: function(value) {
                        //     var dec = Math.pow(2, value as number) - 1
                        //     return Math.round(dec * 1000) / 10 + "%";
                        // }
                    },
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: props.dataContainer.LineDatas[0].yAxisTitle + " (solid line)"
                    }
                }
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
                        console.log("onClick")
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
                    filter: tooltipItem => tooltipItem.datasetIndex < props.dataContainer!.seriesLabels.length,
                    callbacks: {
                        label: tooltipItem => {
                            var label = props.dataContainer!.seriesLabels[tooltipItem.datasetIndex];
                            if (props.dataContainer!.LineDatas.length > 1){
                                //var data2 =  _chart!.data.datasets[tooltipItem.datasetIndex + props.dataContainer!.seriesLabels.length].data[tooltipItem.dataIndex];
                                var data2 =  props.dataContainer!.LineDatas[1].data[tooltipItem.datasetIndex ][tooltipItem.dataIndex];
                                //console.log("data2", typeof data2)
                                return label + ": " + props.dataContainer!.LineDatas[0].labelCallback(tooltipItem.parsed.y) 
                                    + "  |  " + props.dataContainer!.LineDatas[1].labelCallback(data2)
                            }
                            return label + ": " + props.dataContainer!.LineDatas[0]!.labelCallback(tooltipItem.parsed.y);
                        }
                    }
                }
            }
        }
    })
}

</script>

<template>
    <canvas id="line-chart-canvas" role="img" style="width: 100%; height: 100%;"></canvas>
</template>

<style scoped></style>
