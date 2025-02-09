// this one is intended to simulate something Duolingo said about people checking performance of deploys.
const uuid = require("uuid");
const runId = uuid.v4();

const fs = require("fs");
const { parse } = require("csv-parse/sync");

const now = new Date().getTime();

const commonAttributes = {
  name: "GET /word",
  "service.name": "word-lambda",
  "deploy.environment": "production",
  "deploy.region": "us-west-2",
  runId,
};

function generateEvents() {
  const fileContent = fs.readFileSync("input/release-branch-perf.csv", "utf-8");
  const records = parse(fileContent, {
    columns: true, // Treat first row as headers
    skip_empty_lines: true,
  });

  const maxTimeIncrement = Math.max(
    ...records.map((record) => record["time.increment"])
  );
  console.log(" max time increment: " + maxTimeIncrement);
  const events = records.map((record) => {
    const minutesAgo = maxTimeIncrement - record["time.increment"] - 2; // put it a few min into the future
    const unixDate = now - minutesAgo * 60 * 1000;
    const formattedDate = new Date(unixDate).toISOString();
    return {
      time: formattedDate,
      data: {
        ...commonAttributes,
        ...record,
        "lambda.cost": record["duration_ms"] * 0.00001667, // $0.00001667 per ms
      },
    };
  });
  return events;
}

const queryDefinition = {
  time_range: 28800,
  granularity: 0,
  breakdowns: ["release.id"],
  calculations: [
    {
      op: "SUM",
      column: "duration_ms",
    },
  ],
  filters: [],
  filter_combination: "AND",
  orders: [
    {
      column: "duration_ms",
      op: "SUM",
      order: "descending",
    },
  ],
  havings: [],
  trace_joins: [],
  limit: 100,
};

module.exports = { generateEvents, queryDefinition };
