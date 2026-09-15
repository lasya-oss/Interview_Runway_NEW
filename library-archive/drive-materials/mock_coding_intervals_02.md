---
id: mock_coding_intervals_02
status: audio_complete_video_pending
category: coding
round: live_coding
duration_target_minutes: 32
candidate: Meera Subramanian (fictional), Pune, 2 years, full-stack engineer
interviewer: Marcus Lee (fictional), California, senior software engineer
candidate_voice_id: b6f9907b-69fb-4bdb-a4f8-1b39c916602f
interviewer_voice_id: cb1a4fae-dad5-4729-bd73-a43f570b9117
simulation_disclosure: metadata_and_product_page_only
---

# Merge Deployment Freeze Windows

## Private scenario card

Meera is solving a composite problem for a fictional US remote engineering team. The round tests clarification, spoken reasoning, implementation discipline, boundary testing, and recovery from a realistic bug. The interviewer must not lead Meera to the algorithm before the baseline and invariant are stated.

## Dialogue

### Connection, introduction, and frame — approximately 00:00-03:00

**Marcus Lee — Interviewer:** Hi, Meera. Can you hear me clearly?

**Meera Subramanian — Candidate:** Hi, Marcus. Yes, I can hear you. Is my audio okay?

**Marcus Lee — Interviewer:** It is. There was a brief delay when you joined, but it seems stable now. If it changes, we'll pause rather than talk over the connection.

**Meera Subramanian — Candidate:** Sounds good. Thank you.

**Marcus Lee — Interviewer:** We have fifty minutes. We'll use most of it for one coding problem and a follow-up. Please clarify the prompt, talk through your reasoning, and write code in the shared editor. I'll interrupt if I need to time-box us.

**Meera Subramanian — Candidate:** Yes, that works for me.

**Marcus Lee — Interviewer:** Before we get into the main round, could you give me a brief description of yourself and what you've been working on recently?

**Meera Subramanian — Candidate:** I'm a full-stack engineer with experience in release-calendar and deployment tooling in TypeScript and Node.js. My recent work has involved diagnosing state and performance problems under real operational constraints. I try to begin with the contract and smallest examples before selecting a data structure, and I use tests to make boundary assumptions visible rather than relying on an implementation that only works for the happy path.

**Marcus Lee — Interviewer:** What part of that project required the most careful problem solving from you personally?

**Meera Subramanian — Candidate:** In my current project on release-calendar and deployment tooling in TypeScript and Node.js, I owned the problem decomposition, the core implementation, and the boundary tests for one production change. A senior reviewer challenged the rollout and another engineer handled deployment. The careful part for me was making the state invariant explicit so debugging did not depend on reading every line after an incident.

### Prompt and clarification — approximately 03:00-07:00

**Marcus Lee — Interviewer:** Given unsorted deployment-freeze windows represented as half-open intervals [start, end), merge every overlapping or directly touching window and return the result sorted by start time.

**Meera Subramanian — Candidate:** Should I treat the input as already validated, and what are the size constraints?

**Marcus Lee — Interviewer:** There can be one hundred thousand intervals, start is strictly less than end, times are integer minutes, and touching intervals such as [2,5) and [5,8) should merge because there is no deployable minute between them.

**Meera Subramanian — Candidate:** What should I return for an empty input or when there is no valid result?

**Marcus Lee — Interviewer:** Use the natural empty result for the type: zero length or an empty list. Do not throw for an ordinary no-result case.

**Meera Subramanian — Candidate:** May I use standard library collections and sorting where appropriate?

**Marcus Lee — Interviewer:** Yes. Choose the language you are comfortable with and state the operations you rely on.

**Meera Subramanian — Candidate:** Should the result be deterministic when several answers are equally valid?

**Marcus Lee — Interviewer:** Yes. Follow the tie rule in the prompt; where the prompt permits any valid result, say how your implementation behaves.

**Meera Subramanian — Candidate:** I'll restate it to make sure I have the contract. Given unsorted deployment-freeze windows represented as half-open intervals [start, end), merge every overlapping or directly touching window and return the result sorted by start time. I will handle the empty case explicitly, preserve the stated tie behavior, and design for the provided upper bound rather than only the example.

**Marcus Lee — Interviewer:** Yes. That's the problem.

**Meera Subramanian — Candidate:** Let me walk a concrete case before coding. For [8,10), [1,3), [3,6), and [12,14), sorting gives [1,3), [3,6), [8,10), [12,14); the first two merge to [1,6). I would also test the boundary that is most likely to change the comparison or state update.

