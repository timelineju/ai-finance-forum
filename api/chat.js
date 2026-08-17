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

    // 삼성전자 및 삼전, 주가 관련 모든 키워드 매칭
    let marketContext = "";
    const isSamsungQuery = /삼성전자|삼전|005930/.test(question);

    if (isSamsungQuery) {
        try {
            const priceRes = await fetch("https://m.stock.naver.com/api/stock/005930/basic", {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const priceData = await priceRes.json();
            if (priceData && priceData.nowPrice) {
                marketContext = `[실시간 삼성전자(005930) 시세: 현재가 ${priceData.nowPrice}원, 전일대비 ${priceData.changePrice}원(${priceData.fluctuationRate}%), 시가 ${priceData.openPrice}원, 고가 ${priceData.highPrice}원, 저가 ${priceData.lowPrice}원]`;
            }
        } catch (e) {
            marketContext = "";
        }
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`;
        const promptText = `당신은 실시간 금융 분석 AI입니다.
아래 [실시간 데이터]의 수치를 기반으로 질문에 명확하게 답변하세요.

${marketContext}

사용자 질문: ${question}

규칙:
- 주가 질문일 경우 위 데이터에 나온 현재가, 시가, 고가, 저가, 전일대비 등락폭을 정확한 수치로 안내하세요.
- 답변 끝에는 '(※ 본 답변은 실시간 금융 공개 데이터를 기반으로 자동 분석된 참고용 정보입니다.)'를 붙이세요.`;

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
