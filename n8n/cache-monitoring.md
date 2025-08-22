# Cache Monitoring & Analytics

## การติดตาม Performance และ Cache Usage

### 1. Monitoring Dashboard
```javascript
// Code สำหรับสร้าง Monitoring Dashboard
const monitoringCode = `
try {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0,0,0,0));
  
  // ดึงข้อมูลการใช้งานจาก Google Sheets
  const usageData = $('Get row(s) in sheet2').items || [];
  
  const stats = {
    totalRequests: 0,
    faqHits: 0,
    aiCalls: 0,
    timeouts: 0,
    errors: 0,
    avgResponseTime: 0,
    topQuestions: {},
    hourlyDistribution: Array(24).fill(0)
  };
  
  // วิเคราะห์ข้อมูล
  usageData.forEach(item => {
    const data = item.json || item;
    const timestamp = new Date(data.timestamp);
    
    if (timestamp >= startOfDay) {
      stats.totalRequests++;
      
      // นับ FAQ hits
      if (data.source === 'faq_cache') {
        stats.faqHits++;
      } else if (data.source === 'ai_success') {
        stats.aiCalls++;
        stats.avgResponseTime += data.responseTime || 0;
      } else if (data.source === 'fallback' && data.error === 'AI_TIMEOUT') {
        stats.timeouts++;
      } else if (data.source === 'fallback') {
        stats.errors++;
      }
      
      // นับคำถามยอดนิยม
      const question = data.message || data.issue || 'unknown';
      stats.topQuestions[question] = (stats.topQuestions[question] || 0) + 1;
      
      // กระจายตามชั่วโมง
      const hour = timestamp.getHours();
      stats.hourlyDistribution[hour]++;
    }
  });
  
  // คำนวณค่าเฉลี่ย
  if (stats.aiCalls > 0) {
    stats.avgResponseTime = Math.round(stats.avgResponseTime / stats.aiCalls);
  }
  
  // หาคำถามยอดนิยม Top 5
  const topQuestions = Object.entries(stats.topQuestions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([question, count]) => ({ question, count }));
  
  // คำนวณ Cache Hit Rate
  const cacheHitRate = stats.totalRequests > 0 ? 
    Math.round((stats.faqHits / stats.totalRequests) * 100) : 0;
  
  // สร้างรายงาน
  const report = \`📊 รายงานประจำวัน \${today.toLocaleDateString('th-TH')}
  
🔢 สถิติรวม:
- คำขอทั้งหมด: \${stats.totalRequests}
- FAQ Cache Hits: \${stats.faqHits} (\${cacheHitRate}%)
- AI Calls: \${stats.aiCalls}
- Timeouts: \${stats.timeouts}
- Errors: \${stats.errors}

⚡ Performance:
- เวลาตอบเฉลี่ย: \${stats.avgResponseTime}ms
- Cache Hit Rate: \${cacheHitRate}%

🔥 คำถามยอดนิยม:
\${topQuestions.map((item, index) => 
  \`\${index + 1}. \${item.question} (\${item.count} ครั้ง)\`
).join('\\n')}

📈 ช่วงเวลาที่ใช้งานมาก:
\${stats.hourlyDistribution.map((count, hour) => 
  count > 0 ? \`\${hour}:00-\${hour+1}:00 = \${count} ครั้ง\` : null
).filter(Boolean).join('\\n')}\`;
  
  return [{
    json: {
      report: report,
      stats: stats,
      recommendations: generateRecommendations(stats)
    }
  }];
  
} catch (error) {
  return [{
    json: {
      error: error.message,
      report: "ไม่สามารถสร้างรายงานได้"
    }
  }];
}

function generateRecommendations(stats) {
  const recommendations = [];
  
  // Cache Hit Rate ต่ำ
  if (stats.totalRequests > 0 && (stats.faqHits / stats.totalRequests) < 0.4) {
    recommendations.push("💡 ควรเพิ่ม FAQ เพิ่มเติมเพื่อเพิ่ม Cache Hit Rate");
  }
  
  // Timeout สูง
  if (stats.timeouts > stats.totalRequests * 0.1) {
    recommendations.push("⚠️ AI Timeout สูง ควรเพิ่ม FAQ สำหรับคำถามที่ timeout บ่อย");
  }
  
  // Error Rate สูง
  if (stats.errors > stats.totalRequests * 0.05) {
    recommendations.push("🔧 Error Rate สูง ควรตรวจสอบการเชื่อมต่อ AI Services");
  }
  
  // Response Time ช้า
  if (stats.avgResponseTime > 5000) {
    recommendations.push("🚀 Response Time ช้า ควรปรับปรุง AI Model หรือเพิ่ม Caching");
  }
  
  return recommendations;
}
`;
```

### 2. Auto FAQ Update System
```javascript
// ระบบอัพเดท FAQ อัตโนมัติ
const autoFAQUpdate = `
try {
  // ดึงคำถามที่ AI ตอบบ่อยและได้รับ feedback ดี
  const recentQuestions = $('Get row(s) in sheet2').items || [];
  const potentialFAQs = {};
  
  recentQuestions.forEach(item => {
    const data = item.json || item;
    
    // เฉพาะคำถามที่ AI ตอบสำเร็จ
    if (data.source === 'ai_success' && data.responseTime < 10000) {
      const question = normalizeQuestion(data.message || data.issue);
      
      if (!potentialFAQs[question]) {
        potentialFAQs[question] = {
          count: 0,
          responses: [],
          avgResponseTime: 0
        };
      }
      
      potentialFAQs[question].count++;
      potentialFAQs[question].responses.push(data.response);
      potentialFAQs[question].avgResponseTime += data.responseTime;
    }
  });
  
  // หาคำถามที่ควรเพิ่มเข้า FAQ (ถูกถามบ่อย)
  const faqCandidates = Object.entries(potentialFAQs)
    .filter(([question, data]) => data.count >= 5) // ถูกถามอย่างน้อย 5 ครั้ง
    .map(([question, data]) => ({
      question,
      count: data.count,
      avgResponseTime: Math.round(data.avgResponseTime / data.count),
      suggestedAnswer: findMostCommonResponse(data.responses)
    }))
    .sort((a, b) => b.count - a.count);
  
  if (faqCandidates.length > 0) {
    const suggestions = faqCandidates.map(item => 
      \`❓ "\${item.question}" (ถูกถาม \${item.count} ครั้ง)\\n💬 คำตอบที่แนะนำ: \${item.suggestedAnswer.substring(0, 100)}...\`
    ).join('\\n\\n');
    
    return [{
      json: {
        message: \`🤖 แนะนำ FAQ ใหม่:\\n\\n\${suggestions}\`,
        candidates: faqCandidates
      }
    }];
  } else {
    return [{
      json: {
        message: "ไม่พบคำถามที่ควรเพิ่มเข้า FAQ ในขณะนี้"
      }
    }];
  }
  
} catch (error) {
  return [{
    json: {
      error: error.message,
      message: "ไม่สามารถวิเคราะห์ FAQ ได้"
    }
  }];
}

function normalizeQuestion(question) {
  return question.toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, '')
    .trim();
}

function findMostCommonResponse(responses) {
  const responseCount = {};
  responses.forEach(response => {
    const normalized = response.substring(0, 200);
    responseCount[normalized] = (responseCount[normalized] || 0) + 1;
  });
  
  return Object.entries(responseCount)
    .sort(([,a], [,b]) => b - a)[0][0];
}
`;
```

### 3. Performance Alerts
```javascript
// ระบบแจ้งเตือนเมื่อ Performance ผิดปกติ
const performanceAlerts = `
try {
  const currentHour = new Date().getHours();
  const recentData = $('Get row(s) in sheet2').items || [];
  
  // วิเคราะห์ข้อมูล 1 ชั่วโมงที่ผ่านมา
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const recentRequests = recentData.filter(item => {
    const data = item.json || item;
    return new Date(data.timestamp).getTime() > oneHourAgo;
  });
  
  const alerts = [];
  
  // เช็ค Timeout Rate
  const timeouts = recentRequests.filter(item => 
    (item.json || item).error === 'AI_TIMEOUT'
  ).length;
  const timeoutRate = recentRequests.length > 0 ? 
    (timeouts / recentRequests.length) * 100 : 0;
  
  if (timeoutRate > 20) {
    alerts.push({
      type: 'HIGH_TIMEOUT',
      message: \`🚨 AI Timeout Rate สูง: \${timeoutRate.toFixed(1)}% ในชั่วโมงที่ผ่านมา\`,
      severity: 'high'
    });
  }
  
  // เช็ค Error Rate
  const errors = recentRequests.filter(item => 
    (item.json || item).source === 'fallback' && (item.json || item).error
  ).length;
  const errorRate = recentRequests.length > 0 ? 
    (errors / recentRequests.length) * 100 : 0;
  
  if (errorRate > 15) {
    alerts.push({
      type: 'HIGH_ERROR',
      message: \`⚠️ Error Rate สูง: \${errorRate.toFixed(1)}% ในชั่วโมงที่ผ่านมา\`,
      severity: 'medium'
    });
  }
  
  // เช็ค Response Time
  const aiCalls = recentRequests.filter(item => 
    (item.json || item).source === 'ai_success'
  );
  if (aiCalls.length > 0) {
    const avgResponseTime = aiCalls.reduce((sum, item) => 
      sum + ((item.json || item).responseTime || 0), 0
    ) / aiCalls.length;
    
    if (avgResponseTime > 8000) {
      alerts.push({
        type: 'SLOW_RESPONSE',
        message: \`🐌 Response Time ช้า: \${Math.round(avgResponseTime)}ms เฉลี่ย\`,
        severity: 'medium'
      });
    }
  }
  
  // เช็ค Cache Hit Rate
  const faqHits = recentRequests.filter(item => 
    (item.json || item).source === 'faq_cache'
  ).length;
  const cacheHitRate = recentRequests.length > 0 ? 
    (faqHits / recentRequests.length) * 100 : 0;
  
  if (cacheHitRate < 30 && recentRequests.length > 10) {
    alerts.push({
      type: 'LOW_CACHE_HIT',
      message: \`📉 Cache Hit Rate ต่ำ: \${cacheHitRate.toFixed(1)}%\`,
      severity: 'low'
    });
  }
  
  // ส่งการแจ้งเตือน
  if (alerts.length > 0) {
    const alertMessage = alerts.map(alert => alert.message).join('\\n');
    
    return [{
      json: {
        hasAlerts: true,
        alertCount: alerts.length,
        message: \`🔔 Performance Alerts (ชั่วโมงที่ \${currentHour}:00)\\n\\n\${alertMessage}\`,
        alerts: alerts,
        recommendations: generateAlertRecommendations(alerts)
      }
    }];
  } else {
    return [{
      json: {
        hasAlerts: false,
        message: \`✅ ระบบทำงานปกติ (ชั่วโมงที่ \${currentHour}:00)\`
      }
    }];
  }
  
} catch (error) {
  return [{
    json: {
      error: error.message,
      message: "ไม่สามารถตรวจสอบ Performance ได้"
    }
  }];
}

function generateAlertRecommendations(alerts) {
  const recommendations = [];
  
  alerts.forEach(alert => {
    switch (alert.type) {
      case 'HIGH_TIMEOUT':
        recommendations.push("เพิ่ม FAQ สำหรับคำถามที่ timeout บ่อย");
        recommendations.push("ตรวจสอบการเชื่อมต่อ OpenAI API");
        break;
      case 'HIGH_ERROR':
        recommendations.push("ตรวจสอบ API Keys และ Credentials");
        recommendations.push("เช็คสถานะ External Services");
        break;
      case 'SLOW_RESPONSE':
        recommendations.push("พิจารณาใช้ Model ที่เร็วกว่า");
        recommendations.push("เพิ่ม Caching สำหรับคำถามที่ซ้ำ");
        break;
      case 'LOW_CACHE_HIT':
        recommendations.push("วิเคราะห์คำถามใหม่เพื่อเพิ่ม FAQ");
        recommendations.push("ปรับปรุง FAQ Matching Algorithm");
        break;
    }
  });
  
  return [...new Set(recommendations)]; // Remove duplicates
}
`;
```

### 4. Cache Optimization
```javascript
// ระบบปรับปรุง Cache อัตโนมัติ
const cacheOptimization = `
try {
  const usageData = $('Get row(s) in sheet2').items || [];
  const last7Days = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  // วิเคราะห์ข้อมูล 7 วันที่ผ่านมา
  const recentData = usageData.filter(item => {
    const data = item.json || item;
    return new Date(data.timestamp).getTime() > last7Days;
  });
  
  // หาคำถามที่ควรเพิ่มเข้า FAQ
  const questionAnalysis = {};
  
  recentData.forEach(item => {
    const data = item.json || item;
    const question = normalizeQuestion(data.message || data.issue || '');
    
    if (question && question.length > 5) {
      if (!questionAnalysis[question]) {
        questionAnalysis[question] = {
          count: 0,
          aiSuccess: 0,
          avgResponseTime: 0,
          timeouts: 0,
          errors: 0
        };
      }
      
      questionAnalysis[question].count++;
      
      if (data.source === 'ai_success') {
        questionAnalysis[question].aiSuccess++;
        questionAnalysis[question].avgResponseTime += data.responseTime || 0;
      } else if (data.error === 'AI_TIMEOUT') {
        questionAnalysis[question].timeouts++;
      } else if (data.source === 'fallback') {
        questionAnalysis[question].errors++;
      }
    }
  });
  
  // หาคำถามที่ควรเป็น FAQ (ถูกถามบ่อยและมี success rate สูง)
  const faqCandidates = Object.entries(questionAnalysis)
    .filter(([question, data]) => {
      const successRate = data.count > 0 ? (data.aiSuccess / data.count) : 0;
      return data.count >= 3 && successRate >= 0.7; // ถูกถามอย่างน้อย 3 ครั้งและ success rate >= 70%
    })
    .map(([question, data]) => ({
      question,
      count: data.count,
      successRate: Math.round((data.aiSuccess / data.count) * 100),
      avgResponseTime: data.aiSuccess > 0 ? Math.round(data.avgResponseTime / data.aiSuccess) : 0,
      priority: calculatePriority(data)
    }))
    .sort((a, b) => b.priority - a.priority);
  
  // หาคำถามที่มีปัญหา (timeout หรือ error บ่อย)
  const problematicQuestions = Object.entries(questionAnalysis)
    .filter(([question, data]) => {
      const problemRate = data.count > 0 ? ((data.timeouts + data.errors) / data.count) : 0;
      return data.count >= 2 && problemRate >= 0.5; // มีปัญหามากกว่า 50%
    })
    .map(([question, data]) => ({
      question,
      count: data.count,
      problemRate: Math.round(((data.timeouts + data.errors) / data.count) * 100),
      timeouts: data.timeouts,
      errors: data.errors
    }))
    .sort((a, b) => b.problemRate - a.problemRate);
  
  const optimizationReport = \`🔧 Cache Optimization Report
  
📈 แนะนำเพิ่ม FAQ (\${faqCandidates.length} รายการ):
\${faqCandidates.slice(0, 5).map((item, index) => 
  \`\${index + 1}. "\${item.question}" (ถูกถาม \${item.count} ครั้ง, Success Rate: \${item.successRate}%)\`
).join('\\n')}

⚠️ คำถามที่มีปัญหา (\${problematicQuestions.length} รายการ):
\${problematicQuestions.slice(0, 3).map((item, index) => 
  \`\${index + 1}. "\${item.question}" (Problem Rate: \${item.problemRate}%, Timeouts: \${item.timeouts}, Errors: \${item.errors})\`
).join('\\n')}

💡 คำแนะนำ:
- เพิ่ม FAQ สำหรับคำถามยอดนิยมเพื่อลด AI calls
- ปรับปรุงคำตอบสำหรับคำถามที่มีปัญหา
- พิจารณาใช้ fallback response สำหรับคำถามที่ timeout บ่อย\`;
  
  return [{
    json: {
      report: optimizationReport,
      faqCandidates: faqCandidates.slice(0, 10),
      problematicQuestions: problematicQuestions.slice(0, 5),
      totalAnalyzed: Object.keys(questionAnalysis).length
    }
  }];
  
} catch (error) {
  return [{
    json: {
      error: error.message,
      report: "ไม่สามารถสร้างรายงาน Optimization ได้"
    }
  }];
}

function calculatePriority(data) {
  const frequency = data.count;
  const successRate = data.aiSuccess / data.count;
  const avgTime = data.aiSuccess > 0 ? data.avgResponseTime / data.aiSuccess : 0;
  
  // คำนวณ priority (ยิ่งสูงยิ่งควรเป็น FAQ)
  let priority = frequency * successRate;
  
  // ถ้า response time ช้า ให้ priority สูงขึ้น
  if (avgTime > 5000) {
    priority *= 1.5;
  }
  
  return Math.round(priority * 100);
}

function normalizeQuestion(question) {
  return question.toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
`;
```