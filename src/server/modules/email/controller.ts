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

  sendMessage = async (toArr: String[], link: string) => {
    const to = toArr.join(", ");
    try {
      const info = await this.transporter.sendMail({
        from: `"Budjet App" <noreply@onmi.io>`,
        to,
        subject: "Reset Password",
        text: "Reset password",
        html: `<a href=${link}>Перейдите по ссылке для сброса пароля!</b>`,
      });
      console.log({ info });
    } catch (e) {
      console.error("sendMail failed:", e instanceof Error ? e.message : e);
      throw new AppError("error from ");
    }
  };
}

export const sendEmailController = new SendEmailController();
