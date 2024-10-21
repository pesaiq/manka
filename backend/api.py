from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import uvicorn

# Import the extract_transaction_details function from your existing ai.py file
from ai import extract_transaction_details

app = FastAPI()


class TransactionInput(BaseModel):
    text: str


class TransactionOutput(BaseModel):
    amount: float
    date: str
    category: str
    description: str
    transaction_id: str
    payment_method: str


@app.post("/extract_transaction", response_model=TransactionOutput)
async def extract_transaction(transaction: TransactionInput):
    try:
        details = extract_transaction_details(transaction.text)
        return TransactionOutput(**details)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
