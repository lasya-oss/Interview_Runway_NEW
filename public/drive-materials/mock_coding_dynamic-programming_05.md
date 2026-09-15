---
id: mock_coding_dynamic-programming_05
status: audio_complete_video_pending
category: coding
round: live_coding
duration_target_minutes: 38
candidate: Nikhil Verma (fictional), Gurugram, 4 years, product engineer
interviewer: Marcus Lee (fictional), California, senior software engineer
candidate_voice_id: 9a4e0509-6a22-4a95-b202-3321aebb4d3f
interviewer_voice_id: 8b9ed861-3382-455d-9c03-a40671943d6b
simulation_disclosure: metadata_and_product_page_only
---

# Minimum-Cost Support Coverage

## Private scenario card

Nikhil is solving a composite problem for a fictional US remote engineering team. The round tests clarification, spoken reasoning, implementation discipline, boundary testing, and recovery from a realistic bug. The interviewer must not lead Nikhil to the algorithm before the baseline and invariant are stated.

## Dialogue

### Connection, introduction, and frame — approximately 00:00-03:00

**Marcus Lee — Interviewer:** Hi, Nikhil. Can you hear me clearly?

**Nikhil Verma — Candidate:** Hi, Marcus. Yes, I can hear you. Is my audio okay?

**Marcus Lee — Interviewer:** It is. There was a brief delay when you joined, but it seems stable now. If it changes, we'll pause rather than talk over the connection.

**Nikhil Verma — Candidate:** Sounds good. Thank you.

**Marcus Lee — Interviewer:** We have fifty minutes. We'll use most of it for one coding problem and a follow-up. Please clarify the prompt, talk through your reasoning, and write code in the shared editor. I'll interrupt if I need to time-box us.

**Nikhil Verma — Candidate:** Yes, that works for me.

**Marcus Lee — Interviewer:** Before we get into the main round, could you give me a brief description of yourself and what you've been working on recently?

**Nikhil Verma — Candidate:** I'm a product engineer with experience in support scheduling and entitlement services in Kotlin. My recent work has involved diagnosing state and performance problems under real operational constraints. I try to begin with the contract and smallest examples before selecting a data structure, and I use tests to make boundary assumptions visible rather than relying on an implementation that only works for the happy path.

**Marcus Lee — Interviewer:** What part of that project required the most careful problem solving from you personally?

**Nikhil Verma — Candidate:** In my current project on support scheduling and entitlement services in Kotlin, I owned the problem decomposition, the core implementation, and the boundary tests for one production change. A senior reviewer challenged the rollout and another engineer handled deployment. The careful part for me was making the state invariant explicit so debugging did not depend on reading every line after an incident.

### Prompt and clarification — approximately 03:00-07:00

**Marcus Lee — Interviewer:** Given sorted unique support-coverage days and pass options of 1, 7, and 30 days with corresponding costs, return the minimum cost that covers every required day. A pass bought on day d covers d through d plus duration minus one.

**Nikhil Verma — Candidate:** Should I treat the input as already validated, and what are the size constraints?

**Marcus Lee — Interviewer:** There can be up to fifty thousand required days over a multi-year integer timeline. Costs are positive. The list is sorted and has no duplicate days.

**Nikhil Verma — Candidate:** What should I return for an empty input or when there is no valid result?

**Marcus Lee — Interviewer:** Use the natural empty result for the type: zero length or an empty list. Do not throw for an ordinary no-result case.

**Nikhil Verma — Candidate:** May I use standard library collections and sorting where appropriate?

**Marcus Lee — Interviewer:** Yes. Choose the language you are comfortable with and state the operations you rely on.

**Nikhil Verma — Candidate:** Should the result be deterministic when several answers are equally valid?

**Marcus Lee — Interviewer:** Yes. Follow the tie rule in the prompt; where the prompt permits any valid result, say how your implementation behaves.

**Nikhil Verma — Candidate:** I'll restate it to make sure I have the contract. Given sorted unique support-coverage days and pass options of 1, 7, and 30 days with corresponding costs, return the minimum cost that covers every required day. A pass bought on day d covers d through d plus duration minus one. I will handle the empty case explicitly, preserve the stated tie behavior, and design for the provided upper bound rather than only the example.

**Marcus Lee — Interviewer:** Yes. That's the problem.

**Nikhil Verma — Candidate:** Let me walk a concrete case before coding. For days 1, 4, 6, 7, 8, 20 and costs 2, 7, 15, buying one-day passes except a seven-day pass around day 1 may be compared by the recurrence rather than guessed greedily. I would also test the boundary that is most likely to change the comparison or state update.

