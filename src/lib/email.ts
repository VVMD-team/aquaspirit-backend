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
    service: "gmail",
    auth: {
      user: ENV.EMAIL_SENDER_ADDRESS,
      pass: ENV.EMAIL_SENDER_APP_PASS,
    },
  });

  const base64String = screen;

  const matches = base64String.match(/^data:(.+);base64,(.+)$/);

  let buffer: Buffer;
  if (matches) {
    buffer = Buffer.from(matches[2], "base64");
  } else {
    buffer = Buffer.from(base64String, "base64");
  }

  const extension = getExtensionFromBase64(base64String);

  if (!extension) {
    throw new Error("Can't get file extension from base64 string");
  }

  const emailFrom = `"Aquaspirit" <${ENV.EMAIL_SENDER_ADDRESS}>`;
  const emailSubject = `Order: ${name} `;

  const emailTemplate = `
        Name: ${name}
        Country: ${country}
        Email: ${email}
        Phone: ${phone}
        City: ${city}
        Comment: ${comment}
        Link: ${link}
    
        ${JSON.stringify(dynamicFields)}
        `;

  const emailAttachments = [
    {
      filename: `Boat.${extension}`,
      content: buffer,
    },
  ];

  const mailOptionsBasic = {
    from: emailFrom,

    subject: emailSubject,
    text: emailTemplate,
    attachments: emailAttachments,
  };

  const mailOptionsUser = {
    ...mailOptionsBasic,
    to: email,
  };

  const mailOptionsClient = {
    ...mailOptionsBasic,
    to: clientEmails[country] || defaultClientEmail,
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
