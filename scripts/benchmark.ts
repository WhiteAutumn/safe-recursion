/* eslint-disable prefer-const */
import recursive from '../src/recursive';

const unsafeFibonacci = (n: number): number => {
	if (n <= 1) {
		return n;
	}
	return unsafeFibonacci(n - 1) + unsafeFibonacci(n - 2);
};

const safeFibonacci = recursive<(n: number) => number>(function* (recurse, n) {
	if (n <= 1) {
		return n;
	}

	const a = recurse(n - 1); yield;
	const b = recurse(n - 2); yield;
  
	return a.value + b.value;
});

const target = 30;
let result1: number, result2: number;
let start: number, end: number;

start = Date.now();
result1 = unsafeFibonacci(target);
end = Date.now();

console.log(`Regular unsafe: ${end - start}ms`);

start = Date.now();
result2 = safeFibonacci(target);
end = Date.now();

console.log(`Safe: ${end - start}ms`);

if (result1 !== result2) {
	throw new Error('The results were not the same!');
}

