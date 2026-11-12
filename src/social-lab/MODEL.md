# Model specification and research limits

Version: **AISNL-1.0.0**. Time is an integer simulation tick; event IDs order actions within a tick. Save metadata uses UTC wall-clock timestamps. Statistical decisions use a serializable Mulberry32 stream initialized from an FNV-style seed hash.

## Individuals and trait generation

Each fictional adult has 27 traits in [0,1], a continuous opinion in [-1,1], mood in [-1,1], energy, initial affiliation, goals and memory. Names and ages do not determine psychological traits. Initial affiliations are `id mod number_of_groups`; their initial opinion means differ, with noise. This is an explicit modelling assumption, not an emergent finding.

Traits are sampled from a normal, uniform or bimodal distribution centered on configurable means, then clipped to [0,1]. A shared latent Gaussian factor positively loads agreeableness, empathy, honesty and cooperativeness, and negatively loads narcissism, Machiavellianism, aggression, competitiveness and self-interest. Clipping and mixture choice change realized marginal moments and correlations. “Trait variation” is the input scale, not a guarantee of achieved standard deviation.

The input “cognitive ability” is only a simulation parameter controlling detection and memory capacity. It is not an IQ assessment. There is no inference about protected groups or real people. Population identities are deliberately minimal; rich biographical narratives, demographic survey calibration and editable personal-history text are not implemented.

## Local social process

1. Select at most `ceil(N * activation)` distinct initiators, bounded by `maxInteractions` (default 2,500). Initiation can fail based on extraversion, energy and social anxiety.
2. Discover a random individual with a probability affected by curiosity, openness, impulsiveness, risk tolerance and loyalty, or consider up to five known outgoing neighbors. Partner utility combines opinion similarity, trust and in-group preference.
3. The recipient can reject the interaction based on anxiety, extraversion, similarity and mood.
4. The statistical action policy uses honesty, strategic self-interest, agreeableness, empathy, aggression, competitiveness, opinion distance, persuasion, approval seeking, cooperativeness and bounded memory. Categories are cooperation, argument, deception, persuasion, gossip, public post and passive observation.
5. Update beliefs, mood, trust and relationship strength. Add a tie probabilistically when it did not exist. Current affiliations remain distinct from algorithmically detected communities.
6. Add event references to memory. Memory capacity is 4–16 events. Additional forgetting can remove the oldest event. No agent can read the full event log when deciding.
7. Decay unlocked edge strengths toward zero and dissolve sufficiently weak, old relationships. Recover energy and move mood toward neutral.

Statistical language is generated from category-specific templates and is explicitly labelled as such. Language is an observation of the chosen action; the state-transition model creates outcomes. Template variation does not determine relationship outcomes.

## State transitions

Opinion similarity is `1 - abs(opinion_a - opinion_b)/2`. Successful routine interaction adds approximately 0.025–0.10 to edge strength, depending on agreeableness and similarity. Arguments subtract a trait- and disagreement-dependent amount. Detected deception reduces strength by 0.22 and trust by 0.20 before the usual trust update. Undetected deception can shift opinion. Gossip has a small positive or negative effect based on the source's honesty.

Persuasion uses learning rate, source persuasiveness, recipient openness, suggestibility, trust propensity and the existing tie's trust. Cooperation causes a smaller opinion update. Arguments slightly repel opinions. Local conformity can move a recipient toward up to eight known outgoing neighbors; irrationality can produce a small bounded belief perturbation. A public post reaches up to 12 locally known outgoing neighbors. This is a bounded fan-out, not a global broadcast.

Tie strength is signed and bounded to [-1,1]; trust is bounded to [0,1]. Relationship layers are attributes on a single ordered (directed) or unordered (undirected) agent pair. Multiple layers can coexist, but there are no independent parallel edge objects with separately evolving weights. Friendship/rivalry/acquaintance layers evolve with strength; family, professional and other manually assigned layers persist. A locked relationship's weight and decay are fixed until a researcher edits it; its agents may still update their beliefs and moods.

Relationship decay is `weight *= (1-decay)`. Strongly negative ties can dissolve during interaction; sufficiently weak ties can dissolve after inactivity. Reciprocity is topology-dependent; the undirected representation has reciprocity one when at least one tie exists.

An information shock directly exposes an expected 15% of agents and moves their opinions according to suggestibility. Information exposure can diffuse through cooperation, gossip, undetected deception and local posts. “Exposure” records contact with the injected information, not agreement or factual accuracy. Initial exposure is zero until a shock or imported state sets it.

Long-term goals guide the optional model prompt and are derived from the starting profile. They are not a separate reinforcement-learning system. There is no hidden reward-trained cognition. Coalitions are observed as connected communities; explicit coalition negotiation, autonomous demographic change and individual mobility histories beyond events are not implemented.

## Graph generation

| Generator            | Rule and limits                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Erdős–Rényi          | Independent edge probability, geometric skipping; no self loops or duplicates.                                                                         |
| Watts–Strogatz       | Even-degree ring lattice, then per-edge rewiring; near-complete rings can saturate.                                                                    |
| Barabási–Albert      | Preferential attachment through a degree-proportional urn; target mean degree approximately twice attachment count.                                    |
| Fitness preferential | Preferential attachment with power-law-distributed, capped fitness. This is not a guarantee of a specified degree power-law exponent.                  |
| Stochastic block     | Independent within- and between-affiliation probabilities.                                                                                             |
| Geometric            | Euclidean radius on a unit square, with spatial buckets; boundary agents have fewer potential contacts. Directed mode creates reciprocal initial arcs. |
| Custom               | CSV-like `source,target,weight` lines, zero-based IDs.                                                                                                 |

