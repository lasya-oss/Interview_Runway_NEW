---
id: mock_coding_heap-stream_04
status: audio_complete_video_pending
category: coding
round: live_coding
duration_target_minutes: 38
candidate: Lakshmi Rao (fictional), Chennai, 6 years, reliability engineer
interviewer: Marcus Lee (fictional), California, senior software engineer
candidate_voice_id: 32ab6304-5b90-45d3-a523-15fdd53e70c8
interviewer_voice_id: 3b8223cb-30e4-4472-9952-21f89f20548d
simulation_disclosure: metadata_and_product_page_only
---

# Top Error Signatures in a Stream

## Private scenario card

Lakshmi is solving a composite problem for a fictional US remote engineering team. The round tests clarification, spoken reasoning, implementation discipline, boundary testing, and recovery from a realistic bug. The interviewer must not lead Lakshmi to the algorithm before the baseline and invariant are stated.

## Dialogue

### Connection, introduction, and frame — approximately 00:00-03:00

**Marcus Lee — Interviewer:** Hi, Lakshmi. Can you hear me clearly?

**Lakshmi Rao — Candidate:** Hi, Marcus. Yes, I can hear you. Is my audio okay?

**Marcus Lee — Interviewer:** It is. There was a brief delay when you joined, but it seems stable now. If it changes, we'll pause rather than talk over the connection.

**Lakshmi Rao — Candidate:** Sounds good. Thank you.

**Marcus Lee — Interviewer:** We have fifty minutes. We'll use most of it for one coding problem and a follow-up. Please clarify the prompt, talk through your reasoning, and write code in the shared editor. I'll interrupt if I need to time-box us.

**Lakshmi Rao — Candidate:** Yes, that works for me.

**Marcus Lee — Interviewer:** Before we get into the main round, could you give me a brief description of yourself and what you've been working on recently?

**Lakshmi Rao — Candidate:** I'm a reliability engineer with experience in error aggregation and incident tooling in Python and Go. My recent work has involved diagnosing state and performance problems under real operational constraints. I try to begin with the contract and smallest examples before selecting a data structure, and I use tests to make boundary assumptions visible rather than relying on an implementation that only works for the happy path.

**Marcus Lee — Interviewer:** What part of that project required the most careful problem solving from you personally?

**Lakshmi Rao — Candidate:** In my current project on error aggregation and incident tooling in Python and Go, I owned the problem decomposition, the core implementation, and the boundary tests for one production change. A senior reviewer challenged the rollout and another engineer handled deployment. The careful part for me was making the state invariant explicit so debugging did not depend on reading every line after an incident.

### Prompt and clarification — approximately 03:00-07:00

**Marcus Lee — Interviewer:** Given a finite stream of error-signature strings and an integer k, return the k most frequent signatures. Higher frequency comes first; ties use lexicographically smaller signature first.

**Lakshmi Rao — Candidate:** Should I treat the input as already validated, and what are the size constraints?

**Marcus Lee — Interviewer:** The stream contains up to ten million items but at most five hundred thousand distinct signatures. k is between one and the number of distinct signatures. Exact counts are required for this version.

**Lakshmi Rao — Candidate:** What should I return for an empty input or when there is no valid result?

**Marcus Lee — Interviewer:** Use the natural empty result for the type: zero length or an empty list. Do not throw for an ordinary no-result case.

**Lakshmi Rao — Candidate:** May I use standard library collections and sorting where appropriate?

**Marcus Lee — Interviewer:** Yes. Choose the language you are comfortable with and state the operations you rely on.

**Lakshmi Rao — Candidate:** Should the result be deterministic when several answers are equally valid?

**Marcus Lee — Interviewer:** Yes. Follow the tie rule in the prompt; where the prompt permits any valid result, say how your implementation behaves.

**Lakshmi Rao — Candidate:** I'll restate it to make sure I have the contract. Given a finite stream of error-signature strings and an integer k, return the k most frequent signatures. Higher frequency comes first; ties use lexicographically smaller signature first. I will handle the empty case explicitly, preserve the stated tie behavior, and design for the provided upper bound rather than only the example.

**Marcus Lee — Interviewer:** Yes. That's the problem.

**Lakshmi Rao — Candidate:** Let me walk a concrete case before coding. For timeout, auth, timeout, disk, auth, timeout with k two, return timeout then auth. Their counts are three and two. I would also test the boundary that is most likely to change the comparison or state update.

**Marcus Lee — Interviewer:** What does that example reveal about the state you need to preserve?

