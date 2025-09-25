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
    const errorText = await res.text();
    throw new Error(
      `Failed to fetch collection ${collectionId}: ${res.status} ${res.statusText} — ${errorText}`
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

const getMappedWebflowItems = async (collectionId: string) => {
  const response = await getWebflowCollectionItems(collectionId);
  return mapItemsToRecord(response.items);
};

const transformItemsWithReferenceFields = async (
  items: Record<string, Record<string, any>>,
  referenceFieldsMap: Record<string, string>,
  preloadedCollections: Record<string, Record<string, any>> = {}
): Promise<typeof items> => {
  const requiredCollectionIds = Array.from(
    new Set(Object.values(referenceFieldsMap))
  );

  const collectionMaps: Record<string, Record<string, any>> = {
    ...preloadedCollections,
  };

  for (const collectionId of requiredCollectionIds) {
    if (!collectionMaps[collectionId]) {
      collectionMaps[collectionId] = await getMappedWebflowItems(collectionId);
    }
  }

  const updatedItems: typeof items = {};

  for (const [itemId, item] of Object.entries(items)) {
    const newItem = { ...item };

    for (const [fieldName, collectionId] of Object.entries(
      referenceFieldsMap
    )) {
      const sourceMap = collectionMaps[collectionId];
      const fieldValue = item[fieldName];

      if (Array.isArray(fieldValue)) {
        newItem[fieldName] = fieldValue
          .map((refId: string) => {
            const resolved = sourceMap?.[refId];
            if (!resolved) {
              console.warn(
                `[WARN] Item "${itemId}": missing reference "${refId}" in field "${fieldName}" (collection: ${collectionId})`
              );
            }
            return resolved;
          })
          .filter(Boolean);
      }
    }

    updatedItems[itemId] = newItem;
  }

  return updatedItems;
};

export default async function getBoatsData(req: Request, res: Response) {
  try {
    const { id: boatId } = req.params;

    if (!boatId) {
      return res.status(400).json({ message: "Boat ID is required!" });
    }

    const [boatData, colorsMap, optionsMap] = await Promise.all([
      getWebflowCollectionItems(ENV.WEBFLOW_CMS_BOATS_ID, boatId),
      getMappedWebflowItems(ENV.WEBFLOW_CMS_COLORS_ID),
      getMappedWebflowItems(ENV.WEBFLOW_CMS_OPTIONS_ID),
    ]);

    const referenceFieldsMap = {
      "filter-colors": ENV.WEBFLOW_CMS_COLORS_ID,
      "mutual-exclusion-option": ENV.WEBFLOW_CMS_OPTIONS_ID,
      "activator-option": ENV.WEBFLOW_CMS_OPTIONS_ID,
      "related-options": ENV.WEBFLOW_CMS_OPTIONS_ID,
      "related": ENV.WEBFLOW_CMS_OPTIONS_ID,
    };

    const [colorsTransformed, optionsTransformed] = await Promise.all([
      transformItemsWithReferenceFields(colorsMap, referenceFieldsMap, {
        [ENV.WEBFLOW_CMS_COLORS_ID]: colorsMap,
        [ENV.WEBFLOW_CMS_OPTIONS_ID]: optionsMap,
      }),
      transformItemsWithReferenceFields(optionsMap, referenceFieldsMap, {
        [ENV.WEBFLOW_CMS_COLORS_ID]: colorsMap,
        [ENV.WEBFLOW_CMS_OPTIONS_ID]: optionsMap,
      }),
    ]);

    const enrichedFieldData = { ...boatData.fieldData };

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

    const enrichedBoat = { id: boatData.id, ...enrichedFieldData };

    res.status(200).json(enrichedBoat);
  } catch (error) {
    console.error("[ERROR]", error);
    res.status(500).json({
      error: "An error occurred while fetching the CMS items",
    });
  }
}