## Network statistics

Density counts all existing ties, including negative ones. Directed density is `m/(n(n-1))`; undirected density is `2m/(n(n-1))`. Mean degree is outgoing degree for directed graphs and incident degree for undirected graphs. Isolation means no incident ties, even in directed graphs.

Clustering, transitivity, label-propagation communities, modularity, degree assortativity, eigenvector centrality and degree inequality use the unweighted undirected projection, including negative ties. This convention is explicit: these metrics measure contact structure, not positive friendship alone. Community labels are computational summaries, not validated social categories.

PageRank and unweighted betweenness use graph direction. Closeness is **outbound harmonic closeness**, normalized by `n-1`, so it remains defined for disconnected networks. Average path length considers reachable ordered pairs only. A disconnected directed/undirected graph has no finite global diameter. “Max reachable distance” is a different quantity.

Browser betweenness and path metrics are exact through 200 nodes, then use 32 deterministic source samples. Harmonic closeness is exact for the displayed top 200 agents. Clustering is sampled through at most 400 agents and 120 neighbors per agent; high-degree truncation is approximate. The server uses NetworkX with independently disclosed sample thresholds. Stochastic community algorithms differ between the browser and server, so community partitions can differ even when basic graph metrics agree.

Opinion polarization is the population variance of opinions, not a validated sociological polarization scale. Cooperation and conflict rates are cumulative fractions of accepted interactions; rejected invitations are logged separately and do not enter their denominators. Conflict counts arguments and detected deception. Tie formation, dissolution and triadic closure have explicit event counters. Affiliation segregation compares the fraction of same-affiliation ties with the population's squared affiliation shares; it is descriptive and does not adjust for every structural confounder.

## Experiments and inference

Each replication gets a seed string of `experiment_seed/replication/index`. The same replication index is paired across parameter levels. Changing a parameter can change random-number consumption, so common seed strings do not imply identical counterfactual event schedules. Run-level outcomes, rather than agents or edges, are the units of inference.

The browser computes 2,000 run bootstrap resamples and 4,999 paired sign-flip permutations, with a plus-one p-value correction. Paired standardized effects use the standard deviation of run differences. Holm adjustment controls multiplicity across comparisons to the first parameter level. Displayed confidence intervals are exploratory and unadjusted. Three replications are technically permitted but produce unstable inference; use more runs for substantive research.

The Python API supports descriptive t intervals, repeated-measures ANOVA, cluster-robust OLS and binomial regression, descriptive correlation, linear sensitivity and paired bootstrap/permutation comparisons. Model assumptions still need to be checked. No statistical procedure validates the underlying behavioural rules. Findings are not real-world causal claims.

Current interactive sweeps expose agreeableness, aggression, homophily and exploration with a fixed duration. Population sweeps, arbitrary factorial experiments, editable hypotheses, general automatic stopping conditions and an arbitrary statistical formula designer are not included. They can be scripted by calling the shared engine or headless API. This is a working research foundation, not the entire unrestricted platform described in the original brief.

## Persistence, replay and resource bounds

- Browser event journals are stored in IndexedDB until site data is cleared; named saves and portable JSON archives include available journal events. The in-memory event window is 20,000 events. A saved state retains the latest 10,000 metric measurements. Exports identify retained data rather than inventing missing history.
- Checkpoints: at most 80 for populations up to 1,000; 12 through 5,000; 4 through 20,000 at intervals of 20 ticks; and one for larger populations at intervals of 20 ticks. Each checkpoint stores the last 300 events, any older events still referenced by social memory, and the last 300 measurements plus the complete graph, agent states and random state. Save a run or export JSON for longer-term records.
- The graph renders at most 650 nodes, combining edge-anchored and uniformly spaced IDs. This visual sample is not statistically representative; all simulation metrics use the full population unless specifically labelled sampled. Subgraphs omit connections to unrendered nodes, so visual isolation in a sample is not evidence of population isolation.
- Interactive graph budget: 100,000 agents and 600,000 relationships. Dense requests are rejected rather than silently reducing requested probabilities. Actual feasibility depends on browser memory and hardware.
- Large populations retain individual state but cap active initiators per tick; they are not all individually activated at every step. Expensive operations run in a worker. Large dense centrality calculations may still be costly.
- Browser and headless statistical modes use the same kernel. Reproduction requires the same model version, initial state, parameters, random state and intervention schedule. Save/load preserves exact continuation. An exported final-state graph alone is insufficient to reconstruct a prior event stream.
- Server runs and background job specifications/results are durable SQL records. One background experiment executes at a time. A server restart marks in-flight jobs interrupted; submit the saved specification again. Automatic resume of an interrupted background experiment from a partial replication is not implemented.
- Live SSE/WebSocket transport and server-side simulation scheduling are not required by this implementation: workers send progress directly to the UI, and headless jobs use progress polling.
- Optional local-model inference is budgeted and its outputs are recorded. Live Ollama and live PostgreSQL integration require those services and are not implied by unit or SQLite integration tests.
