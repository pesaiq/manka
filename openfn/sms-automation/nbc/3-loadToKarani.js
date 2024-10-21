insert(
  "transaction_data",
  (state) => ({
    ...state.mappedTransactionData,
    user_id: state.configuration.user_id,
  }),
  {
    logValues: true,
  }
);
