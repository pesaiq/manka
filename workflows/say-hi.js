fn(state => {
  state.message = state.data.message;
  return state;
});

post(state => `/bot${state.configuration.botToken}/sendMessage`, {
  headers: {
    'Content-Type': 'application/json',
  },
  body: {
    chat_id: $.message.chat.id,
    text: 'AI working...',
  },
});
