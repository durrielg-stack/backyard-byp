"use client";

import { useState } from "react";
import Script from "next/script";

// The config script calls window.botpress.init(), which only exists once
// inject.js has run. Two independent <Script> tags give no ordering
// guarantee, so the config script is rendered only after inject.js is ready.
// onReady also fires when an already-loaded inject.js is remounted.
const INJECT_SRC = "https://cdn.botpress.cloud/webchat/v3.7/inject.js";
const CONFIG_SRC =
  "https://files.bpcontent.cloud/2026/08/05/13/20260805131439-DNGLV32O.js";

export function BotpressWebchat() {
  const [injectReady, setInjectReady] = useState(false);
  return (
    <>
      <Script
        src={INJECT_SRC}
        strategy="afterInteractive"
        onReady={() => setInjectReady(true)}
      />
      {injectReady && <Script src={CONFIG_SRC} strategy="afterInteractive" />}
    </>
  );
}
