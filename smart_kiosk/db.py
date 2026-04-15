import sqlite3
import os
import json
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = "kiosk.db"

def get_connection():
    # اتصال بقاعدة بيانات SQLite المحلية
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """تهيئة قاعدة البيانات وإنشاء الجداول إذا لم تكن موجودة"""
    conn = get_connection()
    c = conn.cursor()
    
    # جدول الطلاب للتسجيل الجديد
    c.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT
        )
    ''')
    
    # محاولة إضافة الأعمدة في حال كانت القاعدة منشأة مسبقاً (Migration)
    try:
        c.execute("ALTER TABLE students ADD COLUMN phone TEXT")
    except sqlite3.OperationalError:
        pass # العمود موجود مسبقاً
        
    try:
        c.execute("ALTER TABLE students ADD COLUMN email TEXT")
    except sqlite3.OperationalError:
        pass # العمود موجود مسبقاً

    
    # جدول لطلبات الخدمات الجامعية
    c.execute('''
        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            request_type TEXT NOT NULL,
            status TEXT DEFAULT 'قيد المراجعة'
        )
    ''')
    
    # جدول جديد لسجلات الدردشة العامة
    c.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            user_query TEXT NOT NULL,
            bot_response TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # جدول أخبار الجامعة والـ Magazine
    c.execute('''
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            image_url TEXT,
            author_id TEXT,
            category TEXT DEFAULT 'عام',
            status TEXT DEFAULT 'approved',
            is_featured INTEGER DEFAULT 0,
            date DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Migrations for news table
    for col in ['author_id TEXT', "category TEXT DEFAULT 'عام'", "status TEXT DEFAULT 'approved'", 'is_featured INTEGER DEFAULT 0', 'summary TEXT', 'source TEXT', 'link TEXT']:
        try:
            c.execute(f"ALTER TABLE news ADD COLUMN {col}")
        except sqlite3.OperationalError:
            pass

    # إضافة أخبار المجلة الرقمية والعالمية (V5)
    c.execute("SELECT COUNT(*) FROM news")
    if c.fetchone()[0] < 5:
        sample_news = [
            ('وزارة التعليم تعلن بدء العام الدراسي الجديد', 
             'أعلنت وزارة التعليم العالي والبحث العلمي العراقية عن جداول القبول والبدء بالعام الدراسي الجديد لكافة الجامعات التقنية والحكومية...',
             'https://images.unsplash.com/photo-1541339907198-e08756ebafe1?auto=format&fit=crop&w=800&q=80',
             'الوزارة', 'رسمي', 'approved', 1, 'بدء القبول المركزي للعام الدراسي 2024-2025', 'وزارة التعليم العالي'),
            ('جامعة هارفارد: ثورة جديدة في الذكاء الاصطناعي',
             'نشر باحثون من جامعة هارفارد ورقة بحثية حول الجيل الجديد من الـ Neural Networks التي تحاكي منطق العقل البشري بشكل أكثر دقة...',
             'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
             'GlobalDesk', 'تقنية', 'approved', 1, 'بحث رائد عالمي في هندسة الذكاء الاصطناعي', 'Harvard University'),
            ('اكتشاف أثري جديد لجامعة أكسفورد في العراق',
             'تعاون فريق من جامعة أكسفورد مع وزارة الثقافة العراقية في التنقيب عن آثار مدينة تاريخية مفقودة في جنوب ذي قار...',
             'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
             'CultureNews', 'تاريخ', 'approved', 0, 'تعاون دولي للكشف عن عمق التاريخ العراقي', 'Oxford University'),
            ('جامعة بغداد تحقق مركزاً متقدماً في تصنيف شنغهاي',
             'احتفلت جامعة بغداد بدخولها ضمن مراكز متقدمة في التصنيف العالمي الأخير، مما يعكس جودة البحث العلمي العراقي...',
             'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=800&q=80',
             'Admin', 'محلي', 'approved', 0, 'جامعة بغداد تتقدم في التصنيفات العالمية', 'جامعة بغداد'),
            ('كلية صدر العراق التقني تطلق المسابقة البرمجية الكبرى',
             'تستعد الكلية لاستضافة أكبر تجمع للمبرمجين الأوائل في بغداد للتنافس على حل المشكلات المعقدة باستخدام لغة بايثون...',
             'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
             'Internal', 'طلابي', 'approved', 1, 'بدء التسجيل لمسابقة Valdis البرمجية', 'كلية صدر العراق')
        ]
        c.executemany("""
            INSERT INTO news (title, content, image_url, author_id, category, status, is_featured, summary, source) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_news)


    # جدول المشرفين للوحة الإدارة
    c.execute('''
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')
    
    # جدول الأجور الدراسية (جديد)
    c.execute('''
        CREATE TABLE IF NOT EXISTS tuition_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            total_fee REAL NOT NULL,
            paid_amount REAL NOT NULL,
            remaining_balance REAL NOT NULL,
            last_payment_date DATE,
            FOREIGN KEY (student_id) REFERENCES students(student_id)
        )
    ''')
    
    # جدول حالة الملفات والوثائق (جديد V3)
    c.execute('''
        CREATE TABLE IF NOT EXISTS student_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            doc_name TEXT NOT NULL,
            status TEXT DEFAULT 'نقص',
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # جدول التحليلات (جديد V3)
    c.execute('''
        CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            event_data TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # جدول حسابات المستخدمين المطور
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            department TEXT,
            stage TEXT,
            phone TEXT,
            google_id TEXT UNIQUE,
            profile_picture TEXT,
            is_verified INTEGER DEFAULT 0,
            account_status TEXT DEFAULT 'active',
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Migrations for user_accounts
    for col in ['department TEXT', 'stage TEXT', 'phone TEXT', 'google_id TEXT UNIQUE', 
                'profile_picture TEXT', 'is_verified INTEGER DEFAULT 0', 
                'account_status TEXT DEFAULT "active"', 'last_login DATETIME']:
        try:
            c.execute(f"ALTER TABLE user_accounts ADD COLUMN {col}")
        except sqlite3.OperationalError:
            pass

    # جدول المحاضرات (Schedule)
    c.execute('''
        CREATE TABLE IF NOT EXISTS lectures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            department TEXT NOT NULL,
            stage TEXT NOT NULL,
            day TEXT NOT NULL,
            time TEXT NOT NULL,
            room TEXT NOT NULL
        )
    ''')

    # جدول الحضور (Attendance)
    c.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            lecture_id INTEGER NOT NULL,
            status TEXT NOT NULL, -- حاضر، غائب، متأخر
            date DATE DEFAULT (DATE('now')),
            FOREIGN KEY (student_id) REFERENCES user_accounts (student_id),
            FOREIGN KEY (lecture_id) REFERENCES lectures (id)
        )
    ''')

    # جدول المحادثات للمستخدمين المسجلين
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user_accounts (id)
        )
    ''')

    # جدول القيود المحاسبية للطلاب
    c.execute('''
        CREATE TABLE IF NOT EXISTS journal_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tx_type TEXT NOT NULL,
            debit_acc TEXT,
            credit_acc TEXT,
            amount REAL,
            tx_date DATE,
            description TEXT,
            tx_group_id TEXT,
            account_name TEXT,
            debit REAL DEFAULT 0,
            credit REAL DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Migrations for journal_entries
    for col in ['tx_date DATE', 'description TEXT', 'tx_group_id TEXT', 'account_name TEXT', 'debit REAL DEFAULT 0', 'credit REAL DEFAULT 0']:
        try:
            c.execute(f"ALTER TABLE journal_entries ADD COLUMN {col}")
        except sqlite3.OperationalError:
            pass

    # جدول حالة الاقتصاد الكلي (واجهة الأستاذ)
    c.execute('''
        CREATE TABLE IF NOT EXISTS economy_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            inflation REAL DEFAULT 2.0,
            recession REAL DEFAULT 0.0,
            spending REAL DEFAULT 50.0,
            taxes REAL DEFAULT 15.0,
            interest_rate REAL DEFAULT 5.0,
            professor_code TEXT DEFAULT '1234',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # ضمان وجود صف واحد فقط لحالة الاقتصاد
    c.execute("INSERT OR IGNORE INTO economy_state (id) VALUES (1)")

    # إضافة بيانات عينة للملفات (للتجربة)
    c.execute("SELECT COUNT(*) FROM student_files")
    if c.fetchone()[0] == 0:
        sample_files = [
            ('S777', 'الهوية الشخصية', 'مكتمل'),
            ('S777', 'شهادة الإعدادية', 'نقص'),
            ('S777', 'الفحص الطبي', 'مكتمل'),
            ('2024001', 'الهوية الشخصية', 'مكتمل')
        ]
        c.executemany("INSERT INTO student_files (student_id, doc_name, status) VALUES (?, ?, ?)", sample_files)

    # إضافة محاضرات تجريبية (V5)
    c.execute("SELECT COUNT(*) FROM lectures")
    if c.fetchone()[0] == 0:
        sample_lectures = [
            ('الأمن السبراني المتقدم', 'الأمن السبراني', 'الأولى', 'الأحد', '08:30 AM', 'قاعة 101'),
            ('برمجة بايثون', 'الأمن السبراني', 'الأولى', 'الأحد', '10:30 AM', 'مختبر 1'),
            ('هياكل البيانات', 'تقنيات الحاسوب', 'الثانية', 'الاثنين', '09:00 AM', 'قاعة 202'),
            ('قانون العقوبات', 'القانون', 'الأولى', 'الثلاثاء', '11:00 AM', 'قاعة المحكمة'),
            ('المحاسبة المالية', 'إدارة الأعمال', 'الأولى', 'الأربعاء', '01:00 PM', 'قاعة 305')
        ]
        c.executemany("INSERT INTO lectures (name, department, stage, day, time, room) VALUES (?, ?, ?, ?, ?, ?)", sample_lectures)

    conn.commit()
    conn.close()

def register_student(student_id, name, phone, email):
    """تخزين مسجل جديد في SQLite وإرجاع رقم الطلب"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("INSERT INTO students (student_id, name, phone, email) VALUES (?, ?, ?, ?)", 
                  (student_id, name, phone, email))
        request_id = c.lastrowid # الحصول على المعرف الفريد (رقم الطلب)
        conn.commit()
        return True, request_id
    except sqlite3.IntegrityError:
        return False, "تنبيه: الطالب مسجل مسبقاً بهذا الرقم."

    except Exception as e:
        return False, f"خطأ غير متوقع: {str(e)}"
    finally:
        conn.close()