**Marcus Lee — Interviewer:** What does that example reveal about the state you need to preserve?

**Nikhil Verma — Candidate:** It shows that I need a dp array of length n plus one, filled from the end, and either binary search or three monotonic pointers to find each next index. More importantly, the update order must preserve this invariant: dp[i] is the minimum cost to cover required days from index i onward, and every transition buys exactly one pass starting on days[i] then moves to the first uncovered index. If I cannot state that before coding, it will be easy to fix one example while breaking another.

### Approach selection — approximately 07:00-13:00

**Marcus Lee — Interviewer:** How would you start?

**Nikhil Verma — Candidate:** A direct baseline would recursively try every pass at each uncovered day without memoization, creating three branches per state and repeated subproblems. It is useful as a correctness reference on small inputs, but it does not meet the upper bound. I would not implement it as the final answer unless the constraints were much smaller.

**Marcus Lee — Interviewer:** Can we do better under the stated constraints?

**Nikhil Verma — Candidate:** I would use one-dimensional dynamic programming over the index of the next uncovered required day; for each pass, advance to the first day outside its coverage and take cost plus the optimal suffix. The reason is not only the familiar pattern: it avoids repeating work while preserving enough state to decide the next update. I will keep the implementation close to the invariant and avoid clever compression until the tests pass.

**Marcus Lee — Interviewer:** What invariant will tell you the approach is still correct as the input changes?

**Nikhil Verma — Candidate:** Dp[i] is the minimum cost to cover required days from index i onward, and every transition buys exactly one pass starting on days[i] then moves to the first uncovered index. I will check it at the point where state changes, not only after the loop finishes.

**Marcus Lee — Interviewer:** What alternative did you reject, and what cost does your chosen structure introduce?

**Nikhil Verma — Candidate:** I rejected the baseline because it repeats work at the stated scale. My chosen state is a dp array of length n plus one, filled from the end, and either binary search or three monotonic pointers to find each next index, so the cost is additional memory and more careful update ordering. I accept that because it turns the dominant repeated work into bounded collection operations. If memory constraints were tighter, I would need a different contract or representation rather than pretend the state is free.

**Marcus Lee — Interviewer:** Okay. Please implement that. Keep explaining major state changes, but you don't need to narrate every character you type.

**Nikhil Verma — Candidate:** I'll take a moment to set up the function and the core state, then I'll walk through the update logic.

### Implementation and correction — approximately 13:00-24:00

**Marcus Lee — Interviewer:** Talk me through the function signature and result shape before the loop.

**Nikhil Verma — Candidate:** I'll use a function that accepts the exact input and returns the requested result without mutating caller-owned data unless the prompt permits it. I handle the empty case first, initialize a dp array of length n plus one, filled from the end, and either binary search or three monotonic pointers to find each next index, and keep best-result state separate from current working state. That separation prevents a later update from corrupting the answer already found.

**Marcus Lee — Interviewer:** What happens during one normal iteration?

**Nikhil Verma — Candidate:** I read the next logical item, update the working state, then restore validity using the rule implied by the invariant. Only after the state is valid do I compare it with the best result. The core approach is one-dimensional dynamic programming over the index of the next uncovered required day; for each pass, advance to the first day outside its coverage and take cost plus the optimal suffix; I will make each transition visible rather than fold it into one expression.

**Marcus Lee — Interviewer:** Why is that update order important?

**Nikhil Verma — Candidate:** If I record the answer before restoring the invariant, I can accept an invalid candidate. If I remove state too early, I can lose a valid optimum. The order follows the definition: dp[i] is the minimum cost to cover required days from index i onward, and every transition buys exactly one pass starting on days[i] then moves to the first uncovered index. I am adding a short comment about why, not a comment that merely repeats the code.

**Marcus Lee — Interviewer:** What collection operation are you assuming is efficient?

**Nikhil Verma — Candidate:** The main map, set, heap, queue, or sort operations have their standard expected costs in this language. I would avoid an operation that scans or shifts a linear container inside the main loop. If the language's queue removes from the front of an array in linear time, I would use an indexed head or a real deque.

**Marcus Lee — Interviewer:** Pause and inspect the boundary comparisons in what you wrote.

**Nikhil Verma — Candidate:** I see the main risk. The implementation currently treats a seven-day pass bought on day d as covering through d plus seven instead of d plus six, advancing one day too far. That may pass the central example but violates the stated boundary rule. I want to construct the smallest counterexample before I change it so the correction is evidence-driven.

**Marcus Lee — Interviewer:** Use that counterexample. What state changes?