**Lakshmi Rao — Candidate:** It shows that I need a frequency map and a min-heap of at most k count-signature pairs using a comparator that reverses the tie direction at the root. More importantly, the update order must preserve this invariant: after processing each distinct signature, the heap contains the best k items among those considered, and its root is the first item to evict if a better candidate arrives. If I cannot state that before coding, it will be easy to fix one example while breaking another.

### Approach selection — approximately 07:00-13:00

**Marcus Lee — Interviewer:** How would you start?

**Lakshmi Rao — Candidate:** A direct baseline would count every signature and sort all distinct signatures by descending count and ascending name, which costs O(d log d) after counting. It is useful as a correctness reference on small inputs, but it does not meet the upper bound. I would not implement it as the final answer unless the constraints were much smaller.

**Marcus Lee — Interviewer:** Can we do better under the stated constraints?

**Lakshmi Rao — Candidate:** I would use count in a hash map, then maintain a size-k min-heap whose root is the worst retained item: lower count is worse, and for equal count lexicographically larger is worse. The reason is not only the familiar pattern: it avoids repeating work while preserving enough state to decide the next update. I will keep the implementation close to the invariant and avoid clever compression until the tests pass.

**Marcus Lee — Interviewer:** What invariant will tell you the approach is still correct as the input changes?

**Lakshmi Rao — Candidate:** After processing each distinct signature, the heap contains the best k items among those considered, and its root is the first item to evict if a better candidate arrives. I will check it at the point where state changes, not only after the loop finishes.

**Marcus Lee — Interviewer:** What alternative did you reject, and what cost does your chosen structure introduce?

**Lakshmi Rao — Candidate:** I rejected the baseline because it repeats work at the stated scale. My chosen state is a frequency map and a min-heap of at most k count-signature pairs using a comparator that reverses the tie direction at the root, so the cost is additional memory and more careful update ordering. I accept that because it turns the dominant repeated work into bounded collection operations. If memory constraints were tighter, I would need a different contract or representation rather than pretend the state is free.

**Marcus Lee — Interviewer:** Okay. Please implement that. Keep explaining major state changes, but you don't need to narrate every character you type.

**Lakshmi Rao — Candidate:** I'll take a moment to set up the function and the core state, then I'll walk through the update logic.

### Implementation and correction — approximately 13:00-24:00

**Marcus Lee — Interviewer:** Talk me through the function signature and result shape before the loop.

**Lakshmi Rao — Candidate:** I'll use a function that accepts the exact input and returns the requested result without mutating caller-owned data unless the prompt permits it. I handle the empty case first, initialize a frequency map and a min-heap of at most k count-signature pairs using a comparator that reverses the tie direction at the root, and keep best-result state separate from current working state. That separation prevents a later update from corrupting the answer already found.

**Marcus Lee — Interviewer:** What happens during one normal iteration?

**Lakshmi Rao — Candidate:** I read the next logical item, update the working state, then restore validity using the rule implied by the invariant. Only after the state is valid do I compare it with the best result. The core approach is count in a hash map, then maintain a size-k min-heap whose root is the worst retained item: lower count is worse, and for equal count lexicographically larger is worse; I will make each transition visible rather than fold it into one expression.

**Marcus Lee — Interviewer:** Why is that update order important?

**Lakshmi Rao — Candidate:** If I record the answer before restoring the invariant, I can accept an invalid candidate. If I remove state too early, I can lose a valid optimum. The order follows the definition: after processing each distinct signature, the heap contains the best k items among those considered, and its root is the first item to evict if a better candidate arrives. I am adding a short comment about why, not a comment that merely repeats the code.

**Marcus Lee — Interviewer:** What collection operation are you assuming is efficient?

**Lakshmi Rao — Candidate:** The main map, set, heap, queue, or sort operations have their standard expected costs in this language. I would avoid an operation that scans or shifts a linear container inside the main loop. If the language's queue removes from the front of an array in linear time, I would use an indexed head or a real deque.

**Marcus Lee — Interviewer:** Pause and inspect the boundary comparisons in what you wrote.

**Lakshmi Rao — Candidate:** I see the main risk. The implementation currently uses the output ordering directly in the min-heap comparator, causing the lexicographically smaller tied signature to be evicted. That may pass the central example but violates the stated boundary rule. I want to construct the smallest counterexample before I change it so the correction is evidence-driven.

**Marcus Lee — Interviewer:** Use that counterexample. What state changes?

**Lakshmi Rao — Candidate:** On the counterexample, the current code leaves state that should have been updated or evicted. The correct action is to define and test a separate worst-first heap comparator, then sort the final heap by the requested best-first output order. I'll change that line and keep the counterexample as a named test rather than only testing it mentally.

