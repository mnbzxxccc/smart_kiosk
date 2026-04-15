from db import get_connection

def get_student_finance(student_id):
    """جلب تفاصيل الموقف المالي للطالب من قاعدة البيانات."""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM tuition_fees WHERE student_id = ?", (str(student_id),))
        row = c.fetchone()
        conn.close()
        
        if row:
            return {
                "total": row['total_fee'],
                "paid": row['paid_amount'],
                "balance": row['remaining_balance'],
                "last_date": row['last_payment_date']
            }
        return None
    except Exception as e:
        print(f"Finance Query Error: {e}")
        return None

def format_finance_response(data):
    """تنسيق البيانات المالية لإلحاقها بسياق الذكاء الاصطناعي."""
    if not data:
        return "لا توجد سجلات مالية متوفرة لهذا الرقم."
    
    return (f"إجمالي الأجور: {data['total']:,} دينار\n"
            f"المبلغ المسدد: {data['paid']:,} دينار\n"
            f"المبلغ المتبقي: {data['balance']:,} دينار\n"
            f"تاريخ آخر دفعة: {data['last_date']}")
