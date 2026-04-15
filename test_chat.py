import requests
import json

def test_groq_api():
    print('=== اختبار اتصال Groq Cloud AI ===')
    
    import os, sys
    sys.path.insert(0, 'e:/my gpt v2/smart_kiosk')
    from dotenv import load_dotenv
    load_dotenv('e:/my gpt v2/smart_kiosk/.env')
    
    api_key = os.getenv('GROQ_API_KEY')
    model   = os.getenv('AI_MODEL', 'llama-3.3-70b-versatile')
    
    if not api_key:
        print('❌ GROQ_API_KEY غير موجود في ملف .env')
        return

    print(f'✅ المفتاح موجود | النموذج: {model}')
    
    url = 'https://api.groq.com/openai/v1/chat/completions'
    headers = {'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}
    payload = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': 'انت سارة مساعدة ذكية لكلية صدر العراق التقني.'},
            {'role': 'user', 'content': 'مرحبا، ما هو آخر موعد للتسجيل؟'}
        ],
        'max_tokens': 512
    }
    
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=15)
        if res.status_code == 200:
            answer = res.json()['choices'][0]['message']['content']
            print(f'✅ رد سارة: {answer[:200]}...')
        else:
            print(f'❌ خطأ HTTP {res.status_code}: {res.text[:300]}')
    except Exception as e:
        print(f'❌ فشل الاتصال: {e}')

if __name__ == '__main__':
    test_groq_api()
