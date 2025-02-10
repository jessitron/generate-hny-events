// #!/usr/bin/env node

async function main(apiKey, datasetName, queryDefinition) {
  if (!apiKey) {
    console.log("no HONEYCOMB_API_KEY environment variable");
    process.exit(0);
  }

  try {
    const response = await fetch("https://api.honeycomb.io/1/auth", {
      headers: { "X-Honeycomb-Team": apiKey },
    });

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();

    const teamSlug = data.team?.slug;
    const envSlug = data.environment?.slug;

    if (!teamSlug || !envSlug) {
      console.error(
        "Error: Unable to extract team or environment slug from response."
      );
      process.exit(1);
    }

    const envUrl = `https://ui.honeycomb.io/${teamSlug}/environments/${envSlug}/datasets/${datasetName}${queryString(
      queryDefinition
    )}`;
    console.log("Look for events in:", envUrl);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

function queryString(queryDefinition) {
  if (queryDefinition.calculations) {
    return `?query=${encodeURIComponent(JSON.stringify(queryDefinition))}`;
  }
  if (queryDefinition.trace_id) {
    return `/trace?trace_id=${queryDefinition.trace_id}&trace_start_ts=${queryDefinition.trace_start_ts}&trace_end_ts=${queryDefinition.trace_end_ts}`;
  }
}

/*
https://ui.honeycomb.io/<team>/environments/<environment>/datasets/<dataset>/trace?trace_id=<traceId>
  &span=<spanId>
  &trace_start_ts=<ts>
  &trace_end_ts=<ts>
  */

// main(process.env.HONEYCOMB_API_KEY, process.env.DATASET_NAME);

module.exports = main;
