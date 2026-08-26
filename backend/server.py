from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from pydantic import BaseModel
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

from engine import NegotiationInput, analyze, CTX_CFG, TIMING_W
from texts import t as texts_for

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


class SessionSave(BaseModel):
    input: NegotiationInput
    analysis: Dict[str, Any]


class AiRequest(BaseModel):
    input: NegotiationInput
    analysis: Dict[str, Any]
    mode: str = "script"  # script | objections | email | prompt


@api_router.get("/")
async def root():
    return {"message": "PACT Negotiation Engine"}


@api_router.get("/meta")
async def meta(lang: str = "id"):
    tx = texts_for(lang)
    return {
        "contexts": [{"key": k, "label": tx["ctx"][k]["label"], "counterpart": tx["ctx"][k]["counterpart"],
                      "unit": tx["ctx"][k]["unit"]} for k in CTX_CFG],
        "timing_factors": {
            ctx: [{"key": key, "label": tx["timing"][ctx][key], "weight": w}
                  for key, w in TIMING_W[ctx].items()]
            for ctx in CTX_CFG
        },
    }


@api_router.post("/analyze")
async def analyze_endpoint(payload: NegotiationInput):
    return analyze(payload)


@api_router.post("/sessions")
async def save_session(payload: SessionSave):
    sid = str(uuid.uuid4())[:8]
    doc = {
        "id": sid,
        "input": payload.input.model_dump(),
        "analysis": payload.analysis,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pact_sessions.insert_one(doc)
    return {"id": sid}


@api_router.get("/sessions/{sid}")
async def get_session(sid: str):
    doc = await db.pact_sessions.find_one({"id": sid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")
    return doc


MODE_PROMPTS = {
    "script": (
        "Write a complete, ready-to-speak NEGOTIATION SCRIPT. Required structure: "
        "(1) OPENING — 3-4 sentences that can be said verbatim. "
        "(2) CORE ARGUMENT — organised by P.A.C.T with the exact meanings: P = Performance, A = Achievement, "
        "C = Comparison, T = Timing (never change what these letters stand for). Two to three sentences per pillar, "
        "always using the real figures from the user's data. "
        "(3) THE ASK — the sentence stating the exact anchor number, plus the instruction to stay silent afterwards. "
        "(4) FOUR OBJECTION SCENARIOS — for each: what they say, why they say it, and the word-for-word answer. "
        "(5) CLOSING & FOLLOW-UP. Use markdown ## headings and bullets."
    ),
    "objections": (
        "Write an OBJECTION PLAYBOOK. Produce six objections most likely given this user's context and specific "
        "weaknesses. For each: their sentence, the motive behind it, the word-for-word answer, and one escalation "
        "step if they still refuse. Use markdown ## headings."
    ),
    "email": (
        "Write two emails: (1) requesting a negotiation meeting (short, no numbers disclosed), "
        "(2) a post-meeting follow-up summarising what was agreed and requesting a decision with a gentle deadline. "
        "Include subject lines. Use markdown ## headings."
    ),
    "prompt": (
        "Create a READY-TO-PASTE PROMPT the user can give to another AI chatbot to roleplay this negotiation. "
        "The prompt must carry the user's full context and numbers, a realistic and tough counterpart persona, "
        "the roleplay rules, and how to give feedback at the end. Wrap the main prompt in a code block."
    ),
}

SYSTEM_MSG = (
    "You are a senior negotiation coach trained in the principles of the Harvard Program on Negotiation "
    "(Getting to Yes, BATNA, ZOPA, anchoring, interest-based bargaining). "
    "The framework in use is P.A.C.T = Performance (measurable results), Achievement (accomplishments and their value), "
    "Comparison (market benchmark), Timing (the moment). Never change what these four letters mean. "
    "Voice: the calm, precise register of a professional business book — plain words, full sentences, no slang, "
    "no hype, no motivational filler. Explain the reasoning briefly so a first-time negotiator understands why, "
    "then give the exact words to say. Scripts addressed to a manager, recruiter, or client must always be polite "
    "and use the first person. "
    "Hard rule: never invent a figure that is not in the user's data. If a field is empty, name it as a gap and "
    "explain how to fill it."
)

LANG_NAMES = {"id": "Bahasa Indonesia (formal, sopan, seperti buku bisnis profesional)",
              "en": "English (professional, plain, book-like)"}


def _build_context_text(req: AiRequest) -> str:
    inp = req.input.model_dump()
    a = req.analysis or {}
    numbers = a.get("numbers", {})
    return json.dumps({
        "negotiation_context": a.get("context"),
        "context_key": inp.get("context"),
        "role": inp.get("role"),
        "tenure_months": inp.get("tenure_months"),
        "currency": inp.get("currency"),
        "current_value": inp.get("current_value"),
        "offer_value": inp.get("offer_value"),
        "market_p50": inp.get("market_p50"),
        "market_p75": inp.get("market_p75"),
        "performance_metrics": inp.get("metrics"),
        "achievements": inp.get("achievements"),
        "scope_note": inp.get("scope_growth_note"),
        "timing_factors": inp.get("timing_factors"),
        "batna_alternatives": inp.get("alternatives"),
        "relationship_importance_1_5": inp.get("relationship_importance"),
        "engine_output": {
            "leverage_score": a.get("leverage_score"),
            "tier": a.get("tier"),
            "pact_scores": a.get("pact"),
            "batna": a.get("batna"),
            "impact": a.get("impact"),
            "anchor": numbers.get("anchor"),
            "target": numbers.get("target"),
            "compromise": numbers.get("compromise"),
            "walk_away": numbers.get("reservation"),
            "zopa": numbers.get("zopa"),
            "market_position": numbers.get("market_position"),
            "gaps": a.get("gaps"),
            "risks": a.get("risks"),
        },
    }, ensure_ascii=False)


@api_router.post("/ai/generate")
async def ai_generate(req: AiRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key belum dikonfigurasi")
    instruction = MODE_PROMPTS.get(req.mode, MODE_PROMPTS["script"])
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"pact-{uuid.uuid4().hex[:12]}",
        system_message=SYSTEM_MSG,
    ).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=2600)

    message = UserMessage(
        text=f"{instruction}\n\nUSER DATA & ENGINE OUTPUT (JSON):\n{_build_context_text(req)}\n\n"
             f"WRITE THE ENTIRE OUTPUT IN: {LANG_NAMES.get(req.input.lang, LANG_NAMES['id'])}. "
             "Use that language for every word, including headings and labels; the only exceptions are the "
             "framework terms P.A.C.T, BATNA, and ZOPA.\n"
             f"Format all money in {req.input.currency} in a readable form (example: Rp 14.500.000).\n"
             "LENGTH LIMIT: 850 words maximum. Dense, no repetition, no preamble. Start at the first heading."
    )

    async def gen():
        try:
            async for ev in chat.stream_message(message):
                if isinstance(ev, TextDelta):
                    yield f"data: {json.dumps({'delta': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            logger.exception("AI stream error")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