def get_request_status(request_id):
    """الاستعلام عن حالة الطلب"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT status FROM requests WHERE id = ?", (request_id,))
        row = c.fetchone()
        if row:
            return True, row['status']
        return False, "رقم الطلب غير موجود بالنظام."
    finally:
        conn.close()
def save_chat_log(session_id, query, response):
    """حفظ سجلات الدردشة العامة في قاعدة البيانات"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("INSERT INTO chat_history (session_id, user_query, bot_response) VALUES (?, ?, ?)",
                  (session_id, query, response))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error saving chat log: {e}")

def add_news(title, content, image_url, author_id=None, category='عام', status='approved', is_featured=0, summary=None, source=None, link=None):
    """إضافة خبر أو مقال جديد مع دعم الروابط الخارجية"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("""
            INSERT INTO news (title, content, image_url, author_id, category, status, is_featured, summary, source, link) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (title, content, image_url, author_id, category, status, is_featured, summary, source, link))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error adding news: {e}")
        return False

def update_news_status(news_id, new_status):
    """تحديث حالة مقال (مثلاً من pending إلى approved)"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("UPDATE news SET status = ? WHERE id = ?", (new_status, news_id))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error updating news status: {e}")
        return False

def get_student_files(student_id):
    """جلب حالة المستندات المطلوبة للطالب"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT doc_name, status FROM student_files WHERE student_id = ?", (student_id,))
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error fetching student files: {e}")
        return []