**Nikhil Verma — Candidate:** On the counterexample, the current code leaves state that should have been updated or evicted. The correct action is to compute the exclusive coverage boundary as d plus duration and advance while day is strictly less than that boundary; add a test exactly on the boundary. I'll change that line and keep the counterexample as a named test rather than only testing it mentally.

**Marcus Lee — Interviewer:** Continue. How do you produce the result without disturbing correctness?

**Nikhil Verma — Candidate:** After the main processing finishes, I convert the maintained best state to the requested return format. If reconstruction is required, I do it iteratively where input depth could be large. I keep deterministic tie behavior in one comparison helper so it is not implemented differently in two places.

**Marcus Lee — Interviewer:** Do you need to handle malformed input?

**Nikhil Verma — Candidate:** The prompt says ordinary inputs satisfy the stated contract, so I won't spend interview time on a full validation layer. I will handle empty or no-result cases that are part of the domain. In production I would validate external input at the boundary and decide whether malformed data is rejected, quarantined, or logged; that is separate from the algorithm.

**Marcus Lee — Interviewer:** Read the code once from the invariant's perspective.

**Nikhil Verma — Candidate:** Initialization makes the invariant true for an empty prefix. Each iteration updates the new item, restores validity, and records the best state only afterward. The final result comes from state that was valid when recorded. The remaining uncertainty is the exact boundary in the correction, so the next tests should target that before broad random cases.

**Marcus Lee — Interviewer:** Before you type further, give me language-neutral pseudocode.

**Nikhil Verma — Candidate:** The pseudocode is: validate the ordinary empty case; initialize a dp array of length n plus one, filled from the end, and either binary search or three monotonic pointers to find each next index; iterate through the input in its required order; update the working state; restore or verify the invariant; compare the valid candidate with the best using the tie rule; and reconstruct or format the answer after processing. The problem-specific update is one-dimensional dynamic programming over the index of the next uncovered required day; for each pass, advance to the first day outside its coverage and take cost plus the optimal suffix. Writing this first makes it easier to see whether the code changes the order of two logically separate operations. For this problem, I would verify that reasoning specifically against the recurrence requirement.

**Marcus Lee — Interviewer:** Give me a short correctness argument, not only intuition.

**Nikhil Verma — Candidate:** For initialization, the working state represents the empty processed prefix, so the invariant holds. For maintenance, one iteration adds the next item and applies the exact correction needed to restore this invariant: dp[i] is the minimum cost to cover required days from index i onward, and every transition buys exactly one pass starting on days[i] then moves to the first uncovered index. We record an answer only while that invariant holds. At termination every input item has been considered, and any candidate that could beat the result was represented when its decisive boundary was processed. The tie comparison preserves the required deterministic choice. For this problem, I would verify that reasoning specifically against the one-dimensional DP requirement.

**Marcus Lee — Interviewer:** Trace the central example through the actual variables you wrote.

**Nikhil Verma — Candidate:** I start with the empty state and process the example one item at a time: For days 1, 4, 6, 7, 8, 20 and costs 2, 7, 15, buying one-day passes except a seven-day pass around day 1 may be compared by the recurrence rather than guessed greedily. At each point I would say the current state, whether the invariant is valid, and whether the best result changes. The important trace is the transition that removes, evicts, advances, or reconstructs state; that is where the first implementation was most likely to diverge from the algorithm I described. For this problem, I would verify that reasoning specifically against the base cases requirement.

**Marcus Lee — Interviewer:** How are you enforcing the tie rule in code?

**Nikhil Verma — Candidate:** I use one helper that answers whether a new candidate is better than the stored result. It compares the primary score first and only then the specified deterministic tie field. I do not rely on map iteration, heap incidental order, or sort stability unless the language contract guarantees it and the prompt accepts that behavior. A named helper also gives me a direct unit test at the tie boundary. For this problem, I would verify that reasoning specifically against the space optimization requirement.

**Marcus Lee — Interviewer:** What input ownership or mutation assumption does your code make?

**Nikhil Verma — Candidate:** I will not mutate caller-owned input unless the interface explicitly allows it. If sorting is part of the algorithm, I either copy first or state that in-place sorting is part of the contract. Collections inside the function are local. In production I would also consider memory cost of a copy against API clarity; in an interview, silently changing input creates a surprising side effect and makes later tests order-dependent. For this problem, I would verify that reasoning specifically against the recurrence requirement.

**Marcus Lee — Interviewer:** How would you use randomized or property testing here?

