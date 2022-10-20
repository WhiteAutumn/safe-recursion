type Reference<T> = { value: T | undefined };
type AssertedReference<T> = { value: T };
type RecursiveExecution<T> = { invocation: Generator<undefined, T>, result: Reference<T> };

type PublicRecursiveFunction = (...args: any) => any;
type PrivateRecursiveFunction<T extends PublicRecursiveFunction> = (...args: Parameters<T>) => AssertedReference<ReturnType<T>>;
type RecursiveFunctionDefinition<T extends PublicRecursiveFunction> = (recurse: PrivateRecursiveFunction<T>, ...args: Parameters<T>) => Generator<undefined, ReturnType<T>>;

export default function recursive<T extends PublicRecursiveFunction>(func: RecursiveFunctionDefinition<T>): T {
	type Execution = RecursiveExecution<ReturnType<T>>;

	return <T> ((...args: unknown[]) => {
		const stack = <Execution[]> [];

		let hasUnexecutedInvocation = true;

		let nextInvocationArgs = <Parameters<T>> args;
		let nextInvocationResult = <Reference<ReturnType<T>>> { value: undefined };

		const recurse = <PrivateRecursiveFunction<T>> ((...args: unknown[]) => {
			if (hasUnexecutedInvocation) {
				throw new Error('Can not call recurse twice before yielding!');
			}

			hasUnexecutedInvocation = true;
			nextInvocationArgs = <Parameters<T>> args;
			nextInvocationResult = { value: undefined };

			return nextInvocationResult;
		});

		const invokeNext = () => {
			if (!hasUnexecutedInvocation) {
				throw new Error('Internal logic error! No next invocation found!');
			}

			const execution: Execution = {
				invocation: func(recurse, ...nextInvocationArgs),
				result: nextInvocationResult
			};

			hasUnexecutedInvocation = false;
			stack.push(execution);

			return execution;
		};

		let currentExecution: Execution | undefined;
		while (hasUnexecutedInvocation || stack.length !== 0) {
			currentExecution = stack[stack.length - 1];

			if (hasUnexecutedInvocation) {
				currentExecution = invokeNext();
			}

			const result = currentExecution.invocation.next();
			if (result.done) {
				currentExecution.result.value = result.value;
				stack.pop();
			}
		}

		if (currentExecution == null) {
			throw new Error('Internal logic error! No execution found!');
		}

		return currentExecution.result.value;
	});
}
