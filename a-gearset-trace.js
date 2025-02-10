// this time, let's build a trace that shows that salesforce is the problem.

const uuid = require("uuid");
const traceId = uuid.v4();

const commonAttributes = {
  "deploy.environment": "production",
  "deploy.region": "us-west-2",
  "trace.trace_id": traceId,
  "target.environment": "staging",
  "job.id": "askdfj9382698",
  "customer.id": "12324878934",
  "service.name": "job-runner", // unless overridden
};

function jitter(range) {
  return Math.floor(Math.random() * range) - range / 2;
}

const totalRequestTime = 20 * 60 * 1000 + jitter(2000);
const timeAfterStepsRun = 129;
var usedTime = 0;
function useTime(duration) {
  usedTime += duration;
  return duration;
}
const spans = [
  {
    name: "deploy",
    "service.name": "job-runner",
    "span.kind": "server",
    time_offset: 0,
    duration_ms: totalRequestTime, // TODO: prolly need this to be a sum of the children
    status: "success",
    "job.steps": 8,
    children: [
      {
        name: "retrieve config",
        "service.name": "job-runner",
        "span.kind": "client",
        "http.url": "grpc://build-config/definition",
        time_offset: useTime(10),
        duration_ms: useTime(80 + jitter(20)),
        "http.status": 200,
        children: [
          {
            "trace.parent_id": "B",
            "trace.span_id": "C",
            name: "/definition",
            "service.name": "build-config-store",
            "span.kind": "server",
            "http.url": "grpc://build-config/definition",
            time_offset: 11, // from the beginning of the trace
            duration_ms: 48 + jitter(10),
            "http.status": 200,
          },
        ],
      },
      {
        name: "run steps",
        "service.name": "job-runner",
        "span.kind": "internal",
        "step.id": uuid.v4(),
        "responsible.party": "gearset",
        time_offset: usedTime,
        duration_ms: totalRequestTime - usedTime - timeAfterStepsRun, // this doesn't use time, the steps do
        children: [
          {
            name: "task: git pull",
            "task.name": "git pull",
            "repository.location":
              "https://github.com/breadfish/salesforce-config",
            "vcs.provider": "github",
            "step.id": uuid.v4(),
            "responsible.party": "source-control-provider",
            time_offset: usedTime,
            duration_ms: useTime(435 + jitter(100)),
            "span.kind": "client",
          },
          {
            name: "task: parse metadata files",
            "task.name": "parse metadata files",
            "file.count": 47,
            "step.id": uuid.v4(),
            "responsible.party": "gearset, customer input",
            time_offset: usedTime,
            duration_ms: useTime(223 + jitter(20)),
          },
          {
            name: "task: generate dependency graph",
            "task.name": "generate dependency graph",
            "dependency.count": 14,
            "step.id": uuid.v4(),
            "responsible.party": "gearset, customer input",
            time_offset: usedTime,
            duration_ms: useTime(43 + jitter(1)),
          },
          {
            name: "task: salesforce auth",
            "task.name": "salesforce auth",
            "target.org": "staging-org-3",
            "step.id": uuid.v4(),
            "responsible.party": "salesforce",
            time_offset: usedTime,
            duration_ms: useTime(10000 + jitter(1000)),
          },
          {
            name: "task: retrieve target org metadata",
            "task.name": "retrieve target org metadata",
            "api.calls": 8,
            "step.id": uuid.v4(),
            "responsible.party": "salesforce",
            time_offset: usedTime,
            duration_ms: 176234, // the children will use the time
            children: [
              {
                name: "GET /metadata-types",
                "task.name": "list metadata types",
                time_offset: usedTime + useTime(10),
                duration_ms: useTime(445),
                "api.calls": 1,
                "metadata.types.count": 42,
              },

              {
                name: "GET /metadata-types/CustomObject",
                "task.name": "retrieve CustomObject definitions",
                time_offset: usedTime,
                duration_ms: useTime(890),
                "api.calls": 2,
                "objects.count": 15,
              },
              {
                name: "GET /metadata-types/ApexClass",
                "task.name": "retrieve Apex classes",
                time_offset: usedTime,
                duration_ms: useTime(567),
                "api.calls": 1,
                "classes.count": 23,
              },
              {
                name: "GET /metadata-types/Workflow",
                "task.name": "retrieve Workflows",
                time_offset: usedTime,
                duration_ms: useTime(678),
                "api.calls": 2,
                "workflows.count": 8,
              },
              {
                name: "GET /metadata-types/Profile",
                "task.name": "retrieve Profiles",
                time_offset: usedTime,
                duration_ms: useTime(654) + useTime(11) * 0, // look, a little gap after this one
                "api.calls": 2,
                "profiles.count": 6,
              },
              {
                name: "validate completeness",
                "task.name": "validate metadata completeness",
                time_offset: usedTime,
                duration_ms: useTime(21),
                "validation.errors": 0,
              },
            ],
          },
          {
            name: "task: diff changes",
            "task.name": "diff changes",
            "step.id": uuid.v4(),
            "responsible.party": "gearset",
            time_offset: usedTime,
            duration_ms: useTime(230),
            "changes.count": 3,
            "changes.types": ["CustomField", "ValidationRule", "ApexClass"],
          },
          {
            name: "task: validate deployment",
            "task.name": "validate deployment",
            "step.id": uuid.v4(),
            "responsible.party": "gearset",
            time_offset: usedTime,
            duration_ms: useTime(273),
            "api.calls": 4,
          },
          {
            name: "task: run apex tests",
            "task.name": "run apex tests",
            "step.id": uuid.v4(),
            "responsible.party": "customer",
            time_offset: usedTime,
            duration_ms: useTime(32453),
            "tests.total": 156,
            "tests.failed": 0,
          },
          {
            name: "task: deploy metadata",
            "task.name": "deploy metadata",
            "step.id": uuid.v4(),
            "responsible.party": "salesforce",
            time_offset: usedTime,
            duration_ms: useTime(298902),
            "api.calls": 6,
            "components.deployed": 3,
          },
          {
            name: "task: verify deployment",
            "task.name": "verify deployment",
            "step.id": uuid.v4(),
            "responsible.party": "gearset",
            time_offset: usedTime,
            duration_ms: useTime(1041),
            "api.calls": 2,
          },
        ],
      },
    ],
  },
];

const now = new Date().getTime();
const beginningOfTrace = now - totalRequestTime;
function spansToEvents(spans, parentId) {
  return spans
    .map((span) => {
      const spanId = uuid.v4();
      const event = {
        time: new Date(beginningOfTrace + span.time_offset).toISOString(),
        data: {
          ...commonAttributes,
          ...span,
          "trace.parent_id": parentId,
          "trace.span_id": spanId,
        },
      };
      if (span.children) {
        return [event, ...spansToEvents(span.children, spanId)];
      }
      return event;
    })
    .flat();
}

function generateEvents() {
  return spansToEvents(spans, null);
}

const queryDefinition = {
  trace_id: traceId,
  trace_start_ts: Math.round(beginningOfTrace / 1000),
  trace_end_ts: Math.round(now / 1000),
  /*
https://ui.honeycomb.io/<team>/environments/<environment>/datasets/<dataset>/trace?trace_id=<traceId>
  &span=<spanId>
  &trace_start_ts=<ts>
  &trace_end_ts=<ts>
  */
};
module.exports = { generateEvents, queryDefinition };
