import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, SendHorizonal } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import socket from "@/socket";
import { ClientPacketType, ClientPlayerChatPacket } from "@/packets";
import { localChatMessage, store } from "@/state";

const Chat: React.FC = () => {
  const [message, setMessage] = useState("");
  const [isMobileInputVisible, setIsMobileInputVisible] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTouchCapable = useMediaQuery("(pointer: coarse) and (hover: none)");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    const msg = message.trim();
    if (msg) {
      socket.send({
        type: ClientPacketType.PlayerChat,
        message: msg,
      } satisfies ClientPlayerChatPacket);
      store.set(localChatMessage, msg);
    }
    setMessage("");
    setIsMobileInputVisible(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsMobileInputVisible(false);
    }
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isMobile && !isTouchCapable) {
      setIsMobileInputVisible(false);
    }
  }, [isMobile, isTouchCapable]);

  useEffect(() => {
    if (isMobileInputVisible) {
      inputRef.current?.focus();
    }
  }, [isMobileInputVisible]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  if (isMobile || isTouchCapable) {
    return (
      <>
        {!isMobileInputVisible && (
          <Button
            variant="secondary"
            size="icon"
            className="fixed left-4 bottom-4 rounded-full shadow-lg"
            onClick={() => setIsMobileInputVisible(true)}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        )}
        {isMobileInputVisible && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background">
            <div className="flex items-center space-x-2">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-grow rounded-full"
                maxLength={100}
              />
              <Button
                variant="default"
                size="icon"
                className="rounded-full aspect-square bg-sky-500 hover:bg-sky-600"
                onClick={handleSendMessage}
              >
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 max-w-md w-full">
      <div className="bg-background rounded-full shadow-lg flex items-center p-2">
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="border-none flex-grow rounded-full"
          maxLength={100}
        />
        <Button
          variant="default"
          size="icon"
          onClick={handleSendMessage}
          className="ml-2 rounded-full aspect-square bg-sky-500 hover:bg-sky-600"
        >
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Chat;
