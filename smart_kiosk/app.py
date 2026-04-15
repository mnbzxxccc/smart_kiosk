import os
from db import init_db
from intent import classify_intent
from actions import handle_registration, handle_check_status
from rag import setup_rag_qa, ask_question

def clear_screen():
    # تنظيف واجهة الأوامر لتجربة كشك نظيفة
    os.system('cls' if os.name == 'nt' else 'clear')

def main():
    clear_screen()
    print("="*55)
    print(" 🎓 Smart University Kiosk (Offline AI System) 🎓")
    print("="*55)
    
    # 1. تهيئة قاعدة بيانات الكشك (SQLite)
    print("\n[✔] جاري إعداد قاعدة بيانات التسجيل المحلية...")
    init_db()
    
    # إنشاء المجلدات المطلوبة قبل الانطلاق
    os.makedirs("data", exist_ok=True)
    os.makedirs("models", exist_ok=True)
    
    # 2. تهيئة محرك الـ RAG والموديل
    print("[✔] جاري تهيئة المحرك الذكي (RAG + مسار المتجهات)...")
    retriever, qa_chain = setup_rag_qa()
    
    print("\n✅ النظام جاهز تماماً للاستخدام. (لإنهاء المحادثة اكتب 'خروج' أو 'exit')\n")
    print("🤖 الكشك: أهلاً بك! يمكنك سؤالي عن لوائح الجامعة، أو يمكنك بدء إجراء 'تسجيل طالب'، أو 'متابعة حالة الطلب'.")
    
    # Dictionary لإدارة حالة المحادثة المتعددة (Interactive Flow)
    chat_state = {"awaiting": None} 
    
    while True:
        try:
            user_input = input("\n👤 الطالب: ").strip()
        except KeyboardInterrupt:
            break
            
        if user_input.lower() in ['خروج', 'exit', 'quit']:
            print("🤖 الكشك: شكراً لاستخدامك النظام. نتمنى لك يوماً جامعياً سعيداً! 🎓")
            break
            
        if not user_input:
            continue
            
        # 1. تنفيذ السيناريوهات المستمرة (مراقبة حالة الجاهزية)
        if chat_state["awaiting"] == "req_student_id_for_reg":
            chat_state["student_id"] = user_input
            chat_state["awaiting"] = "req_student_name_for_reg"
            print("🤖 الكشك: ممتاز، يرجى إدخال اسمك الكامل للاستمرار.")
            continue
            
        elif chat_state["awaiting"] == "req_student_name_for_reg":
            name = user_input
            student_id = chat_state["student_id"]
            
            # تنفيذ دالة تسجيل الطالب والتواصل مع SQLite
            result_msg = handle_registration(student_id, name)
            print(f"🤖 الكشك: {result_msg}")
            
            # إنهاء الحدث
            chat_state["awaiting"] = None
            continue
            
        elif chat_state["awaiting"] == "req_request_id":
            result_msg = handle_check_status(user_input)
            print(f"🤖 الكشك: {result_msg}")
            
            # إنهاء الحدث
            chat_state["awaiting"] = None
            continue

        # 2. تحديد نية المستخدم (Intent Routing) للمدخلات المباشرة الجديدة
        intent = classify_intent(user_input)
        
        if intent == "ACTION_REGISTER":
            chat_state["awaiting"] = "req_student_id_for_reg"
            print("🤖 الكشك: مرحباً بك في خدمة التسجيل! يرجى إدخال رقمك الجامعي أو الوطني أولاً:")
            
        elif intent == "ACTION_STATUS":
            chat_state["awaiting"] = "req_request_id"
            print("🤖 الكشك: حسناً، الرجاء إدخال رقم الطلب الخاص بك للمتابعة:")
            
        elif intent == "QUESTION":
            # 3. توجيه السؤال العام إلى محرك المعرفة RAG System للحصول على الجواب
            print("🤖 الكشك: (تفضّل بالانتظار، جاري البحث في مستندات الجامعة...)")
            answer = ask_question(user_input, retriever, qa_chain)
            print(f"🤖 الكشك:\n{answer}")
            
        else:
            print("🤖 الكشك: أعتذر، لم أتمكن من تصنيف طلبك. هل تسأل أم تريد تسجيل حساب جديد؟")

if __name__ == "__main__":
    main()
