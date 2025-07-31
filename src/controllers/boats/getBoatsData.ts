import { Request, Response } from "express";
import { ENV } from "@/env";
import { colorOptionKeys } from "@/constants/colorOptionKeys";

const colorOptionKeysSet = new Set(colorOptionKeys);

const headers = {
  Authorization: `Bearer ${ENV.WEBFLOW_API_TOKEN}`,
  "Accept-Version": "1.0.0",
  "Content-Type": "application/json",
};

const getWebflowCollectionItems = async (
  collectionId: string,
  itemId?: string
) => {
  const url = `https://api.webflow.com/v2/collections/${collectionId}/items${
    itemId ? `/${itemId}` : ""
  }`;

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

const transformItemsWithFilterItems = async (
  items: Record<string, Record<string, any>>,
  filterCollectionId: string
): Promise<typeof items> => {
  const response = await getWebflowCollectionItems(filterCollectionId);
  const filterMap = mapItemsToRecord(response.items); // { [id]: fieldData }

  const updatedColors: typeof items = {};

  for (const [key, item] of Object.entries(items)) {
    if (Array.isArray(item["filter-colors"])) {
      updatedColors[key] = {
        ...item,
        "filter-colors": item["filter-colors"]
          .map((id: string) => filterMap[id])
          .filter(Boolean),
      };
    } else {
      updatedColors[key] = item;
    }
  }

  return updatedColors;
};

// filter-colors

export default async function getBoatsData(req: Request, res: Response) {
  try {
    const { id: boatId } = req.params;

    if (!boatId) {
      return res.status(400).send({ message: "Boat ID is required!" });
    }

    const [boatsData, colorsData, optionsData] = await Promise.all([
      getWebflowCollectionItems(ENV.WEBFLOW_CMS_BOATS_ID, boatId),
      getWebflowCollectionItems(ENV.WEBFLOW_CMS_COLORS_ID),
      getWebflowCollectionItems(ENV.WEBFLOW_CMS_OPTIONS_ID),
    ]);

    const colors = mapItemsToRecord(colorsData.items);
    const options = mapItemsToRecord(optionsData.items);

    const [colorsTransformed, optionsTransformed] = await Promise.all([
      transformItemsWithFilterItems(colors, ENV.WEBFLOW_CMS_COLORS_ID),
      transformItemsWithFilterItems(options, ENV.WEBFLOW_CMS_COLORS_ID),
    ]);

    const enrichedBoats = boatsData.items.map((boat: WebflowItem) => {
      const enrichedFieldData = { ...boat.fieldData };

      for (const key of Object.keys(enrichedFieldData)) {
        const value = enrichedFieldData[key];

        if (colorOptionKeysSet.has(key) && Array.isArray(value)) {
          enrichedFieldData[key] = value.map(
            (colorId: string) => colorsTransformed[colorId]
          );
        }
        if (key === "options" && Array.isArray(value)) {
          enrichedFieldData[key] = value.map(
            (optionId: string) => optionsTransformed[optionId]
          );
        }
      }

      return { id: boat.id, ...enrichedFieldData };
    });

    res.status(200).json(enrichedBoats);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "An error occurred while fetching the CMS items",
    });
  }
}
