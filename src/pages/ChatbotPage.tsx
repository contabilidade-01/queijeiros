import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatbotFlow } from "@/components/ChatbotFlow";

const ChatbotPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Assistente</h1>
              <p className="text-xs text-muted-foreground">Gere documentos de forma guiada</p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-2xl">
        <ChatbotFlow />
      </main>
    </div>
  );
};

export default ChatbotPage;
