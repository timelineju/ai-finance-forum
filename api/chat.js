module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    let question = '';
    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        question = body?.question;
    } catch (e) {
        question = req.body?.question;
    }

    if (!question) {
        return res.status(400).json({ error: '질문 내용이 없습니다.' });
    }

    const API_KEY = "AQ.Ab8RN6LrakOCV_1ENOw9kyyq6DQAMw0nLwQgSGUP_yo5YskwUw";

    // 사용자가 '오늘/현재 실시간 시세'를 명확하게 물어볼 때만 데이터 주입
    let marketContext = "";
    const isPriceQuery = /(오늘|현재|지금|실시간).*(주가|시세|얼마|가격)/.test(question);
    
    if (isPriceQuery && question.includes("삼성전자")) {
        try {
            const priceRes = await fetch("https://m.stock.naver.com/api/stock/005930/basic");
            const priceData = await priceRes.json();
            if (priceData && priceData.nowPrice) {
                marketContext = `[참고용 실시간 삼성전자(005930) 시세: 현재가 ${priceData.nowPrice}원, 시가 ${priceData.openPrice}원, 고가 ${priceData.highPrice}원, 저가 ${priceData.lowPrice}원, 전일대비 ${priceData.changePrice}원(${priceData.fluctuationRate}%)]`;
            }
        } catch (e) {
            marketContext = "";
        }
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`;
        const promptText = `당신은 금융·정책·경제 분야에 능통한 스마트하고 자연스러운 'AI 인텔리전스 어시스턴트'입니다.

[상황 및 시간 기준]
- 현재 시점은 2026년입니다.
- ${marketContext}

[답변 원칙]
1. **문맥과 의도 파악**:
   - 가벼운 인사("안녕", "반가워")에는 시세를 읊지 말고 친절하고 자연스럽게 맞인사를 건네며 어떤 분석이 필요한지 물어보세요.
   - 특정 과거(예: 2025년 특정 월)를 물으면 이미 지나간 과거 팩트 관점에서 설명하세요.
   - 시세나 구체적인 지표 질문에는 핵심 수치와 배경을 유연하고 알기 쉽게 요약하세요.
2. **자연스러운 톤**: 정형화된 틀(불필요한 목차, 기계적인 머리말/꼬리말)에 갇히지 말고, 실제 전문 분석가가 메신저로 설명해주듯 유연하고 깔끔한 구어체로 답변하세요.
3. 금융/투자 관련 구체적 정보 제공 시 마지막에만 가볍게 '(※ 참고용 정보이며 투자 권유가 아닙니다.)'를 덧붙이세요. (단순 인사에는 붙이지 마세요)

사용자 입력: ${question}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-goog-api-key": API_KEY
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            return res.status(200).json({ answer: data.candidates[0].content.parts[0].text });
        } else {
            return res.status(500).json({ error: data.error?.message || "답변 생성 실패" });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
