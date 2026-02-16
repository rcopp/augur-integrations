jest.mock("../src/services/qradar-connector/qradarClient", () => {
    return jest.fn().mockImplementation(() => ({
        bulkLoadSet: jest.fn(),
        bulkLoadMap: jest.fn()
    }));
});

const Connector = require("../src/services/qradar-connector/connector");

describe("connector batching", () => {
    test("chunks indicators", async () => {
        const connector = new Connector();

        const inds = Array.from({ length: 250 }, (_, i) => ({
            id: i,
            type: "ip",
            value: "1.1.1." + i
        }));

        await connector.sendIndicators(inds);

        const client = connector.client;

        expect(client.bulkLoadSet).toHaveBeenCalled();
    });
});
