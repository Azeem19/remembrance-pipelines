// Cloudflare Worker — airtable-proxy.js
// Cypher Innovation Studio | Remembrance Day Project
// Receives consent records from the intake form.
// Holds the Airtable token securely — never exposed to the browser.
// Deploy via: wrangler deploy

const AIRTABLE_BASE_ID = "appXFYw4mym1tKckG";
const AIRTABLE_TABLE  = "Consent Records";
const AIRTABLE_URL    = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    // Parse incoming consent payload from the React form
    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    // Validate required fields
    const required = ["interviewee", "date", "interviewer"];
    for (const field of required) {
      if (!payload[field]) {
        return json({ error: `Missing required field: ${field}` }, 400);
      }
    }

    // Map form JSON → Airtable fields
    const fields = {
      Interviewee:     payload.interviewee,
      Date:            payload.date,
      Interviewer:     payload.interviewer,
      Location:        payload.location        ?? "",
      ConsentFor:      (payload.consent_for ?? []).join(", "),
      RetentionUntil:  payload.retention_until ?? "indefinite",
      Embargo:         payload.embargo         ?? "",
      CommunityReview: payload.community_review ?? true,
      Notes:           payload.notes           ?? "",
      Initials:        payload.signed_by_initials ?? "",
      RecordedAt:      payload.consent_recorded_at ?? new Date().toISOString(),
      Status:          "Pending Review",
      RawJSON:         JSON.stringify(payload),
    };

    // POST to Airtable
    const airtableRes = await fetch(AIRTABLE_URL, {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${env.AIRTABLE_TOKEN}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    const airtableData = await airtableRes.json();

    if (!airtableRes.ok) {
      console.error("Airtable error:", airtableData);
      return json({ error: "Airtable rejected the record", detail: airtableData }, 502);
    }

    return json({
      success: true,
      record_id: airtableData.id,
      message: `Consent record created for ${payload.interviewee}. Status: Pending Review.`
    }, 201);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
