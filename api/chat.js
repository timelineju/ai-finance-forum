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

    // 실시간 주가 조회를 위한 금융 데이터 전처리
    let marketContext = "";
    if (question.includes("삼성전자") || question.includes("주가") || question.includes("얼마")) {
        try {
            // 네이버 금융 실시간 시세 크롤링 API 연동 (실시간 시가, 고가, 저가, 현재가 추출)
            const priceRes = await fetch("https://m.stock.naver.com/api/stock/005930/basic");
            const priceData = await priceRes.json();
            if (priceData && priceData.nowPrice) {
                marketContext = `[실시간 삼성전자(005930) 시장 데이터: 현재가 ${priceData.nowPrice}원, 전일대비 ${priceData.changePrice}원(${priceData.fluctuationRate}%), 시가 ${priceData.openPrice}원, 고가 ${priceData.highPrice}원, 저가 ${priceData.lowPrice}원, 거래량 ${priceData.volume}주]`;
            }
        } catch (e) {
            marketContext = "";
        }
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`;
        const promptText = `당신은 한국의 금융, 주식, 정책 데이터 전문 AI 분석가입니다. 아래 제공된 [실시간 시장 데이터]와 질문을 바탕으로, 오늘의 시가, 고가, 저가, 현재가, 등락률 등 핵심 가격 수치를 반드시 포함하여 명확하고 친절하게 답변하세요. 회피성 답변(예: 직접 확인하라)은 절대 하지 마세요.\n\n${marketContext}\n\n사용자 질문: ${question}\n\n답변 끝에는 반드시 '(※ 본 답변은 실시간 금융 공개 데이터를 기반으로 자동 분석된 참고용 정보이며 투자 권유가 아닙니다.)'를 붙이세요.`;

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
