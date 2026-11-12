"""Integration checks for durable storage, inference boundaries and research APIs."""
import os
os.environ['AISNL_DATABASE_URL'] = 'sqlite://'
os.environ['AISNL_ENABLE_LLM'] = '0'
import pytest
from fastapi.testclient import TestClient
from src.server.main import app


@pytest.fixture
def client():
    with TestClient(app) as client:
        yield client


def test_shared_engine_save_and_exact_continuation(client):
    payload = {'config': {'n': 20, 'seed': 'api-check', 'topology': 'block'}, 'steps': 5}
    first = client.post('/api/simulate', json=payload)
    assert first.status_code == 200, first.text
    state = first.json()
    resumed = client.post('/api/simulate', json={'state': state, 'steps': 5})
    complete = client.post('/api/simulate', json={**payload, 'steps': 10})
    assert resumed.json() == complete.json()
    run = {'id': 'integration-run', 'name': 'Integration', 'savedAt': '2026-11-11T20:00:00Z',
           'tick': 5, 'n': 20, 'seed': 'api-check', 'data': {'state': state}}
    assert client.put('/api/runs/integration-run', json=run).status_code == 200
    restored = client.get('/api/runs/integration-run').json()
    assert restored['data']['state'] == state
    assert any(r['id'] == run['id'] for r in client.get('/api/runs').json())
    assert client.delete('/api/runs/integration-run').status_code == 200
    assert client.get('/api/runs/integration-run').status_code == 404


def test_networkx_disconnected_and_directed_definitions(client):
    graph = {'config': {'directed': True}, 'agents': [{'id': i, 'name': str(i)} for i in range(3)],
             'edges': [{'source': 0, 'target': 1}, {'source': 1, 'target': 2}]}
    response = client.post('/api/analyze', json=graph)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result['global_diameter'] is None
    assert result['average_reachable_path'] == pytest.approx(4 / 3)
    assert result['reciprocity'] == 0
    center = next(a for a in result['centrality'] if a['id'] == 1)
    assert center['betweenness'] == .5


def test_statistical_unit_validation_and_paired_analysis(client):
    rows = [{'level': level, 'replicate': r, 'value': .2 * level + .03 * r + .002 * r * level}
            for level in [.2, .5, .8] for r in range(8)]
    assert client.post('/api/statistics', json={'rows': rows, 'unit': 'agent'}).status_code == 422
    response = client.post('/api/statistics', json={'rows': rows, 'unit': 'simulation_run', 'method': 'permutation', 'seed': 42})
    assert response.status_code == 200, response.text
    result = response.json()
    assert len(result['comparisons']) == 2
    assert all(c['holm_p'] >= c['p'] for c in result['comparisons'])
    regression = client.post('/api/statistics', json={'rows': rows, 'unit': 'simulation_run', 'method': 'linear'})
    assert regression.status_code == 200, regression.text
    assert regression.json()['regression']['coefficients']['level'] > 0
    anova = client.post('/api/statistics', json={'rows': rows, 'unit': 'simulation_run', 'method': 'anova'})
    assert anova.status_code == 200, anova.text


def test_background_experiment_uses_canonical_engine(client):
    response = client.post('/api/experiments', json={
        'config': {'n': 12, 'seed': 'jobs', 'topology': 'erdos', 'probability': .1},
        'spec': {'variable': 'agreeableness', 'values': [.2, .8], 'replications': 3, 'steps': 4, 'outcome': 'density', 'seed': 'job-42'}})
    assert response.status_code == 202, response.text
    job = client.get('/api/experiments/' + response.json()['id']).json()
    assert job['status'] == 'complete', job
    assert job['completed'] == 6
    assert len(job['result']['rows']) == 6


def test_no_credentials_or_inference_needed_for_core_and_pdf(client):
    health = client.get('/api/health').json()
    assert health['status'] == 'ok'
    assert health['models'] == []
    request = {'model': 'local-model', 'agent': {}, 'partner': {}, 'memories': [], 'mode': 'hybrid'}
    assert client.post('/api/cognition', json=request).status_code == 503
    state = client.post('/api/simulate', json={'config': {'n': 6, 'seed': 'pdf'}, 'steps': 1}).json()
    report = client.post('/api/report', json={'state': state})
    assert report.status_code == 200
    assert report.content.startswith(b'%PDF-')
    assert client.get('/api/nonexistent').status_code == 404
