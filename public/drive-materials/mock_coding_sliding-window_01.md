---
id: mock_coding_sliding-window_01
status: audio_complete_video_pending
category: coding
round: live_coding
duration_target_minutes: 34
candidate: Vikram Sethi (fictional), Bengaluru, 3 years, backend engineer
interviewer: Marcus Lee (fictional), California, senior software engineer
candidate_voice_id: efb6d51d-ce64-4ec3-bacc-5f8e3a2594db
interviewer_voice_id: 8b9ed861-3382-455d-9c03-a40671943d6b
simulation_disclosure: metadata_and_product_page_only
---

# Longest Stable Activity Window

## Private scenario card

Vikram is solving a composite problem for a fictional US remote engineering team. The round tests clarification, spoken reasoning, implementation discipline, boundary testing, and recovery from a realistic bug. The interviewer must not lead Vikram to the algorithm before the baseline and invariant are stated.

## Dialogue

### Connection, introduction, and frame — approximately 00:00-03:00

**Marcus Lee — Interviewer:** Hi, Vikram. Can you hear me clearly?

**Vikram Sethi — Candidate:** Hi, Marcus. Yes, I can hear you. Is my audio okay?

**Marcus Lee — Interviewer:** It is. There was a brief delay when you joined, but it seems stable now. If it changes, we'll pause rather than talk over the connection.

**Vikram Sethi — Candidate:** Sounds good. Thank you.

**Marcus Lee — Interviewer:** We have fifty minutes. We'll use most of it for one coding problem and a follow-up. Please clarify the prompt, talk through your reasoning, and write code in the shared editor. I'll interrupt if I need to time-box us.

**Vikram Sethi — Candidate:** Yes, that works for me.

**Marcus Lee — Interviewer:** Before we get into the main round, could you give me a brief description of yourself and what you've been working on recently?

**Vikram Sethi — Candidate:** I'm a backend engineer with experience in rate-limiting and session-anomaly services in Java and Python. My recent work has involved diagnosing state and performance problems under real operational constraints. I try to begin with the contract and smallest examples before selecting a data structure, and I use tests to make boundary assumptions visible rather than relying on an implementation that only works for the happy path.

**Marcus Lee — Interviewer:** What part of that project required the most careful problem solving from you personally?

**Vikram Sethi — Candidate:** In my current project on rate-limiting and session-anomaly services in Java and Python, I owned the problem decomposition, the core implementation, and the boundary tests for one production change. A senior reviewer challenged the rollout and another engineer handled deployment. The careful part for me was making the state invariant explicit so debugging did not depend on reading every line after an incident.

### Prompt and clarification — approximately 03:00-07:00

**Marcus Lee — Interviewer:** Given a time-ordered array of activity labels and an integer k, return the length and indices of the longest contiguous window containing at most k distinct labels. If several windows have the same maximum length, return the earliest one.

**Vikram Sethi — Candidate:** Should I treat the input as already validated, and what are the size constraints?

**Marcus Lee — Interviewer:** The array can contain up to two hundred thousand strings, k can be zero, and labels are compared exactly. The input is already in time order.

**Vikram Sethi — Candidate:** What should I return for an empty input or when there is no valid result?

**Marcus Lee — Interviewer:** Use the natural empty result for the type: zero length or an empty list. Do not throw for an ordinary no-result case.

**Vikram Sethi — Candidate:** May I use standard library collections and sorting where appropriate?

**Marcus Lee — Interviewer:** Yes. Choose the language you are comfortable with and state the operations you rely on.

**Vikram Sethi — Candidate:** Should the result be deterministic when several answers are equally valid?

**Marcus Lee — Interviewer:** Yes. Follow the tie rule in the prompt; where the prompt permits any valid result, say how your implementation behaves.

