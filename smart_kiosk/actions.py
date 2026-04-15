import db

def handle_registration(student_id, name, phone, email):
    """تنفيذ عملية تسجيل الطالب وإظهار رقم الطلب"""
    success, result = db.register_student(student_id, name, phone, email)
    if success:
        return f"تم تسجيل طلبك بنجاح! رقم طلبك الخاص للمتابعة هو: ({result}). يرجى الاحتفاظ به."
    return result


def handle_check_status(request_id):
    """تصرف الاستعلام عن حالة طلب (Action)"""
    try:
        # التأكد من صحة رقم الطلب كأرقام
        req_id = int(request_id)
        success, status = db.get_request_status(req_id)
        if success:
            return f"حالة الطلب رقم {req_id} هي: {status}"
        return f"عفوًا، {status}"
    except ValueError:
        return "الرجاء توفير رقم طلب صحيح (أرقام فقط)."
