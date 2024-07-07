import { NullableColumn, DayPrice, Column } from "../models/models";

export function getTimestamps(dayPricess: DayPrice[][], filterDays: string | null): number[] {
    const timestampsSet = new Set<number>();
    for (var darPrices of dayPricess) {
        for (const dayPrice of darPrices) {
            timestampsSet.add(dayPrice.timestamp);
        }
    }
    var timestamps = Array.from(timestampsSet);
    if (filterDays && filterDays.length < 5){
        if (filterDays == "MWF"){
            var filterDayInts = [1,3,5];
        }
        else if (filterDays == "F"){
            var filterDayInts = [5];
        } else {
            throw "unknown filterDays code";
        }
        timestamps = timestamps.filter(timestamp => {
            var daysSinceEpoch = Math.floor(timestamp / 86400); 
            var dayOfWeek = (daysSinceEpoch + 4) % 7;//epoch was on thurday (4);
            return filterDayInts.includes(dayOfWeek);
        });
    }
    timestamps.sort((z1, z2) => z1 - z2);
    return timestamps;
}

export function getPriceColumns(timestamps: number[], dayPricess: DayPrice[][]): NullableColumn[]{
    var columns: NullableColumn[] = [];
    var timestampToPriceMaps = dayPricess.map(dayPrices => {
        var map: { [key: number]: number } = {};
        dayPrices.forEach(dayPrice => map[dayPrice.timestamp] = dayPrice.price);
        return map;
    });
    for(var timestamp of timestamps){
        var column: NullableColumn = [];
        for (var i = 0; i < dayPricess.length; i++){
            var foundPrice = timestampToPriceMaps[i][timestamp];
            column.push(foundPrice != null ? foundPrice : null);
        }
        columns.push(column);
    }
    return columns;
}

export function getNonNullPriceColumns(timestamps: number[], priceColumns: NullableColumn[]): [number[], Column[]]{
    var validTimestamps: number[] = [];
    var validPriceColumns: Column[] = [];
    for (var i = 0; i < priceColumns.length; i++){
        if (priceColumns[i].every(z => z != null)){
            validPriceColumns.push(<number[]>priceColumns[i]);
            validTimestamps.push(timestamps[i]);
        }
    }
    return [validTimestamps, validPriceColumns];
}

export function getAFRs<T extends number[] | (number | null)[]>(timestamps: number[], prices: T, returnDays: number): T{
    if (timestamps.length != prices.length){
        throw "timestamps doesn't match priceColumns (getAFRs)";
    }
    var returnSeconds = returnDays * 86400;
    var exponent = 365.25 / returnDays;
    var lastIndex = timestamps.length - 1;
    var afrs: (number | null)[] = [];
    //I'll iterate backwards to make the logic easier. 
    for (var i = timestamps.length - 1; i >= 0; i--){
        if (prices[i] == null){
            afrs.push(null);
            continue;
        }
        var startTime = timestamps[i] - returnSeconds;
        while (lastIndex >= 0 && timestamps[lastIndex] > startTime){
            lastIndex--;
        }
        if (lastIndex < 0 || prices[lastIndex] == null){
            while (i > 0){
                afrs.push(null);
                i--;
            }
            break;
        }
        //linearly interpolate the startPrice based on the 2 prices before & after startTime. 
        var startPrice = prices[lastIndex]! + (prices[lastIndex+1]! - prices[lastIndex]!) * (startTime - timestamps[lastIndex]) / (timestamps[lastIndex+1] - timestamps[lastIndex]);
        var afr = (prices[i]! / startPrice) ** exponent
        afrs.push(afr);
    }
    afrs.reverse(); //needed since we iterated backwards
    return afrs as T;
}

export function getSmoothedLogAFRs<T extends number[] | (number | null)[]>(timestamps: number[], logAFRs: T, smoothDays: number): T{
    if (timestamps.length != logAFRs.length){
        throw "timestamps doesn't match priceColumns";
    }
    var totalDays = Math.round((timestamps[timestamps.length - 1] - timestamps[0]) / 86400);
    var daysPerItem = totalDays / timestamps.length;
    var itemsToAverage = smoothDays / daysPerItem;
    console.log(totalDays, daysPerItem, itemsToAverage);
    var firstIndex = 0;
    for (var i = 0; i < logAFRs.length; i++){
        if (logAFRs[i] == null){
            firstIndex++;
        }
    }

    var upperIndex = 1 + Math.floor(itemsToAverage / 2);
    var lowerIndex = -upperIndex;
    upperIndex += firstIndex;
    lowerIndex += firstIndex;
    var count = 0;
    var sum = 0;
    for (var i = firstIndex; i <= upperIndex && i < logAFRs.length && logAFRs[i] != null; i++){
        sum += logAFRs[i]!;
        count++;
    }
    var output: (number | null)[] = [];
    for (var i = 0; i < logAFRs.length; i++){
        if (logAFRs[i] == null){
            output.push(null);
            continue;
        }
        output.push(sum/count); //I'm assuming there's at least 1 non-null value
        if (lowerIndex >= firstIndex){
            sum -= logAFRs[lowerIndex]!;
            count--;
        }
        lowerIndex++;
        upperIndex++;
        if (upperIndex < logAFRs.length && logAFRs[upperIndex] != null){
            sum += logAFRs[upperIndex]!;
            count++;
        }
    }
    return output as T;
}