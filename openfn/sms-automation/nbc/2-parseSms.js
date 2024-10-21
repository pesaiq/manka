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
          keyphrase: "",
          template: "",
        },
      ],
      deposit: [
        {
          keyphrase: "",
          template: "",
        },
      ],
    },

    sw: {
      deposit: [
        {
          keyphrase: "imewekwa kwenye akaunti yako",
          template:
            "Mpendwa Mteja, <currency> <amount> imewekwa kwenye akaunti yako <destination> tarehe <timestamp>. <ads>.",
        },
      ],
      withdraw: [
        {
          keyphrase: "imetolewa kwenye akaunti yako",
          template:
            "Mpendwa Mteja, <currency> <amount> imetolewa kwenye akaunti yako <source> tarehe <timestamp>. <ads>.",
        },
      ],
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

  const mappedTransactionData = convertKeysToSnakeCase({
    ...transactionData,
    type,
    currency: transactionData.currency.replace(/^Tsh(s)?$/, "TZS"),
    rawData: state.sms,
  });

  console.log(mappedTransactionData);

  return { ...state, mappedTransactionData };
});
