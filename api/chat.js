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
        // v1 정식 엔드포인트 규격 사용
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `당신은 한국의 금융, 주식 공시, 정책, 세무 데이터를 심층 분석하는 전문 AI 팩트체크 에이전트입니다. 사용자의 질문에 대해 핵심 팩트와 수치 위주로 3~4문장으로 명확하고 전문적인 한국어로 답변하세요. 답변 끝에는 반드시 '(※ 본 답변은 공개 데이터를 기반으로 한 참고용 정보이며 투자 권유가 아닙니다.)'를 붙이세요.\n\n질문: ${question}`
                    }]
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