**Vikram Sethi — Candidate:** I'll restate it to make sure I have the contract. Given a time-ordered array of activity labels and an integer k, return the length and indices of the longest contiguous window containing at most k distinct labels. If several windows have the same maximum length, return the earliest one. I will handle the empty case explicitly, preserve the stated tie behavior, and design for the provided upper bound rather than only the example.

**Marcus Lee — Interviewer:** Yes. That's the problem.

**Vikram Sethi — Candidate:** Let me walk a concrete case before coding. For A, B, A, C, C with k equal to two, the best window is indices one through four if we count B, A, C, C; it has length four. The earlier A, B, A has length three. I would also test the boundary that is most likely to change the comparison or state update.

**Marcus Lee — Interviewer:** What does that example reveal about the state you need to preserve?

**Vikram Sethi — Candidate:** It shows that I need left, a map from label to positive count, the best start, and the best length. More importantly, the update order must preserve this invariant: after the shrink loop the current left-to-right window is valid, every earlier left position for this right edge was invalid or no longer useful, and the frequency map exactly matches the current window. If I cannot state that before coding, it will be easy to fix one example while breaking another.

### Approach selection — approximately 07:00-13:00

**Marcus Lee — Interviewer:** How would you start?

**Vikram Sethi — Candidate:** A direct baseline would enumerate every start and extend until the distinct count exceeds k, rebuilding or updating a set; in the worst case that is quadratic. It is useful as a correctness reference on small inputs, but it does not meet the upper bound. I would not implement it as the final answer unless the constraints were much smaller.

**Marcus Lee — Interviewer:** Can we do better under the stated constraints?

**Vikram Sethi — Candidate:** I would use a variable sliding window with a frequency map, advancing the right edge once and shrinking the left edge in a loop while the distinct count is greater than k. The reason is not only the familiar pattern: it avoids repeating work while preserving enough state to decide the next update. I will keep the implementation close to the invariant and avoid clever compression until the tests pass.

**Marcus Lee — Interviewer:** What invariant will tell you the approach is still correct as the input changes?

**Vikram Sethi — Candidate:** After the shrink loop the current left-to-right window is valid, every earlier left position for this right edge was invalid or no longer useful, and the frequency map exactly matches the current window. I will check it at the point where state changes, not only after the loop finishes.

**Marcus Lee — Interviewer:** What alternative did you reject, and what cost does your chosen structure introduce?

**Vikram Sethi — Candidate:** I rejected the baseline because it repeats work at the stated scale. My chosen state is left, a map from label to positive count, the best start, and the best length, so the cost is additional memory and more careful update ordering. I accept that because it turns the dominant repeated work into bounded collection operations. If memory constraints were tighter, I would need a different contract or representation rather than pretend the state is free.

**Marcus Lee — Interviewer:** Okay. Please implement that. Keep explaining major state changes, but you don't need to narrate every character you type.

**Vikram Sethi — Candidate:** I'll take a moment to set up the function and the core state, then I'll walk through the update logic.

### Implementation and correction — approximately 13:00-24:00

**Marcus Lee — Interviewer:** Talk me through the function signature and result shape before the loop.

**Vikram Sethi — Candidate:** I'll use a function that accepts the exact input and returns the requested result without mutating caller-owned data unless the prompt permits it. I handle the empty case first, initialize left, a map from label to positive count, the best start, and the best length, and keep best-result state separate from current working state. That separation prevents a later update from corrupting the answer already found.

**Marcus Lee — Interviewer:** What happens during one normal iteration?

**Vikram Sethi — Candidate:** I read the next logical item, update the working state, then restore validity using the rule implied by the invariant. Only after the state is valid do I compare it with the best result. The core approach is a variable sliding window with a frequency map, advancing the right edge once and shrinking the left edge in a loop while the distinct count is greater than k; I will make each transition visible rather than fold it into one expression.

**Marcus Lee — Interviewer:** Why is that update order important?

