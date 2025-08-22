# คู่มือการติดตั้ง Caching System

## ขั้นตอนการติดตั้งใน n8n Workflow

### 1. เพิ่ม FAQ Cache ในโหนด Information Extractor
```javascript
// แทนที่ Code ในโหนด "Information Extractor1"
// Copy code จากไฟล์ n8n-cache-implementation.js -> enhancedInformationExtractor
```

### 2. เพิ่ม Timeout Handling ในโหนด Question and Answer Chain
```javascript
// แทนที่ Code ในโหนด "Question and Answer Chain1"  
// Copy code จากไฟล์ n8n-cache-implementation.js -> enhancedQAChain
```

### 3. ปรับปรุงโหนด Admin Alert Code
```javascript
// แทนที่ Code ในโหนด "Admin Alert Code4" และ "Admin Alert Code5"
// Copy code จากไฟล์ n8n-cache-implementation.js -> enhancedAdminAlert
```

### 4. เพิ่มโหนดใหม่สำหรับ Monitoring

#### 4.1 Health Check Node
1. เพิ่ม Code Node ใหม่ชื่อ "Health Check"
2. ตั้งให้รันทุก 5 นาที (ใช้ Cron Trigger)
3. Copy code จาก `n8n-cache-implementation.js -> healthCheckCode`

#### 4.2 Performance Monitor Node  
1. เพิ่ม Code Node ใหม่ชื่อ "Performance Monitor"
2. ตั้งให้รันทุกชั่วโมง
3. Copy code จาก `cache-monitoring.md -> performanceAlerts`

#### 4.3 Daily Report Node
1. เพิ่ม Code Node ใหม่ชื่อ "Daily Report"
2. ตั้งให้รันทุกวันเวลา 23:00
3. Copy code จาก `cache-monitoring.md -> monitoringCode`

### 5. การตั้งค่า Google Sheets สำหรับ Logging

#### 5.1 สร้าง Sheet ใหม่สำหรับ Cache Stats
```
Sheet Name: "CacheStats"
Columns:
- timestamp (วันเวลา)
- userId (ID ผู้ใช้)
- message (ข้อความ)
- source (แหล่งที่มา: faq_cache, ai_success, fallback)
- responseTime (เวลาตอบ ms)
- error (ข้อผิดพลาด)
```

#### 5.2 เพิ่มโหนด Append สำหรับ Logging
```javascript
// เพิ่มโหนด Google Sheets Append หลังจากทุก response
{
  "timestamp": "={{ new Date().toISOString() }}",
  "userId": "={{ $('Edit Fields1').item.json.body.events[0].source.userId }}",
  "message": "={{ $('Edit Fields1').item.json.body.events[0].message.text }}",
  "source": "={{ $json.source || 'unknown' }}",
  "responseTime": "={{ $json.responseTime || 0 }}",
  "error": "={{ $json.error || '' }}"
}
```

### 6. การตั้งค่า Environment Variables

#### 6.1 เพิ่มตัวแปรใน n8n
```bash
# Timeout Settings
AI_TIMEOUT=25000
FAQ_CACHE_ENABLED=true
HEALTH_CHECK_INTERVAL=300000

# Alert Settings  
ALERT_TIMEOUT_THRESHOLD=20
ALERT_ERROR_THRESHOLD=15
ALERT_RESPONSE_TIME_THRESHOLD=8000

# Contact Info
SUPPORT_PHONE=02-222-2222
SUPPORT_LINE=@support_pos
SUPPORT_EMAIL=support@company.com
```

### 7. การทดสอบระบบ

#### 7.1 ทดสอบ FAQ Cache
```
ส่งข้อความทดสอบ:
- "วิธีใช้ pos"
- "เพิ่มสินค้าใหม่"  
- "เชื่อมต่อไม่ได้"
- "พิมพ์ใบเสร็จ"
- "ติดต่อเจ้าหน้าที่"

ผลลัพธ์ที่คาดหวัง: ได้รับคำตอบจาก FAQ ทันที
```

