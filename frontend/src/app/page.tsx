"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

const Home: React.FC = () => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleGo = () => {
    if (inputRef.current && inputRef.current.value.trim() !== "") {
      // Make sure there's no extra space or plus sign in the URL
      router.push(`/chat/${inputRef.current.value.trim()}`);
    }
  };
  
  return (
    <main className="bg-white w-screen h-screen flex justify-center items-center text-black text-[12px]">
      <div className="shadow rounded-[16px] p-[16px] flex flex-col gap-[32px] border-[1px]">
        <div className="flex flex-col justify-center items-center gap-[16px]">
          <div>Enter your username</div>
          <input
            className="border-[1px] border-1 border-slate-300 rounded-[4px] p-[8px] w-[200px]"
            type="text"
            placeholder="username"
            ref={inputRef}
          />
        </div>
        <button
          className="bg-black text-white rounded-[8px] p-[8px] w-full hover:bg-slate-500 transition-colors duration-300"
          onClick={handleGo}
        >
          Enter
        </button>
      </div>
    </main>
  );
};

export default Home;