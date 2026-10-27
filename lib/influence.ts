export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
export function influenceExample(reliability: number, exposure: number, disagreement = false) {
  const feature = (reliability * .8 + .7 * .2) / (reliability + .7);
  const change = feature - .3;
  const components = [sigmoid(-1.5 + 2 * feature), sigmoid(-1 + 2 * change), sigmoid((disagreement ? 2.6 : -1.4) + (disagreement ? -1 : 2) * exposure)];
  const weights = [.4, .3, .3];
  const probability = components.reduce((sum, p, i) => sum + p * weights[i], 0);
  const variance = components.reduce((sum, p, i) => sum + weights[i] * (p - probability) ** 2, 0);
  const entropy = -probability * Math.log(probability) - (1 - probability) * Math.log(1 - probability);
  return { feature, change, components, probability, variance, entropy, abstain: reliability < .35 || variance > .025 || entropy > .685 };
}