#### 7.2 ทดสอบ AI Timeout
```
วิธีทดสอบ:
1. ปิดการเชื่อมต่อ OpenAI ชั่วคราว
2. ส่งคำถามที่ไม่อยู่ใน FAQ
3. ควรได้รับ fallback response ภายใน 25 วินาที
```

#### 7.3 ทดสอบ Health Check
```
1. เรียกโหนด Health Check
2. ตรวจสอบ response ว่าแสดงสถานะ services ต่างๆ
3. ทดสอบกรณี service ล่ม
```

### 8. การ Maintenance

#### 8.1 การอัพเดท FAQ
```javascript
// เพิ่ม FAQ ใหม่ในฟังก์ชัน checkFAQCache
if (message.includes('คำถามใหม่')) {
  return `คำตอบใหม่สำหรับคำถามนี้`;
}
```

#### 8.2 การปรับ Timeout
```javascript
// ปรับค่า timeout ในโหนด Enhanced QA Chain
const timeout = 30000; // เปลี่ยนจาก 25000 เป็น 30000
```

#### 8.3 การดู Log
```sql
-- Query สำหรับดู Cache Performance
SELECT 
  source,
  COUNT(*) as count,
  AVG(responseTime) as avg_response_time
FROM CacheStats 
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY source;
```

### 9. Troubleshooting

#### 9.1 FAQ ไม่ทำงาน
```
ตรวจสอบ:
1. ฟังก์ชัน checkFAQCache ถูกเรียกหรือไม่
2. คำค้นหาตรงกับ keywords หรือไม่
3. Case sensitivity ของการเปรียบเทียบ
```

#### 9.2 AI Timeout บ่อย
```
แก้ไข:
1. เพิ่มเวลา timeout
2. เพิ่ม FAQ สำหรับคำถามที่ timeout บ่อย
3. ตรวจสอบการเชื่อมต่อ OpenAI
```

#### 9.3 Performance ช้า
```
ปรับปรุง:
1. เพิ่ม FAQ เพื่อลด AI calls
2. ใช้ Model ที่เร็วกว่า
3. ปรับปรุง Vector Database
```

### 10. การ Monitor และ Alert

#### 10.1 ตั้งค่า LINE Notify สำหรับ Alert
```javascript
// เพิ่มในโหนด Performance Monitor
if (alerts.length > 0) {
  // ส่ง LINE Notify
  await fetch('https://notify-api.line.me/api/notify', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_LINE_NOTIFY_TOKEN',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `message=${encodeURIComponent(alertMessage)}`
  });
}
```

#### 10.2 Dashboard URL
```
สร้าง Dashboard ง่ายๆ ด้วย Google Sheets:
1. สร้าง Chart จากข้อมูลใน CacheStats
2. แสดง Cache Hit Rate, Response Time, Error Rate
3. Share URL สำหรับดู real-time stats
```

## สรุป Benefits

### ✅ ประโยชน์ที่ได้รับ
1. **ลด AI Costs** - FAQ Cache ลดการเรียก AI API
2. **เพิ่มความเร็ว** - คำตอบทันทีสำหรับคำถามที่พบบ่อย  
3. **เพิ่ม Reliability** - Fallback เมื่อ AI ล้มเหลว
4. **ง่ายต่อการ Monitor** - Dashboard และ Alert system
5. **ปรับปรุงได้ต่อเนื่อง** - Auto-suggest FAQ ใหม่

### 📊 KPIs ที่ควรติดตาม
- Cache Hit Rate (เป้าหมาย: >40%)
- AI Response Time (เป้าหมาย: <5 วินาที)
- Error Rate (เป้าหมาย: <5%)
- User Satisfaction (จาก feedback)

### 🔄 การพัฒนาต่อ
1. Machine Learning สำหรับ FAQ matching
2. A/B Testing สำหรับคำตอบ
3. Multi-language support
4. Voice/Audio input support