**Marcus Lee — Interviewer:** What does that example reveal about the state you need to preserve?

**Meera Subramanian — Candidate:** It shows that I need a sorted copy of the intervals, a result list, and mutable current start and end values rather than mutating caller-owned interval objects. More importantly, the update order must preserve this invariant: the output contains finalized non-touching intervals in sorted order, and current is the merge of every not-yet-emitted interval seen so far. If I cannot state that before coding, it will be easy to fix one example while breaking another.

### Approach selection — approximately 07:00-13:00

**Marcus Lee — Interviewer:** How would you start?

**Meera Subramanian — Candidate:** A direct baseline would repeatedly scan pairs, merge any overlap, and restart; that can become quadratic and makes stable ordering difficult. It is useful as a correctness reference on small inputs, but it does not meet the upper bound. I would not implement it as the final answer unless the constraints were much smaller.

**Marcus Lee — Interviewer:** Can we do better under the stated constraints?

**Meera Subramanian — Candidate:** I would use sort by start then end, keep one current merged interval, extend its end when the next start is less than or equal to the current end, otherwise emit it and start a new interval. The reason is not only the familiar pattern: it avoids repeating work while preserving enough state to decide the next update. I will keep the implementation close to the invariant and avoid clever compression until the tests pass.

**Marcus Lee — Interviewer:** What invariant will tell you the approach is still correct as the input changes?

**Meera Subramanian — Candidate:** The output contains finalized non-touching intervals in sorted order, and current is the merge of every not-yet-emitted interval seen so far. I will check it at the point where state changes, not only after the loop finishes.

**Marcus Lee — Interviewer:** What alternative did you reject, and what cost does your chosen structure introduce?

**Meera Subramanian — Candidate:** I rejected the baseline because it repeats work at the stated scale. My chosen state is a sorted copy of the intervals, a result list, and mutable current start and end values rather than mutating caller-owned interval objects, so the cost is additional memory and more careful update ordering. I accept that because it turns the dominant repeated work into bounded collection operations. If memory constraints were tighter, I would need a different contract or representation rather than pretend the state is free.

**Marcus Lee — Interviewer:** Okay. Please implement that. Keep explaining major state changes, but you don't need to narrate every character you type.

**Meera Subramanian — Candidate:** I'll take a moment to set up the function and the core state, then I'll walk through the update logic.

### Implementation and correction — approximately 13:00-24:00

**Marcus Lee — Interviewer:** Talk me through the function signature and result shape before the loop.

**Meera Subramanian — Candidate:** I'll use a function that accepts the exact input and returns the requested result without mutating caller-owned data unless the prompt permits it. I handle the empty case first, initialize a sorted copy of the intervals, a result list, and mutable current start and end values rather than mutating caller-owned interval objects, and keep best-result state separate from current working state. That separation prevents a later update from corrupting the answer already found.

**Marcus Lee — Interviewer:** What happens during one normal iteration?

**Meera Subramanian — Candidate:** I read the next logical item, update the working state, then restore validity using the rule implied by the invariant. Only after the state is valid do I compare it with the best result. The core approach is sort by start then end, keep one current merged interval, extend its end when the next start is less than or equal to the current end, otherwise emit it and start a new interval; I will make each transition visible rather than fold it into one expression.

**Marcus Lee — Interviewer:** Why is that update order important?

**Meera Subramanian — Candidate:** If I record the answer before restoring the invariant, I can accept an invalid candidate. If I remove state too early, I can lose a valid optimum. The order follows the definition: the output contains finalized non-touching intervals in sorted order, and current is the merge of every not-yet-emitted interval seen so far. I am adding a short comment about why, not a comment that merely repeats the code.

**Marcus Lee — Interviewer:** What collection operation are you assuming is efficient?

**Meera Subramanian — Candidate:** The main map, set, heap, queue, or sort operations have their standard expected costs in this language. I would avoid an operation that scans or shifts a linear container inside the main loop. If the language's queue removes from the front of an array in linear time, I would use an indexed head or a real deque.

**Marcus Lee — Interviewer:** Pause and inspect the boundary comparisons in what you wrote.

**Meera Subramanian — Candidate:** I see the main risk. The implementation currently uses next.start strictly less than current.end and therefore fails to merge two touching half-open windows even though the product rule requires it. That may pass the central example but violates the stated boundary rule. I want to construct the smallest counterexample before I change it so the correction is evidence-driven.

**Marcus Lee — Interviewer:** Use that counterexample. What state changes?