**Marcus Lee — Interviewer:** Continue. How do you produce the result without disturbing correctness?

**Lakshmi Rao — Candidate:** After the main processing finishes, I convert the maintained best state to the requested return format. If reconstruction is required, I do it iteratively where input depth could be large. I keep deterministic tie behavior in one comparison helper so it is not implemented differently in two places.

**Marcus Lee — Interviewer:** Do you need to handle malformed input?

**Lakshmi Rao — Candidate:** The prompt says ordinary inputs satisfy the stated contract, so I won't spend interview time on a full validation layer. I will handle empty or no-result cases that are part of the domain. In production I would validate external input at the boundary and decide whether malformed data is rejected, quarantined, or logged; that is separate from the algorithm.

**Marcus Lee — Interviewer:** Read the code once from the invariant's perspective.

**Lakshmi Rao — Candidate:** Initialization makes the invariant true for an empty prefix. Each iteration updates the new item, restores validity, and records the best state only afterward. The final result comes from state that was valid when recorded. The remaining uncertainty is the exact boundary in the correction, so the next tests should target that before broad random cases.

**Marcus Lee — Interviewer:** Before you type further, give me language-neutral pseudocode.

**Lakshmi Rao — Candidate:** The pseudocode is: validate the ordinary empty case; initialize a frequency map and a min-heap of at most k count-signature pairs using a comparator that reverses the tie direction at the root; iterate through the input in its required order; update the working state; restore or verify the invariant; compare the valid candidate with the best using the tie rule; and reconstruct or format the answer after processing. The problem-specific update is count in a hash map, then maintain a size-k min-heap whose root is the worst retained item: lower count is worse, and for equal count lexicographically larger is worse. Writing this first makes it easier to see whether the code changes the order of two logically separate operations. For this problem, I would verify that reasoning specifically against the heap requirement.

**Marcus Lee — Interviewer:** Give me a short correctness argument, not only intuition.

**Lakshmi Rao — Candidate:** For initialization, the working state represents the empty processed prefix, so the invariant holds. For maintenance, one iteration adds the next item and applies the exact correction needed to restore this invariant: after processing each distinct signature, the heap contains the best k items among those considered, and its root is the first item to evict if a better candidate arrives. We record an answer only while that invariant holds. At termination every input item has been considered, and any candidate that could beat the result was represented when its decisive boundary was processed. The tie comparison preserves the required deterministic choice. For this problem, I would verify that reasoning specifically against the streaming constraints requirement.

**Marcus Lee — Interviewer:** Trace the central example through the actual variables you wrote.

**Lakshmi Rao — Candidate:** I start with the empty state and process the example one item at a time: For timeout, auth, timeout, disk, auth, timeout with k two, return timeout then auth. Their counts are three and two. At each point I would say the current state, whether the invariant is valid, and whether the best result changes. The important trace is the transition that removes, evicts, advances, or reconstructs state; that is where the first implementation was most likely to diverge from the algorithm I described. For this problem, I would verify that reasoning specifically against the memory tradeoff requirement.

**Marcus Lee — Interviewer:** How are you enforcing the tie rule in code?

**Lakshmi Rao — Candidate:** I use one helper that answers whether a new candidate is better than the stored result. It compares the primary score first and only then the specified deterministic tie field. I do not rely on map iteration, heap incidental order, or sort stability unless the language contract guarantees it and the prompt accepts that behavior. A named helper also gives me a direct unit test at the tie boundary. For this problem, I would verify that reasoning specifically against the follow-up scaling requirement.

**Marcus Lee — Interviewer:** What input ownership or mutation assumption does your code make?

**Lakshmi Rao — Candidate:** I will not mutate caller-owned input unless the interface explicitly allows it. If sorting is part of the algorithm, I either copy first or state that in-place sorting is part of the contract. Collections inside the function are local. In production I would also consider memory cost of a copy against API clarity; in an interview, silently changing input creates a surprising side effect and makes later tests order-dependent. For this problem, I would verify that reasoning specifically against the heap requirement.

**Marcus Lee — Interviewer:** How would you use randomized or property testing here?

**Lakshmi Rao — Candidate:** I would generate small valid inputs, compare the optimized answer against the simple baseline that would count every signature and sort all distinct signatures by descending count and ascending name, which costs O(d log d) after counting, and assert structural properties such as determinism, valid indices or order, and the invariant. Small random cases are effective at exposing boundary combinations I did not name. They complement, not replace, targeted tests for the exact bug and product rule. For this problem, I would verify that reasoning specifically against the streaming constraints requirement.

