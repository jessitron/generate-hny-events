// this one is intended to simulate something Duolingo said about people checking performance of deploys.
const uuid = require("uuid");
const runId = uuid.v4();

const fs = require("fs");
const { parse } = require("csv-parse/sync");

function generateEvents() {
  const fileContent = fs.readFileSync("input/release-branch-perf.csv", "utf-8");
  const records = parse(fileContent, {
    columns: true, // Treat first row as headers
    skip_empty_lines: true,
  });

  console.log(records);
  return [];
}

const queryDefinition = {
  time_range: 5184000,
  granularity: 86400,
  calculations: [
    {
      op: "SUM(duration_ms)",
    },
  ],
  filters: [
    {
      column: "runId",
      op: "=",
      value: runId,
    },
  ],
  orders: [],
  havings: [],
  limit: 100,
};

module.exports = { generateEvents, queryDefinition };
