# Intervals: Worked interview problem

## Opening

This lesson builds an interview-ready mental model for Intervals, with emphasis on worked interview problem. The goal is not to memorize a code shape. The goal is to recognize when the pattern is justified, name the invariant before implementation, and explain why every pointer, state update, or recursive step preserves correctness. The core mental model is simple: Sort ranges by a boundary, then reason about overlap using the last accepted or currently merged interval. During an interview, say the model out loud before touching the editor. That gives the interviewer a testable plan and gives you a reference point when edge cases appear.

## Recognition cues

Strong cues include merge or insert ranges, meeting conflicts, coverage, and minimum rooms or removals. These phrases are evidence, not proof. Translate the prompt into three questions: what part of the input is active, what summary changes incrementally, and what decision lets you discard work permanently? If those answers line up with this pattern, proceed. If the prompt requires arbitrary reordering, nonlocal updates, or a guarantee the pattern cannot provide, choose another tool. A disciplined candidate explains both why a pattern fits and what would make it fail.

## State and invariant

Write the invariant in one sentence: Processed intervals are represented by a correct non-overlapping summary, and only the last summary interval can overlap the next sorted one. Treat that sentence as a contract. Before the loop or recursion begins, show why it is true. For every update, explain why it remains true. At termination, connect it directly to the returned answer. This structure turns code narration into a short correctness proof. It also exposes common bugs early: if a variable cannot be connected to the invariant, it may be unnecessary or updated at the wrong time.

## Implementation plan

Use this sequence: define inclusive versus half-open boundaries, choose sort key, compare next start with active end, merge or finalize, and handle touching intervals deliberately. Start with the clearest correct implementation, then discuss optimization. Name boundary conventions explicitly. If duplicates, empty inputs, or invalid parameters change behavior, decide that behavior before coding. Keep the implementation vocabulary aligned with your explanation: names such as left, right, distance, parent, count, or best should describe their role, not their type. This makes the dry run and test discussion much faster.

## Worked reasoning

Use this representative example: When merging, if next.start <= current.end, extend current.end; otherwise emit current and start a new range. Before calculating, predict what the state should mean after the first meaningful step. Then trace at least one normal transition, one boundary transition, and one transition that changes the best answer. Do not narrate every assignment. Narrate the decisions that rule out alternatives. In a live interview, a small table with input position, active state, and current answer is usually enough to make the reasoning visible.

## Complexity

The target analysis is: O(n log n) for sorting and O(n) for scanning; output may require O(n) space. Explain the bound by counting operations, not by pointing at the visual nesting of loops. A nested loop can still be linear when a pointer moves only forward across the entire execution. Conversely, a short implementation can hide expensive copies, slicing, sorting, or repeated hashing. State time, auxiliary space, output space when relevant, and the assumptions behind the bound.

## Failure modes

The most common mistakes are wrong overlap inequality, sorting by the wrong endpoint, mutating caller data unexpectedly, and confusing room-count and merge logic. Test each one deliberately. Use an empty input, a single item, all-equal values, no valid answer, an answer at the first or last position, and the smallest input that forces the main state transition. For numeric problems, add zero, negative values, and overflow-sized totals when the prompt permits them. A good final check is to restate the invariant and verify every mutation preserves it.

## Interview talk track

A concise talk track is: I see Intervals because the prompt contains the relevant structural cues. My state will represent the active portion of the input, and my invariant is the contract I just stated. I will update one boundary or decision at a time, restore validity when necessary, and record the answer only when the invariant guarantees it is meaningful. The resulting complexity follows from the bounded number of state transitions. I will dry-run a boundary case before I call the solution complete.

## Practice plan

Practice in three passes. First, classify six prompts without coding and write only the state and invariant. Second, implement two canonical problems from a blank editor while speaking the proof. Third, take one near-miss problem where this pattern looks tempting but is wrong, and explain the disqualifying condition. Revisit the set after forty-eight hours. A pattern counts as learned only when you can identify it, reject it when inappropriate, implement it, test it, and explain its complexity without notes. Finish by writing one new edge case and predicting the result before running code; that prediction is evidence that the mental model, not the syntax, is doing the work.

