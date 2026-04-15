def classify_intent(text):
    """
    تحديد نية المستخدم بناءً على نصوص الإدخال.
    في بيئة offline محلية سريعة، نستخدم Rule-Based / Keywords Classifier.
    """
    text_lower = text.lower()
    
    # كلمات دلالية (Keywords) تدل على إجراء تسجيل
    action_register_kws = ['تسجيل', 'سجلني', 'اريد اسجل', 'اريد التسجيل', 'مستجد', 'تسجيل طالب', 'register']
    
    # كلمات دلالية تدل على استعلام عن حالة طلب معين (تتبع)
    action_status_kws = ['حالة الطلب', 'متابعة الطلب', 'رقم طلبي', 'وين وصل طلبي', 'رقم طلب']

    
    # كلمات دلالية للدردشة العامة
    action_chat_kws = ['دردشة', 'شات', 'chat', 'سؤال عام', 'استفسار دراسي']

    # الفحص إذا كانت النية تسجيل
    if any(kw in text_lower for kw in action_register_kws):
        return "ACTION_REGISTER"
        
    # الفحص إذا كانت النية استعلام عن طلب 
    if any(kw in text_lower for kw in action_status_kws):
        return "ACTION_STATUS"

    # الفحص إذا كانت النية دردشة عامة
    if any(kw in text_lower for kw in action_chat_kws):
        return "ACTION_GENERAL_CHAT"
        
    # إذا لم يكن هذا ولا ذاك، يتم اعتباره سؤال عام يحتاج RAG (Answer)
    return "QUESTION"

