import { DayPrice } from "../models/models";
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
}


type tickerRecord = { 
    ticker: string,
    insertTime: number
}
type CachedData = {
    insertTime: number,
    compressedData: string
}

var MAXCACHEHOURS = 48;


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
            var tickersToRemove: string[] = [];
            for(var tickerRecord of this.tickerRecords){
                var msDiff = (new Date().getTime() / 1000) - tickerRecord.insertTime;
                var hourDiff = msDiff / (1000 & 60 * 60);
                if (hourDiff > MAXCACHEHOURS){
                    tickersToRemove.push(tickerRecord.ticker);
                    delete localStorage[tickerRecord.ticker];
                }
            }
            this.tickerRecords = this.tickerRecords.filter(z => !tickersToRemove.includes(z.ticker));

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

    setDayPrices(ticker: string, dayPrices: DayPrice[]){
        var arr = dayPrices.map(z => ([z.timestamp, z.price]));
        var compressed = LZString.compress(JSON.stringify(arr));
        var cachedData: CachedData = {
            insertTime: Math.round(new Date().getTime() / 1000),
            compressedData: compressed
        };
        try {
            localStorage[ticker] = JSON.stringify(cachedData);
            this.tickerRecords = this.tickerRecords.filter(z => z.ticker != ticker);
            this.tickerRecords.push({ticker: ticker, insertTime: cachedData.insertTime});
            localStorage["ticker-catalog"] = JSON.stringify(this.tickerRecords);
        } catch (e){

        }
    }

    getDayPrices(ticker: string): DayPrice[] | null{
        var json = localStorage[ticker];
        if (!json){
            return null;
        }
        var cachedData: CachedData = JSON.parse(json);
        var msDiff = (new Date().getTime() / 1000)  - cachedData.insertTime;
        var hourDiff = msDiff / (1000 & 60 * 60);
        if (hourDiff > MAXCACHEHOURS) {
            return null;
        }
        var arr: [number, number][] = JSON.parse(LZString.decompress(cachedData.compressedData));
        var dayPrices: DayPrice[] = arr.map(z => ({
            timestamp: z[0],
            price: z[1]
        }));
        return dayPrices;
    }
}

export var localSettingsService = new LocalSettingsService();