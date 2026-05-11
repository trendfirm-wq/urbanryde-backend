const axios = require('axios');

const formatGhanaPhoneNumber = (phone) => {
  if (!phone) return null;

  let cleaned = phone.toString().replace(/\s+/g, '').replace(/-/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith('0')) {
    cleaned = `233${cleaned.substring(1)}`;
  }

  if (cleaned.startsWith('233')) {
    return cleaned;
  }

  return null;
};

const sendVerificationSms = async ({ to, code }) => {
  console.log('SMS SERVICE STARTED');
console.log('SMS TO:', to);
console.log('SMS CODE:', code);
console.log('HUBTEL CLIENT ID EXISTS:', !!process.env.HUBTEL_SMS_CLIENT_ID);
console.log('HUBTEL SECRET EXISTS:', !!process.env.HUBTEL_SMS_CLIENT_SECRET);
console.log('HUBTEL SENDER EXISTS:', !!process.env.HUBTEL_SMS_SENDER_ID);
  if (
    !process.env.HUBTEL_SMS_CLIENT_ID ||
    !process.env.HUBTEL_SMS_CLIENT_SECRET ||
    !process.env.HUBTEL_SMS_SENDER_ID
  ) {
    throw new Error('Hubtel SMS settings are missing in environment variables');
  }

  const formattedPhone = formatGhanaPhoneNumber(to);

  if (!formattedPhone || !/^233\d{9}$/.test(formattedPhone)) {
    throw new Error('Invalid Ghana phone number. Use format 233XXXXXXXXX');
  }

  const content = `Your UrbanRyde verification code is ${code}. It expires in 10 minutes.`;

  const response = await axios.get('https://sms.hubtel.com/v1/messages/send', {
    params: {
      clientsecret: process.env.HUBTEL_SMS_CLIENT_SECRET,
      clientid: process.env.HUBTEL_SMS_CLIENT_ID,
      from: process.env.HUBTEL_SMS_SENDER_ID,
      to: formattedPhone,
      content,
    },
  });

  console.log('HUBTEL SMS RESPONSE:', response.data);

  if (Number(response.data?.status) !== 0) {
    throw new Error(
      response.data?.statusDescription || 'Hubtel SMS request failed'
    );
  }

  return response.data;
};

module.exports = {
  formatGhanaPhoneNumber,
  sendVerificationSms,
};