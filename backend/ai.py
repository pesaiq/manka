import spacy
import dateparser
from datetime import datetime
import json

# Load SpaCy's pre-trained model for English
nlp = spacy.load("en_core_web_sm")


# Function to normalize amounts (e.g., '2k' -> 2000, '$15' -> 15)
def normalize_amount(amount_text):
    amount_text = amount_text.lower().replace(",", "").strip()

    # Handle cases with no space, e.g., '2k', '3k'
    if amount_text.endswith("k"):
        return float(amount_text[:-1]) * 1000
    elif amount_text.endswith("m"):
        return float(amount_text[:-1]) * 1000000

    # Remove currency symbols and return float
    amount_text = (
        amount_text.replace("$", "")
        .replace("tzs", "")
        .replace("usd", "")
        .replace("tsh", "")
        .strip()
    )

    try:
        return float(amount_text)
    except ValueError:
        return None


# Function to manually extract amounts when NER fails (like Tsh cases)
def extract_amount_manually(doc):
    for i, token in enumerate(doc):
        # Check if token is numeric or contains a valid amount shorthand
        if token.like_num or any(
            c in token.text.lower() for c in ["k", "m", "tsh", "$", "tzs"]
        ):
            amount_candidate = token.text

            # Check if the next token could be part of the amount (like "Tsh" or currency symbols)
            if i + 1 < len(doc) and doc[i + 1].text.lower() in [
                "tsh",
                "tzs",
                "$",
                "usd",
            ]:
                amount_candidate += doc[i + 1].text

            # Normalize the amount only if it looks like a valid number
            amount = normalize_amount(amount_candidate)
            if amount is not None:
                return amount

    return None


# Function to categorize the expense
def categorize_expense(doc):
    categories = {
        "Groceries": [
            "groceries",
            "supermarket",
            "market",
            "produce",
            "baking",
            "snacks",
            "beverages",
        ],
        "Bills": [
            "rent",
            "lease",
            "subscription",
            "electricity",
            "water",
            "gas",
            "internet",
            "cable",
            "phone",
            "recycling",
            "trash",
            "sewer",
            "insurance",
            "mobile data",
            "J4U M-PESA",
        ],
        "Allowance": ["allowance", "stipend", "bhoke", "mtuchi", "gift"],
        "Transportation": [
            "taxi",
            "bus",
            "uber",
            "transport",
            "train",
            "boda boda",
            "bicycle",
            "airfare",
            "gasoline",
        ],
        "Entertainment": [
            "movie",
            "cinema",
            "concert",
            "sports event",
            "games",
            "theater",
            "music",
            "streaming services",
        ],
        "Shopping": [
            "shoes",
            "clothes",
            "mall",
            "shopping",
            "accessories",
            "electronics",
            "gadgets",
            "furniture",
            "appliances",
            "books",
        ],
        "Eating Out": [
            "food",
            "restaurant",
            "lunch",
            "dinner",
            "breakfast",
            "meal",
            "takeaway",
            "fast food",
            "coffee",
            "snacks",
        ],
        "Transfer": [
            "received",
            "sent",
            "transfer",
            "payment",
            "bank transfer",
            "mobile money",
            "withdrawal",
            "deposit",
        ],
        "Car": [
            "fuel",
            "service",
            "motorcycle",
            "parking-fee",
            "auto-parts",
            "wash",
            "insurance",
            "repair",
            "registration",
            "toll",
        ],
        "Family": [
            "michango",
            "family",
            "kids",
            "childcare",
            "education",
            "toys",
            "allowance",
        ],
        "Household": [
            "household",
            "utilities",
            "laundry",
            "electricity",
            "furniture",
            "appliances",
            "cleaning",
            "repair",
            "security",
            "auwasa",
            "luku",
            "water",
            "gas",
            "internet",
            "maintenance",
            "home decor",
        ],
        "Health & Fitness": [
            "gym",
            "healthcare",
            "insurance",
            "medication",
            "doctor",
            "hospital",
            "dentist",
            "optician",
            "yoga",
            "fitness equipment",
            "therapy",
        ],
        "Travel": [
            "hotel",
            "flight",
            "bus ticket",
            "train ticket",
            "taxi",
            "tours",
            "souvenirs",
            "car rental",
            "luggage",
        ],
        "Gifts & Donations": [
            "gifts",
            "donations",
            "charity",
            "presents",
            "weddings",
            "birthdays",
            "fundraisers",
        ],
        "Personal Care": [
            "haircut",
            "salon",
            "spa",
            "manicure",
            "pedicure",
            "skincare",
            "beauty products",
            "hygiene",
        ],
        "Savings & Investments": [
            "savings",
            "investments",
            "stocks",
            "bonds",
            "retirement",
            "real estate",
            "emergency fund",
        ],
    }

    for token in doc:
        for category, keywords in categories.items():
            if token.lemma_ in keywords:
                return category
    return "Other"


