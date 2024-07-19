const prompt = msg => `
Extract transaction details from ${msg} using this JSON Schema:
{
  "type": "object",
  "properties": {
    "amount": {
      "type": "number",
      "minimum": 0.01,
      "description": "The amount of the expense (positive number)"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "The date of the expense (YYYY-MM-DD format)"
    },
    "category": {
      "type": "string",
      "description": "The category of the expense (e.g., Groceries, Rent)"
    },
    "description": {
      "type": "string",
      "description": "Optional description of the expense"
    },
    "transaction_id": {
      "type": "string",
      "description": "Optional transaction ID of the expense"
    },
    "payment_method": {
      "type": "string",
      "enum": [
        "Cash",
        "Bank Card",
        "Mobile Money",
        "Other"
      ],
      "description": "Optional payment method for the expense"
    }
  }
}`;

post(
  '/v1beta/models/gemini-1.5-flash:generateContent',
  {
    query: {
      key: $.configuration.apiKey,
    },
    body: {
      contents: [
        {
          parts: [
            {
              text: state => prompt(state.message.text),
            },
          ],
        },
      ],
    },
  },
  state => {
    // Not really reliable way of extracting transaction information
    state.transaction = JSON.parse(
      state.data.candidates[0].content.parts[0].text.match(
        /```json\n([\s\S]*?)\n```/
      )[1]
    );

    return state;
  }
);

/**
 * Experiment with Stream Generate Content
 * */

// post(
//   '/v1beta/models/gemini-1.5-flash:streamGenerateContent',
//   {
//     query: {
//       alt: 'sse',
//       key: $.configuration.apiKey,
//     },
//     body: {
//       contents: [
//         {
//           parts: [
//             {
//               text: prompt(
//                 'Leo nimekula chapati na maharage pale fifi cafe, nimelipa 2000.'
//               ),
//             },
//           ],
//         },
//       ],
//     },
//   },
//   state => {
//     // console.log(state.data.candidates[0].content.parts[0].text);
//     // state.transaction = JSON.parse(
//     //   state.data.candidates[0].content.parts[0].text.match(
//     //     /```json\n([\s\S]*?)\n```/
//     //   )[1]
//     // );

//     return state;
//   }
// );
