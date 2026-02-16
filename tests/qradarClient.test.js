jest.mock("axios");

const axios = require("axios");
const QRadarClient = require("../src/services/qradar-connector/qradarClient");

describe("qradarClient", () => {
    test("retries on network error", async () => {
        axios.create.mockReturnValue({
            post: jest
                .fn()
                .mockRejectedValueOnce(new Error("net"))
                .mockResolvedValue({ status: 200 })
        });

        process.env.QRADAR_SEC_TOKEN = "x";

        const client = new QRadarClient();

        await client.bulkLoadSet("test", {});

        expect(axios.create().post).toHaveBeenCalledTimes(2);

        client.limiter.stop();
    });
});
