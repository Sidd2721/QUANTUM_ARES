import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, Send, Bot, User } from "lucide-react";
import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const predefinedResponses: Record<string, string> = {
  default: "I can help you understand your security posture. Try asking about specific vulnerabilities, remediation steps, or compliance requirements.",
  vulnerabilities: "Your infrastructure has 3 critical vulnerabilities: 1) Unencrypted S3 bucket (s3://prod-data-bucket), 2) Public database access (rds://user-db-prod), and 3) Missing MFA on root account. I recommend prioritizing the S3 encryption and database isolation first.",
  fix: "I can generate automated fixes for these issues. The S3 bucket encryption can be enabled with a single Terraform patch. Would you like me to show you the IaC changes?",
  compliance: "Based on your current configuration, you're not meeting SOC 2, GDPR, and PCI-DSS requirements. The main gaps are in data encryption, access controls, and audit logging. Estimated remediation time: 4-6 hours.",
  score: "Your current security score is 78/100, up from 42 after applying automated fixes. This puts you in the 'Good' range. To reach 90+, focus on implementing least-privilege IAM policies and enabling comprehensive logging.",
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm your AI security assistant. Ask me anything about your infrastructure security, vulnerabilities, or compliance status.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const lowerInput = input.toLowerCase();
      let response = predefinedResponses.default;

      if (lowerInput.includes("vulnerab") || lowerInput.includes("issue") || lowerInput.includes("risk")) {
        response = predefinedResponses.vulnerabilities;
      } else if (lowerInput.includes("fix") || lowerInput.includes("remediat") || lowerInput.includes("solve")) {
        response = predefinedResponses.fix;
      } else if (lowerInput.includes("complian") || lowerInput.includes("soc") || lowerInput.includes("gdpr")) {
        response = predefinedResponses.compliance;
      } else if (lowerInput.includes("score") || lowerInput.includes("rating")) {
        response = predefinedResponses.score;
      }

      const assistantMessage: Message = { role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden flex flex-col h-[500px]"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
      }}
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          <h3 className="text-gray-800">AI Security Chat</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "bg-white/80 border border-gray-200 text-gray-800"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white/80 border border-gray-200 p-3 rounded-2xl">
              <div className="flex gap-1">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your security..."
            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
