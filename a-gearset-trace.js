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
};

function jitter(range) {
  return Math.floor(Math.random() * range) - range / 2;
}

const totalRequestTime = 20 * 60 * 1000 + jitter(2000);
const timeAfterStepsRun = 129;
const usedTime = 0;
function useTime(duration) {
  usedTime += duration;
  return duration;
}
const spans = [
  {
    "trace.span_id": "A",
    name: "deploy",
    "service.name": "job-runner",
    "span.kind": "server",
    time_offset: 0,
    duration: totalRequestTime,
    status: "success",
    "job.steps": 8,
  },
  {
    "trace.parent_id": "A",
    "trace.span_id": "B",
    name: "retrieve config",
    "service.name": "job-runner",
    "span.kind": "client",
    "http.url": "grpc://build-config/definition",
    time_offset: useTime(10),
    duration: useTime(80 + jitter(20)),
    "http.status": 200,
  },
  {
    "trace.parent_id": "B",
    "trace.span_id": "C",
    name: "/definition",
    "service.name": "build-config-store",
    "span.kind": "server",
    "http.url": "grpc://build-config/definition",
    time_offset: 11,
    duration: 48 + jitter(10),
    "http.status": 200,
  },
  {
    "trace.parent_id": "A",
    "trace.span_id": "C", // this is the parent of all the steps
    name: "run steps",
    "service.name": "job-runner",
    "span.kind": "internal",
    "step.id": uuid.v4(),
    "responsible.party": "gearset",
    time_offset: usedTime,
    duration: totalRequestTime - usedTime - timeAfterStepsRun, // this doesn't use time, the steps do
  },
  {
    "trace.parent_id": "C",
    "trace.span_id": "D",
    name: "task: git pull",
    "task.name": "git pull",
    "repository.location": "https://github.com/breadfish/salesforce-config",
    "vcs.provider": "github",
    "step.id": uuid.v4(),
    "responsible.party": "source-control-provider",
    time_offset: usedTime,
    duration_ms: useTime(435 + jitter(100)),
    "span.kind": "client",
  },
  {
    "trace.parent_id": "C",
    "trace.span_id": "E",
    name: "task: parse metadata files",
    "task.name": "parse metadata files",
    "file.count": 47,
    "step.id": uuid.v4(),
    "responsible.party": "gearset, customer input",
    time_offset: usedTime,
    duration_ms: useTime(223 + jitter(20)),
  },
  {
    "task.name": "generate dependency graph",
    "dependency.count": 14,
    "step.id": uuid.v4(),
    "responsible.party": "gearset, customer input",
    time_offset: usedTime,
    duration_ms: useTime(43 + jitter(1)),
  },
  {
    "task.name": "salesforce auth",
    "target.org": "staging-org-3",
    "step.id": uuid.v4(),
    "responsible.party": "salesforce",
    time_offset: usedTime,
    duration_ms: useTime(10000 + jitter(1000)),
  },
  {
    "task.name": "retrieve target org metadata",
    "api.calls": 8,
    "step.id": uuid.v4(),
    "responsible.party": "salesforce",
    time_offset: usedTime,
    duration_ms: useTime(3*60 + jitter(10000)),
  },
  {
    "task.name": "diff changes",
    duration_ms: 234,
    "changes.count": 3,
    "changes.types": ["CustomField", "ValidationRule", "ApexClass"],
  },
  {
    "task.name": "validate deployment",
    duration_ms: 5673,
    "api.calls": 4,
  },
  {
    "task.name": "run apex tests",
    duration_ms: 12453,
    "tests.total": 156,
    "tests.failed": 0,
  },
  {
    "task.name": "deploy metadata",
    duration_ms: 8902,
    "api.calls": 6,
    "components.deployed": 3,
  },
  {
    "task.name": "verify deployment",
    duration_ms: 2341,
    "api.calls": 2,
  },
];