def log_event(event_type, event_data=None):
    """سجل حدث جديد في التحليلات"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("INSERT INTO analytics (event_type, event_data) VALUES (?, ?)", 
                  (event_type, json.dumps(event_data) if event_data else None))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error logging event: {e}")

def get_analytics_summary():
    """ملخص التحليلات للوحة التحكم"""
    try:
        conn = get_connection()
        c = conn.cursor()
        # إحصائيات بسيطة
        c.execute("SELECT event_type, COUNT(*) as count FROM analytics GROUP BY event_type")
        event_counts = [dict(row) for row in c.fetchall()]
        
        c.execute("SELECT COUNT(*) FROM students")
        total_students = c.fetchone()[0]
        
        c.execute("SELECT COUNT(*) FROM news")
        total_news = c.fetchone()[0]
        
        conn.close()
        return {
            "events": event_counts,
            "total_students": total_students,
            "total_news": total_news
        }
    except Exception as e:
        print(f"Error fetching analytics: {e}")
        return {}

def get_latest_news(limit=10, include_pending=False, category=None, is_featured=None):
    """جلب آخر الأخبار مع إمكانية التصفية حسب القسم أو التمييز"""
    try:
        conn = get_connection()
        c = conn.cursor()
        query = "SELECT * FROM news WHERE 1=1"
        params = []
        
        if not include_pending:
            query += " AND status = 'approved'"
        
        if category and category != 'الكل':
            query += " AND category = ?"
            params.append(category)
            
        if is_featured is not None:
            query += " AND is_featured = ?"
            params.append(1 if is_featured else 0)
            
        query += " ORDER BY date DESC LIMIT ?"
        params.append(limit)
        
        c.execute(query, tuple(params))
        news = c.fetchall()
        conn.close()
        return [dict(row) for row in news]
    except Exception as e:
        print(f"Error fetching news: {e}")
        return []

# === نظام حسابات المستخدمين (V4) ===

def create_user_account(student_id, password, display_name=None, department=None, stage=None, phone=None):
    """إنشاء حساب مستخدم جديد بالتفاصيل الأكاديمية ورقم الهاتف"""
    try:
        conn = get_connection()
        c = conn.cursor()
        pw_hash = generate_password_hash(password)
        name = display_name or f"طالب {student_id}"
        c.execute("""
            INSERT INTO user_accounts (student_id, password_hash, display_name, department, stage, phone) 
            VALUES (?, ?, ?, ?, ?, ?)
        """, (student_id, pw_hash, name, department, stage, phone))
        conn.commit()
        user_id = c.lastrowid
        conn.close()
        return True, {"user_id": user_id, "student_id": student_id, "display_name": name, "department": department, "stage": stage, "phone": phone}
    except sqlite3.IntegrityError:
        return False, "هذا الرقم الجامعي مسجل مسبقاً."
    except Exception as e:
        print(f"Error creating account: {e}")
        return False, f"خطأ: {str(e)}"

def authenticate_user(student_id, password):
    """التحقق من بيانات تسجيل الدخول"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM user_accounts WHERE student_id = ?", (student_id,))
        user = c.fetchone()
        conn.close()
        if user:
            user_dict = dict(user)
            if check_password_hash(user_dict['password_hash'], password):
                return True, {
                    "user_id": user_dict['id'],
                    "student_id": user_dict['student_id'],
                    "display_name": user_dict['display_name'],
                    "department": user_dict.get('department'),
                    "stage": user_dict.get('stage'),
                    "phone": user_dict.get('phone')
                }
        return False, "الرقم الجامعي أو كلمة السر غير صحيحة."
    except Exception as e:
        print(f"Error authenticating: {e}")
        return False, str(e)


