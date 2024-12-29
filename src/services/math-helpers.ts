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