**Vikram Sethi — Candidate:** If I record the answer before restoring the invariant, I can accept an invalid candidate. If I remove state too early, I can lose a valid optimum. The order follows the definition: after the shrink loop the current left-to-right window is valid, every earlier left position for this right edge was invalid or no longer useful, and the frequency map exactly matches the current window. I am adding a short comment about why, not a comment that merely repeats the code.

**Marcus Lee — Interviewer:** What collection operation are you assuming is efficient?

**Vikram Sethi — Candidate:** The main map, set, heap, queue, or sort operations have their standard expected costs in this language. I would avoid an operation that scans or shifts a linear container inside the main loop. If the language's queue removes from the front of an array in linear time, I would use an indexed head or a real deque.

**Marcus Lee — Interviewer:** Pause and inspect the boundary comparisons in what you wrote.

**Vikram Sethi — Candidate:** I see the main risk. The implementation currently uses a single if when the new label can require removing more than one distinct label before the window becomes valid. That may pass the central example but violates the stated boundary rule. I want to construct the smallest counterexample before I change it so the correction is evidence-driven.

**Marcus Lee — Interviewer:** Use that counterexample. What state changes?

**Vikram Sethi — Candidate:** On the counterexample, the current code leaves state that should have been updated or evicted. The correct action is to replace the single shrink with a while loop, decrementing the left label and removing it from the map only when its count reaches zero. I'll change that line and keep the counterexample as a named test rather than only testing it mentally.

**Marcus Lee — Interviewer:** Continue. How do you produce the result without disturbing correctness?

**Vikram Sethi — Candidate:** After the main processing finishes, I convert the maintained best state to the requested return format. If reconstruction is required, I do it iteratively where input depth could be large. I keep deterministic tie behavior in one comparison helper so it is not implemented differently in two places.

**Marcus Lee — Interviewer:** Do you need to handle malformed input?

**Vikram Sethi — Candidate:** The prompt says ordinary inputs satisfy the stated contract, so I won't spend interview time on a full validation layer. I will handle empty or no-result cases that are part of the domain. In production I would validate external input at the boundary and decide whether malformed data is rejected, quarantined, or logged; that is separate from the algorithm.

**Marcus Lee — Interviewer:** Read the code once from the invariant's perspective.

**Vikram Sethi — Candidate:** Initialization makes the invariant true for an empty prefix. Each iteration updates the new item, restores validity, and records the best state only afterward. The final result comes from state that was valid when recorded. The remaining uncertainty is the exact boundary in the correction, so the next tests should target that before broad random cases.

**Marcus Lee — Interviewer:** Before you type further, give me language-neutral pseudocode.

**Vikram Sethi — Candidate:** The pseudocode is: validate the ordinary empty case; initialize left, a map from label to positive count, the best start, and the best length; iterate through the input in its required order; update the working state; restore or verify the invariant; compare the valid candidate with the best using the tie rule; and reconstruct or format the answer after processing. The problem-specific update is a variable sliding window with a frequency map, advancing the right edge once and shrinking the left edge in a loop while the distinct count is greater than k. Writing this first makes it easier to see whether the code changes the order of two logically separate operations. For this problem, I would verify that reasoning specifically against the clarification requirement.

**Marcus Lee — Interviewer:** Give me a short correctness argument, not only intuition.

**Vikram Sethi — Candidate:** For initialization, the working state represents the empty processed prefix, so the invariant holds. For maintenance, one iteration adds the next item and applies the exact correction needed to restore this invariant: after the shrink loop the current left-to-right window is valid, every earlier left position for this right edge was invalid or no longer useful, and the frequency map exactly matches the current window. We record an answer only while that invariant holds. At termination every input item has been considered, and any candidate that could beat the result was represented when its decisive boundary was processed. The tie comparison preserves the required deterministic choice. For this problem, I would verify that reasoning specifically against the sliding window requirement.

**Marcus Lee — Interviewer:** Trace the central example through the actual variables you wrote.

