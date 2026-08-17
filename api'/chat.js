export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { question } = req.body;
    const GROQ_API_KEY = "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";

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { 
                        role: "system", 
                        content: "당신은 한국의 금융, 주식 공시, 정책, 세무 데이터를 심층 분석하는 'AI 팩트체크 에이전트'입니다. 사용자의 질문에 대해 핵심 팩트와 수치 위주로 3~4문장으로 간결하고 전문적인 답변을 한국어로 제공하세요. 답변 끝에는 '(※ 본 답변은 공개 데이터를 기반으로 한 참고용 정보이며 투자 권유가 아닙니다.)'를 반드시 덧붙이세요." 
                    },
                    { role: "user", content: question }
                ],
                temperature: 0.5,
                max_tokens: 400
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]) {
            return res.status(200).json({ answer: data.choices[0].message.content });
        } else {
            return res.status(500).json({ error: "AI 응답 생성 실패" });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
