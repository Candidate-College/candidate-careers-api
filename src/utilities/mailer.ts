import transporter from '@/config/mailer';

exports.sendMail = async (
  to: string,
  subject: string,
  html: string,
) => {
  return transporter.sendMail({
    from: process.env.MAILER_SENDER,
    to,
    subject,
    html,
  });
};

exports.mockMailer = () => {};