def save_user_chat(user_id, role, message):
    """حفظ رسالة في سجل دردشة المستخدم"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("INSERT INTO user_chat_history (user_id, role, message) VALUES (?, ?, ?)",
                  (user_id, role, message))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error saving user chat: {e}")

def get_user_chat_history(user_id, limit=50):
    """جلب سجل دردشة المستخدم"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT role, message, timestamp FROM user_chat_history WHERE user_id = ? ORDER BY timestamp ASC LIMIT ?",
                  (user_id, limit))
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error fetching chat history: {e}")
        return []


# ----------------- FINANCE & ACCOUNTING DB -----------------
def add_journal_entry(tx_type, debit_acc, credit_acc, amount, tx_date=None, description=None):
    """
    سابقاً: قيد بسيط (حساب واحد مدين وواحد دائن)
    حالياً: ندعم استلام التاريخ والوصف أيضاً لتعزيز المعيار.
    """
    conn = get_connection()
    c = conn.cursor()
    import uuid
    group_id = str(uuid.uuid4())
    
    # نقوم بإضافة سطرين (مدين ودائن) لتمثيل القيد بالمعيار المزدوج
    lines = [
        (tx_type, tx_date, description, group_id, debit_acc, amount, 0),    # المدين
        (tx_type, tx_date, description, group_id, credit_acc, 0, amount)      # الدائن
    ]
    
    c.executemany("""
        INSERT INTO journal_entries (tx_type, tx_date, description, tx_group_id, account_name, debit, credit) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, lines)
    
    conn.commit()
    conn.close()
    return group_id

def add_compound_entry(tx_date, description, lines):
    """
    إضافة قيد مركب (متعدد الأسطر) وفق المعيار المهني
    lines format: [{"account": "...", "debit": 0, "credit": 0}, ...]
    """
    conn = get_connection()
    c = conn.cursor()
    import uuid
    group_id = str(uuid.uuid4())
    tx_type = "قيد مركب"
    
    db_lines = []
    for l in lines:
        db_lines.append((tx_type, tx_date, description, group_id, l['account'], l['debit'], l['credit']))
        
    c.executemany("""
        INSERT INTO journal_entries (tx_type, tx_date, description, tx_group_id, account_name, debit, credit) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, db_lines)
    
    conn.commit()
    conn.close()
    return group_id

