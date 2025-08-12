import { Request, Response } from "express";

import { countryList } from "@/constants/countryList";

import { Boat, BoatBase, BoatDynamicFields } from "@/custom-types/Boat";

import { sendEmails } from "@/lib/email";
import { appendToSheet } from "@/lib/google-sheets";

export default async function sendBoatsData(req: Request, res: Response) {
  try {
    const {
      name,
      country,
      email,
      phone,
      city,
      comment,
      screen,
      link,
      ...rest
    } = req.body;

    if (!country) {
      res.status(400).send({ error: "Country is required" });
    }

    if (!countryList.includes(country)) {
      res.status(400).send({ error: "Invalid Country" });
    }

    if (!name || !email || !phone || !screen || !link) {
      res.status(400).send({ error: "Missing required fields" });
    }

    const dynamicKeys = Object.keys(rest).filter(
      (key) =>
        /^tab-\d+-color-\d+-(name|value)$/.test(key) || // tab-X-color-Y-name/value
        /^option-\d+-(text|code)$/.test(key) // option-X-text/code
    );

    const dynamicFields: BoatDynamicFields = Object.fromEntries(
      dynamicKeys.map((key) => [key, rest[key]])
    );

    const dataBase: BoatBase = {
      name,
      country,
      email,
      phone,
      city,
      comment,
      screen,
      link,
    };

    const data: Boat = {
      ...dataBase,
      ...dynamicFields,
    };

    const [{ sucessUserEmail, sucessClientEmail }, successSheet] =
      await Promise.all([sendEmails(data), appendToSheet(data)]);

    const success = sucessUserEmail && sucessClientEmail && successSheet;

    res.status(success ? 200 : 500).json({
      success,
      successSheet,
      sucessUserEmail,
      sucessClientEmail,
    });
  } catch (error) {
    res.status(500).json({
      error: `Error sending data: ${error}`,
    });
  }
}
