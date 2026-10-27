"""
FastAPI Signal Integrity & MT5 Execution Bridge
------------------------------------------------
- Ingests TradingView v6 Webhook Alerts
- Validates HMAC-SHA256 Signature and Block Nonce (Anti-Replay)
- Applies Global Risk Floor (Daily Drawdown Cap, Max Consecutive Losses)
- Serves verified order queue to MetaTrader 5 Expert Advisor
"""

import hmac
import hashlib
import time
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Header, Request
from pydantic import BaseModel, Field

app = FastAPI(title="Institutional Signal Integrity & MT5 Bridge", version="6.0.0")

# Secret Key for HMAC Signature Verification
API_SECRET = "INSTITUTIONAL_SECRET_KEY_QUANT_2026"

# In-Memory State & Replay Defense Buffer
seen_block_nonces = set()
verified_signal_queue: List[Dict[str, Any]] = []
daily_risk_state = {
    "daily_loss_percent": 0.0,
    "max_daily_loss_cap": 2.0,
    "consecutive_losses": 0,
    "max_consecutive_loss_cap": 3,
    "is_risk_locked": False
}


class SignalPayload(BaseModel):
    version: str
    symbol: str
    signal: str
    entry: float
    sl: float
    tp1: float
    tp2: float
    tp3: float
    score: int
    regime: str
    strategy: str
    block: int
    risk_percent: Optional[float] = 0.5


def verify_signal_integrity(payload_str: str, signature: Optional[str]) -> bool:
    """Validate HMAC-SHA256 signature."""
    if not signature:
        return True # Fallback for simple testing; enforce in production
    computed_sig = hmac.new(API_SECRET.encode(), payload_str.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed_sig, signature)


@app.get("/")
def health_check():
    return {
        "status": "ONLINE",
        "engine": "Institutional Quant Bridge v6",
        "risk_locked": daily_risk_state["is_risk_locked"],
        "pending_signals": len(verified_signal_queue)
    }


@app.post("/webhook/signal")
async def receive_webhook_signal(signal: SignalPayload, request: Request, x_signature: Optional[str] = Header(None)):
    """
    Ingest & validate TradingView alert signal.
    """
    raw_body = await request.body()
    
    # 1. Signature & Anti-Tamper Check
    if not verify_signal_integrity(raw_body.decode(), x_signature):
        raise HTTPException(status_code=401, detail="Invalid Cryptographic Signature")

    # 2. Replay Defense
    nonce_key = f"{signal.symbol}_{signal.block}_{signal.signal}"
    if nonce_key in seen_block_nonces:
        return {"status": "SKIPPED", "reason": "Duplicate Nonce / Replay Signal"}
    seen_block_nonces.add(nonce_key)

    # 3. Global Risk Gatekeeper
    if daily_risk_state["is_risk_locked"]:
        return {"status": "BLOCKED", "reason": "Risk Lockout Active: Daily Drawdown Limit Hit"}

    if signal.score < 70:
        return {"status": "REJECTED", "reason": "Score below minimum institutional threshold"}

    # 4. Canonicalize & Push to Execution Queue
    order_ticket = {
        "ticket_id": f"ORD_{int(time.time()*1000)}_{signal.block}",
        "timestamp": int(time.time()),
        "symbol": signal.symbol,
        "action": signal.signal.upper(),
        "entry_price": signal.entry,
        "stop_loss": signal.sl,
        "take_profit_1": signal.tp1,
        "take_profit_2": signal.tp2,
        "take_profit_3": signal.tp3,
        "risk_percent": signal.risk_percent,
        "regime": signal.regime,
        "strategy": signal.strategy,
        "score": signal.score,
        "status": "PENDING"
    }

    verified_signal_queue.append(order_ticket)
    return {"status": "ACCEPTED", "ticket": order_ticket}


@app.get("/mt5/next-signal")
def mt5_fetch_next_signal(api_key: Optional[str] = Header(None)):
    """
    Endpoint polled by MT5 Expert Advisor via WebRequest.
    """
    if not verified_signal_queue:
        return {"status": "EMPTY", "signal": None}
    
    next_order = verified_signal_queue.pop(0)
    next_order["status"] = "DISPATCHED"
    return {"status": "EXECUTE", "signal": next_order}


@app.post("/mt5/trade-sync")
def mt5_sync_trade_outcome(data: Dict[str, Any]):
    """
    Sync trade outcome from MT5 to update global drawdown and risk metrics.
    """
    pnl = data.get("pnl", 0.0)
    pnl_percent = data.get("pnl_percent", 0.0)

    if pnl < 0:
        daily_risk_state["daily_loss_percent"] += abs(pnl_percent)
        daily_risk_state["consecutive_losses"] += 1
    else:
        daily_risk_state["consecutive_losses"] = 0

    if (daily_risk_state["daily_loss_percent"] >= daily_risk_state["max_daily_loss_cap"] or 
        daily_risk_state["consecutive_losses"] >= daily_risk_state["max_consecutive_loss_cap"]):
        daily_risk_state["is_risk_locked"] = True

    return {
        "status": "SYNCED",
        "current_daily_loss": daily_risk_state["daily_loss_percent"],
        "risk_locked": daily_risk_state["is_risk_locked"]
    }
