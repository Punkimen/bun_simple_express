import { createTransport } from "nodemailer";
import { AppError } from "../../utils/error";

class SendEmailController {
  transporter = createTransport({
    host: "connect.smtp.bz",
    port: 587,
    secure: false,
    auth: {
      type: "login",
      user: process.env.SMTP_EMAIL ?? "",
      pass: process.env.SMTP_PASS ?? "",
    },
  });

  verifyTransporter = async () => {
    const res = await this.transporter.verify();
    return res;
  };

  sendMessage = async () => {
    try {
      const info = await this.transporter.sendMail({
        from: `"Example Team" <${process.env.SMTP_EMAIL}>`,
        to: "punkimen666@gmail.com, punkiment@yandex.ru",
        subject: "Hello",
        text: "Hello world",
        html: "<b>Hello world!</b>",
      });
      console.log({ info });
    } catch (e) {
      throw new AppError(e instanceof Error ? e.message : String(e));
    }
  };
}

export const sendEmailController = new SendEmailController();
