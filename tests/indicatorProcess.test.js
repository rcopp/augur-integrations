const mockSendIndicators = jest.fn().mockResolvedValue(true);
const mockConnector = { sendIndicators: mockSendIndicators };

const { createProcessor } = require("../src/webhook/processors/qradarIndicatorProcessor");
const { processIndicators } = createProcessor(mockConnector);

describe("indicatorProcessor", () => {
    beforeEach(() => {
        mockSendIndicators.mockClear();
    });

    test("sends new indicators", async () => {
        await processIndicators([{ id: "1", last_seen: "2026-01-01" }], mockConnector);

        expect(mockSendIndicators).toHaveBeenCalledTimes(1);
    });
});
