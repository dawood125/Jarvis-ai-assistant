"""
MiniMax Provider - Primary AI using OpenCode/Zen proxy
MiniMax M2.5 has 1M token context window, ideal for code analysis
"""
import os
import json
from typing import Any, Dict, List

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None


class MiniMaxProvider:
    """MiniMax M2.5 via OpenCode Zen proxy (Anthropic-compatible)"""

    def __init__(self):
        self.base_url = os.environ.get("MINIMAX_BASE_URL", "https://opencode.ai/zen")
        self.api_key = os.environ.get("MINIMAX_API_KEY")
        self.model = os.environ.get("MINIMAX_MODEL", "minimax-m2.5-free")
        self.client = None

    def is_available(self) -> bool:
        """Check if MiniMax provider is configured and available"""
        return bool(self.api_key and AsyncOpenAI is not None)

    def get_client(self) -> AsyncOpenAI:
        """Get or create the AsyncOpenAI client"""
        if self.client is None:
            self.client = AsyncOpenAI(
                base_url=self.base_url,
                api_key=self.api_key
            )
        return self.client

    async def chat(
        self,
        messages: List[Dict[str, Any]],
        tools: List[Dict[str, Any]] | None = None,
        temperature: float = 0.3,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        Send chat completion request to MiniMax M2.5

        Args:
            messages: List of message dicts with 'role' and 'content'
            tools: Optional list of tool schemas
            temperature: Sampling temperature
            stream: Whether to stream response

        Returns:
            Response dict with 'content' and optional 'tool_calls'
        """
        if not self.is_available():
            raise RuntimeError("MiniMax provider not available - missing API key or openai package")

        client = self.get_client()

        request_kwargs = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }

        if tools:
            request_kwargs["tools"] = tools
            request_kwargs["tool_choice"] = "auto"

        if stream:
            request_kwargs["stream"] = True

        response = await client.chat.completions.create(**request_kwargs)

        if stream:
            return response  # Return generator for streaming

        # Parse non-streaming response
        choice = response.choices[0]
        result = {
            "content": choice.message.content,
            "tool_calls": []
        }

        tool_calls = getattr(choice.message, "tool_calls", None) or []
        for tc in tool_calls:
            result["tool_calls"].append({
                "id": tc.id,
                "name": tc.function.name,
                "arguments": tc.function.arguments
            })

        return result


# Singleton instance
_minimax_provider = None


def get_minimax_provider() -> MiniMaxProvider:
    """Get or create the MiniMax provider singleton"""
    global _minimax_provider
    if _minimax_provider is None:
        _minimax_provider = MiniMaxProvider()
    return _minimax_provider
