// Check out the Job Writing Guide for help getting started:
// https://docs.openfn.org/documentation/jobs/job-writing-guide

fn(state => {
  const {
    amount,
    date,
    category,
    description,
    transaction_id = '',
    payment_method = 'Cash',
  } = state.transaction;

  state.mapping = [
    amount,
    category,
    description,
    payment_method,
    date,
    transaction_id,
  ];
  return state;
});
appendValues({
  spreadsheetId: '1RUEWBpt1ipbe4aTUPNmLmxxWXJ1KyelNCbUogaRZUAw',
  range: 'Daily Expenses!A1:F1',
  values: state => [state.mapping],
});
