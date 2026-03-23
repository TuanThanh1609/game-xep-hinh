// webhook/server.js — Facebook Messenger Webhook cho Speed Jigsaw Maycha Festival
// Deploy lên: Railway, Render, Replit, hoặc VPS

const express = require('express');
const crypto  = require('crypto');
const fetch   = require('node-fetch');

const app = express();
app.use(express.json());

// ===== CẤU HÌNH =====
const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_TOKEN;
const VERIFY_TOKEN      = process.env.FB_VERIFY_TOKEN || 'maycha_festival_2025';
const GAME_BASE_URL     = process.env.GAME_BASE_URL;   // VD: https://speed-jigsaw.onrender.com
const NOCODB_URL        = process.env.NOCODB_URL;
const NOCODB_TOKEN      = process.env.NOCODB_TOKEN;
const LEADS_TABLE       = process.env.NOCODB_LEADS_TABLE;
const RESULTS_TABLE     = process.env.NOCODB_RESULTS_TABLE;
const VOUCHERS_TABLE    = process.env.NOCODB_VOUCHERS_TABLE;

// ===== PRIZE CONFIG =====
const PRIZE_TIERS = [
  { label: 'Voucher 10K',   value: 10000,  probability: 0.35, emoji: '🍵' },
  { label: 'Voucher 20K',   value: 20000,  probability: 0.30, emoji: '🧋' },
  { label: 'Voucher 30K',   value: 30000,  probability: 0.20, emoji: '🥤' },
  { label: 'Voucher 50K',   value: 50000,  probability: 0.10, emoji: '🎁' },
  { label: 'Voucher 100K', value: 100000, probability: 0.05, emoji: '🎉' },
];

// ===== FB Webhook Setup ==========
app.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Speed Jigsaw Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const event = entry?.messaging?.[0];
    if (!event || event.message?.is_echo) return res.sendStatus(200);

    const senderId = event.sender.id;
    const message  = event.message?.text?.trim() || '';
    const payload  = event.message?.quick_reply?.payload;

    console.log(`📩 Message from ${senderId}: "${message}" | Payload: ${payload}`);

    // === FLOW: Chào → Gửi link game ===
    if (payload === 'PLAY_JIGSAW' || message.toUpperCase().startsWith('CHƠI')) {
      await sendWelcomeMessage(senderId);
    } else if (payload === 'JIGSAW_LEAD') {
      await sendLeadPrompt(senderId);
    } else if (payload?.startsWith('PHONE_')) {
      const phone = payload.replace('PHONE_', '') + message;
      if (/^0[3-9]\d{8}$/.test(phone)) {
        await handleLeadSubmission(senderId, phone);
      } else {
        await sendText(senderId, '❌ SĐT không hợp lệ. Vui lòng nhập lại (09xxxxxxxx):');
      }
    } else if (message.toUpperCase() === 'CHƠI LẠI' || payload === 'REPLAY_JIGSAW') {
      await sendWelcomeMessage(senderId);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(200); // Always 200 to avoid FB retries
  }
});

