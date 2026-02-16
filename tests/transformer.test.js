const {
    groupByType,
    buildSetPayload,
    buildMetadataPayload
} = require('../src/services/qradar-connector/transformer');

const sample = [
    {
        id: 'ioc-1',
        type: 'ip',
        value: '1.2.3.4',
        confidence: 90,
        threat_level: 'high',
        first_seen: '2024-01-01T00:00:00Z',
        last_seen: '2024-01-02T00:00:00Z',
        tags: ['c2'],
        threat_actor: { name: 'APT-X' },
        campaign: { name: 'OpX' }
    }
];

test('groups by type', () => {
    const g = groupByType(sample);
    expect(g.ip).toHaveLength(1);
});

test('builds set payload', () => {
    const payload = buildSetPayload('ip', sample);
    expect(payload.data[0].value).toBe('1.2.3.4');
    expect(payload.data[0].first_seen).toBeDefined();
});

test('builds metadata payload', () => {
    const meta = buildMetadataPayload(sample);
    const threatLevel = meta.data.find(d => d.inner_key === 'threat_level');
    expect(threatLevel.value).toBe('high');
});