**Marcus Lee — Interviewer:** Is there an integer, recursion, or allocation risk at the upper bound?

**Lakshmi Rao — Candidate:** I would use a numeric type large enough for counts and derived totals, avoid recursive depth proportional to the input, and ensure the inner loop does not create a new substring, array, or object on every step without need. Output allocation is unavoidable where the result itself is large. I would measure before micro-optimizing, but the upper bound is large enough that asymptotically hidden allocation matters. For this problem, I would verify that reasoning specifically against the memory tradeoff requirement.

**Marcus Lee — Interviewer:** If memory became the primary constraint, what would you revisit?

**Lakshmi Rao — Candidate:** I would first separate memory required for an exact answer from convenient implementation state. The current method retains a frequency map and a min-heap of at most k count-signature pairs using a comparator that reverses the tie direction at the root. Some of that can be compressed using indices, integer IDs, packed arrays, or an output-sensitive structure. If the exact contract fundamentally requires state proportional to distinct items or discovered nodes, I would say so and discuss approximation, external storage, or a changed API rather than claim constant space. For this problem, I would verify that reasoning specifically against the follow-up scaling requirement.

**Marcus Lee — Interviewer:** How would this function fail observably in production?

**Lakshmi Rao — Candidate:** I would expose input size, latency, allocation or queue growth where relevant, result cardinality, and counts of invalid or no-result outcomes. I would not log entire sensitive inputs. A rollout could compare the optimized implementation with the trusted baseline on sampled small cases or shadow traffic. If disagreement occurs, retain the stable request identifier and enough bounded state to reproduce it. For this problem, I would verify that reasoning specifically against the heap requirement.

**Marcus Lee — Interviewer:** Read the final implementation as if you were reviewing someone else's code.

**Lakshmi Rao — Candidate:** The function now follows the stated phases and makes the invariant visible. The data structures match the promised complexity, and the product boundary is encoded in one comparison. The remaining review risks are off-by-one behavior, incidental collection ordering, and the correction for the known issue that it originally uses the output ordering directly in the min-heap comparator, causing the lexicographically smaller tied signature to be evicted. The targeted tests cover those before broad happy-path examples. For this problem, I would verify that reasoning specifically against the streaming constraints requirement.

**Marcus Lee — Interviewer:** Suppose the product requirement changes slightly after launch. Which part is easiest to adapt?

**Lakshmi Rao — Candidate:** The parsing and output formatting are separated from the algorithm's invariant and comparison policy, so a return-shape or deterministic tie change should remain localized. A change to exactness, ordering, or input arrival model may invalidate the algorithm and must trigger a fresh design review. I would avoid adding flags that combine several contracts in one hard-to-test loop; two clear implementations can be safer than one highly parameterized one. For this problem, I would verify that reasoning specifically against the memory tradeoff requirement.

**Marcus Lee — Interviewer:** I think there is a case where the code uses the output ordering directly in the min-heap comparator, causing the lexicographically smaller tied signature to be evicted. Can you find it without me giving the input?

**Lakshmi Rao — Candidate:** Yes. The smallest counterexample is one that lands exactly on that boundary or requires the state to change twice. Walking it line by line, the code preserves an invalid or incorrectly ordered state. The root issue is that it uses the output ordering directly in the min-heap comparator, causing the lexicographically smaller tied signature to be evicted; it is not a syntax problem.

**Marcus Lee — Interviewer:** Make that change in the code, then let's test it.

**Lakshmi Rao — Candidate:** I've updated it to define and test a separate worst-first heap comparator, then sort the final heap by the requested best-first output order. I also separated the boundary comparison into a named condition so the product rule is readable. I'll rerun the counterexample first, then the original sample, because fixing the edge should not change the normal path.

### Testing, complexity, and follow-up — approximately 24:00-35:00

**Marcus Lee — Interviewer:** Test 1: one signature. What do you expect?

**Lakshmi Rao — Candidate:** For one signature, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 2: k equal to distinct count. What do you expect?

**Lakshmi Rao — Candidate:** For k equal to distinct count, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 3: all equal frequencies. What do you expect?

**Lakshmi Rao — Candidate:** For all equal frequencies, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 4: a late signature that enters the heap. What do you expect?

**Lakshmi Rao — Candidate:** For a late signature that enters the heap, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 5: a tie at the eviction boundary. What do you expect?

**Lakshmi Rao — Candidate:** For a tie at the eviction boundary, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** Test 6: repeated Unicode strings if the product permits them. What do you expect?

