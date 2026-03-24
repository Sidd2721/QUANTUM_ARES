import { ChatInterface } from "../../../components/panels/ChatInterface";

export function ChatPage() {
  return (
    <div className="space-y-6 h-full flex flex-col pb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Security Assistant</h1>
      <p className="text-gray-600 mb-8">Chat with our intelligent agent to analyze threats and configure policies.</p>
      <div className="flex-1 max-w-4xl max-h-[700px]">
        <ChatInterface />
      </div>
    </div>
  );
}
