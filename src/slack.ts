import type { Handler } from "@netlify/functions";

import { parse } from "querystring";
import {
  getRandomCatImageUrl,
  slackApi,
  verifySlackRequest,
  blocks,
  modal,
} from "./util/slack";
import {
  FOOD_FIGHT_MODAL_ID,
  FOOD_FIGHT_MODAL_TITLE,
  FOOD_FIGHT_NUDGE_ID,
  GENERAL_CAHNNEL_ID,
  SPICE_LEVELS_OPTIONS,
} from "./constants";
import { saveItem } from "./util/notion";

async function handleSlashCommand(payload: SlackSlashCommandPayload) {
  switch (payload.command) {
    // case "/foodfight": {
    //   const catUrl = await getRandomCatImageUrl();
    //   const response = await slackApi("chat.postMessage", {
    //     channel: payload.channel_id,
    //     attachments: [
    //       {
    //         fallback: "Plain-text summary of the attachment.",
    //         color: "#2eb886",
    //         pretext: "Don't you just love cats",
    //         fields: [
    //           {
    //             title: "Priority",
    //             value: "High",
    //             short: false,
    //           },
    //         ],
    //         image_url: catUrl,
    //         thumb_url: "https://cdn2.thecatapi.com/images/YXjvj-hjW.jpg",
    //       },
    //     ],
    //     text: "Things are happening!",
    //   });

    //   if (!response.ok) {
    //     console.log(response);
    //   }
    //   break;
    // }

    case "/foodfight":
      const response = await slackApi(
        "views.open",
        modal({
          id: FOOD_FIGHT_MODAL_ID,
          title: "Start food fight",
          trigger_id: payload.trigger_id,
          blocks: [
            blocks.sections({
              text: FOOD_FIGHT_MODAL_TITLE,
            }),
            blocks.input({
              id: "opinion",
              label: "Deposit your contriversial food opinions here",
              placeholder:
                "Example: peanut butter and mayonise sandwish are delicious!",
              initial_value: payload.text ?? "",
              hint: "What do you believe about food that people find apalling ? Say it with your chest!",
            }),
            blocks.select({
              id: "spice_level",
              label: "How spicy is this opinion?",
              placeholder: "Select a spice level",
              options: SPICE_LEVELS_OPTIONS,
            }),
          ],
        })
      );
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

async function handleInteractivity(payload: SlackModalPayload) {
  const callback_id = payload.callback_id ?? payload.view.callback_id;

  switch (callback_id) {
    case FOOD_FIGHT_MODAL_ID:
      const data = payload.view.state.values;
      const fields = {
        opinion: data.opinion_block.opinion.value,
        spiceLevel: data.spice_level_block.spice_level.selected_option.value,
        submitter: payload.user.name,
      };

      await saveItem({
        ...fields,
      });

      await slackApi("chat.postMessage", {
        channel: GENERAL_CAHNNEL_ID,
        text: `Oh dang, y'all :eyes: <@${payload.user.id}> just started a food fight with a ${fields.spiceLevel} take :\n\n *${fields.opinion}*\n\n...discuss 😈`,
      });
      break;

    case FOOD_FIGHT_NUDGE_ID:
      const channelId = payload.channel?.id;
      const userId = payload.user.id;
      const threadTimestamp = payload.message.thread_ts ?? payload.message.ts;

      await slackApi("chat.postMessage", {
        channel: channelId,
        thread_ts: threadTimestamp,
        text: `Hey <@${userId}>, an opinion like this one deserves a heated public debate. Run the \`/foodfight\` slash command in a main channel to start one!`,
      });
      break;
    default:
      console.log(`no handler defined for ${callback_id}`);
      return {
        statusCode: 400,
        body: `no handler defined for ${callback_id}`,
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

  // handle slash commands
  const body = parse(event.body ?? "") as SlackPayload;

  if (body.command) {
    return handleSlashCommand(body as SlackSlashCommandPayload);
  }
  //handle interactivity (e.g. context commands, modals)
  if (body.payload) {
    const payload = JSON.parse(body.payload);
    return handleInteractivity(payload);
  }

  return {
    statusCode: 200,
    body: "TODO: Lets build an Awesome Slack bot!",
  };
};
