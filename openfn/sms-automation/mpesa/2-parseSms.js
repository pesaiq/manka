function parseTextWithTemplate(template, inputText) {
  // Escape special characters in the template for regex
  const escapedTemplate = template.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Create a regex pattern to match placeholders enclosed in < >
  const regexPattern = escapedTemplate.replace(/<([^>]+)>/g, "(.*?)");

  const regex = new RegExp(regexPattern, "i");
  const matches = inputText.match(regex);

  if (!matches) {
    return null; // No match found
  }

  const values = matches.slice(1);

  const result = {};
  const placeholders = template
    .match(/<(\w+)>/g)
    .map((match) => match.slice(1, -1));

  for (let i = 0; i < placeholders.length; i++) {
    result[placeholders[i]] = values[i];
  }

  return result;
}

function camelToSnake(camelCaseString) {
  return camelCaseString.replace(
    /[A-Z]/g,
    (letter) => `_${letter.toLowerCase()}`
  );
}

function convertKeysToSnakeCase(obj) {
  if (obj === null || typeof obj !== "object") return obj;

  return Array.isArray(obj)
    ? obj.map(convertKeysToSnakeCase)
    : Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [
          camelToSnake(k),
          convertKeysToSnakeCase(v),
        ])
      );
}

fn((state) => {
  const { language, type, text, from } = state.sms;
  const parsers = {
    en: {
      withdraw: [
        {
          keyphrase: "Give Tsh",
          template:
            "<transactionId> Confirmed. On <timestamp> Give <amount> to <destination> New balance is <balance>. <ads>.",
        },
        {
          keyphrase: "sent to LUKU",
          template:
            "<transactionId> Confirmed. <amount> sent to <destination> on <timestamp> Total fee <fee> (<feeDescription>). Balance is <balance>.",
        },
        {
          keyphrase: "sent to business",
          template:
            "<transactionId> Confirmed. <amount> sent to business <destination> on <timestamp>. New M-Pesa balance is <balance>.",
        },
        {
          keyphrase: "sent to",
          template:
            "<transactionId> Confirmed. <amount> sent to <destination> on <timestamp> Total fee <fee> (<feeDescription>). New balance is <balance>.",
        },
      ],
      deposit: [
        {
          keyphrase: "You have received",
          template:
            "<transactionId> Confirmed.You have received <amount> from <source> on <timestamp> New M-Pesa balance is <balance>.",
        },
      ],
    },

    sw: {
      deposit: [],
    },
  };

  const smsPatterns = parsers[language][type];

  const getSmsParser = (sms) => {
    for (const pattern of smsPatterns) {
      if (sms.includes(pattern.keyphrase)) {
        return pattern.template;
      }
    }
    return null;
  };

  const template = getSmsParser(text);

  const transactionData = parseTextWithTemplate(template, text);

  const formattedAmount = transactionData["amount"].replace(/[^\d.]/g, "");
  const formattedBalance = parseFloat(
    transactionData["balance"].replace(/[^\d.]/g, "")
  );
  const currency = transactionData["amount"].match(/[^\d.]+/)[0]; // Extract non-numeric characters

  const mappedTransactionData = convertKeysToSnakeCase({
    ...transactionData,
    type,
    amount: formattedAmount,
    currency: currency.replace(/^Tsh(s)?$/, "TZS"),
    balance: formattedBalance,
    rawData: state.sms,
  });

  console.log(mappedTransactionData);

  return { ...state, mappedTransactionData };
});
