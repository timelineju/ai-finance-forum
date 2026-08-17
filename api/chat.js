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

    try {
        // 구글 실시간 검색 연동 엔드포인트
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-goog-api-key": API_KEY
            },
            body: JSON.stringify({
                // 실시간 웹/금융 검색 기능 활성화
                tools: [{ "googleSearch": {} }],
                systemInstruction: {
                    parts: [{
                        text: "당신은 한국의 금융·주식·경제 전문 AI 분석가입니다. 주가, 환율, 공시, 시세 관련 질문이 들어오면 실시간 검색 데이터를 바탕으로 '현재가, 등락폭(%), 시가, 고가, 저가, 최근 핵심 이슈' 등 구체적인 수치와 팩트를 명확하게 제시하세요. '직접 조회하라'는 식의 회피성 답변은 절대 하지 마세요. 답변 끝에는 '(※ 본 답변은 실시간 공개 데이터를 기반으로 한 참고용 정보이며 투자 권유가 아닙니다.)'를 붙이세요."
                    }]
                },
                contents: [{
                    parts: [{ text: question }]
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
