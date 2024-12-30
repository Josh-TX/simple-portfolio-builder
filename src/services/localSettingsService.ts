import { DayVal, LineChartDataInputs, ScatterplotAxisInputs } from "../models/models";
import LZString from 'lz-string';

export type LocalSettings = { 
    returnDays?: number | undefined,
    smoothDays?: number | undefined,
    syncDays?: boolean | undefined,
    tickers?: string | undefined,
    filterDays?: string | undefined,
    segmentCount?: number | undefined
    filterExpr?: string | undefined
    highlightExpr?: string | undefined
    lineChartInputs1?: LineChartDataInputs | undefined
    lineChartInputs2?: LineChartDataInputs | undefined
    scatterplotAxisInputsX?: ScatterplotAxisInputs | undefined
    scatterplotAxisInputsY?: ScatterplotAxisInputs | undefined
}


type tickerRecord = { 
    ticker: string,
    insertTime: number,
    size: number
}
type CachedData = {
    insertTime: number,
    compressedData: string
}

var MAXCACHEHOURS = 48;
var MAXCACHESIZE = 3000000;


class LocalSettingsService {
    private localSettings: LocalSettings;
    private tickerRecords: tickerRecord[]; 

    constructor() { 
        var storedStr = localStorage["local-settings"];
        if (storedStr){
            this.localSettings = JSON.parse(storedStr);
        } else {
            this.localSettings = {};
        }

        var storedTickerRecords = localStorage["ticker-records"];
        if (storedTickerRecords){
            this.tickerRecords = JSON.parse(storedTickerRecords);
            this.cleanCache();
        } else {
            this.tickerRecords = [];
        }
    }
    setValue<K extends keyof LocalSettings>(key: K, val: LocalSettings[K]){
        this.localSettings[key] = val;
        localStorage["local-settings"] = JSON.stringify(this.localSettings);
    } 

    getValue<K extends keyof LocalSettings>(key: K): LocalSettings[K]{
        return this.localSettings[key]
    }

    setDayPrices(ticker: string, dayPrices: DayVal[]){
        var arr = dayPrices.map(z => ([z.dayNumber, z.val]));
        var compressed = LZString.compress(JSON.stringify(arr));
        var cachedData: CachedData = {
            insertTime: Math.round(new Date().getTime() / 1000),
            compressedData: compressed
        };
        try {
            localStorage[ticker] = JSON.stringify(cachedData);
            this.tickerRecords = this.tickerRecords.filter(z => z.ticker != ticker);
            this.tickerRecords.push({ticker: ticker, insertTime: cachedData.insertTime, size: compressed.length});
            localStorage["ticker-catalog"] = JSON.stringify(this.tickerRecords);
            this.cleanCache();
        } catch (e){

        }
    }

    getDayPrices(ticker: string): DayVal[] | null{
        var json = localStorage[ticker];
        if (!json){
            return null;
        }
        var cachedData: CachedData = JSON.parse(json);
        var msDiff = (new Date().getTime() / 1000) - cachedData.insertTime;
        var hourDiff = msDiff / (1000 * 60 * 60);
        if (hourDiff > MAXCACHEHOURS) {
            return null;
        }
        var arr: [number, number][] = JSON.parse(LZString.decompress(cachedData.compressedData));
        var dayPrices: DayVal[] = arr.map(z => ({
            dayNumber: z[0],
            val: z[1]
        }));
        return dayPrices;
    }

    private cleanCache(){
        var tickerRecordsToRemove: string[] = [];
        this.tickerRecords.sort((z1, z2) => z1.insertTime - z2.insertTime);
        var sumSize = 0;
        for(var tickerRecord of this.tickerRecords){
            var msDiff = (new Date().getTime() / 1000) - tickerRecord.insertTime;
            var hourDiff = msDiff / (1000 * 60 * 60);
            if (hourDiff > MAXCACHEHOURS || sumSize + tickerRecord.size > MAXCACHESIZE){
                tickerRecordsToRemove.push(tickerRecord.ticker);
                delete localStorage[tickerRecord.ticker];
            }
            sumSize += tickerRecord.size;
        }
        this.tickerRecords = this.tickerRecords.filter(z => !tickerRecordsToRemove.includes(z.ticker));
    }
}

export var localSettingsService = new LocalSettingsService();