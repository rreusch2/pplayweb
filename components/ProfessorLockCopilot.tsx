"use client";

import React, { useState } from "react";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAIChat } from "@/shared/hooks/useAIChat";
import type { Message } from "@copilotkit/shared";

type LimitedInputProps = {
  inProgress: boolean;
  onSend: (text: string) => Promise<Message>;
  isVisible?: boolean;
  onStop?: () => void;
  onUpload?: () => void;
  hideStopButton?: boolean;
};

interface ProfessorLockCopilotProps {
  isOpen: boolean;
  onClose: () => void;
}

const SYSTEM_INSTRUCTIONS = `You are Professor Lock — a sharp, witty, high-IQ sports betting analyst.
Follow the Response Excellence Framework:
- Keep answers tight (2–4 sentences). Bold all picks, odds, and numbers.
- Hook + Value + Action. End with a concrete next step.
- Data over opinions. Cite tools used (News, Odds, Insights, StatMuse) when relevant.
- Bankroll wisdom: 1–2% unit size. Avoid correlated legs.
- Personality: confident pro, not cringe. Use concise slang sparingly.

Primary tools you can call:
- get_latest_predictions(userTier?) → latest team + props picks (today, tomorrow)
- statmuse_query(query, sport?) → real stats context (MLB, WNBA, etc.)

If the user asks for a parlay, intelligently select from latest predictions based on risk and confidence. Avoid correlated games, mention implied probability and risk level. If user preferences are available later, bias selections to preferred sports.
`;

export default function ProfessorLockCopilot({ isOpen, onClose }: ProfessorLockCopilotProps) {
  const { subscriptionTier } = useSubscription();
  const isPro = subscriptionTier !== 'free';
  const { canSendMessage, freeUserMessageCount, incrementFreeUserMessages } = useAIChat();

  const LimitedInput = ({ inProgress, onSend, isVisible, onStop, onUpload, hideStopButton }: LimitedInputProps) => {
    const [text, setText] = useState("");
    const [error, setError] = useState<string>("");

    const remaining = Math.max(0, 3 - freeUserMessageCount);
    const blocked = !isPro && !canSendMessage(isPro);

    const handleSend = async () => {
      if (!text.trim() || inProgress) return;
      if (blocked) {
        setError("Free message limit reached. Upgrade to continue chatting with Professor Lock.");
        return;
      }
      try {
        const msg: Message = await onSend(text.trim());
        if (!isPro) await incrementFreeUserMessages();
        setText("");
        setError("");
        return msg;
      } catch (e) {
        setError("Failed to send. Please try again.");
      }
    };

    return (
      <div className="px-3 py-3 border-t border-white/10 bg-black/20">
        {!isPro && (
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-gray-300">Chats left: <span className="font-semibold text-blue-300">{remaining}</span></span>
            {blocked && <span className="text-yellow-300">Upgrade for unlimited</span>}
          </div>
        )}
        {error && <div className="mb-2 text-xs text-yellow-300">{error}</div>}
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={blocked ? "Upgrade to continue chatting..." : "Ask Professor Lock about picks, odds, or a smart parlay..."}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-predictive-blue disabled:opacity-50"
            disabled={inProgress || blocked}
          />
          <button
            onClick={handleSend}
            disabled={inProgress || blocked || !text.trim()}
            className="px-5 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-predictive-blue to-predictive-purple disabled:opacity-50"
          >
            Send
          </button>
          {onStop && !hideStopButton && (
            <button onClick={onStop} className="px-3 py-3 rounded-lg text-white bg-white/10">Stop</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <CopilotSidebar
      key={isOpen ? 'open' : 'closed'}
      defaultOpen={isOpen}
      onSetOpen={(open) => {
        if (!open) onClose();
      }}
      className="copilotKitSidebar predictive-chat"
      labels={{
        title: "Professor Lock",
        initial: "Need an edge? Ask for a smart parlay or today’s highest-confidence locks.",
      }}
      instructions={SYSTEM_INSTRUCTIONS}
      Input={LimitedInput}
      suggestions={[
        { id: "parlay-smart", title: "Build a smart parlay from the latest picks", message: "Build me a smart parlay from your latest predictions." },
        { id: "news-scan", title: "Scan breaking news for today’s slate", message: "Scan breaking news that could move lines today." },
        { id: "value-hunt", title: "Find best value locks right now", message: "What are the best value locks right now and why?" },
      ] as any}
    >
      {/* Optional: a small header banner could be rendered here in the app area when sidebar is open */}
      <div />
    </CopilotSidebar>
  );
}
