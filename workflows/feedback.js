fn(state => {
  const {
    amount,
    category,
    description,
    payment_method,
    transaction_id = '',
    date,
  } = state.transaction;
  state.reply = `*AI Says...*\n\n*Amount:* \`${amount}\`\n*Category:* \`${category}\`\n*Description:* \`${description}\`\n*Payment Method:* \`${payment_method}\`\n*Date:* \`${date}\`\n*Transaction ID:* \`${transaction_id}\``;

  return state;
});

post(state => `/bot${state.configuration.botToken}/sendMessage`, {
  headers: {
    'Content-Type': 'application/json',
  },
  body: {
    chat_id: $.message.chat.id,
    text: state => state.reply,
    parse_mode: 'MarkdownV2',
  },
});

post(state => `/bot${state.configuration.botToken}/sendMessage`, {
  headers: {
    'Content-Type': 'application/json',
  },
  body: {
    chat_id: $.message.chat.id,
    text: 'Adding transaction to googlesheet',
  },
});
