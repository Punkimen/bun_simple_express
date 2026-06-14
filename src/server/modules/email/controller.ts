import { createTransport } from "nodemailer";

class SendEmailController {
  transporter = createTransport({
    host: "connect.smtp.bz",
    port: 587,
    secure: false,
    auth: {
      type: "login",
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });
  secondTransporter = createTransport(
    `smtps://${process.env.SMTP_EMAIL}:${process.env.SMTP_PASS}@connect.smtp.bz/?pool=true`,
  );
  verifyTransporter = async () => {
    console.log(process.env.SMTP_EMAIL, process.env.SMTP_PASS);
    const res = await this.transporter.verify();
    console.log({ res });
    return res;
  };
}

export const sendEmailController = new SendEmailController();
