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

    if (!name || !email || !phone || !city || !comment || !screen || !link) {
      res.status(400).send({ error: "Missing required fields" });
    }

    const dynamicKeys = Object.keys(rest).filter(
      (key) =>
        /^tab-\d+-color-\d+$/.test(key) || /^option-\d+-(text|code)$/.test(key)
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

    // temporary
    res.status(200).json({ data });

    // const [{ sucessUserEmail, sucessClientEmail }, successSheet] =
    //   await Promise.all([sendEmails(data), appendToSheet(dataBase)]);

    // const success = sucessUserEmail && sucessClientEmail && successSheet;

    // res.status(success ? 200 : 500).json({
    //   success,
    //   successSheet,
    //   sucessUserEmail,
    //   sucessClientEmail,
    // });
  } catch (error) {
    res.status(500).json({
      error: `Error sending email: ${error}`,
    });
  }
}
