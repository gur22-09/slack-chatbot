import type { HandlerEvent } from "@netlify/functions";
import { createHmac } from "crypto";

export function slackApi(
  endpoint: SlackApiEndpoint,
  body: SlackApiRequestBody
) {
  return fetch(`https://slack.com/api/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_OAUTH_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  }).then((res) => res.json());
}

export function verifySlackRequest(request: HandlerEvent) {
  const secret = process.env.SLACK_SIGNING_SECRET!;
  const signature = request.headers["x-slack-signature"];
  const timestamp = Number(request.headers["x-slack-request-timestamp"]);
  const now = Math.floor(Date.now() / 1000); // precison of slack timestamp is smaller than js timestamp

  if (Math.abs(now - timestamp) > 300) {
    return false;
  }

  const hash = createHmac("sha256", secret)
    .update(`v0:${timestamp}:${request.body}`)
    .digest("hex");

  return `v0=${hash}` === signature;
}

export async function getRandomCatImageUrl() {
  return fetch(`https://api.thecatapi.com/v1/images/search`, {
    method: "GET",
  })
    .then((res) => res.json())
    .then((data) => data[0].url);
}