**Meera Subramanian — Candidate:** On the counterexample, the current code leaves state that should have been updated or evicted. The correct action is to change the condition to next.start less than or equal to current.end and add a boundary test that distinguishes the domain rule from mathematical overlap. I'll change that line and keep the counterexample as a named test rather than only testing it mentally.

**Marcus Lee — Interviewer:** Continue. How do you produce the result without disturbing correctness?

**Meera Subramanian — Candidate:** After the main processing finishes, I convert the maintained best state to the requested return format. If reconstruction is required, I do it iteratively where input depth could be large. I keep deterministic tie behavior in one comparison helper so it is not implemented differently in two places.

**Marcus Lee — Interviewer:** Do you need to handle malformed input?

**Meera Subramanian — Candidate:** The prompt says ordinary inputs satisfy the stated contract, so I won't spend interview time on a full validation layer. I will handle empty or no-result cases that are part of the domain. In production I would validate external input at the boundary and decide whether malformed data is rejected, quarantined, or logged; that is separate from the algorithm.

**Marcus Lee — Interviewer:** Read the code once from the invariant's perspective.

**Meera Subramanian — Candidate:** Initialization makes the invariant true for an empty prefix. Each iteration updates the new item, restores validity, and records the best state only afterward. The final result comes from state that was valid when recorded. The remaining uncertainty is the exact boundary in the correction, so the next tests should target that before broad random cases.

**Marcus Lee — Interviewer:** Before you type further, give me language-neutral pseudocode.

**Meera Subramanian — Candidate:** The pseudocode is: validate the ordinary empty case; initialize a sorted copy of the intervals, a result list, and mutable current start and end values rather than mutating caller-owned interval objects; iterate through the input in its required order; update the working state; restore or verify the invariant; compare the valid candidate with the best using the tie rule; and reconstruct or format the answer after processing. The problem-specific update is sort by start then end, keep one current merged interval, extend its end when the next start is less than or equal to the current end, otherwise emit it and start a new interval. Writing this first makes it easier to see whether the code changes the order of two logically separate operations. For this problem, I would verify that reasoning specifically against the interval semantics requirement.

**Marcus Lee — Interviewer:** Give me a short correctness argument, not only intuition.

**Meera Subramanian — Candidate:** For initialization, the working state represents the empty processed prefix, so the invariant holds. For maintenance, one iteration adds the next item and applies the exact correction needed to restore this invariant: the output contains finalized non-touching intervals in sorted order, and current is the merge of every not-yet-emitted interval seen so far. We record an answer only while that invariant holds. At termination every input item has been considered, and any candidate that could beat the result was represented when its decisive boundary was processed. The tie comparison preserves the required deterministic choice. For this problem, I would verify that reasoning specifically against the sorting requirement.

**Marcus Lee — Interviewer:** Trace the central example through the actual variables you wrote.

**Meera Subramanian — Candidate:** I start with the empty state and process the example one item at a time: For [8,10), [1,3), [3,6), and [12,14), sorting gives [1,3), [3,6), [8,10), [12,14); the first two merge to [1,6). At each point I would say the current state, whether the invariant is valid, and whether the best result changes. The important trace is the transition that removes, evicts, advances, or reconstructs state; that is where the first implementation was most likely to diverge from the algorithm I described. For this problem, I would verify that reasoning specifically against the edge cases requirement.

**Marcus Lee — Interviewer:** I think there is a case where the code uses next.start strictly less than current.end and therefore fails to merge two touching half-open windows even though the product rule requires it. Can you find it without me giving the input?

**Meera Subramanian — Candidate:** Yes. The smallest counterexample is one that lands exactly on that boundary or requires the state to change twice. Walking it line by line, the code preserves an invalid or incorrectly ordered state. The root issue is that it uses next.start strictly less than current.end and therefore fails to merge two touching half-open windows even though the product rule requires it; it is not a syntax problem.

**Marcus Lee — Interviewer:** Make that change in the code, then let's test it.

**Meera Subramanian — Candidate:** I've updated it to change the condition to next.start less than or equal to current.end and add a boundary test that distinguishes the domain rule from mathematical overlap. I also separated the boundary comparison into a named condition so the product rule is readable. I'll rerun the counterexample first, then the original sample, because fixing the edge should not change the normal path.

### Testing, complexity, and follow-up — approximately 24:00-29:00

**Marcus Lee — Interviewer:** Test 1: no intervals. What do you expect?

**Meera Subramanian — Candidate:** For no intervals, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 2: one interval. What do you expect?

**Meera Subramanian — Candidate:** For one interval, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 3: already disjoint sorted intervals. What do you expect?

**Meera Subramanian — Candidate:** For already disjoint sorted intervals, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 4: fully nested intervals. What do you expect?

