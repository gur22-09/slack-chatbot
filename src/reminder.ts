import { type Handler, schedule } from "@netlify/functions";
import { getNewItems } from "./util/notion";
import { blocks, slackApi } from "./util/slack";

const postNewItemsToSlack: Handler = async (event) => {
  const items = await getNewItems();

  await slackApi("chat.postMessage", {
    channel: process.env.GENERAL_CAHNNEL_ID,
    blocks: [
      blocks.section({
        text: [
          "Here are the Latest Food takes!",
          "",
          ...items.map(
            (item) => `- ${item.opinion} (spice level: *${item.spiceLevel}*)`
          ),
          "",
          `See all items : <https://notion.com/${process.env.NOTION_DATABASE_ID}|in Notion>`,
        ].join("\n"),
      }),
    ],
  });

  return {
    statusCode: 200,
  }
};

export const handler = schedule('0 9 * * 1',postNewItemsToSlack);
// export const handler = schedule('* * * * *',postNewItemsToSlack);

