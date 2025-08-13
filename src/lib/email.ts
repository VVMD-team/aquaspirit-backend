import nodemailer from "nodemailer";

import { getExtensionFromBase64 } from "@/lib/helpers";

import { ENV } from "@/env";

import { Boat } from "@/custom-types/Boat";

import { clientEmails, defaultClientEmail } from "@/constants/clientEmails";

type Params = Boat;

export const sendEmails = async ({
  name,
  country,
  email,
  phone,
  city,
  comment,
  screen,
  link,
  ...dynamicFields
}: Params) => {
  const transporter = nodemailer.createTransport({
    host: ENV.EMAIL_SMTP_HOST as string,
    port: +ENV.EMAIL_SMTP_SSL_PORT as number,
    secure: true,
    auth: {
      type: "login",
      user: ENV.EMAIL_SMTP_USERNAME,
      pass: ENV.EMAIL_SMTP_PASSWORD,
    },
  });

  // const base64String = screen;

  // const matches = base64String.match(/^data:(.+);base64,(.+)$/);

  // let buffer: Buffer;
  // if (matches) {
  //   buffer = Buffer.from(matches[2], "base64");
  // } else {
  //   buffer = Buffer.from(base64String, "base64");
  // }

  // const extension = getExtensionFromBase64(base64String);

  // if (!extension) {
  //   throw new Error("Can't get file extension from base64 string");
  // }

  const selectedValues = Object.entries(dynamicFields)
    .filter(([, v]) => typeof v === "string" && v.trim() !== "")
    .sort(([a], [b]) => {
      const tabRe = /^tab-(\d+)-color-(\d+)$/;
      const optRe = /^option-(\d+)$/;
      const aTab = tabRe.exec(a);
      const bTab = tabRe.exec(b);
      if (aTab && bTab) return +aTab[1] - +bTab[1] || +aTab[2] - +bTab[2];
      if (aTab && !bTab) return -1;
      if (!aTab && bTab) return 1;
      const aOpt = optRe.exec(a);
      const bOpt = optRe.exec(b);
      if (aOpt && bOpt) return +aOpt[1] - +bOpt[1];
      return a.localeCompare(b);
    })
    .map(([, v]) => `- ${v!.trim()}`)
    .join("\n");

  const emailFrom = `"Aquaspirit" <${ENV.EMAIL_SMTP_USERNAME}>`;
  const emailSubject = `Order: ${name} `;

  const emailTemplate = `
Name: ${name}
Country: ${country}
Email: ${email}
Phone: ${phone}
City: ${city}
${comment ? `Comment: ${comment}` : ""}
Link: ${link}

Selected:
${selectedValues || "(none)"}`;

  // const emailAttachments = [
  //   {
  //     filename: `Boat.${extension}`,
  //     content: buffer,
  //   },
  // ];

  const mailOptionsBasic = {
    from: emailFrom,

    subject: emailSubject,
    text: emailTemplate,
    // attachments: emailAttachments,
  };

  const mailOptionsUser = {
    ...mailOptionsBasic,
    to: email,
  };

  const mailOptionsClient = {
    ...mailOptionsBasic,
    // to: clientEmails[country] || defaultClientEmail,
    to: "vvmd.internal.team@gmail.com",
  };

  const [respEmailUser, respEmailClient] = await Promise.all([
    transporter.sendMail(mailOptionsUser),
    transporter.sendMail(mailOptionsClient),
  ]);

  const isSuccess = (resp: typeof respEmailUser) =>
    resp.accepted.length > 0 &&
    resp.rejected.length === 0 &&
    /^250/.test(resp.response);

  const sucessUserEmail = isSuccess(respEmailUser);
  const sucessClientEmail = isSuccess(respEmailClient);

  if (!sucessUserEmail) {
    console.error("respEmailUser: ", respEmailUser.rejected);
  }

  if (!sucessClientEmail) {
    console.error("respEmailClient: ", respEmailClient.rejected);
  }

  return { sucessUserEmail, sucessClientEmail };
};
