from web3 import Web3
import json
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/asD5khNptnhgPrPkDG3-e"

PRIVATE_KEY = os.getenv("PRIVATE_KEY")

CONTRACT_ADDRESS = "0x2e4d486d84CCBA47f0601F552AcF5129Ed5292d9"

w3 = Web3(Web3.HTTPProvider(RPC_URL))

# Use absolute path relative to this file - works from any working directory
_ABI_PATH = Path(__file__).resolve().parent / "CarbonTokenABI.json"
with open(_ABI_PATH) as f:
    abi = json.load(f)

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)


def issue_carbon(project_id, carbon_amount, recipient_address=None):

    account = w3.eth.account.from_key(PRIVATE_KEY)

    txn = contract.functions.issueCarbonCredits(
        project_id,
        int(carbon_amount)
    ).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address, "pending"),
        "gas": 200000,
        "maxFeePerGas": w3.to_wei("20", "gwei"),
        "maxPriorityFeePerGas": w3.to_wei("2", "gwei"),
        "chainId": 11155111
    })

    signed_txn = w3.eth.account.sign_transaction(txn, PRIVATE_KEY)

    tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
    main_tx_hex = w3.to_hex(tx_hash)

    # Transfer tokens to recipient if provided
    if recipient_address and recipient_address.startswith("0x") and int(carbon_amount) > 0:
        try:
            checksum_recipient = w3.to_checksum_address(recipient_address)
            scaled_amount = int(carbon_amount) * (10 ** 18)
            transfer_txn = contract.functions.transfer(
                checksum_recipient,
                scaled_amount
            ).build_transaction({
                "from": account.address,
                "nonce": w3.eth.get_transaction_count(account.address, "pending"),
                "gas": 150000,
                "maxFeePerGas": w3.to_wei("20", "gwei"),
                "maxPriorityFeePerGas": w3.to_wei("2", "gwei"),
                "chainId": 11155111
            })
            signed_transfer = w3.eth.account.sign_transaction(transfer_txn, PRIVATE_KEY)
            w3.eth.send_raw_transaction(signed_transfer.raw_transaction)
        except Exception as e:
            print("Failed to auto-transfer credits to recipient wallet:", e)

    return main_tx_hex

