"""Network and statistical analysis; run-level units and explicit projections."""
import math
import numpy as np
import pandas as pd
import networkx as nx
from scipy import stats
import statsmodels.api as sm
import statsmodels.formula.api as smf
from statsmodels.stats.anova import AnovaRM
from statsmodels.stats.multitest import multipletests


def clean(value):
    if isinstance(value, dict):
        return {str(k): clean(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, np.ndarray)):
        return [clean(v) for v in value]
    if isinstance(value, (float, np.floating)):
        return float(value) if math.isfinite(value) else None
    if isinstance(value, np.integer):
        return int(value)
    return value


def network_analysis(state):
    agents, edges = state['agents'], state['edges']
    directed = state['config'].get('directed', False)
    if len(agents) > 100000 or len(edges) > 600000:
        raise ValueError('Graph exceeds the 100,000-agent / 600,000-edge analysis budget.')
    graph = nx.DiGraph() if directed else nx.Graph()
    for a in agents:
        graph.add_node(a['id'], opinion=a.get('opinion', 0), group=a.get('group', 0), name=a.get('name', ''))
    for e in edges:
        if e['source'] not in graph or e['target'] not in graph or e['source'] == e['target']:
            raise ValueError('Invalid graph endpoints.')
        graph.add_edge(e['source'], e['target'], weight=e.get('weight', 0), trust=e.get('trust', .5))
    n = len(graph)
    projection = graph.to_undirected()
    if not n:
        return {'population': 0, 'edges': 0, 'centrality': [], 'method': 'Empty graph.'}
    exact = n <= 300
    source_nodes = list(graph) if exact else list(graph)[::max(1, n // 32)][:32]
    paths = [d for source in source_nodes for target, d in nx.single_source_shortest_path_length(graph, source).items() if target != source]
    samples = list(projection) if n <= 400 else list(projection)[::max(1, n // 400)][:400]
    # Clustering is bounded by degree to keep an analysis request finite.
    sampled_projection = projection if max(dict(projection.degree()).values(), default=0) <= 2000 else projection.subgraph(list(projection)[:3000])
    samples = [v for v in samples if v in sampled_projection]
    communities = list(nx.community.asyn_lpa_communities(projection, seed=17)) if projection.number_of_edges() else [{v} for v in projection]
    modularity = nx.community.modularity(projection, communities, weight=None) if projection.number_of_edges() else 0
    between = nx.betweenness_centrality(graph, k=None if exact else min(32, n), seed=17, weight=None)
    pagerank = nx.pagerank(graph, weight=None)
    top = sorted(graph, key=lambda v: pagerank[v], reverse=True)[:200]
    harmonic = {}
    for source in top:
        distances = nx.single_source_shortest_path_length(graph, source)
        harmonic[source] = sum(1 / d for d in distances.values() if d) / max(1, n - 1)
    try:
        eigen = nx.eigenvector_centrality(projection, max_iter=200, tol=1e-7, weight=None)
    except nx.PowerIterationFailedConvergence:
        eigen = {}
    degree = [d for _, d in projection.degree()]
    sorted_degree = sorted(degree)
    gini = (2 * sum((i + 1) * d for i, d in enumerate(sorted_degree)) / (n * sum(degree)) - (n + 1) / n) if sum(degree) else 0
    connected = nx.is_strongly_connected(graph) if directed else nx.is_connected(graph)
    result = {'population': n, 'edges': graph.number_of_edges(), 'density': nx.density(graph),
              'average_degree': graph.number_of_edges() * (1 if directed else 2) / n,
              'components': nx.number_connected_components(projection),
              'clustering': nx.average_clustering(sampled_projection, nodes=samples) if samples else 0,
              'transitivity': nx.transitivity(sampled_projection),
              'average_reachable_path': float(np.mean(paths)) if paths else None,
              'global_diameter': max(paths) if exact and connected and paths else None,
              'maximum_reachable_distance': max(paths) if paths else None,
              'reciprocity': nx.reciprocity(graph) if directed and graph.number_of_edges() else (1 if graph.number_of_edges() else 0),
              'modularity': modularity, 'community_sizes': sorted(map(len, communities), reverse=True),
              'degree_gini': gini, 'assortativity': None,
              'centrality': [{'id': v, 'name': graph.nodes[v]['name'], 'degree': projection.degree(v),
                             'in_degree': graph.in_degree(v) if directed else graph.degree(v),
                             'out_degree': graph.out_degree(v) if directed else graph.degree(v),
                             'pagerank': pagerank[v], 'betweenness': between[v],
                             'harmonic_closeness': harmonic[v], 'eigenvector': eigen.get(v)} for v in top],
              'method': {'path_sources': len(source_nodes), 'betweenness': 'exact' if exact else '32 sampled sources',
                         'projection': 'Clustering, communities, eigenvector and inequality use the unweighted undirected projection, including negative ties.',
                         'clustering': f'{len(samples)} nodes sampled; high-degree graph may use a 3,000-node induced subgraph.',
                         'paths': 'Outbound, reachable ordered pairs only. Disconnected global diameter is undefined.',
                         'community': 'Seeded asynchronous label propagation, independent of initial affiliation.'}}
    if len(set(degree)) > 1 and projection.number_of_edges():
        result['assortativity'] = nx.degree_assortativity_coefficient(projection, weight=None)
    return clean(result)


def statistical_analysis(payload):
    if payload.get('unit') != 'simulation_run':
        raise ValueError('The unit of inference must be simulation_run. Do not submit interacting agents as independent observations.')
    rows = payload['rows']
    if len(rows) < 6 or len(rows) > 20000:
        raise ValueError('Submit 6–20,000 run-level observations.')
    frame = pd.DataFrame(rows)
    if not {'level', 'replicate', 'value'}.issubset(frame.columns):
        raise ValueError('Each row needs level, replicate and value.')
    if frame.duplicated(['level', 'replicate']).any():
        raise ValueError('Duplicate level/replicate observations.')
    if not np.isfinite(frame[['level', 'replicate', 'value']].to_numpy(dtype=float)).all():
        raise ValueError('Inputs must be finite numbers.')
    if (frame.groupby('level').size() < 3).any():
        raise ValueError('At least three independent replications per level are required.')
    method = payload.get('method', 'descriptive')
    description = 'Independent replication indices are clusters; levels with a shared replication index are paired. Results concern this model only.'
    groups = []
    for level, group in frame.groupby('level'):
        values = group['value'].to_numpy()
        se = stats.sem(values)
        radius = float(stats.t.ppf(.975, len(values) - 1) * se) if se else 0
        groups.append({'level': level, 'n': len(values), 'mean': values.mean(), 'sd': values.std(ddof=1),
                       'ci95': [values.mean() - radius, values.mean() + radius]})
    result = {'unit': 'simulation_run', 'method': method, 'description': description, 'groups': groups}
    if method == 'anova':
        pivot = frame.pivot(index='replicate', columns='level', values='value')
        if pivot.isna().any().any() or pivot.shape[1] < 2:
            raise ValueError('Repeated-measures ANOVA requires complete paired replications across at least two levels.')
        result['anova'] = AnovaRM(frame, 'value', 'replicate', within=['level']).fit().anova_table.reset_index().to_dict(orient='records')
        result['assumptions'] = 'Balanced repeated measures; normal run-level residuals and sphericity (for >2 levels). Bootstrap/permutation comparisons are preferable when assumptions fail.'
    elif method in ('linear', 'sensitivity', 'correlation'):
        model = smf.ols('value ~ level', frame).fit(cov_type='cluster', cov_kwds={'groups': frame['replicate']})
        result['regression'] = {'coefficients': model.params.to_dict(), 'standard_errors': model.bse.to_dict(),
                                'p_values': model.pvalues.to_dict(), 'ci95': model.conf_int().to_dict(orient='index'), 'r_squared': model.rsquared}
        result['correlation_descriptive_only'] = frame[['level', 'value']].corr().iloc[0, 1]
        result['assumptions'] = 'Linear response; independent replication clusters; cluster-robust uncertainty is unreliable with very few clusters.'
    elif method == 'logistic':
        if not set(frame['value']).issubset({0, 1}):
            raise ValueError('Logistic regression requires binary run-level outcomes.')
        model = smf.glm('value ~ level', frame, family=sm.families.Binomial()).fit(cov_type='cluster', cov_kwds={'groups': frame['replicate']})
        result['regression'] = {'coefficients': model.params.to_dict(), 'p_values': model.pvalues.to_dict(),
                                'odds_ratios': np.exp(model.params).to_dict(), 'ci95_log_odds': model.conf_int().to_dict(orient='index')}
    elif method in ('bootstrap', 'permutation'):
        rng = np.random.default_rng(int(payload.get('seed', 17)))
        baseline = min(frame['level'].unique())
        base = frame[frame.level == baseline].set_index('replicate')['value']
        comparisons = []
        for level in sorted(frame.level.unique()):
            if level == baseline:
                continue
            target = frame[frame.level == level].set_index('replicate')['value']
            if set(target.index) != set(base.index):
                raise ValueError('Paired resampling requires matching replication indices.')
            difference = (target.sort_index() - base.sort_index()).to_numpy()
            observed = difference.mean()
            boot = rng.choice(difference, size=(5000, len(difference)), replace=True).mean(axis=1)
            signs = rng.choice([-1, 1], size=(9999, len(difference)))
            p = (1 + np.sum(np.abs((signs * difference).mean(axis=1)) >= abs(observed) - 1e-14)) / 10000
            sd = difference.std(ddof=1)
            comparisons.append({'level': level, 'baseline': baseline, 'difference': observed,
                                'ci95_percentile': np.quantile(boot, [.025, .975]), 'p': p,
                                'paired_standardized_effect': observed / sd if sd else None})
        adjusted = multipletests([c['p'] for c in comparisons], method='holm')[1] if comparisons else []
        for comparison, p in zip(comparisons, adjusted):
            comparison['holm_p'] = p
        result['comparisons'] = comparisons
        result['resamples'] = {'bootstrap': 5000, 'sign_flip_permutations': 9999, 'seed': int(payload.get('seed', 17))}
    elif method != 'descriptive':
        raise ValueError('Unsupported method.')
    return clean(result)
