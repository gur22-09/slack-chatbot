import type { Handler } from "@netlify/functions";

import { parse } from "querystring";
import {
  getRandomCatImageUrl,
  slackApi,
  verifySlackRequest,
} from "./util/slack";

async function handleSlashCommand(payload: SlackSlashCommandPayload) {
  switch (payload.command) {
    case "/foodfight":
      const catUrl = await getRandomCatImageUrl();
      const response = await slackApi("chat.postMessage", {
        channel: payload.channel_id,
        attachments: [
          {
            fallback: "Plain-text summary of the attachment.",
            color: "#2eb886",
            pretext: "Don't you just love cats",
            fields: [
              {
                title: "Priority",
                value: "High",
                short: false,
              },
            ],
            image_url: catUrl,
            thumb_url: "https://cdn2.thecatapi.com/images/YXjvj-hjW.jpg",
          },
        ],
        text: "Things are happening!",
      });

      if (!response.ok) {
        console.log(response);
      }
      break;

    default:
      return {
        statusCode: 200,
        body: `Command ${payload.command} is not recognized`,
      };
  }

  return {
    statusCode: 200,
    body: "",
  };
}

export const handler: Handler = async (event) => {
  // validate the Slack request
  const isValid = verifySlackRequest(event);
  if (!isValid) {
    console.error("invalid request");
    return {
      statusCode: 400,
      body: "invalid request",
    };
  }

  // TODO handle slash commands
  const body = parse(event.body ?? "") as SlackPayload;

  if (body) {
    return handleSlashCommand(body as SlackSlashCommandPayload);
  }
  // TODO handle interactivity (e.g. context commands, modals)

  return {
    statusCode: 200,
    body: "TODO: Lets build an Awesome Slack bot!",
  };
};
