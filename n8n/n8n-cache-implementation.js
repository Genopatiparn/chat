// n8n Cache Implementation Code
// ใช้แทนที่ในโหนด Code ต่างๆ ใน workflow

// 1. Enhanced Information Extractor with FAQ Cache
const enhancedInformationExtractor = `
try {
  const userMessage = $json.message || '';
  console.log('Processing message:', userMessage);
  
  // เช็ค FAQ Cache ก่อน
  const faqResponse = checkFAQCache(userMessage);
  if (faqResponse) {
    console.log('FAQ Cache hit for:', userMessage);
    return [{
      json: {
        output: {
          issue: userMessage,
          name: '',
          phone: ''
        },
        faqResponse: faqResponse,
        source: 'faq_cache'
      }
    }];
  }
  
  // ถ้าไม่พบใน FAQ ให้ดำเนินการปกติ
  const extractedData = $('Information Extractor1').item.json.output;
  
  if (!extractedData) {
    return [{
      json: {
        output: {
          issue: userMessage,
          name: '',
          phone: ''
        },
        source: 'fallback'
      }
    }];
  }
  
  return [{
    json: {
      output: extractedData,
      source: 'ai_extraction'
    }
  }];
  
} catch (error) {
  console.error('Enhanced Information Extractor Error:', error);
  return [{
    json: {
      output: {
        issue: $json.message || 'ไม่ระบุ',
        name: '',
        phone: ''
      },
      source: 'error_fallback'
    }
  }];
}

// FAQ Cache Function
function checkFAQCache(userMessage) {
  const message = userMessage.toLowerCase().trim();
  
  // POS Usage
  if (message.includes('pos') || message.includes('ใช้งาน') || message.includes('วิธีใช้')) {
    return \`📱 วิธีใช้งาน POS ระบบ

1. เปิดแอป POS บนเครื่อง
2. เลือกสินค้าที่ต้องการขาย
3. ใส่จำนวนสินค้า
4. เลือกวิธีการชำระเงิน
5. พิมพ์ใบเสร็จ

📞 หากต้องการความช่วยเหลือเพิ่มเติม โทร: 02-222-2222\`;
  }
  
  // Add Product
  if (message.includes('เพิ่มสินค้า') || message.includes('สินค้าใหม่') || message.includes('ใส่สินค้า')) {
    return \`➕ วิธีเพิ่มสินค้าใหม่

1. เข้าเมนู "จัดการสินค้า"
2. กดปุ่ม "เพิ่มสินค้าใหม่"
3. กรอกข้อมูล: ชื่อสินค้า, ราคา, รหัสสินค้า, หมวดหมู่
4. บันทึกข้อมูล

💡 สามารถสแกน Barcode ได้ด้วยค่ะ\`;
  }
  
  // Connection Issues
  if (message.includes('เชื่อมต่อ') || message.includes('อินเทอร์เน็ต') || message.includes('ระบบล่ม') || message.includes('ไม่ได้')) {
    return \`🔧 แก้ไขปัญหาการเชื่อมต่อ

1. เช็คสัญญาณอินเทอร์เน็ต
2. รีสตาร์ทแอป POS
3. เช็คการเชื่อมต่อ WiFi
4. ลองใช้ข้อมูลมือถือ

⚠️ หากยังไม่ได้ กรุณาติดต่อ: 02-222-2222 (24 ชม.)\`;
  }
  
  // Printing Issues
  if (message.includes('พิมพ์') || message.includes('ใบเสร็จ') || message.includes('เครื่องพิมพ์') || message.includes('ปริ้น')) {
    return \`🖨️ แก้ไขปัญหาการพิมพ์

1. เช็คกระดาษในเครื่องพิมพ์
2. เช็คการเชื่อมต่อ Bluetooth/USB
3. รีสตาร์ทเครื่องพิมพ์
4. ตั้งค่าเครื่องพิมพ์ใหม่

📋 สามารถส่งใบเสร็จทาง Email ได้ด้วยค่ะ\`;
  }
  
  // Payment
  if (message.includes('ชำระเงิน') || message.includes('รับเงิน') || message.includes('qr') || message.includes('โอน') || message.includes('บัตร')) {
    return \`💳 วิธีการชำระเงิน

✅ รองรับการชำระ:
- เงินสด
- บัตรเครดิต/เดบิต
- QR Code (PromptPay)
- โอนเงิน
- เงินทอน

📱 สแกน QR ผ่านแอป Banking ได้เลยค่ะ\`;
  }
  
  // Reports
  if (message.includes('ยอดขาย') || message.includes('รายงาน') || message.includes('สรุป') || message.includes('สถิติ')) {
    return \`📊 ดูรายงานยอดขาย

1. เข้าเมนู "รายงาน"
2. เลือกช่วงเวลา: รายวัน/สัปดาห์/เดือน
3. ดูรายละเอียด: ยอดขายรวม, จำนวนบิล, สินค้าขายดี

📈 สามารถส่งออกเป็น Excel ได้ค่ะ\`;
  }
  
  // Backup
  if (message.includes('สำรอง') || message.includes('backup') || message.includes('กู้ข้อมูล')) {
    return \`💾 การสำรองข้อมูล

🔄 อัตโนมัติ: สำรองทุก 24 ชั่วโมง เก็บบน Cloud ปลอดภัย 100%

📥 สำรองด้วยตนเอง:
1. เข้าเมนู "ตั้งค่า"
2. เลือก "สำรองข้อมูล"
3. กด "สำรองเดี๋ยวนี้"

✅ ข้อมูลปลอดภัยแน่นอนค่ะ\`;
  }
  
  // Contact
  if (message.includes('ติดต่อ') || message.includes('เบอร์') || message.includes('ช่วยเหลือ') || message.includes('โทร')) {
    return \`📞 ช่องทางติดต่อ

🕐 24 ชั่วโมง: 02-222-2222
💬 LINE: @support_pos
📧 Email: support@company.com

🏢 สำนักงาน:
จันทร์-ศุกร์ 9:00-18:00
เสาร์ 9:00-16:00

⚡ ตอบกลับภายใน 30 นาทีค่ะ\`;
  }
  
  return null; // ไม่พบใน FAQ
}
`;

