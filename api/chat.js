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

    const GEMINI_API_KEY = "AQ.Ab8RN6LrakOCV_1ENOw9kyyq6DQAMw0nLwQgSGUP_yo5YskwUw";

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const promptText = `당신은 대한민국 최고 수준의 '금융·정책·경제 전문 AI 인텔리전스 어시스턴트'입니다.

[운영 원칙]
1. **문맥 기반 유연한 응답**:
   - 가벼운 인사나 일상 대화("안녕", "반가워" 등)에는 억지로 금융 데이터를 말하지 말고 자연스럽고 센스 있게 맞인사를 건네세요.
   - 금융, 주식, 정책, 세무, 부동산, 기업 분석 등 전문 질문에는 전문 지식과 명확한 논리를 바탕으로 직관적이고 완성도 높게 설명하세요.
2. **자연스러운 톤앤매너**: 딱딱한 기계식 템플릿(불필요한 목차, 로봇 같은 서론)을 버리고, 금융 전문가가 메신저로 1:1 브리핑하듯 읽기 편하게 작성하세요.
3. 금융/투자/정책 관련 분석 제공 시에만 문장 맨 끝에 가볍게 '(※ 본 답변은 참고용 정보이며 투자 권유가 아닙니다.)'를 붙이세요. (단순 대화나 일반 질문에는 붙이지 마세요.)

사용자 질문: ${question}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY
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