**Meera Subramanian — Candidate:** For fully nested intervals, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 5: touching windows. What do you expect?

**Meera Subramanian — Candidate:** For touching windows, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 6: same start with different ends. What do you expect?

**Meera Subramanian — Candidate:** For same start with different ends, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 7: unsorted negative and positive times. What do you expect?

**Meera Subramanian — Candidate:** For unsorted negative and positive times, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** What are the time and space costs of the final version?

**Meera Subramanian — Candidate:** O(n log n) time for sorting and O(n) output space; the scan itself is O(n), and sort space depends on the language implementation. I am including input, output, and maintained state rather than quoting only the loop cost.

**Marcus Lee — Interviewer:** Assume the intervals arrive continuously and the input is not time ordered. Can you emit final merged windows immediately?

**Meera Subramanian — Candidate:** Not in general, because a later interval can begin before a window I already emitted and bridge it to another. With a known watermark or maximum lateness, I can buffer intervals in an ordered structure and finalize windows whose end is behind the watermark. Without such a bound, exact immediate finalization is impossible.

**Marcus Lee — Interviewer:** What guarantee becomes weaker or what cost becomes larger in that follow-up?

**Meera Subramanian — Candidate:** The original correctness argument still applies only where the contract is unchanged. I would explicitly document the new memory, ordering, or approximation cost and add a test that distinguishes it from the original version. I would not silently present a heuristic as the same exact solution.

### Candidate questions and close — approximately 29:00-32:00

**Marcus Lee — Interviewer:** I have what I need. What questions do you have for me?

**Meera Subramanian — Candidate:** How does this team evaluate a candidate who has the right reasoning but does not finish every line of code?

**Marcus Lee — Interviewer:** We score problem framing, correctness of the chosen approach, communication, code quality, and testing separately. An incomplete but coherent solution can still show useful signal; silent guessing usually does not.

**Meera Subramanian — Candidate:** That's helpful. I prefer making the tradeoffs visible rather than hiding unfinished work.

**Meera Subramanian — Candidate:** What kind of problems would an engineer at this level own after joining?

**Marcus Lee — Interviewer:** The team owns release safety and internal developer tooling and expects engineers at this level to deliver bounded changes through testing and production follow-up.

**Meera Subramanian — Candidate:** That scope sounds appropriate.

**Meera Subramanian — Candidate:** Those were my main questions. Thank you for the context and for your time.

**Marcus Lee — Interviewer:** I need to finish my notes and compare them with the rest of the interview team, so I won't give feedback on this call. The recruiter will contact you about the next step within a few business days.

**Meera Subramanian — Candidate:** Understood. Thank you, Marcus. Have a good day.

**Marcus Lee — Interviewer:** You too, Meera. Take care.

## Timing plan

- Interviewer words: 670 at approximately 145 words per minute.
- Candidate words: 2261 at approximately 125 words per minute.
- Dialogue turns: 93, with approximately 0.4 seconds average turn gap.
- Planned natural thinking, reading, writing, or coding pauses: 8.7 minutes.
- Estimated finished duration: 32.0 minutes; catalog target: 32 minutes.

## Sparse overlap plan

1. The interviewer begins a narrowing follow-up under the final 200 ms of the candidate's broad opening. Keep both voices intelligible and neutral.
2. The candidate starts a brief acknowledgment about 160 ms before the interviewer finishes a later transition. Do not repeat this pattern elsewhere.

## Private coach map

| Moment | Interviewer intent | Candidate signal | Coaching value |
|---|---|---|---|
| Clarification | Check whether the candidate discovers the contract before coding. | The candidate asks about size, empty behavior, and determinism. | Use constraints to eliminate approaches rather than recite them. |
| Invariant | Test whether the pattern is understood beyond recognition. | The output contains finalized non-touching intervals in sorted order, and current is the merge of every not-yet-emitted interval seen so far. | An invariant makes implementation and debugging explainable. |
| Bug correction | Observe response to disconfirming evidence. | Meera first applies strict mathematical overlap and misses the product requirement that touching freeze windows merge. | A calm correction with a counterexample is stronger than defending the first draft. |
| Follow-up | Test whether the candidate preserves guarantees under changed constraints. | The candidate names which cost or guarantee changes. | Do not reuse an algorithm label without rechecking its contract. |

## Deliberate imperfections to preserve

- Meera first applies strict mathematical overlap and misses the product requirement that touching freeze windows merge.
- The candidate spends a little too long explaining the first collection choice before the interviewer redirects to code.
- One test expectation is initially verbal rather than written and is added after the probe.