// 2. Enhanced Question and Answer Chain with Timeout
const enhancedQAChain = `
try {
  const userMessage = $json.output.issue || $json.message || 'คำถามทั่วไป';
  const startTime = Date.now();
  const timeout = 25000; // 25 วินาที
  
  console.log('Processing QA for:', userMessage);
  
  // เช็ค FAQ ก่อน (ถ้ายังไม่ได้เช็ค)
  if ($json.source === 'faq_cache') {
    return [{
      json: {
        response: $json.faqResponse,
        source: 'faq_cache'
      }
    }];
  }
  
  // สร้าง Promise สำหรับ AI call
  const aiCall = new Promise((resolve, reject) => {
    try {
      // เรียก AI service (แทนที่ด้วย actual AI call)
      const result = $('Question and Answer Chain1').first();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
  
  // สร้าง timeout Promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('AI_TIMEOUT'));
    }, timeout);
  });
  
  // รอผลลัพธ์หรือ timeout
  const result = await Promise.race([aiCall, timeoutPromise]);
  
  if (result && result.json && result.json.response) {
    console.log('AI response received in', Date.now() - startTime, 'ms');
    return [{
      json: {
        response: result.json.response,
        source: 'ai_success',
        responseTime: Date.now() - startTime
      }
    }];
  } else {
    throw new Error('Empty AI response');
  }
  
} catch (error) {
  console.error('Enhanced QA Chain Error:', error);
  
  let fallbackMessage = "ขออภัยค่ะ เกิดข้อผิดพลาดในการประมวลผล";
  let requiresHuman = false;
  
  if (error.message === 'AI_TIMEOUT') {
    fallbackMessage = "ระบบกำลังประมวลผลช้ากว่าปกติ กรุณารอสักครู่แล้วลองใหม่อีกครั้งค่ะ";
    requiresHuman = true;
  } else if (error.message.includes('rate_limit') || error.message.includes('429')) {
    fallbackMessage = "ขณะนี้มีผู้ใช้งานเยอะ กรุณารอสักครู่แล้วลองใหม่อีกครั้งค่ะ";
    requiresHuman = true;
  } else if (error.message.includes('network') || error.message.includes('connection')) {
    fallbackMessage = "เกิดปัญหาการเชื่อมต่อ กรุณาเช็คอินเทอร์เน็ตแล้วลองใหม่ค่ะ";
    requiresHuman = true;
  }
  
  if (requiresHuman) {
    fallbackMessage += "\\n\\nเจ้าหน้าที่จะติดต่อกลับภายใน 24 ชั่วโมงค่ะ\\nหากเร่งด่วน กรุณาติดต่อ: 02-222-2222";
  }
  
  return [{
    json: {
      response: fallbackMessage,
      source: 'fallback',
      requiresHumanResponse: requiresHuman,
      error: error.message
    }
  }];
}
`;

