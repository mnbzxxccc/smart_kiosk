import os
import glob
import requests
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import TextLoader, PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# تحميل المتغيرات البيئية (Groq API Key)
load_dotenv()

# إعداد المسارات المطلقة
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_DIR = os.path.join(BASE_DIR, "chroma_db")

# إعدادات Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
AI_MODEL = os.getenv("AI_MODEL", "llama-3.3-70b-versatile")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

def build_vector_db(embeddings):
    """بناء قاعدة بيانات المتجهات ChromaDB محلياً من ملفات الـ data/"""
    print("جاري بناء قاعدة المتجهات (Vector DB)...")
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        return None

    documents = []
    
    # تحميل الملفات المتوفرة (نصوص / PDF / Word)
    for file in glob.glob(f"{DATA_DIR}/**/*.txt", recursive=True):
        documents.extend(TextLoader(file, encoding='utf-8').load())
        
    for file in glob.glob(f"{DATA_DIR}/**/*.pdf", recursive=True):
        documents.extend(PyPDFLoader(file).load())
        
    for file in glob.glob(f"{DATA_DIR}/**/*.docx", recursive=True):
        documents.extend(Docx2txtLoader(file).load())

    if not documents:
        print("⚠️ مجلد البيانات `data/` فارغ، يتم تجاهل بناء قاعدة المتجهات RAG.")
        return None

    # تقطيع الملفات لقطع صغيرة لفهم السياق بمقدار 500 حرف
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(documents)

    # التخزين الدائم (Persist)
    db = Chroma.from_documents(chunks, embeddings, persist_directory=DB_DIR)
    db.persist()
    print("✅ تم بناء قاعدة المتجهات للـ RAG بنجاح.")
    return db

def setup_rag_qa():
    """تهيئة محرك استرجاع المعلومات RAG"""
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    if not os.path.exists(DB_DIR) or not os.listdir(DB_DIR):
        db = build_vector_db(embeddings)
        if not db:
            return None, None
    else:
        db = Chroma(persist_directory=DB_DIR, embedding_function=embeddings)
        
    return db.as_retriever(search_kwargs={"k": 3}), None


def ask_question(query, retriever, qa_chain=None, extra_context=""):
    """إرسال السؤال للذكاء الاصطناعي مع دمج البيانات الديناميكية للسياق"""
    db_context = ""
    
    # محاولة جلب معلومات من مستندات الكلية أولاً (RAG)
    if retriever:
        try:
            docs = retriever.invoke(query)
            if docs:
                db_context = "\n".join([f"- {doc.page_content}" for doc in docs])
        except Exception as e:
            print(f"RAG Retrieval Error: {e}")

    # إعداد المحفز للذكاء الاصطناعي (Prompt)
    prompt = f"""أنت مساعد ذكي ولطيف اسمه "فالديس" (Valdis) تعمل كمرشد رقمي لكلية صدر العراق التقني.
الرجاء الإجابة على استفسار الطالب التالي باللغة العربية بلهجة عراقية مهذبة ومرحبة.
تجنبي الردود الآلية الطويلة، كوني موجزة وواضحة.

[معلومات الكلية]:
{db_context if db_context else 'أجيبي بناءً على معلوماتك العامة عن الكليات التقنية في العراق.'}

[بيانات الطالب الحالية إن وجدت]:
{extra_context if extra_context else 'لا تتوفر بيانات محددة عن هذا الطالب حالياً.'}

[سؤال الطالب]:
{query}

الإجابة:"""

    # الحالة الأولى: استخدام Groq (السحابي المجاني السريع)
    if GROQ_API_KEY:
        payload = {
            "model": AI_MODEL,
            "messages": [
                {"role": "system", "content": "أنت فالديس، مساعد ذكي لكلية صدر العراق التقني. تتحدث العربية بلهجة ودودة عصرية."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1024
        }
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        try:
            print("🚀 Calling Valdis Cloud Engine...")
            res = requests.post(GROQ_URL, json=payload, headers=headers, timeout=15)
            if res.status_code == 200:
                answer = res.json()['choices'][0]['message']['content']
                print(f"✅ Valdis SUCCESS: {answer[:30]}...")
                return answer
            else:
                print(f"⚠️ Groq API Error: {res.status_code} - {res.text}")
        except Exception as e:
            print(f"⚠️ Cloud AI Connection Failed: {e}")

    # نظام الاستجابة الذكي المبسط (Fallback)
    fallback_msg = "أهلاً بك! 👋 أنا فالديس، المساعد الرقمي لكلية صدر العراق التقني."
    if extra_context:
        fallback_msg += f"<br><br>📝 <b>إليك البيانات المطلوبة من السجلات:</b><br>{extra_context.replace('\n', '<br>')}"
    elif db_context:
        fallback_msg += f"<br><br>🔍 <b>إليك ما وجدته في اللوائح الجامعية:</b><br>{db_context.replace('\n', '<br>')}"
    else:
        fallback_msg += "<br><br>عذراً، محرك الذكاء الاصطناعي (فالديس) غير متصل حالياً بالسحاب. لكن يمكنني مساعدتك يدوياً في الاستعلام عن نتيجتك أو جدولك."
    
    return fallback_msg

