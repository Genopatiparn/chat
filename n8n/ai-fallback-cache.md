# AI Fallback & Caching System

## ระบบ Caching สำหรับกรณี AI ล้มเหลว

### 1. Cache Configuration
```json
{
  "cache": {
    "enabled": true,
    "timeout": 30000,
    "retryAttempts": 3,
    "fallbackEnabled": true,
    "cacheExpiry": 3600000
  }
}
```

### 2. AI Timeout & Retry Logic
```javascript
// Code สำหรับจัดการ AI Timeout
try {
  const startTime = Date.now();
  const timeout = 30000; // 30 วินาที
  
  // เช็ค cache ก่อน
  const cachedResponse = await checkCache(userMessage);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // เรียก AI พร้อม timeout
  const aiResponse = await Promise.race([
    callAIService(userMessage),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI_TIMEOUT')), timeout)
    )
  ]);
  
  // บันทึกลง cache
  await saveToCache(userMessage, aiResponse);
  return aiResponse;
  
} catch (error) {
  console.error('AI Error:', error);
  
  if (error.message === 'AI_TIMEOUT') {
    return getFallbackResponse('timeout');
  } else if (error.message.includes('rate_limit')) {
    return getFallbackResponse('rate_limit');
  } else {
    return getFallbackResponse('general_error');
  }
}
```

### 3. Fallback Responses
```javascript
const fallbackResponses = {
  timeout: "ขออภัยค่ะ ระบบกำลังประมวลผลช้ากว่าปกติ กรุณารอสักครู่แล้วลองใหม่อีกครั้งค่ะ หรือติดต่อเจ้าหน้าที่ที่ 02-222-2222",
  rate_limit: "ขณะนี้มีผู้ใช้งานเยอะ กรุณารอสักครู่แล้วลองใหม่อีกครั้งค่ะ หรือดู FAQ ด้านล่างก่อนค่ะ",
  general_error: "ขออภัยค่ะ เกิดข้อผิดพลาดชั่วคราว กรุณาลองใหม่อีกครั้งค่ะ หรือติดต่อเจ้าหน้าที่ได้เลยค่ะ",
  ai_unavailable: "ระบบ AI ไม่สามารถใช้งานได้ชั่วคราว กรุณาดู FAQ หรือติดต่อเจ้าหน้าที่ค่ะ"
};
```

### 4. Cache Management Functions
```javascript
// ฟังก์ชันจัดการ Cache
async function checkCache(message) {
  const cacheKey = generateCacheKey(message);
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    const data = JSON.parse(cached);
    if (Date.now() - data.timestamp < 3600000) { // 1 ชั่วโมง
      return data.response;
    }
  }
  return null;
}

async function saveToCache(message, response) {
  const cacheKey = generateCacheKey(message);
  const data = {
    response: response,
    timestamp: Date.now()
  };
  await redis.setex(cacheKey, 3600, JSON.stringify(data));
}

function generateCacheKey(message) {
  return `ai_cache:${crypto.createHash('md5').update(message.toLowerCase()).digest('hex')}`;
}
```

## การติดตั้งใน n8n Workflow

### 1. เพิ่ม Code Node สำหรับ AI Fallback
```javascript
// แทนที่ในโหนด "Question and Answer Chain1"
try {
  const userMessage = $json.output.issue || $json.message || 'คำถามทั่วไป';
  const startTime = Date.now();
  const timeout = 30000; // 30 วินาที
  
  // เช็ค FAQ cache ก่อน
  const faqResponse = checkFAQCache(userMessage);
  if (faqResponse) {
    return [{
      json: {
        response: faqResponse,
        source: 'faq_cache'
      }
    }];
  }
  
  // เรียก AI พร้อม timeout
  const aiPromise = $('Question and Answer Chain1').first();
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('AI_TIMEOUT')), timeout)
  );
  
  const result = await Promise.race([aiPromise, timeoutPromise]);
  
  // บันทึกผลลัพธ์ลง cache
  if (result && result.json && result.json.response) {
    await saveFAQCache(userMessage, result.json.response);
  }
  
  return result;
  
} catch (error) {
  console.error('AI Fallback Error:', error);
  
  let fallbackMessage = "ขออภัยค่ะ เกิดข้อผิดพลาดในการประมวลผล";
  
  if (error.message === 'AI_TIMEOUT') {
    fallbackMessage = "ระบบกำลังประมวลผลช้ากว่าปกติ กรุณารอสักครู่แล้วลองใหม่อีกครั้งค่ะ";
  } else if (error.message.includes('rate_limit')) {
    fallbackMessage = "ขณะนี้มีผู้ใช้งานเยอะ กรุณารอสักครู่แล้วลองใหม่อีกครั้งค่ะ";
  }
  
  // ส่งไปยังเจ้าหน้าที่แทน
  return [{
    json: {
      response: fallbackMessage + "\n\nเจ้าหน้าที่จะติดต่อกลับภายใน 24 ชั่วโมงค่ะ\nหากเร่งด่วน กรุณาติดต่อ: 02-222-2222",
      source: 'fallback',
      requiresHumanResponse: true
    }
  }];
}
```

### 2. Health Check Node
```javascript
// โหนดเช็คสถานะ AI
try {
  const healthCheck = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });
  
  if (healthCheck.ok) {
    return [{
      json: {
        status: 'healthy',
        timestamp: Date.now()
      }
    }];
  } else {
    return [{
      json: {
        status: 'unhealthy',
        timestamp: Date.now(),
        error: 'API not responding'
      }
    }];
  }
} catch (error) {
  return [{
    json: {
      status: 'error',
      timestamp: Date.now(),
      error: error.message
    }
  }];
}
```