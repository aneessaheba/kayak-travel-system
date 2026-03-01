"""
Fine-tuned travel concierge inference module.

Loads a QLoRA adapter (trained in notebooks/finetune_travel_qlora.ipynb) on top
of google/gemma-2b-it and serves travel recommendations.

The model is loaded lazily on the first request and cached for subsequent calls.
If the adapter is missing, the GPU is unavailable, or inference fails, this
module returns None — the caller (main.py) falls back to Gemini 2.5 Flash.

Environment variables:
  USE_FINETUNED_MODEL   set to "true" to enable (default: false)
  FINETUNED_MODEL_PATH  path to the saved LoRA adapter directory
                        (default: "notebooks/adapter")
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Module-level singletons — loaded once, reused across requests
_pipeline = None
_load_attempted = False

BASE_MODEL_ID = "google/gemma-2b-it"

SYSTEM_PROMPT = (
    "You are a concise travel concierge. "
    "Use any provided context — inventory, search results, or weather — if present. "
    "Respond with one or two sentences that acknowledge the request, cite facts, and keep it actionable."
)


def _load_pipeline(adapter_path: str):
    """
    Lazily load the fine-tuned model pipeline.

    Uses 4-bit quantisation (BitsAndBytes NF4) so the 2B-parameter model fits
    in ~4 GB of GPU VRAM. Returns None if loading fails for any reason.
    """
    global _pipeline, _load_attempted

    if _load_attempted:
        return _pipeline
    _load_attempted = True

    try:
        import torch
        from transformers import (
            AutoTokenizer,
            AutoModelForCausalLM,
            BitsAndBytesConfig,
            pipeline,
        )
        from peft import PeftModel

        if not torch.cuda.is_available():
            logger.warning(
                "Fine-tuned model requires a CUDA GPU — none detected. "
                "Gemini fallback will be used for all /chat requests."
            )
            return None

        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )

        logger.info("Loading base model %s with 4-bit quantisation...", BASE_MODEL_ID)
        tokenizer = AutoTokenizer.from_pretrained(adapter_path)
        base = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL_ID,
            quantization_config=bnb_config,
            device_map="auto",
        )

        logger.info("Loading LoRA adapter from %s ...", adapter_path)
        model = PeftModel.from_pretrained(base, adapter_path)
        model.eval()

        _pipeline = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_new_tokens=256,
            temperature=0.4,
            do_sample=True,
        )
        logger.info("Fine-tuned travel concierge model ready.")

    except Exception as exc:
        logger.warning(
            "Fine-tuned model failed to load (%s). "
            "Gemini 2.5 Flash fallback is active.",
            exc,
        )
        _pipeline = None

    return _pipeline


def infer(prompt: str, adapter_path: str, context: str = "") -> Optional[str]:
    """
    Generate a travel recommendation using the fine-tuned adapter.

    Args:
        prompt:       The user's message.
        adapter_path: Path to the saved LoRA adapter directory.
        context:      Optional RAG / search / weather context to prepend.

    Returns:
        The generated reply string, or None if the model is unavailable.
    """
    pipe = _load_pipeline(adapter_path)
    if pipe is None:
        return None

    try:
        full_prompt_parts = [SYSTEM_PROMPT]
        if context:
            full_prompt_parts.append(context)
        full_prompt_parts.append(prompt)

        # Gemma instruction-tuning chat template
        formatted = (
            f"<start_of_turn>user\n"
            + "\n\n".join(full_prompt_parts)
            + "<end_of_turn>\n<start_of_turn>model\n"
        )

        result = pipe(formatted)
        generated: str = result[0]["generated_text"]

        # Strip the echoed prompt prefix that some pipelines include
        reply = generated[len(formatted):].strip() if generated.startswith(formatted) else generated.strip()

        # Truncate at end-of-turn token if present
        if "<end_of_turn>" in reply:
            reply = reply.split("<end_of_turn>")[0].strip()

        return reply if reply else None

    except Exception as exc:
        logger.error("Fine-tuned inference error: %s", exc)
        return None
