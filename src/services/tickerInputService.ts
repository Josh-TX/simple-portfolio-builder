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

watch(() => tickerInputs.tickers, () => {
    localSettingsService.setValue("tickers", tickerInputs.tickers);
});