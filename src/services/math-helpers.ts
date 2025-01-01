export function getSum(nums: number[]): number{
    return nums.reduce((a, b) => a + b, 0);
}

export function getProduct(nums: number[]): number{
    return nums.reduce((a, b) => a * b, 1)
}

export function getSD(nums: number[], sum?: number | undefined): number | undefined {
    if (!nums.length){
        return undefined;
    }
    var mean = (sum == null ? getSum(nums) : sum) / nums.length
    return Math.sqrt(nums.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / nums.length)
}

export function getRMS(nums: number[]): number | undefined {
    if (!nums.length){
        return undefined;
    }
    var sumOfSquares = nums.reduce((a, b) => a + b*b, 0);
    return Math.sqrt(sumOfSquares / nums.length);
}

function factorial(n: number) {
    if (n === 0 || n === 1) {
        return 1;
    }
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function binomialCoefficient(n: number, k: number) {
    return factorial(n) / (factorial(k) * factorial(n - k));
}

export function combinations(N: number, M: number) {
    return binomialCoefficient(N + M - 1, M - 1);
}

/**Useful for testing worker-pool performance. Should remove before final release */
export function doWork(ms: number){
    var num = 0;
    for (var i = 0; i < 38000 * ms; i++){
        num += Math.sin(i) + Math.cos(i);
    }
    if (num > 2){
        return;
    }
}