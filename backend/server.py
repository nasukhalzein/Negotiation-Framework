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

from engine import NegotiationInput, analyze, CONTEXTS, TIMING_FACTORS

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
async def meta():
    return {
        "contexts": [{"key": k, "label": v["label"], "counterpart": v["counterpart"], "unit": v["unit"]}
                     for k, v in CONTEXTS.items()],
        "timing_factors": [{"key": k, "label": v[0], "weight": v[1]} for k, v in TIMING_FACTORS.items()],
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
        "Tulis SKRIP NEGOSIASI lengkap siap pakai dalam Bahasa Indonesia yang natural dan tidak kaku. "
        "Struktur wajib: (1) PEMBUKAAN — 3-4 kalimat yang bisa diucapkan apa adanya. "
        "(2) INTI ARGUMEN — susun mengikuti P.A.C.T dengan label yang TEPAT: P = Performance, A = Achievement, "
        "C = Comparison, T = Timing (jangan pernah mengganti arti huruf-huruf ini). Tiap pilar 2-3 kalimat, "
        "WAJIB memakai angka nyata dari data user. "
        "(3) THE ASK — kalimat menyebut anchor number persis, plus instruksi diam setelahnya. "
        "(4) 4 SKENARIO PENOLAKAN — tiap skenario: apa yang mereka bilang, kenapa mereka bilang itu, dan jawaban kata-per-kata. "
        "(5) PENUTUP & FOLLOW-UP. Gunakan heading markdown ## dan bullet."
    ),
    "objections": (
        "Tulis PLAYBOOK MENGHADAPI PENOLAKAN dalam Bahasa Indonesia. Buat 6 skenario penolakan yang paling mungkin "
        "berdasarkan konteks dan kelemahan spesifik user. Untuk tiap skenario: kalimat mereka, motif di baliknya, "
        "jawaban kata-per-kata, dan satu langkah eskalasi kalau mereka masih menolak. Heading markdown ##."
    ),
    "email": (
        "Tulis 2 versi email dalam Bahasa Indonesia: (1) email meminta jadwal meeting negosiasi (singkat, tidak membocorkan angka), "
        "(2) email follow-up setelah meeting yang merangkum kesepakatan dan menagih keputusan dengan tenggat halus. "
        "Sertakan subject line. Heading markdown ##."
    ),
    "prompt": (
        "Buat PROMPT SIAP PAKAI dalam Bahasa Indonesia yang bisa user tempel ke AI chatbot lain untuk latihan roleplay "
        "negosiasi. Prompt harus memuat seluruh konteks user, angka-angkanya, persona lawan bicara yang realistis dan keras, "
        "aturan roleplay, dan cara memberi feedback di akhir. Bungkus prompt utama dalam code block."
    ),
}

SYSTEM_MSG = (
    "Kamu adalah negotiation coach senior yang dilatih dengan prinsip Harvard Program on Negotiation "
    "(Getting to Yes, BATNA, ZOPA, anchoring, interest-based bargaining). "
    "Framework yang dipakai: P.A.C.T = Performance (hasil terukur), Achievement (pencapaian & dampaknya), "
    "Comparison (pembanding pasar), Timing (momen). Jangan pernah mengubah arti keempat huruf itu. "
    "Gayamu: langsung, konkret, tidak memotivasi kosong, dan selalu memakai angka nyata dari data user. "
    "Bahasa Indonesia semi-kasual profesional (pakai 'lo' hanya di narasi coaching, tapi skrip yang diucapkan ke atasan/klien "
    "harus memakai 'saya' dan sopan). "
    "Aturan keras: JANGAN mengarang angka yang tidak ada di data. Kalau sebuah data kosong, sebutkan itu sebagai gap dan "
    "beri cara mengisinya. Jangan memberi nasihat generik seperti 'percaya diri' tanpa langkah konkret."
)


def _build_context_text(req: AiRequest) -> str:
    inp = req.input.model_dump()
    a = req.analysis or {}
    numbers = a.get("numbers", {})
    return json.dumps({
        "konteks_negosiasi": a.get("context"),
        "peran": inp.get("role"),
        "lama_bekerja_bulan": inp.get("tenure_months"),
        "mata_uang": inp.get("currency"),
        "nilai_sekarang": inp.get("current_value"),
        "offer": inp.get("offer_value"),
        "pasar_p50": inp.get("market_p50"),
        "pasar_p75": inp.get("market_p75"),
        "metrik_performance": inp.get("metrics"),
        "pencapaian": inp.get("achievements"),
        "catatan_scope": inp.get("scope_growth_note"),
        "faktor_timing": inp.get("timing_factors"),
        "alternatif_batna": inp.get("alternatives"),
        "pentingnya_hubungan_1_5": inp.get("relationship_importance"),
        "hasil_engine": {
            "leverage_score": a.get("leverage_score"),
            "tier": a.get("tier"),
            "skor_pact": a.get("pact"),
            "batna": a.get("batna"),
            "dampak": a.get("impact"),
            "anchor": numbers.get("anchor"),
            "target": numbers.get("target"),
            "kompromi": numbers.get("compromise"),
            "walk_away": numbers.get("reservation"),
            "zopa": numbers.get("zopa"),
            "posisi_pasar": numbers.get("market_position"),
            "gap": a.get("gaps"),
            "risiko": a.get("risks"),
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
        text=f"{instruction}\n\nDATA USER & HASIL ENGINE (JSON):\n{_build_context_text(req)}\n\n"
             f"Semua angka uang ditulis dalam format {req.input.currency} yang mudah dibaca (contoh: Rp 14.500.000).\n"
             "BATAS PANJANG: maksimal 850 kata. Padat, tanpa pengulangan, tanpa kalimat pembuka basa-basi. "
             "Langsung mulai dari heading pertama."
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
