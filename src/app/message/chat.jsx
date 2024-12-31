"use client";

import * as Ably from "ably";
import ChatBox from "./chat-box.jsx";

export default function Chat() {
  const client = new Ably.Realtime({
    key: "NWYBUg.-hdX5w:bBrn8OoLjRwMXxGPaiMNZwSJAiUcFrmrjOHmKKJ8prM",
  });
  return <ChatBox />;
}