// 3. Enhanced Admin Alert Code with Caching
const enhancedAdminAlert = `
try {
  const inputData = $input.first().json;
  
  // เช็คว่าเป็น FAQ response หรือไม่
  if (inputData.source === 'faq_cache') {
    return [{
      json: {
        text: inputData.response
      }
    }];
  }
  
  // เช็คว่าต้องการ human response หรือไม่
  if (inputData.requiresHumanResponse) {
    const extractedData = $('Information Extractor1').item.json.output;
    const name = extractedData?.name || '';
    const issue = extractedData?.issue || 'ไม่ระบุ';
    
    let userReply = name ? 
      \`เรียนคุณ \${name}\\nสอบถามมาเกี่ยวกับ "\${issue}"\\nระบบกำลังมีปัญหาชั่วคราว เจ้าหน้าที่จะติดต่อกลับภายใน 24 ชั่วโมงค่ะ\\nหากเร่งด่วน กรุณาติดต่อ: 02-222-2222\\nขอบคุณที่ใช้บริการค่ะ\` :
      \`สอบถามมาเกี่ยวกับ "\${issue}"\\nระบบกำลังมีปัญหาชั่วคราว เจ้าหน้าที่จะติดต่อกลับภายใน 24 ชั่วโมงค่ะ\\nหากเร่งด่วน กรุณาติดต่อ: 02-222-2222\\nขอบคุณที่ใช้บริการค่ะ\`;
    
    return [{
      json: {
        text: userReply
      }
    }];
  }
  
  // กรณีปกติ
  const extractedData = $('Information Extractor1').item.json.output;
  
  if (!extractedData) {
    return [{
      json: {
        text: "ขออภัยค่ะ ไม่สามารถประมวลผลข้อมูลได้ กรุณาลองใหม่อีกครั้งค่ะ"
      }
    }];
  }
  
  const name = extractedData.name || '';
  const issue = extractedData.issue || 'ไม่ระบุ';
  
  let userReply = name ? 
    \`เรียนคุณ \${name}\\nสอบถามมาเกี่ยวกับ "\${issue}"\\nเจ้าหน้าที่จะติดต่อกลับภายใน 24 ชั่วโมงค่ะ\\nหากเร่งด่วน กรุณาติดต่อ: 02-222-2222\\nขอบคุณที่ใช้บริการค่ะ\` :
    \`สอบถามมาเกี่ยวกับ "\${issue}"\\nเจ้าหน้าที่จะติดต่อกลับภายใน 24 ชั่วโมงค่ะ\\nหากเร่งด่วน กรุณาติดต่อ: 02-222-2222\\nขอบคุณที่ใช้บริการค่ะ\`;
  
  return [{
    json: {
      text: userReply
    }
  }];
  
} catch (error) {
  console.error('Enhanced Admin Alert Error:', error);
  return [{
    json: {
      text: "ขออภัยค่ะ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้งค่ะ หรือติดต่อ 02-222-2222"
    }
  }];
}
`;

// 4. Health Check Code
const healthCheckCode = `
try {
  const healthChecks = {
    openai: false,
    qdrant: false,
    sheets: false,
    line: false
  };
  
  // เช็ค OpenAI
  try {
    const openaiTest = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_OPENAI_KEY',
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    healthChecks.openai = openaiTest.ok;
  } catch (e) {
    console.log('OpenAI health check failed:', e.message);
  }
  
  // เช็ค Qdrant (ถ้ามี endpoint)
  try {
    const qdrantTest = await fetch('YOUR_QDRANT_ENDPOINT/collections', {
      method: 'GET',
      timeout: 5000
    });
    healthChecks.qdrant = qdrantTest.ok;
  } catch (e) {
    console.log('Qdrant health check failed:', e.message);
  }
  
  // เช็ค Google Sheets
  try {
    const sheetsTest = $('Get row(s) in sheet2');
    healthChecks.sheets = true;
  } catch (e) {
    console.log('Sheets health check failed:', e.message);
  }
  
  // เช็ค LINE API
  try {
    const lineTest = await fetch('https://api.line.me/v2/bot/info', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_LINE_TOKEN'
      },
      timeout: 5000
    });
    healthChecks.line = lineTest.ok;
  } catch (e) {
    console.log('LINE health check failed:', e.message);
  }
  
  const allHealthy = Object.values(healthChecks).every(status => status);
  
  return [{
    json: {
      status: allHealthy ? 'healthy' : 'degraded',
      services: healthChecks,
      timestamp: Date.now(),
      message: allHealthy ? 'All services operational' : 'Some services experiencing issues'
    }
  }];
  
} catch (error) {
  return [{
    json: {
      status: 'error',
      error: error.message,
      timestamp: Date.now()
    }
  }];
}
`;

// 5. Cache Statistics Code
const cacheStatsCode = `
try {
  // สถิติการใช้งาน Cache
  const stats = {
    faqHits: 0,
    aiCalls: 0,
    timeouts: 0,
    errors: 0,
    avgResponseTime: 0
  };
  
  // ดึงข้อมูลจาก Google Sheets หรือ Database
  // (ในตัวอย่างนี้เป็นการจำลอง)
  
  const today = new Date().toISOString().split('T')[0];
  
  return [{
    json: {
      date: today,
      cacheStats: stats,
      recommendations: [
        stats.timeouts > 10 ? "พิจารณาเพิ่ม FAQ สำหรับคำถามที่ timeout บ่อย" : null,
        stats.faqHits / (stats.faqHits + stats.aiCalls) < 0.3 ? "ควรเพิ่ม FAQ เพิ่มเติม" : null,
        stats.errors > 5 ? "ตรวจสอบการเชื่อมต่อ AI services" : null
      ].filter(Boolean)
    }
  }];
  
} catch (error) {
  return [{
    json: {
      error: error.message,
      timestamp: Date.now()
    }
  }];
}
`;

module.exports = {
  enhancedInformationExtractor,
  enhancedQAChain,
  enhancedAdminAlert,
  healthCheckCode,
  cacheStatsCode
};