// ===== API: Nhận kết quả từ game (cross-origin) ==========
app.post('/api/game-result', async (req, res) => {
  try {
    const { phone, fb_sender, time_seconds, time_ms, completed, prize, prize_code, prize_value } = req.body;
    if (!phone) return res.status(400).json({ error: 'Missing phone' });

    // Lưu vào NocoDB
    if (NOCODB_URL && NOCODB_TOKEN && RESULTS_TABLE) {
      await fetch(`${NOCODB_URL}/api/v2/tables/${RESULTS_TABLE}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': NOCODB_TOKEN
        },
        body: JSON.stringify({
          phone,
          fb_psid: fb_sender || '',
          time_seconds: time_seconds || null,
          time_ms: time_ms || null,
          completed: completed || false,
          prize: prize || null,
          prize_code: prize_code || null,
          prize_value: prize_value || null,
          won_at: new Date().toISOString(),
          campaign: 'Festival 30/4 - 1/5'
        })
      });
    }

    // Cập nhật voucher nếu có mã
    if (prize_code && NOCODB_URL && NOCODB_TOKEN && VOUCHERS_TABLE) {
      await fetch(`${NOCODB_URL}/api/v2/tables/${VOUCHERS_TABLE}/records`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': NOCODB_TOKEN
        },
        body: JSON.stringify({
          "Limit": 1,
          "where": `(code,eq,${prize_code})`,
          "payload": {
            phone,
            issued_at: new Date().toISOString()
          }
        })
      }).catch(e => console.error('Voucher update error:', e));
    }

    // Gửi kết quả về Messenger
    if (fb_sender && PAGE_ACCESS_TOKEN) {
      await sendGameResult(fb_sender, { time_seconds, completed, prize, prize_code, prize_value });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Game result error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== API: Lưu lead ==========
app.post('/api/lead', async (req, res) => {
  try {
    const { phone, fb_sender } = req.body;
    if (!phone) return res.status(400).json({ error: 'Missing phone' });

    if (NOCODB_URL && NOCODB_TOKEN && LEADS_TABLE) {
      await fetch(`${NOCODB_URL}/api/v2/tables/${LEADS_TABLE}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': NOCODB_TOKEN
        },
        body: JSON.stringify({
          phone,
          fb_psid: fb_sender || '',
          played_at: new Date().toISOString(),
          source: 'MESSENGER',
          completed: false,
          campaign: 'Festival 30/4 - 1/5'
        })
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Lead save error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== API: Lấy voucher trúng (random) ==========
app.get('/api/get-voucher', async (req, res) => {
  try {
    const { prize_value } = req.query;

    // Lấy 1 voucher chưa phát, còn hạn
    if (!NOCODB_URL || !NOCODB_TOKEN || !VOUCHERS_TABLE) {
      // Fallback: generate code locally
      const code = generateVoucherCode();
      return res.json({ code, prize: `Voucher ${prize_value || 20}K`, prize_value: parseInt(prize_value) || 20000 });
    }

    const now = new Date().toISOString();
    const filter = prize_value
      ? `&where=(prize_value,eq,${prize_value})`
      : '';
    const res_nc = await fetch(
      `${NOCODB_URL}/api/v2/tables/${VOUCHERS_TABLE}/records?limit=1&offset=0&where=(redeemed,eq,false)${filter}`,
      { headers: { 'xc-token': NOCODB_TOKEN } }
    );
    const json = await res_nc.json();
    const voucher = json.list?.[0];

    if (!voucher) {
      // Không còn voucher — trả fallback
      const code = generateVoucherCode();
      return res.json({ code, prize: `Voucher ${prize_value || 20}K`, prize_value: parseInt(prize_value) || 20000 });
    }

    res.json({
      code: voucher.code,
      prize: voucher.prize,
      prize_value: voucher.prize_value,
      expires_at: voucher.expires_at
    });
  } catch (err) {
    console.error('Get voucher error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== API: Health check ==========
app.get('/', (req, res) => {
  res.json({ status: 'ok', game: 'Speed Jigsaw - Maycha Festival', uptime: process.uptime() });
});

// ===== FB Message Senders ==========

async function sendWelcomeMessage(senderId) {
  const gameUrl = `${GAME_BASE_URL}/index.html?fb_sender=${senderId}&nocodb=true`;

  await sendText(senderId,
    '🧋🎮 CHÀO MỪNG ĐẠI LỄ 30/4 - 1/5!\n\n' +
    '🎯 SPEED JIGSAW — Ghép hình 6x6 nhanh nhất để nhận Voucher trà sữa Maycha cực hấp dẫn!\n\n' +
    '⏱️ 60 giây — 36 mảnh ghép — Quà tặng cực chất\n\n' +
    '👇 Bấm nút bên dưới để bắt đầu!'
  );

  const message = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: '🎮 Nhấn để chơi ngay!',
        buttons: [
          {
            type: 'web_url',
            url: gameUrl,
            title: '🎯 CHƠI NGAY',
            webview_height_ratio: 'full',
            messenger_extensions: true,
            fallback_url: gameUrl
          },
          {
            type: 'postback',
            title: '🔄 Chơi lại',
            payload: 'REPLAY_JIGSAW'
          }
        ]
      }
    }
  };
  await sendFbMessage(senderId, message);
}

async function sendLeadPrompt(senderId) {
  await sendText(senderId,
    '📱 Nhập SĐT của bạn để nhận quà!\n' +
    'SĐT của bạn sẽ được bảo mật và chỉ dùng để nhận quà tại Maycha.'
  );

  const message = {
    text: 'Nhập SĐT:',
    quick_replies: [
      { content_type: 'user_phone_number', payload: 'PHONE_' }
    ]
  };
  await sendFbMessage(senderId, message);
}

async function handleLeadSubmission(senderId, phone) {
  if (NOCODB_URL && NOCODB_TOKEN && LEADS_TABLE) {
    try {
      await fetch(`${NOCODB_URL}/api/v2/tables/${LEADS_TABLE}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': NOCODB_TOKEN
        },
        body: JSON.stringify({
          phone, fb_psid: senderId,
          played_at: new Date().toISOString(),
          source: 'MESSENGER',
          campaign: 'Festival 30/4 - 1/5'
        })
      });
    } catch (e) {
      console.error('NocoDB lead save error:', e);
    }
  }

  await sendText(senderId, '✅ Đã nhận SĐT! Đang mở game...');

  const gameUrl = `${GAME_BASE_URL}/index.html?fb_sender=${senderId}&nocodb=true`;
  const message = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: '🎯 Nhấn nút bên dưới để chơi và nhận Voucher trà sữa Maycha!',
        buttons: [
          {
            type: 'web_url',
            url: gameUrl,
            title: '🎮 CHƠI NGAY',
            webview_height_ratio: 'full',
            messenger_extensions: true,
            fallback_url: gameUrl
          }
        ]
      }
    }
  };
  await sendFbMessage(senderId, message);
}

async function sendGameResult(senderId, result) {
  const { time_seconds, completed, prize, prize_code, prize_value } = result;

  if (!completed) {
    await sendText(senderId,
      '⏰ Hết giờ! Bạn chưa hoàn thành kịp lúc.\n\n' +
      '🔄 Đừng nản chí — Chơi lại ngay để nhận quà!\n\n' +
      'Gửi tin nhắn "CHƠI" để bắt đầu lại.'
    );
    return;
  }

  const minutes = Math.floor(time_seconds / 60);
  const seconds = time_seconds % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

  const emoji = prize_value >= 50000 ? '🎉🎉🎉' : prize_value >= 20000 ? '🎉🎉' : '🎊';
  const formattedValue = prize_value ? prize_value.toLocaleString('vi-VN') : '';

  await sendText(senderId,
    `${emoji} KẾT QUẢ SPEED JIGSAW\n` +
    `─────────────────────\n` +
    `⏱️ Thời gian: ${timeStr}\n` +
    `🎁 Phần thưởng: ${prize || 'Voucher Maycha'}\n` +
    `🎫 Mã: ${prize_code || 'MAYTICKET'}\n` +
    `💰 Giá trị: ${formattedValue}đ\n` +
    `─────────────────────\n\n` +
    `📍 Đến cửa hàng Maycha gần nhất để đổi quà.\n` +
    `⏰ Hiệu lực: 30 ngày kể từ hôm nay.\n\n` +
    `🔄 Gửi "CHƠI" để chơi lại!`
  );

  if (prize_code && prize_value) {
    const message = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'receipt',
          recipient_name: 'Khách hàng Maycha',
          merchant_name: 'Maycha Bubble Tea',
          order_number: prize_code,
          currency: 'VND',
          payment_method: 'Voucher',
          elements: [
            {
              title: prize || 'Voucher Maycha',
              subtitle: `Mã: ${prize_code} — Trị giá ${formattedValue}đ`,
              quantity: 1,
              price: prize_value,
              currency: 'VND'
            }
          ],
          adjustments: []
        }
      }
    };
    await sendFbMessage(senderId, message).catch(() => {});
  }
}

async function sendText(recipientId, text) {
  await sendFbMessage(recipientId, { text });
}

async function sendFbMessage(recipientId, message) {
  if (!PAGE_ACCESS_TOKEN) {
    console.log('📤 FB Message (no token):', JSON.stringify(message).substring(0, 100));
    return;
  }
  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: { id: recipientId }, ...message })
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('FB API error:', err);
    }
  } catch (e) {
    console.error('FB message send error:', e);
  }
}

// ===== UTILS =====

function generateVoucherCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'MCJIG';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function pickPrize() {
  const rand = Math.random();
  let cumulative = 0;
  for (const tier of PRIZE_TIERS) {
    cumulative += tier.probability;
    if (rand <= cumulative) return tier;
  }
  return PRIZE_TIERS[0];
}

// ===== START ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🧋 Speed Jigsaw Webhook Server running on :${PORT}`);
  console.log(`📱 FB Page Token: ${PAGE_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`🗄️  NocoDB: ${NOCODB_URL ? '✅ Configured' : '❌ Not set'}`);
  console.log(`🎮 Game Base URL: ${GAME_BASE_URL || '❌ Not set'}`);
});
