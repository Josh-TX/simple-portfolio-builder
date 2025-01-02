import { FundData } from "../models/models";
import { pricesDB } from "./db";
import { moneyMarketPrices } from "./moneyMarketPrices";

var pricesMap: {[ticker: string]: FundData} = {}

export async function getPriceHistory(ticker: string): Promise<FundData> {
    if (pricesMap[ticker]){
        return pricesMap[ticker];
    }
    if (ticker == "$"){
        return getMoneyMarket();
    }
    var cachedPrices = await pricesDB.tryGet(ticker);
    if (cachedPrices){
        return cachedPrices;
    }
    var loadedPrices = await loadPriceHistoryFromAPI(ticker);
    pricesDB.set(ticker, loadedPrices);
    pricesMap[ticker] = loadedPrices;
    return loadedPrices;
}


async function loadPriceHistoryFromAPI(ticker: string): Promise<FundData> {
    //proxy needed because yahoo finance has restrictive CORS headers
    //also, adding a &a=1 fixes some issues with the proxy (it was adding an = to the yahoo finanace request). 
    const proxiedUrl = getProxiedUrl(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=100y&interval=1d&a=1`)
    const httpResponse = await fetch(proxiedUrl);
    if (!httpResponse.ok) {
        throw new Error('Network response was not ok');
    }
    const response: YahooResponse = await httpResponse.json();
    var item = response.chart.result[0];
    var adjCloses = item.indicators.adjclose[0].adjclose;
    var timestamps = item.timestamp;
    var dayNumbers = timestamps.map(z => Math.floor(z / 86400));
    return convertToFundData(adjCloses, dayNumbers);
}

function convertToFundData(prices: number[], dayNumbers: number[]): FundData {
    if (prices.length != dayNumbers.length){
        throw "prices length must match dayNumbers length";
    }
    var len = dayNumbers[dayNumbers.length - 1] - dayNumbers[0];
    var values = new Float32Array(len);
    var valuesIndex = 0;
    for (var i = 0; i < dayNumbers.length - 1; i++) {
        values[valuesIndex++] = prices[i];
        var dayDiff = dayNumbers[i + 1] - dayNumbers[i];
        for (var j = 1; j < dayDiff; j++) {
            var interpolated = prices[i] + (prices[i + 1] - prices[i]) * (j / dayDiff);
            values[valuesIndex++] = interpolated;
        }
    }
    return {
        startDayNumber: dayNumbers[0],
        dataType: "price",
        values: values
    };
}

function getMoneyMarket(): FundData {
    var dayNumbers = moneyMarketPrices.map(z => z[0]);
    var prices = moneyMarketPrices.map(z => z[1]);
    return convertToFundData(prices, dayNumbers);
}

function getProxiedUrl(targetUrl: string){
    return 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);
}

type YahooResponse = {
    chart: {
        result: [YahooItem]
    }
}

type YahooItem = {
    timestamp: number[],
    indicators: {
        quote: any,
        adjclose: AdjClose[]
    }
}

type AdjClose = {
    adjclose: number[]
}