import { Request, Response } from "express";
import { ENV } from "@/env";

const colorOptionKeysSet = new Set([
  "color-option-1-colors-1",
  "color-option-1-colors-2",
  "color-option-2-colors-1",
  "color-option-2-colors-2",
  "color-option-3-colors-1",
  "color-option-3-colors-2",
  "color-option-4-colors-1",
  "color-option-4-colors-2",
]);

const headers = {
  Authorization: `Bearer ${ENV.WEBFLOW_API_TOKEN}`,
  "Accept-Version": "1.0.0",
  "Content-Type": "application/json",
};

const getWebflowCollectionItems = async (collectionId: string) => {
  const url = `https://api.webflow.com/v2/collections/${collectionId}/items`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch collection ${collectionId}: ${res.statusText}`
    );
  }

  return res.json();
};

type WebflowItem = {
  id: string;
  fieldData: Record<string, any>;
};

const mapItemsToRecord = (items: WebflowItem[]) =>
  items.reduce<Record<string, Record<string, any>>>(
    (acc, { id, fieldData }) => {
      acc[id] = fieldData;
      return acc;
    },
    {}
  );

export default async function getBoatsData(_req: Request, res: Response) {
  try {
    const [boatsData, colorsData, optionsData] = await Promise.all([
      getWebflowCollectionItems(ENV.WEBFLOW_CMS_BOATS_ID),
      getWebflowCollectionItems(ENV.WEBFLOW_CMS_COLORS_ID),
      getWebflowCollectionItems(ENV.WEBFLOW_CMS_OPTIONS_ID),
    ]);

    const colors = mapItemsToRecord(colorsData.items);
    const options = mapItemsToRecord(optionsData.items);

    const boat = boatsData.items[0];

    const enrichedFieldData = { ...boat.fieldData };

    for (const key of Object.keys(enrichedFieldData)) {
      const value = enrichedFieldData[key];

      if (colorOptionKeysSet.has(key) && Array.isArray(value)) {
        enrichedFieldData[key] = value.map(
          (colorId: string) => colors[colorId]
        );
      }
      if (key === "options" && Array.isArray(value)) {
        enrichedFieldData[key] = value.map(
          (optionId: string) => options[optionId]
        );
      }
    }

    res.status(200).json({ id: boat.id, ...enrichedFieldData });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "An error occurred while fetching the CMS item",
    });
  }
}
