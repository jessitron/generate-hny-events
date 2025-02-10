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

const totalRequestDuration = 20 * 60 * 1000 + jitter(2000);
const timeAfterStepsRun = 129;

const spans = [
  {
    name: "deploy",
    "service.name": "job-runner",
    "span.kind": "server",
    time_offset: 0,
    duration_ms: totalRequestDuration, // TODO: prolly need this to be a sum of the children
    status: "success",
    "job.steps": 8,
    children: [
      {
        name: "retrieve config",
        "service.name": "job-runner",
        "span.kind": "client",
        "http.url": "grpc://build-config/definition",
        time_offset: 10,
        duration_ms: 80 + jitter(20),
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
        consumePercentRemainingParentTime: 0.99,
        children: [
          {
            name: "task: git pull",
            "task.name": "git pull",
            "repository.location":
              "https://github.com/breadfish/salesforce-config",
            "vcs.provider": "github",
            "step.id": uuid.v4(),
            "responsible.party": "source-control-provider",
            duration_ms: 435 + jitter(100),
            "span.kind": "client",
          },
          {
            name: "task: parse metadata files",
            "task.name": "parse metadata files",
            "file.count": 47,
            "step.id": uuid.v4(),
            "responsible.party": "gearset, customer input",
            duration_ms: 223 + jitter(20),
          },
          {
            name: "task: generate dependency graph",
            "task.name": "generate dependency graph",
            "dependency.count": 14,
            "step.id": uuid.v4(),
            "responsible.party": "gearset, customer input",
            duration_ms: 43 + jitter(1),
          },
          {
            name: "task: salesforce auth",
            "task.name": "salesforce auth",
            "target.org": "staging-org-3",
            "step.id": uuid.v4(),
            "responsible.party": "salesforce",
            duration_ms: 10000 + jitter(1000),
          },
          {
            name: "task: retrieve target org metadata",
            "task.name": "retrieve target org metadata",
            "api.calls": 8,
            "step.id": uuid.v4(),
            "responsible.party": "salesforce",
            consumePercentRemainingParentTime: 0.3,
            children: [
              {
                name: "GET /metadata-types",
                "task.name": "list metadata types",
                time_offset: 10,
                consumePercentRemainingParentTime: 0.18,
                "api.calls": 1,
                "metadata.types.count": 42,
              },

              {
                name: "GET /metadata-types/CustomObject",
                "task.name": "retrieve CustomObject definitions",
                consumePercentRemainingParentTime: 0.28,
                "api.calls": 2,
                "objects.count": 15,
              },
              {
                name: "GET /metadata-types/ApexClass",
                "task.name": "retrieve Apex classes",
                consumePercentRemainingParentTime: 0.5,
                "api.calls": 1,
                "classes.count": 23,
              },
              {
                name: "GET /metadata-types/Workflow",
                "task.name": "retrieve Workflows",
                consumePercentRemainingParentTime: 0.25,
                "api.calls": 2,
                "workflows.count": 8,
              },
              {
                name: "GET /metadata-types/Profile",
                "task.name": "retrieve Profiles",
                consumePercentRemainingParentTime: 0.9,
                "api.calls": 2,
                "profiles.count": 6,
              },
              {
                name: "validate completeness",
                "task.name": "validate metadata completeness",
                consumePercentRemainingParentTime: 1,
                "validation.errors": 0,
              },
            ],
          },
          {
            name: "task: diff changes",
            "task.name": "diff changes",
            "step.id": uuid.v4(),
            "responsible.party": "gearset",
            duration_ms: 230,
            "changes.count": 3,
            "changes.types": ["CustomField", "ValidationRule", "ApexClass"],
          },
          {
            name: "task: validate deployment",
            "task.name": "validate deployment",
            "step.id": uuid.v4(),
            "responsible.party": "gearset",
            duration_ms: 273,
            "api.calls": 4,
          },
          {
            name: "task: run apex tests",
            "task.name": "run apex tests",
            "step.id": uuid.v4(),
            "responsible.party": "customer",
            duration_ms: 32453,
            "tests.total": 156,
            "tests.failed": 0,
          },
          {
            name: "task: deploy metadata",
            "task.name": "deploy metadata",
            "step.id": uuid.v4(),
            "responsible.party": "salesforce",
            consumePercentRemainingParentTime: 0.99,
            "api.calls": 6,
            "components.deployed": 3,
          },
          {
            name: "task: verify deployment",
            "task.name": "verify deployment",
            "step.id": uuid.v4(),
            "responsible.party": "gearset",
            consumePercentRemainingParentTime: 1,
            "api.calls": 2,
          },
        ],
      },
    ],
  },
];

const now = new Date().getTime();
const beginningOfTrace = now - totalRequestDuration;
function spansToEvents(spans, parentId, parentStartTimeOffset, parentDuration) {
  var parentDurationRemaining = parentDuration || 0;
  var nextStartTimeOffset = parentStartTimeOffset || 0;

  function useParentTime(duration) {
    parentDurationRemaining -= duration;
    nextStartTimeOffset += duration;
    return duration;
  }
  return spans
    .map((span) => {
      const spanId = uuid.v4();
      if (span.consumePercentRemainingParentTime) {
        span.duration_ms = useParentTime(
          parentDurationRemaining * span.consumePercentRemainingParentTime
        );
      } else {
        useParentTime(span.duration_ms);
      }
      const startTimeOffset =
        nextStartTimeOffset + useParentTime(span.time_offset || 0);
      const event = {
        time: new Date(beginningOfTrace + startTimeOffset).toISOString(),
        data: {
          ...commonAttributes,
          ...span,
          parentDurationRemaining,
          "span.children": span.children?.length || 0,
          "trace.parent_id": parentId,
          "trace.span_id": spanId,
        },
      };
      if (span.children) {
        return [
          event,
          ...spansToEvents(
            span.children,
            spanId,
            startTimeOffset,
            span.duration_ms
          ),
        ];
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
  trace_start_ts: Math.round(beginningOfTrace / 1000) - 60,
  trace_end_ts: Math.round(now / 1000) + 60,
  /*
https://ui.honeycomb.io/<team>/environments/<environment>/datasets/<dataset>/trace?trace_id=<traceId>
  &span=<spanId>
  &trace_start_ts=<ts>
  &trace_end_ts=<ts>
  */
};
module.exports = { generateEvents, queryDefinition };
