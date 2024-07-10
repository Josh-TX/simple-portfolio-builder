import { Reactive, reactive, watch } from "vue";
import { TickerInputs } from "../models/models";
import { localSettingsService } from "./localSettingsService";

export var tickerInputs: Reactive<TickerInputs> = reactive({
    tickers: (localSettingsService.getValue("tickers") || "VFIAX VGT AMZN"),
    returnDays: localSettingsService.getValue("returnDays") ?? 50,
    smoothDays: localSettingsService.getValue("smoothDays") ?? 50,
    filterDays: localSettingsService.getValue("filterDays") || "MWF",
    syncDays: localSettingsService.getValue("syncDays") ?? true
});

watch(() => tickerInputs.returnDays, () => {
    if (tickerInputs.syncDays){
        tickerInputs.smoothDays = tickerInputs.returnDays;
    }
    localSettingsService.setValue("returnDays", tickerInputs.returnDays);
});
watch(() => tickerInputs.smoothDays, () => {
    if (tickerInputs.syncDays){
        tickerInputs.returnDays = tickerInputs.smoothDays;
    }
    localSettingsService.setValue("smoothDays", tickerInputs.smoothDays);
});
watch(() => tickerInputs.syncDays, () => {
    if (tickerInputs.syncDays){
        tickerInputs.smoothDays = tickerInputs.returnDays;
    }
    localSettingsService.setValue("syncDays", tickerInputs.syncDays);
});
watch(() => tickerInputs.filterDays, () => {
    localSettingsService.setValue("filterDays", tickerInputs.filterDays);
});
watch(() => tickerInputs.tickers, () => {
    localSettingsService.setValue("tickers", tickerInputs.tickers);
});