**Vikram Sethi — Candidate:** I start with the empty state and process the example one item at a time: For A, B, A, C, C with k equal to two, the best window is indices one through four if we count B, A, C, C; it has length four. The earlier A, B, A has length three. At each point I would say the current state, whether the invariant is valid, and whether the best result changes. The important trace is the transition that removes, evicts, advances, or reconstructs state; that is where the first implementation was most likely to diverge from the algorithm I described. For this problem, I would verify that reasoning specifically against the duplicates requirement.

**Marcus Lee — Interviewer:** How are you enforcing the tie rule in code?

**Vikram Sethi — Candidate:** I use one helper that answers whether a new candidate is better than the stored result. It compares the primary score first and only then the specified deterministic tie field. I do not rely on map iteration, heap incidental order, or sort stability unless the language contract guarantees it and the prompt accepts that behavior. A named helper also gives me a direct unit test at the tie boundary. For this problem, I would verify that reasoning specifically against the testing requirement.

**Marcus Lee — Interviewer:** What input ownership or mutation assumption does your code make?

**Vikram Sethi — Candidate:** I will not mutate caller-owned input unless the interface explicitly allows it. If sorting is part of the algorithm, I either copy first or state that in-place sorting is part of the contract. Collections inside the function are local. In production I would also consider memory cost of a copy against API clarity; in an interview, silently changing input creates a surprising side effect and makes later tests order-dependent. For this problem, I would verify that reasoning specifically against the complexity requirement.

**Marcus Lee — Interviewer:** How would you use randomized or property testing here?

**Vikram Sethi — Candidate:** I would generate small valid inputs, compare the optimized answer against the simple baseline that would enumerate every start and extend until the distinct count exceeds k, rebuilding or updating a set; in the worst case that is quadratic, and assert structural properties such as determinism, valid indices or order, and the invariant. Small random cases are effective at exposing boundary combinations I did not name. They complement, not replace, targeted tests for the exact bug and product rule. For this problem, I would verify that reasoning specifically against the clarification requirement.

**Marcus Lee — Interviewer:** I think there is a case where the code uses a single if when the new label can require removing more than one distinct label before the window becomes valid. Can you find it without me giving the input?

**Vikram Sethi — Candidate:** Yes. The smallest counterexample is one that lands exactly on that boundary or requires the state to change twice. Walking it line by line, the code preserves an invalid or incorrectly ordered state. The root issue is that it uses a single if when the new label can require removing more than one distinct label before the window becomes valid; it is not a syntax problem.

**Marcus Lee — Interviewer:** Make that change in the code, then let's test it.

**Vikram Sethi — Candidate:** I've updated it to replace the single shrink with a while loop, decrementing the left label and removing it from the map only when its count reaches zero. I also separated the boundary comparison into a named condition so the product rule is readable. I'll rerun the counterexample first, then the original sample, because fixing the edge should not change the normal path.

### Testing, complexity, and follow-up — approximately 24:00-31:00

**Marcus Lee — Interviewer:** Test 1: an empty array. What do you expect?

**Vikram Sethi — Candidate:** For an empty array, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 2: k equal to zero. What do you expect?

**Vikram Sethi — Candidate:** For k equal to zero, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 3: all labels identical. What do you expect?

**Vikram Sethi — Candidate:** For all labels identical, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 4: all labels different with k one. What do you expect?

**Vikram Sethi — Candidate:** For all labels different with k one, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 5: a tie where the earlier window must win. What do you expect?

**Vikram Sethi — Candidate:** For a tie where the earlier window must win, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 6: a label that leaves and later re-enters the window. What do you expect?

**Vikram Sethi — Candidate:** For a label that leaves and later re-enters the window, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** What are the time and space costs of the final version?

**Vikram Sethi — Candidate:** O(n) time because each index enters and leaves at most once, and O(min(n, number of distinct labels in the active window)) space. I am including input, output, and maintained state rather than quoting only the loop cost.