**Nikhil Verma — Candidate:** I would generate small valid inputs, compare the optimized answer against the simple baseline that would recursively try every pass at each uncovered day without memoization, creating three branches per state and repeated subproblems, and assert structural properties such as determinism, valid indices or order, and the invariant. Small random cases are effective at exposing boundary combinations I did not name. They complement, not replace, targeted tests for the exact bug and product rule. For this problem, I would verify that reasoning specifically against the one-dimensional DP requirement.

**Marcus Lee — Interviewer:** Is there an integer, recursion, or allocation risk at the upper bound?

**Nikhil Verma — Candidate:** I would use a numeric type large enough for counts and derived totals, avoid recursive depth proportional to the input, and ensure the inner loop does not create a new substring, array, or object on every step without need. Output allocation is unavoidable where the result itself is large. I would measure before micro-optimizing, but the upper bound is large enough that asymptotically hidden allocation matters. For this problem, I would verify that reasoning specifically against the base cases requirement.

**Marcus Lee — Interviewer:** If memory became the primary constraint, what would you revisit?

**Nikhil Verma — Candidate:** I would first separate memory required for an exact answer from convenient implementation state. The current method retains a dp array of length n plus one, filled from the end, and either binary search or three monotonic pointers to find each next index. Some of that can be compressed using indices, integer IDs, packed arrays, or an output-sensitive structure. If the exact contract fundamentally requires state proportional to distinct items or discovered nodes, I would say so and discuss approximation, external storage, or a changed API rather than claim constant space. For this problem, I would verify that reasoning specifically against the space optimization requirement.

**Marcus Lee — Interviewer:** How would this function fail observably in production?

**Nikhil Verma — Candidate:** I would expose input size, latency, allocation or queue growth where relevant, result cardinality, and counts of invalid or no-result outcomes. I would not log entire sensitive inputs. A rollout could compare the optimized implementation with the trusted baseline on sampled small cases or shadow traffic. If disagreement occurs, retain the stable request identifier and enough bounded state to reproduce it. For this problem, I would verify that reasoning specifically against the recurrence requirement.

**Marcus Lee — Interviewer:** Read the final implementation as if you were reviewing someone else's code.

**Nikhil Verma — Candidate:** The function now follows the stated phases and makes the invariant visible. The data structures match the promised complexity, and the product boundary is encoded in one comparison. The remaining review risks are off-by-one behavior, incidental collection ordering, and the correction for the known issue that it originally treats a seven-day pass bought on day d as covering through d plus seven instead of d plus six, advancing one day too far. The targeted tests cover those before broad happy-path examples. For this problem, I would verify that reasoning specifically against the one-dimensional DP requirement.

**Marcus Lee — Interviewer:** Suppose the product requirement changes slightly after launch. Which part is easiest to adapt?

**Nikhil Verma — Candidate:** The parsing and output formatting are separated from the algorithm's invariant and comparison policy, so a return-shape or deterministic tie change should remain localized. A change to exactness, ordering, or input arrival model may invalidate the algorithm and must trigger a fresh design review. I would avoid adding flags that combine several contracts in one hard-to-test loop; two clear implementations can be safer than one highly parameterized one. For this problem, I would verify that reasoning specifically against the base cases requirement.

**Marcus Lee — Interviewer:** I think there is a case where the code treats a seven-day pass bought on day d as covering through d plus seven instead of d plus six, advancing one day too far. Can you find it without me giving the input?

**Nikhil Verma — Candidate:** Yes. The smallest counterexample is one that lands exactly on that boundary or requires the state to change twice. Walking it line by line, the code preserves an invalid or incorrectly ordered state. The root issue is that it treats a seven-day pass bought on day d as covering through d plus seven instead of d plus six, advancing one day too far; it is not a syntax problem.

**Marcus Lee — Interviewer:** Make that change in the code, then let's test it.

**Nikhil Verma — Candidate:** I've updated it to compute the exclusive coverage boundary as d plus duration and advance while day is strictly less than that boundary; add a test exactly on the boundary. I also separated the boundary comparison into a named condition so the product rule is readable. I'll rerun the counterexample first, then the original sample, because fixing the edge should not change the normal path.

### Testing, complexity, and follow-up — approximately 24:00-35:00

**Marcus Lee — Interviewer:** Test 1: no required days. What do you expect?

**Nikhil Verma — Candidate:** For no required days, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 2: one day. What do you expect?

**Nikhil Verma — Candidate:** For one day, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 3: consecutive days. What do you expect?

**Nikhil Verma — Candidate:** For consecutive days, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 4: widely separated days. What do you expect?

**Nikhil Verma — Candidate:** For widely separated days, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 5: a day exactly at each pass boundary. What do you expect?

**Nikhil Verma — Candidate:** For a day exactly at each pass boundary, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 6: costs where the longest pass is unexpectedly cheapest. What do you expect?

