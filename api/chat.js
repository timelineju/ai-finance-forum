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
        // 활성 모델 gemini-3.6-flash 지정
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{
                        text: "당신은 사용자의 질문 의도를 정확하게 파악하는 스마트한 AI 에이전트입니다. 인사에는 친절하게 맞인사하고, 금융·시세·정책 등의 질문에는 구체적인 핵심 팩트와 수치 위주로 유연하고 명확하게 답변하세요."
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