# Function to extract payment method
def extract_payment_method(doc):
    payment_methods = {
        "Cash": ["cash"],
        "Bank Card": ["card", "credit", "debit", "bank", "visa-card", "master-card"],
        "Mobile Money": [
            "mobile money",
            "m-pesa",
            "tigo pesa",
            "airtel money",
            "halo-pesa",
            "master-card",
            "visa-card",
        ],
        "Other": ["other", "unknown"],
    }

    for token in doc:
        for method, keywords in payment_methods.items():
            if token.lemma_ in keywords:
                return method
    return "Other"


# Function to extract transaction details
def extract_transaction_details(text):
    doc = nlp(text)

    amount, date, category, description, transaction_id, payment_method = (
        None,
        None,
        None,
        text,
        None,
        None,
    )

    # Extract entities using SpaCy's NER
    for ent in doc.ents:
        if ent.label_ == "MONEY":
            normalized_amount = normalize_amount(ent.text)
            if normalized_amount is not None:
                amount = normalized_amount
        elif ent.label_ == "DATE":
            parsed_date = dateparser.parse(ent.text)
            if parsed_date:
                date = parsed_date.strftime("%Y-%m-%d")

    # If amount is not found through NER, try to manually extract it
    if amount is None:
        amount = extract_amount_manually(doc)

    # Handle transaction ID (assuming alphanumeric string at the start)
    tokens = text.split()
    for token in tokens:
        if (
            token.isalnum() and len(token) > 8
        ):  # Assuming transaction IDs are longer than 8 characters
            transaction_id = token
            break

    # If no amount was detected, set amount to a default
    if amount is None:
        amount = 0.01  # Default value if amount is not found

    # If no date was detected, default to today's date
    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")

    # Categorize the expense
    category = categorize_expense(doc)

    # Extract payment method
    payment_method = extract_payment_method(doc)

    # Create a dictionary matching the schema
    transaction_details = {
        "amount": amount,
        "date": date,
        "category": category if category else "Other",
        "description": description,
        "transaction_id": transaction_id if transaction_id else "N/A",
        "payment_method": payment_method,
    }

    return transaction_details


# Test on different transaction texts
transaction_texts = [
    "BJ77EXCKGYD Confirmed. MAINA KISE has received Tsh 20000 on 07-OCT-24 10:27:18.676.",
    "I bought shoes from Zara yesterday. I paid $20.",
    "I spent 2k on food yesterday",
    "I had lunch at WSH 2days ago. It cost me 3k",
    "I spent TZS 5000 on groceries last week using Mobile Money.",
    "Paid 500 for taxi today.",
    "I spent $15 on coffee last Monday.",
    "Paid 2500 on 2023-09-25 for transport.",
    "BJE1F0KXR4H Confirmed. Tsh10,000.00 paid to LIPA LAKE OIL LIMITED-CLOCK TOWER on 14/10/24 at 2:02 PM and charged Tsh700.00.New M-Pesa balance is Tsh51,698.50",
]

for transaction_text in transaction_texts:
    details = extract_transaction_details(transaction_text)
    print(json.dumps(details, indent=4))