**Nikhil Verma — Candidate:** For costs where the longest pass is unexpectedly cheapest, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 7: a long input for stack safety. What do you expect?

**Nikhil Verma — Candidate:** For a long input for stack safety, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** What are the time and space costs of the final version?

**Nikhil Verma — Candidate:** O(n log n) time with binary search for three fixed pass types and O(n) space; with monotonic next pointers it can be O(n) time, though the simpler binary-search version is already sufficient. I am including input, output, and maintained state rather than quoting only the loop cost.

**Marcus Lee — Interviewer:** Pass durations and costs are now an arbitrary list with up to one thousand options.

**Nikhil Verma — Candidate:** The same recurrence works, but each state now evaluates every pass, giving O(n times p log n) with binary search. I would remove dominated passes first: if another pass lasts at least as long and costs no more, the dominated option is never useful. If p remains large, I would examine timeline bounds or more specialized optimization, but I would not claim the fixed-three-pass complexity still holds.

**Marcus Lee — Interviewer:** What guarantee becomes weaker or what cost becomes larger in that follow-up?

**Nikhil Verma — Candidate:** The original correctness argument still applies only where the contract is unchanged. I would explicitly document the new memory, ordering, or approximation cost and add a test that distinguishes it from the original version. I would not silently present a heuristic as the same exact solution.

### Candidate questions and close — approximately 35:00-38:00

**Marcus Lee — Interviewer:** I have what I need. What questions do you have for me?

**Nikhil Verma — Candidate:** How does this team evaluate a candidate who has the right reasoning but does not finish every line of code?

**Marcus Lee — Interviewer:** We score problem framing, correctness of the chosen approach, communication, code quality, and testing separately. An incomplete but coherent solution can still show useful signal; silent guessing usually does not.

**Nikhil Verma — Candidate:** That's helpful. I prefer making the tradeoffs visible rather than hiding unfinished work.

**Nikhil Verma — Candidate:** What kind of problems would an engineer at this level own after joining?

**Marcus Lee — Interviewer:** The team owns entitlement and scheduling workflows and expects engineers at this level to deliver bounded changes through testing and production follow-up.

**Nikhil Verma — Candidate:** That scope sounds appropriate.

**Nikhil Verma — Candidate:** Those were my main questions. Thank you for the context and for your time.

**Marcus Lee — Interviewer:** I need to finish my notes and compare them with the rest of the interview team, so I won't give feedback on this call. The recruiter will contact you about the next step within a few business days.

**Nikhil Verma — Candidate:** Understood. Thank you, Marcus. Have a good day.

**Marcus Lee — Interviewer:** You too, Nikhil. Take care.

## Timing plan

- Interviewer words: 760 at approximately 145 words per minute.
- Candidate words: 3050 at approximately 125 words per minute.
- Dialogue turns: 109, with approximately 0.4 seconds average turn gap.
- Planned natural thinking, reading, writing, or coding pauses: 7.6 minutes.
- Estimated finished duration: 38.0 minutes; catalog target: 38 minutes.

## Sparse overlap plan

1. The interviewer begins a narrowing follow-up under the final 200 ms of the candidate's broad opening. Keep both voices intelligible and neutral.
2. The candidate starts a brief acknowledgment about 160 ms before the interviewer finishes a later transition. Do not repeat this pattern elsewhere.

## Private coach map

| Moment | Interviewer intent | Candidate signal | Coaching value |
|---|---|---|---|
| Clarification | Check whether the candidate discovers the contract before coding. | The candidate asks about size, empty behavior, and determinism. | Use constraints to eliminate approaches rather than recite them. |
| Invariant | Test whether the pattern is understood beyond recognition. | Dp[i] is the minimum cost to cover required days from index i onward, and every transition buys exactly one pass starting on days[i] then moves to the first uncovered index. | An invariant makes implementation and debugging explainable. |
| Bug correction | Observe response to disconfirming evidence. | Nikhil states the recurrence correctly but makes an inclusive-versus-exclusive coverage error in the first implementation. | A calm correction with a counterexample is stronger than defending the first draft. |
| Follow-up | Test whether the candidate preserves guarantees under changed constraints. | The candidate names which cost or guarantee changes. | Do not reuse an algorithm label without rechecking its contract. |

## Deliberate imperfections to preserve

- Nikhil states the recurrence correctly but makes an inclusive-versus-exclusive coverage error in the first implementation.
- The candidate spends a little too long explaining the first collection choice before the interviewer redirects to code.
- One test expectation is initially verbal rather than written and is added after the probe.