**Lakshmi Rao — Candidate:** For repeated Unicode strings if the product permits them, I would state the exact expected result, walk only the state transition that is different, and verify both the returned value and the relevant tie or parent behavior. This case exists because it can break an assumption that the central sample does not exercise.

**Marcus Lee — Interviewer:** What are the time and space costs of the final version?

**Lakshmi Rao — Candidate:** O(n plus d log k) time and O(d plus k) space, where d is the distinct-signature count; exact counting itself requires O(d) memory. I am including input, output, and maintained state rather than quoting only the loop cost.

**Marcus Lee — Interviewer:** The stream is unbounded and distinct signatures may exceed memory. Exact answers are no longer mandatory, but large errors should be found reliably.

**Lakshmi Rao — Candidate:** I would state that exact arbitrary-frequency top k requires memory proportional to distinct items. For an approximate answer I could use a heavy-hitters algorithm such as Space-Saving with a fixed counter budget, perhaps combined with a Count-Min Sketch for estimates. The API must expose error bounds or approximation semantics rather than silently changing the contract.

**Marcus Lee — Interviewer:** What guarantee becomes weaker or what cost becomes larger in that follow-up?

**Lakshmi Rao — Candidate:** The original correctness argument still applies only where the contract is unchanged. I would explicitly document the new memory, ordering, or approximation cost and add a test that distinguishes it from the original version. I would not silently present a heuristic as the same exact solution.

### Candidate questions and close — approximately 35:00-38:00

**Marcus Lee — Interviewer:** I have what I need. What questions do you have for me?

**Lakshmi Rao — Candidate:** How does this team evaluate a candidate who has the right reasoning but does not finish every line of code?

**Marcus Lee — Interviewer:** We score problem framing, correctness of the chosen approach, communication, code quality, and testing separately. An incomplete but coherent solution can still show useful signal; silent guessing usually does not.

**Lakshmi Rao — Candidate:** That's helpful. I prefer making the tradeoffs visible rather than hiding unfinished work.

**Lakshmi Rao — Candidate:** What kind of problems would an engineer at this level own after joining?

**Marcus Lee — Interviewer:** The team owns production observability and incident tooling and expects engineers at this level to deliver bounded changes through testing and production follow-up.

**Lakshmi Rao — Candidate:** That scope sounds appropriate.

**Lakshmi Rao — Candidate:** Those were my main questions. Thank you for the context and for your time.

**Marcus Lee — Interviewer:** I need to finish my notes and compare them with the rest of the interview team, so I won't give feedback on this call. The recruiter will contact you about the next step within a few business days.

**Lakshmi Rao — Candidate:** Understood. Thank you, Marcus. Have a good day.

**Marcus Lee — Interviewer:** You too, Lakshmi. Take care.

## Timing plan

- Interviewer words: 751 at approximately 145 words per minute.
- Candidate words: 2899 at approximately 125 words per minute.
- Dialogue turns: 107, with approximately 0.4 seconds average turn gap.
- Planned natural thinking, reading, writing, or coding pauses: 8.9 minutes.
- Estimated finished duration: 38.0 minutes; catalog target: 38 minutes.

## Sparse overlap plan

1. The interviewer begins a narrowing follow-up under the final 200 ms of the candidate's broad opening. Keep both voices intelligible and neutral.
2. The candidate starts a brief acknowledgment about 160 ms before the interviewer finishes a later transition. Do not repeat this pattern elsewhere.

## Private coach map

| Moment | Interviewer intent | Candidate signal | Coaching value |
|---|---|---|---|
| Clarification | Check whether the candidate discovers the contract before coding. | The candidate asks about size, empty behavior, and determinism. | Use constraints to eliminate approaches rather than recite them. |
| Invariant | Test whether the pattern is understood beyond recognition. | After processing each distinct signature, the heap contains the best k items among those considered, and its root is the first item to evict if a better candidate arrives. | An invariant makes implementation and debugging explainable. |
| Bug correction | Observe response to disconfirming evidence. | Lakshmi knows the heap strategy but initially gets the tie comparator backward, a common production bug in top-k code. | A calm correction with a counterexample is stronger than defending the first draft. |
| Follow-up | Test whether the candidate preserves guarantees under changed constraints. | The candidate names which cost or guarantee changes. | Do not reuse an algorithm label without rechecking its contract. |

## Deliberate imperfections to preserve

- Lakshmi knows the heap strategy but initially gets the tie comparator backward, a common production bug in top-k code.
- The candidate spends a little too long explaining the first collection choice before the interviewer redirects to code.
- One test expectation is initially verbal rather than written and is added after the probe.