**Marcus Lee — Interviewer:** Now the labels arrive as a stream and you need only the maximum length seen so far, not the indices after the stream ends.

**Vikram Sethi — Candidate:** The same algorithm works online. I retain the active labels or their positions so I can remove the left edge, plus the map and best length. If I cannot retain the active window at all, exact removal is impossible without additional assumptions; an approximate sketch would answer a different question.

**Marcus Lee — Interviewer:** What guarantee becomes weaker or what cost becomes larger in that follow-up?

**Vikram Sethi — Candidate:** The original correctness argument still applies only where the contract is unchanged. I would explicitly document the new memory, ordering, or approximation cost and add a test that distinguishes it from the original version. I would not silently present a heuristic as the same exact solution.

### Candidate questions and close — approximately 31:00-34:00

**Marcus Lee — Interviewer:** I have what I need. What questions do you have for me?

**Vikram Sethi — Candidate:** How does this team evaluate a candidate who has the right reasoning but does not finish every line of code?

**Marcus Lee — Interviewer:** We score problem framing, correctness of the chosen approach, communication, code quality, and testing separately. An incomplete but coherent solution can still show useful signal; silent guessing usually does not.

**Vikram Sethi — Candidate:** That's helpful. I prefer making the tradeoffs visible rather than hiding unfinished work.

**Vikram Sethi — Candidate:** What kind of problems would an engineer at this level own after joining?

**Marcus Lee — Interviewer:** The team owns customer-facing session analysis features and expects engineers at this level to deliver bounded changes through testing and production follow-up.

**Vikram Sethi — Candidate:** That scope sounds appropriate.

**Vikram Sethi — Candidate:** Those were my main questions. Thank you for the context and for your time.

**Marcus Lee — Interviewer:** I need to finish my notes and compare them with the rest of the interview team, so I won't give feedback on this call. The recruiter will contact you about the next step within a few business days.

**Vikram Sethi — Candidate:** Understood. Thank you, Marcus. Have a good day.

**Marcus Lee — Interviewer:** You too, Vikram. Take care.

## Timing plan

- Interviewer words: 705 at approximately 145 words per minute.
- Candidate words: 2512 at approximately 125 words per minute.
- Dialogue turns: 97, with approximately 0.4 seconds average turn gap.
- Planned natural thinking, reading, writing, or coding pauses: 8.4 minutes.
- Estimated finished duration: 34.0 minutes; catalog target: 34 minutes.

## Sparse overlap plan

1. The interviewer begins a narrowing follow-up under the final 200 ms of the candidate's broad opening. Keep both voices intelligible and neutral.
2. The candidate starts a brief acknowledgment about 160 ms before the interviewer finishes a later transition. Do not repeat this pattern elsewhere.

## Private coach map

| Moment | Interviewer intent | Candidate signal | Coaching value |
|---|---|---|---|
| Clarification | Check whether the candidate discovers the contract before coding. | The candidate asks about size, empty behavior, and determinism. | Use constraints to eliminate approaches rather than recite them. |
| Invariant | Test whether the pattern is understood beyond recognition. | After the shrink loop the current left-to-right window is valid, every earlier left position for this right edge was invalid or no longer useful, and the frequency map exactly matches the current window. | An invariant makes implementation and debugging explainable. |
| Bug correction | Observe response to disconfirming evidence. | Vikram initially uses one shrink step rather than a loop and corrects it after testing a window that remains invalid. | A calm correction with a counterexample is stronger than defending the first draft. |
| Follow-up | Test whether the candidate preserves guarantees under changed constraints. | The candidate names which cost or guarantee changes. | Do not reuse an algorithm label without rechecking its contract. |

## Deliberate imperfections to preserve

- Vikram initially uses one shrink step rather than a loop and corrects it after testing a window that remains invalid.
- The candidate spends a little too long explaining the first collection choice before the interviewer redirects to code.
- One test expectation is initially verbal rather than written and is added after the probe.

