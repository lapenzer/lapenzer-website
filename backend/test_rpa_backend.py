import math
import unittest
from backend.rpa_core import Edge, Node, Observation, bayesian_shrinkage, candidate_probabilities, distance_only_probabilities, generalized_resistance, map_match, stable_softmax

class RpaBackendTests(unittest.TestCase):
    def test_softmax(self):
        p = stable_softmax([1000, 1001, 999])
        self.assertAlmostEqual(sum(p), 1.0, places=12)
        self.assertTrue(all(math.isfinite(x) for x in p))

    def test_distance_special_case(self):
        d = [1, 2, 3]
        p = distance_only_probabilities(d, .7)
        raw = [math.exp(-.7 * x) for x in d]
        z = sum(raw)
        for a, b in zip(p, [x/z for x in raw]): self.assertAlmostEqual(a, b, places=12)

    def test_resistance_can_prefer_longer_safer_path(self):
        short = Edge("s", "a", "b", 1.0, terrain=1, risk=1)
        long = Edge("l", "a", "c", 1.4, terrain=0, risk=0)
        rs, _ = generalized_resistance(short, {"terrain": 1.2, "risk": 1.8})
        rl, _ = generalized_resistance(long, {"terrain": 1.2, "risk": 1.8})
        self.assertLess(rl, rs)

    def test_map_match_current_observation_only(self):
        nodes = [Node("A", 0, 0), Node("B", 10, 0)]
        result = map_match(nodes, Observation(timestamp=1, x=.1, y=0, accuracy_m=1), 2)
        self.assertEqual(result[0][0], "A")
        self.assertAlmostEqual(sum(p for _, p in result), 1.0, places=12)

    def test_node_attraction_affects_candidate_probability(self):
        p = candidate_probabilities([0, 0], [1, 3], [1, 1])
        self.assertGreater(p[1], p[0])

    def test_shrinkage(self):
        self.assertAlmostEqual(bayesian_shrinkage(0, 0, .25, 20), .25)
        self.assertGreater(bayesian_shrinkage(9, 10, .25, 20), .25)

if __name__ == "__main__": unittest.main()
