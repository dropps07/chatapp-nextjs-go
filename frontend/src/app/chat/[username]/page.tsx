"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { IoMdSend } from "react-icons/io";
import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "next/navigation";

interface MessageType {
    SenderID:    string;
    ReceiversID: string;
    Content:     string;
}

const Chat = () => {
  const params = useParams();
  const username = params.username as string;
  
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessage] = useState<MessageType[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  
  const [receiverState, setReceiverState] = useState<string>("");

  // First effect to safely detect client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Second effect to handle WebSocket connection only on client
  useEffect(() => {
    if (!isClient) return;
    
    let newSocket: WebSocket;
    try {
      newSocket = new WebSocket(`ws://localhost:8080/ws?userID=${username}`);
      setSocket(newSocket);

      newSocket.onmessage = (event: MessageEvent) => {
        const receivedMessage = JSON.parse(event.data);
        setMessage(prevMessages => [...prevMessages, receivedMessage]);
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [isClient, username]);

  useLayoutEffect(() => {
    if (isClient && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isClient]);

  const sendMessage = (receiver_id: string) => {
    if (socket && messageInput.trim() !== '') {
      const newMessage = {
        SenderID: username,
        ReceiversID: receiver_id.trim(),
        Content: messageInput.trim(),
      };
      socket.send(JSON.stringify(newMessage));
      setMessage(prevMessages => [...prevMessages, newMessage]);
      setMessageInput('');
    }
  };    

  // Don't render full component until we confirm we're on client
  if (!isClient) {
    return <div className="bg-white w-screen h-screen text-black flex justify-center items-center">Loading...</div>;
  }

  return (
    <div className="bg-white w-screen h-screen text-black flex flex-col justify-between items-center p-[24px] gap-[16px] lg:p-[96px] md:text-2xl md:p-[32px]">
      <div className="w-full bg-slate-100 overflow-y-scroll h-full rounded-[16px] p-[16px] flex flex-col gap-[16px] transition-all duration-300 overflow-x-hidden" ref={chatContainerRef}>
        <AnimatePresence>
          {messages.map((message: MessageType, index: number) => (
            <motion.div
              key={`${message.SenderID}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`bg-slate-300 rounded-[8px] flex flex-col gap-[8px] md:p-[16px] p-[8px] overflow-hidden 
                ${message.SenderID === username ? "items-end lg:ml-[200px] md:ml-[100px] ml-[50px]" : "lg:mr-[200px] md:mr-[100px] mr-[50px]"}`}
            >
              <div className="md:text-base font-bold">{message.SenderID}</div>
              <div className="md:text-2xl text-xl">{message.Content}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="bg-white flex flex-col justify-center items-start w-full gap-[16px]">
        <input 
          className="border-[1px] border-1 border-slate-300 rounded-[4px] p-[8px] md:w-[500px] w-[200px]"
          type="text"
          placeholder="receiver"
          value={receiverState}
          onChange={(e) => setReceiverState(e.target.value)}
        />
        <div className="w-full flex flex-row gap-[10px]">
          <input 
            className="border-[1px] border-1 border-slate-300 rounded-[4px] p-[8px] w-full"
            type="text"
            placeholder="message"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
          />
          <button 
            className="bg-black text-white rounded-[8px] p-[8px] hover:bg-slate-500 transition-colors duration-300 lg:size-16 flex flex-col justify-center items-center h-full size-12"
            onClick={() => sendMessage(receiverState)}
          >
            <IoMdSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;