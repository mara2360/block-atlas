/* Atlas AI — crypto Q&A chat.
   Asks the /api/chat serverless function (Claude) when it's deployed with an API key.
   If that isn't available (local preview, no key yet, network error) it answers from
   the built-in field guide below so the chat never dead-ends. */
(function () {
  const fab = document.getElementById('chatFab');
  const panel = document.getElementById('chatPanel');
  if (!fab || !panel) return;
  const log = document.getElementById('chatLog');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const chips = document.getElementById('chatChips');
  const closeBtn = document.getElementById('chatClose');

  const history = []; // {role:'user'|'assistant', content}
  let apiOk = true;   // flips to false after the first failed API call
  let busy = false;

  /* ---------- Built-in field guide (offline fallback) ---------- */
  const KB = [
    { k: ['what is crypto', 'cryptocurrency', 'what is a crypto', 'crypto mean', 'define crypto'],
      a: "Cryptocurrency is digital money that runs on a public network of computers instead of a bank. A shared ledger (the blockchain) records who owns what, and cryptography keeps it secure. Nobody needs to trust a single company to keep the books." },
    { k: ['blockchain', 'block chain', 'ledger'],
      a: "A blockchain is a shared record book that thousands of computers keep a copy of. New transactions are bundled into \"blocks,\" and each block links to the one before it, so changing old history would mean redoing everything after it. That's what makes it hard to tamper with." },
    { k: ['bitcoin', 'btc'],
      a: "Bitcoin (BTC) was the first cryptocurrency, launched in 2009. It has a fixed maximum supply of 21 million coins and uses proof of work to stay secure. Most people treat it as a settlement network or a kind of digital store of value." },
    { k: ['ethereum', 'eth', 'ether'],
      a: "Ethereum is a blockchain that can run programs called smart contracts, so people build apps on it: exchanges, lending, NFTs and more. Its coin, ETH, pays the network fees (called gas). Ethereum moved from proof of work to proof of stake in 2022." },
    { k: ['solana', 'sol'],
      a: "Solana is a blockchain designed for speed and low fees, which makes it popular for consumer apps, payments and trading. Its coin is SOL. The trade-off people debate is that running a Solana node needs more powerful hardware than some other networks." },
    { k: ['bitcoin vs ethereum', 'ethereum vs bitcoin', 'btc vs eth', 'eth vs btc', 'difference between bitcoin', 'difference between ethereum'],
      a: "The short version: Bitcoin is built to be simple, scarce money (fixed 21M supply, secured by proof of work). Ethereum is built to be a programmable platform where apps run on smart contracts, and ETH pays for using it (secured by proof of stake). Bitcoin optimizes for stability; Ethereum optimizes for flexibility." },
    { k: ['wallet', 'metamask', 'phantom'],
      a: "A crypto wallet is an app or device that holds the keys that control your coins. The coins live on the blockchain; the wallet just proves they're yours. \"Hot\" wallets are apps connected to the internet; \"cold\" wallets are offline devices that are harder to hack." },
    { k: ['seed phrase', 'recovery phrase', 'private key', 'mnemonic', 'secret phrase'],
      a: "A seed phrase (usually 12 or 24 words) is the master backup for your wallet. Anyone who has it can take everything. Write it on paper, store it somewhere safe, never type it into a website, and never share it, not even with \"support.\" No real company will ever ask for it." },
    { k: ['proof of work', 'mining', 'miner', 'pow'],
      a: "Proof of work is how Bitcoin agrees on its history. Miners race to solve a hard math puzzle using computing power; the winner adds the next block and earns new coins plus fees. Attacking the network would require more computing power than the honest miners combined." },
    { k: ['proof of stake', 'staking', 'stake', 'validator', 'pos'],
      a: "Proof of stake secures a network with coins instead of computing power. Validators lock up (stake) coins to earn the right to add blocks, and they can lose part of that stake if they cheat. Staking rewards are payment for helping secure the network, and they come with risks like lock-up periods and price swings." },
    { k: ['gas', 'fee', 'fees', 'transaction cost'],
      a: "Gas is the fee you pay to get a transaction processed. It goes to the miners or validators doing the work. Fees rise when the network is busy, the same way surge pricing works for rides." },
    { k: ['smart contract'],
      a: "A smart contract is a program that lives on a blockchain and runs exactly as written when someone uses it, for example \"if you send 1 ETH, send back this token.\" It's powerful, but bugs in the code can't easily be fixed, so audits and caution matter." },
    { k: ['stablecoin', 'usdc', 'usdt', 'tether'],
      a: "A stablecoin is a token designed to hold a steady value, usually $1. Most are backed by cash and short-term bonds held by a company (like USDC). They're used for trading and payments, but you're trusting the issuer's reserves, so it's worth checking who backs one." },
    { k: ['nft', 'non-fungible'],
      a: "An NFT (non-fungible token) is a unique token on a blockchain that proves ownership of a specific item: art, a ticket, a game item. \"Non-fungible\" just means each one is different, unlike coins where any one is the same as another." },
    { k: ['defi', 'decentralized finance', 'lending', 'yield'],
      a: "DeFi (decentralized finance) means financial apps like trading, lending and borrowing that run on smart contracts instead of banks. It's open to anyone, but risks include contract bugs, hacks and very high advertised yields that can disappear quickly." },
    { k: ['exchange', 'coinbase', 'where to buy', 'how to buy', 'buy crypto'],
      a: "Most people start with a regulated exchange in their country. You verify your identity, link a bank account and buy. If you plan to hold for a long time, many people move coins to a wallet they control. Start small, and only use money you can afford to lose." },
    { k: ['halving', 'halvening'],
      a: "The Bitcoin halving happens about every four years (every 210,000 blocks) and cuts the reward miners earn per block in half. It slows the creation of new bitcoin until the 21 million cap is reached, around the year 2140." },
    { k: ['scam', 'rug pull', 'rugpull', 'fraud', 'safe', 'phishing'],
      a: "Common red flags: guaranteed returns, pressure to act fast, someone asking for your seed phrase, \"support\" reaching out to you first, and tokens promoted mainly by hype. When in doubt, slow down, verify the website address, and never approve a transaction you don't understand." },
    { k: ['altcoin', 'token vs coin', 'token', 'coin vs'],
      a: "A coin usually runs on its own blockchain (BTC on Bitcoin, ETH on Ethereum). A token is built on top of someone else's blockchain, like the thousands of tokens on Ethereum or Solana. \"Altcoin\" just means any crypto other than Bitcoin." },
    { k: ['layer 2', 'l2', 'rollup', 'layer two'],
      a: "A layer 2 is a network built on top of a main blockchain (usually Ethereum) to make transactions faster and cheaper. It bundles many transactions together and settles them back on the main chain for security." },
    { k: ['volatile', 'volatility', 'why price', 'price go', 'crash', 'pump'],
      a: "Crypto prices swing a lot because the market is young, trades 24/7 worldwide, and moves on news, sentiment and leverage. Drops of 50% or more have happened many times. That's why it's wise to size positions carefully." },
    { k: ['should i buy', 'should i invest', 'invest', 'good investment', 'will it go up', 'predict', 'price prediction'],
      a: "I can't tell you what to buy or predict prices. That would be financial advice, and nobody reliably knows. What I can help with is how a network works, what risks to check, and questions to ask before you decide. Want a quick checklist?" },
    { k: ['price', 'how much', 'worth', 'cost'],
      a: "The prices shown on Block Atlas are simulated for demonstration, not live market data. For real prices, check a reputable exchange or market data site." },
    { k: ['checklist', 'research', 'before buying', 'dyor'],
      a: "A quick research checklist: 1) What problem does the network solve, in one sentence? 2) Who controls it, and how are decisions made? 3) Where does the token supply come from, and who holds most of it? 4) Has the code been audited or hacked? 5) What would make your thesis wrong?" },
    { k: ['block atlas', 'who are you', 'what are you', 'about this site'],
      a: "I'm Atlas AI, Block Atlas's field guide. I answer simple, educational crypto questions in plain English. I don't give financial advice or price predictions." },
    { k: ['hi', 'hello', 'hey', 'yo', 'sup'],
      a: "Hey! Ask me anything basic about crypto: what a blockchain is, how wallets work, Bitcoin vs Ethereum, how to stay safe and more." },
    { k: ['thank', 'thanks', 'ty'],
      a: "Anytime. Stay curious, stay solvent." }
  ];

  function localAnswer(q) {
    const t = ' ' + q.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ') + ' ';
    let best = null, score = 0;
    for (const item of KB) {
      for (const k of item.k) {
        const hit = k.length <= 4 ? t.includes(' ' + k + ' ') : t.includes(k);
        if (hit && k.length > score) { best = item; score = k.length; }
      }
    }
    return best ? best.a :
      "Good question. That's a bit outside my built-in field guide. Try asking about blockchains, wallets, Bitcoin, Ethereum, Solana, staking, fees, stablecoins or staying safe from scams.";
  }

  /* ---------- UI ---------- */
  const STARTERS = ['What is a blockchain?', 'Bitcoin vs Ethereum?', 'What is a seed phrase?', 'How do I avoid scams?'];

  function esc(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function fmt(s) {
    // light formatting: **bold**, line breaks
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  }

  function bubble(role, text) {
    const el = document.createElement('div');
    el.className = 'msg ' + (role === 'user' ? 'msg-user' : 'msg-bot');
    el.innerHTML = '<div class="msg-body">' + fmt(text) + '</div>';
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function typing() {
    const el = document.createElement('div');
    el.className = 'msg msg-bot';
    el.innerHTML = '<div class="msg-body typing"><i></i><i></i><i></i></div>';
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function renderChips() {
    chips.innerHTML = '';
    STARTERS.forEach(q => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = q;
      b.addEventListener('click', () => send(q));
      chips.appendChild(b);
    });
  }

  async function askApi() {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-10) }),
        signal: ctrl.signal
      });
      if (!r.ok) throw new Error('status ' + r.status);
      const data = await r.json();
      if (!data || typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('empty');
      return data.reply.trim();
    } finally { clearTimeout(timer); }
  }

  async function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    busy = true;
    chips.hidden = true;
    bubble('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    const t = typing();
    let reply;
    const canTryApi = apiOk && /^https?:$/.test(location.protocol);
    if (canTryApi) {
      try { reply = await askApi(); }
      catch (e) { apiOk = false; }
    }
    if (!reply) {
      await new Promise(r => setTimeout(r, 450 + Math.random() * 400));
      reply = localAnswer(text);
    }
    t.remove();
    bubble('assistant', reply);
    history.push({ role: 'assistant', content: reply });
    busy = false;
    input.focus();
  }

  function open() {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    fab.setAttribute('aria-expanded', 'true');
    fab.classList.add('hide');
    if (!log.children.length) {
      bubble('assistant', "Hi, I'm **Atlas AI**. Ask me a simple crypto question, or click one of the prompts below to get started. (Educational only, not financial advice.)");
      renderChips();
    }
    setTimeout(() => input.focus(), 250);
  }
  function close() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    fab.setAttribute('aria-expanded', 'false');
    fab.classList.remove('hide');
    fab.focus();
  }

  fab.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) close(); });
  document.querySelectorAll('[data-open-chat]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); open(); }));
  form.addEventListener('submit', e => { e.preventDefault(); send(input.value); });

  // test hook
  window.__atlasLocalAnswer = localAnswer;
})();
