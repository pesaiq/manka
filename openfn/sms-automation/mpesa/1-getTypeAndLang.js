fn((state) => {
  const { text } = state.data;

  // Convert the text to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();

  // Define the transaction type patterns and their associated transaction types and languages
  const patterns = [
    {
      pattern: /deposited|deposit|received/g,
      transactionType: "deposit",
      language: "en",
    },
    {
      pattern: /purchase|transferred|transfer|give|withdrawn|withdraw|sent/g,
      transactionType: "withdraw",
      language: "en",
    },
    {
      pattern: /amechangia|imeingizwa|umepokea|kimewekwa|imewekwa/g,
      transactionType: "deposit",
      language: "sw",
    },
    {
      pattern: /umelipa|zimehamishwa|umetoa|imetumwa|imetolewa/g,
      transactionType: "withdraw",
      language: "sw",
    },
  ];

  // Find the first matching pattern and extract the transaction type and language
  let transactionType = "unknown";
  let language = "unknown";

  for (const item of patterns) {
    if (item.pattern.test(lowerText)) {
      transactionType = item.transactionType;
      language = item.language;
      break;
    }
  }

  const sms = {
    ...state.data,
    type: transactionType,
    language: language,
  };

  return { ...state, sms };
});
