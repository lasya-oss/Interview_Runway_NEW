# Monotonic Stack: Pattern recognition and reusable templates

## Opening

This lesson builds an interview-ready mental model for Monotonic Stack, with emphasis on recognition and reusable template. The goal is not to memorize a code shape. The goal is to recognize when the pattern is justified, name the invariant before implementation, and explain why every pointer, state update, or recursive step preserves correctness. The core mental model is simple: Keep unresolved candidates in monotonic order; a new value resolves every dominated candidate once. During an interview, say the model out loud before touching the editor. That gives the interviewer a testable plan and gives you a reference point when edge cases appear.

## Recognition cues

Strong cues include next greater or smaller, span, histogram area, and nearest boundary. These phrases are evidence, not proof. Translate the prompt into three questions: what part of the input is active, what summary changes incrementally, and what decision lets you discard work permanently? If those answers line up with this pattern, proceed. If the prompt requires arbitrary reordering, nonlocal updates, or a guarantee the pattern cannot provide, choose another tool. A disciplined candidate explains both why a pattern fits and what would make it fail.

## State and invariant

Write the invariant in one sentence: Stack indices remain monotonic by value and each stored index is still waiting for its resolving boundary. Treat that sentence as a contract. Before the loop or recursion begins, show why it is true. For every update, explain why it remains true. At termination, connect it directly to the returned answer. This structure turns code narration into a short correctness proof. It also exposes common bugs early: if a variable cannot be connected to the invariant, it may be unnecessary or updated at the wrong time.

## Implementation plan

Use this sequence: store indices, choose strict or non-strict comparison, resolve during pops, and flush with a sentinel when necessary. Start with the clearest correct implementation, then discuss optimization. Name boundary conventions explicitly. If duplicates, empty inputs, or invalid parameters change behavior, decide that behavior before coding. Keep the implementation vocabulary aligned with your explanation: names such as left, right, distance, parent, count, or best should describe their role, not their type. This makes the dry run and test discussion much faster.

## Worked reasoning

Use this representative example: For next greater element, pop smaller values when a larger value arrives and assign the current index as their answer. Before calculating, predict what the state should mean after the first meaningful step. Then trace at least one normal transition, one boundary transition, and one transition that changes the best answer. Do not narrate every assignment. Narrate the decisions that rule out alternatives. In a live interview, a small table with input position, active state, and current answer is usually enough to make the reasoning visible.

## Complexity

The target analysis is: O(n) time because each index is pushed and popped at most once; O(n) space. Explain the bound by counting operations, not by pointing at the visual nesting of loops. A nested loop can still be linear when a pointer moves only forward across the entire execution. Conversely, a short implementation can hide expensive copies, slicing, sorting, or repeated hashing. State time, auxiliary space, output space when relevant, and the assumptions behind the bound.

## Failure modes

The most common mistakes are wrong equality rule, storing values without positions, missing final flush, and confusing previous and next boundaries. Test each one deliberately. Use an empty input, a single item, all-equal values, no valid answer, an answer at the first or last position, and the smallest input that forces the main state transition. For numeric problems, add zero, negative values, and overflow-sized totals when the prompt permits them. A good final check is to restate the invariant and verify every mutation preserves it.

## Interview talk track

A concise talk track is: I see Monotonic Stack because the prompt contains the relevant structural cues. My state will represent the active portion of the input, and my invariant is the contract I just stated. I will update one boundary or decision at a time, restore validity when necessary, and record the answer only when the invariant guarantees it is meaningful. The resulting complexity follows from the bounded number of state transitions. I will dry-run a boundary case before I call the solution complete.

## Practice plan

Practice in three passes. First, classify six prompts without coding and write only the state and invariant. Second, implement two canonical problems from a blank editor while speaking the proof. Third, take one near-miss problem where this pattern looks tempting but is wrong, and explain the disqualifying condition. Revisit the set after forty-eight hours. A pattern counts as learned only when you can identify it, reject it when inappropriate, implement it, test it, and explain its complexity without notes. Finish by writing one new edge case and predicting the result before running code; that prediction is evidence that the mental model, not the syntax, is doing the work.