def get_journal_entries():
    conn = get_connection()
    c = conn.cursor()
    # جلب القيود مرتبة حسب مجموعة المعاملة والتاريخ
    c.execute("""
        SELECT id, tx_type, tx_date, description, tx_group_id, account_name, debit, credit, timestamp 
        FROM journal_entries 
        ORDER BY tx_date ASC, tx_group_id ASC, id ASC
    """)
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def clear_journal_entries():
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM journal_entries")
    conn.commit()
    conn.close()


# ----------------- ECONOMY STATE (واجهة الأستاذ) -----------------
def get_economy_state():
    """جلب حالة الاقتصاد الكلي الحالية"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT inflation, recession, spending, taxes, interest_rate, professor_code, updated_at FROM economy_state WHERE id = 1")
        row = c.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None
    except Exception as e:
        print(f"Error fetching economy state: {e}")
        return None

def update_economy_state(inflation, recession, spending, taxes, interest_rate):
    """تحديث المتغيرات الاقتصادية الكلية"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("""UPDATE economy_state 
                     SET inflation = ?, recession = ?, spending = ?, taxes = ?, interest_rate = ?,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = 1""",
                  (inflation, recession, spending, taxes, interest_rate))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error updating economy state: {e}")
        return False

def verify_professor_code(code):
    """التحقق من رمز الأستاذ"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT professor_code FROM economy_state WHERE id = 1")
        row = c.fetchone()
        conn.close()
        if row:
            return str(row['professor_code']) == str(code)
        return False
    except Exception as e:
        print(f"Error verifying professor code: {e}")
        return False

# ----------------- ACADEMIC & FINANCIAL HELPERS (V5) -----------------

def get_student_lectures(department, stage):
    """جلب المحاضرات بناءً على القسم والمرحلة"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT name, day, time, room FROM lectures WHERE department = ? AND stage = ?", (department, stage))
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error fetching lectures: {e}")
        return []

def get_student_attendance_record(student_id):
    """جلب سجل حضور الطالب"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("""
            SELECT l.name as lecture_name, a.status, a.date 
            FROM attendance a
            JOIN lectures l ON a.lecture_id = l.id
            WHERE a.student_id = ?
            ORDER BY a.date DESC
        """, (student_id,))
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error fetching attendance: {e}")
        return []

def get_detailed_tuition(student_id):
    """جلب الموقف المالي المفصل للطالب"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM tuition_fees WHERE student_id = ?", (student_id,))
        row = c.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None
    except Exception as e:
        print(f"Error fetching tuition: {e}")
        return None

def update_user_session_info(student_id, last_login=True):
    """تحديث معلومات الجلسة وتاريخ الدخول"""
    try:
        conn = get_connection()
        c = conn.cursor()
        if last_login:
            c.execute("UPDATE user_accounts SET last_login = CURRENT_TIMESTAMP WHERE student_id = ?", (student_id,))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error updating session info: {e}")
        return False
