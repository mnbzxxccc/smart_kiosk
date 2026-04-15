from flask import Flask, request, jsonify, session, render_template, redirect, url_for
import os
import json
from db import (init_db, save_chat_log, add_news, get_latest_news, get_connection, 
        log_event, get_student_files, get_analytics_summary,
        create_user_account, authenticate_user, save_user_chat, get_user_chat_history,
        add_journal_entry, add_compound_entry, get_journal_entries, clear_journal_entries,
        get_economy_state, update_economy_state, verify_professor_code,
        get_student_lectures, get_student_attendance_record, get_detailed_tuition, update_user_session_info)
from intent import classify_intent
from actions import handle_registration, handle_check_status
from rag import setup_rag_qa, ask_question
from excel_handler import init_excel_files, get_student_results, get_department_schedule
from finance_handler import get_student_finance, format_finance_response
from banking_sim import calculate_loan, currency_converter, simulate_savings
import threading
import time
import sys
from scrape_siuc import main as scrape_main
from news_engine import run_magaly_engine

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# دالة محلية لإضافة الأخبار في حال كانت قاعدة البيانات فارغة (لضمان وجود محتوى)
def ensure_news_exists():
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM news")
        if c.fetchone()[0] < 5:
            # حذف الأخبار القديمة وإعادة تعبئة
            c.execute("DELETE FROM news")
            news_items = [
                ("بوابة فالديس الذكية", "تم إطلاق نظام فالديس الذكي لخدمة طلبة كلية صدر العراق التقني، وتوفير كافة الإجابات حول الأقسام والأقساط.", None),
                ("فتح باب التسجيل 2026", "تعلن عمادة كلية صدر العراق التقني (تأسست 2009) عن استمرار التقديم للأقسام كافة: الأمن السبراني، هندسة الأجهزة الطبية، التحليلات، والقانون.", None),
                ("مختبر المحاكاة المالية", "قريباً بدء ورشة التدريب العملي في مختبر المحاكاة لطلبة العلوم المالية والمصرفية وإدارة الأعمال.", None),
                ("الأقساط الدراسية الجديدة", "أعلنت الحسابات أن الأقساط تتراوح بين 1.5 مليون إلى 2 مليون دينار للأقسام الصباحية والمسائية.", None),
                ("تطوير قسم التحليلات المرضية", "تم إضافة أجهزة طبية حديثة في مختبرات التحليلات المرضية لتوفير بيئة تدريبية متكاملة.", None),
                ("مسابقة الابتكار السنوية", "ندعو طلبة قسم تقنيات الأمن السبراني وتكنولوجيا المعلومات للمشاركة بابتكاراتهم التقنية الجديدة.", None),
                ("المحكمة الافتراضية", "جلسة محاكاة جديدة لطلبة قسم القانون يوم الخميس المقبل في القاعة الكبرى بالكاظمية.", None),
                ("تحديث نظام الدفع الإلكتروني", "يمكنكم الآن سداد الأجور الدراسية عبر زين كاش وكي كارد ومن تطبيق الكلية مباشرة.", None),
            ]
            c.executemany("INSERT INTO news (title, content, image_url) VALUES (?, ?, ?)", news_items)
            conn.commit()
            print("✅ تم تحديث الأخبار بهوية فالديس.")
        conn.close()
    except Exception as e:
        print(f"⚠️ خطأ أثناء تحديث الأخبار: {e}")

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = "super_secret_kiosk_key_2026"  # Required for sessions
app.config['TEMPLATES_AUTO_RELOAD'] = True
from flask_cors import CORS
CORS(app, supports_credentials=True) 

@app.route('/')
def index():
    return render_template('index.html', active_page='index')

@app.route('/auth')
def auth_page():
    return render_template('auth.html', active_page='auth')

@app.route('/finance')
def finance_hub():
    return render_template('finance.html', active_page='finance')

@app.route('/law')
def law_hub():
    return render_template('law.html', active_page='law')

@app.route('/chat')
def chat_page():
    return render_template('chat.html', active_page='chat')

@app.route('/user/logout')
def logout():
    session.pop('user_id', None)
    session.pop('student_id', None)
    session.pop('student_name', None)
    return redirect(url_for('index'))

@app.route('/manifest.json')
def manifest():
    return app.send_static_file('manifest.json')

@app.route('/sw.js')
def sw():
    return app.send_static_file('sw.js')


# حالة المحرك الذكي
retriever = None
qa_chain = None
rag_ready = False

def initialize_ai():
    global retriever, qa_chain, rag_ready
    print("[System] جاري تهيئة محرك الذكاء الاصطناعي (فالديس) في الخلفية...")
    try:
        retriever, qa_chain = setup_rag_qa()
        rag_ready = True
        print("[System] محرك فالديس جاهز للعمل.")
    except Exception as e:
        print(f"[System] فشل تهيئة RAG: {e}")

# تهيئة قاعدة البيانات والمحرك والإكسل عند بدء التشغيل
init_db()
ensure_news_exists() # إضافة الأخبار
os.makedirs("data", exist_ok=True)
os.makedirs("models", exist_ok=True)
init_excel_files()

# بدء تهيئة AI في thread منفصل لمنع تجميد الخادم
threading.Thread(target=initialize_ai, daemon=True).start()

# حالة المحادثة
chat_state = {"awaiting": None, "student_id": None, "name": None, "phone": None, "session_id": None}


@app.route('/api/news', methods=['GET'])
def fetch_news():
    include_pending = request.args.get('pending') == 'true'
    category = request.args.get('category')
    is_featured = request.args.get('featured')
    
    # Convert is_featured string to boolean
    featured_bool = None
    if is_featured == 'true': featured_bool = True
    elif is_featured == 'false': featured_bool = False
    
    news = get_latest_news(limit=20, include_pending=include_pending, category=category, is_featured=featured_bool)
    return jsonify(news)

@app.route('/api/news', methods=['POST'])
def submit_news():
    data = request.json
    title = data.get('title')
    content = data.get('content')
    image_url = data.get('image_url')
    author_id = data.get('author_id')
    category = data.get('category', 'عام')
    
    if not title or not content:
        return jsonify({"success": False, "error": "العنوان والمحتوى مطلوبان"}), 400
        
    res = add_news(title, content, image_url, author_id, category, status='pending')
    if res:
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "فشل إضافة المقال"}), 500

@app.route('/api/admin/news/approve/<int:news_id>', methods=['POST'])
def approve_news(news_id):
    if not session.get('admin_logged_in'):
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    
    from db import update_news_status
    res = update_news_status(news_id, 'approved')
    if res:
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Failed to approve"}), 500

# --- Admin Authentication & System Routes ---
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM admin_users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()
    
    if user and check_password_hash(user['password_hash'], password):
        session['admin_logged_in'] = True
        session['admin_username'] = username
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "اسم المستخدم أو كلمة المرور غير صحيحة"}), 401

@app.route('/api/admin/check_auth', methods=['GET'])
def check_auth():
    return jsonify({"authenticated": session.get('admin_logged_in', False)})

@app.route('/api/admin/logout', methods=['GET'])
def admin_logout():
    session.pop('admin_logged_in', None)
    return jsonify({"success": True})

@app.route('/api/admin/update_credentials', methods=['POST'])
def update_credentials():
    if not session.get('admin_logged_in'):
        return jsonify({"success": False, "error": "غير مصرح لك بذلك"}), 401
    
    data = request.json
    new_user = data.get('username')
    new_pass = generate_password_hash(data.get('password'))
    old_user = session.get('admin_username')
    
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("UPDATE admin_users SET username = ?, password_hash = ? WHERE username = ?", (new_user, new_pass, old_user))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/admin/upload/<file_type>', methods=['POST'])
def upload_excel(file_type):
    if not session.get('admin_logged_in'):
        return jsonify({"success": False, "error": "Access Denied"}), 401
        
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "لم يتم اختيار ملف"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "لا يوجد ملف"}), 400
        
    if file and file.filename.endswith('.xlsx'):
        filename = "results.xlsx" if file_type == "results" else "schedules.xlsx"
        filepath = os.path.join("data", filename)
        file.save(filepath)
        return jsonify({"success": True})
        
    return jsonify({"success": False, "error": "يُسمح برفع ملفات xlsx فقط"}), 400

@app.route('/api/chat', methods=['POST'])
def chat_api():
    global chat_state
    data = request.json
    user_input = data.get('message', '').strip()
    
    if not user_input:
        return jsonify({"reply": "الرجاء كتابة سؤال..."})

    # سجل الحدث للتحليلات (V3)
    log_event("query", {"text": user_input})

    import re
    extra_context = ""
    
    # Check for tuition fee context
    match = re.search(r'\d{3,}', user_input)
    if match:
        s_id = match.group()
        # Get results
        res_stud = get_student_results(s_id)
        if res_stud:
            extra_context += f"الرقم الجامعي: {s_id}\nاسم الطالب: {res_stud['name']}\nالنتائج الدراسية:\n{res_stud['records']}\n"
            
        # Get financial status (Real Service)
        res_fin = get_student_finance(s_id)
        if res_fin:
            extra_context += f"الموقف المالي:\n{format_finance_response(res_fin)}\n"
    
    # Check for schedules
    if any(k in user_input for k in ["جدول", "حصص", "محاضرات"]):
        res_sch = get_department_schedule(user_input)
        if res_sch:
            extra_context += f"الجدول الدراسي:\n{res_sch}\n"

    # AI Interaction
    if rag_ready:
        answer = ask_question(user_input, retriever, qa_chain, extra_context)
    else:
        answer = "محرك المساعد الذكي قيد التجهيز حالياً، سأتمكن من الإجابة بدقة أكبر خلال لحظات. " + (extra_context if extra_context else "كيف يمكنني مساعدتك؟")
    
    # حفظ الدردشة للمستخدم المسجل (V4)
    user_id = data.get('user_id')
    if user_id:
        save_user_chat(user_id, 'user', user_input)
        save_user_chat(user_id, 'bot', answer)
    
    return jsonify({"reply": answer})



# --- Advanced Accounting (Journal) Routes ---
@app.route('/api/finance/journal', methods=['GET', 'POST', 'DELETE'])
def api_journal():
    if request.method == 'GET':
        entries = get_journal_entries()
        return jsonify(entries)
    
    elif request.method == 'POST':
        data = request.json
        tx_date = data.get('tx_date')
        description = data.get('description', '')
        
        # دعم القيود المركبة (مجموعة من الأسطر)
        if 'lines' in data:
            lines = data['lines']
            group_id = add_compound_entry(tx_date, description, lines)
            return jsonify({"status": "success", "tx_group_id": group_id})
        
        # دعم القيد البسيط التقليدي
        else:
            tx_type = data.get('tx_type', 'قيد بسيط')
            debit_acc = data.get('debit_acc')
            credit_acc = data.get('credit_acc')
            amount = float(data.get('amount', 0))
            
            if amount <= 0:
                return jsonify({"status": "error", "message": "المبلغ يجب أن يكون أكبر من الصفر."}), 400
                
            group_id = add_journal_entry(tx_type, debit_acc, credit_acc, amount, tx_date, description)
            return jsonify({"status": "success", "tx_group_id": group_id})
        
    elif request.method == 'DELETE':
        clear_journal_entries()
        return jsonify({"status": "success"})


# --- Economy State Routes (واجهة الأستاذ) ---
@app.route('/api/simulation/economy', methods=['GET'])
def get_economy():
    state = get_economy_state()
    if state:
        # لا نرسل رمز الأستاذ للعميل
        safe_state = {k: v for k, v in state.items() if k != 'professor_code'}
        return jsonify(safe_state)
    return jsonify({"error": "No economy state found"}), 404

@app.route('/api/simulation/economy', methods=['POST'])
def set_economy():
    data = request.json
    code = data.get('professor_code', '')
    
    if not verify_professor_code(code):
        return jsonify({"success": False, "error": "رمز الأستاذ غير صحيح."}), 401
    
    inflation = float(data.get('inflation', 2.0))
    recession = float(data.get('recession', 0.0))
    spending = float(data.get('spending', 50.0))
    taxes = float(data.get('taxes', 15.0))
    interest_rate = float(data.get('interest_rate', 5.0))
    
    success = update_economy_state(inflation, recession, spending, taxes, interest_rate)
    if success:
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "فشل في تحديث حالة الاقتصاد."}), 500

@app.route('/api/simulation/economy/verify', methods=['POST'])
def verify_professor():
    data = request.json
    code = data.get('code', '')
    if verify_professor_code(code):
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "الرمز غير صحيح."}), 401


# --- Advanced Virtual Court Routes ---
mock_cases = [
    {
        "id": "case_01",
        "title": "قضية مدنية: إخلال بعقد مقاولة",
        "type": "مدني وتجاري",
        "difficulty": 3,
        "facts": "تعاقد (أحمد) مع شركة بناء لتسليم مشروع خلال 6 أشهر بقيمة 50 مليون دينار. تأخرت الشركة 3 أشهر عن الموعد بسبب أزمة تمويل. يطالب أحمد بتعويض مادي وغرامات تأخير.",
        "attachments": ["نسخة من العقد (مرفق أ)", "رسائل إنذار (مرفق ب)"],
        "ai_role": "رئيس المحكمة (القاضي)",
        "system_prompt": "أنت قاضي محكمة بداءة حازم وعادل وفق القانون المدني العراقي. الطالب يلعب دور محامي أحد الأطراف. استمع لدفوع الطالب القانونية وقيمها بشكل بناء. رد على الحجج الضعيفة بالنقض واطلب السند القانوني. إذا قدم الطالب مرافعة ختامية أو استوفت القضية نقاشها، يجب عليك إصدار 'قرار حكم نهائي' تذكر فيه حيثيات الحكم استناداً للعقد والظروف القاهرة وتعويض الضرر. لا تلعب دور الخصم، أنت القاضي."
    },
    {
        "id": "case_02",
        "title": "قضية جنائية: تهمة اختلاس",
        "type": "جزائي",
        "difficulty": 4,
        "facts": "المتهم (سعد) يعمل محاسباً في مصرف، اختفى مبلغ 15 مليون دينار من العهدة في يوم مناوبته. الكاميرات متعطلة، ولا توجد بصمات واضحة، لكن سعد قام بشراء سيارة بقيمة 12 مليون بعد يومين من الحادث.",
        "attachments": ["تقرير الكاميرات", "كشف حساب سعد"],
        "ai_role": "قاضي محكمة الجنايات",
        "system_prompt": "العب دور قاضي محكمة الجنايات. الطالب سيلعب دور النيابة العامة أو محامي الدفاع عن (سعد). إذا قدم الطالب دليلاً (مثل شراء السيارة) دون ربط مباشر أو قرينة قانونية صحيحة، انقض استنتاجه ذكّره بمبدأ 'الشك يفسر لصالح المتهم'. قيّم مرافعة الطالب بشكل بناء، وفي النهاية أعلن 'قرار الحكم النهائي' بإدانة المتهم أو براءته لعدم كفاية الأدلة بناءً على قوة حجة الطالب."
    }
]

@app.route('/api/court/cases', methods=['GET'])
def get_court_cases():
    return jsonify(mock_cases)

@app.route('/api/court/chat', methods=['POST'])
def court_chat():
    data = request.json
    case_id = data.get('case_id')
    user_msg = data.get('message', '').strip()
    user_role = data.get('user_role', 'محامي الدفاع').strip()
    
    # Locate case
    selected_case = next((c for c in mock_cases if c["id"] == case_id), None)
    if not selected_case:
        return jsonify({"reply": "خطأ: المعطيات غير صالحة، يرجى اختيار قضية."})
    
    if len(user_msg) < 5:
        return jsonify({"reply": "المحكمة لا تستمع للردود القصيرة جداً، قدم حجة وافية."})
        
    prompt = f"""أنت نظام محاكاة قاعة المحكمة الذكي وفق القانون العراقي. 
القضية: {selected_case['title']}
سياق القضية: {selected_case['facts']}

الطالب اختار أن يُمثل دور: ({user_role}).
رسالة الطالب ({user_role}): {user_msg}

يجب عليك الآن أن تمثل كافة الأطراف الأخرى في القاعة (الخصم، والقاضي). 
اكتب ردك بالصيغة التالية تماماً:
(محامي الخصم): [رد على حجة الطالب وفندها أو قدم دليلاً مضاداً].
(رئيس المحكمة): [تعقيب على نقاش الطرفين، أو طلب السند القانوني، أو إصدار قرار حكم نهائي إذا طلب منك الطالب ذلك]."""
    
    # Send to AI
    answer = ask_question(prompt, retriever, qa_chain, "")
    
    return jsonify({"reply": answer})


# === محاكاة الخدمات المصرفية (V4) ===

@app.route('/api/simulation/loan', methods=['POST'])
def sim_loan():
    data = request.json
    amount = float(data.get('amount', 0))
    rate = float(data.get('rate', 0))
    years = int(data.get('years', 0))
    res = calculate_loan(amount, rate, years)
    if res:
        return jsonify({"success": True, "monthly": res['monthly_payment'], "total_interest": res['total_interest']})
    return jsonify({"success": False, "error": "خطأ في الحساب"}), 400

@app.route('/api/simulation/savings', methods=['POST'])
def sim_savings():
    data = request.json
    initial = float(data.get('initial', 0))
    monthly = float(data.get('monthly', 0))
    rate = float(data.get('rate', 0))
    years = int(data.get('years', 0))
    res = simulate_savings(initial, monthly, rate, years)
    if res:
        return jsonify({"success": True, "final_balance": res['final_balance'], "profit": res['total_profit']})
    return jsonify({"success": False, "error": "خطأ في الحساب"}), 400

# === نظام ملفات الطلبة ===

@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    if not session.get('admin_logged_in'):
        return jsonify({"error": "Unauthorized"}), 401
    stats = get_analytics_summary()
    return jsonify(stats)

# === نظام حسابات المستخدمين (V4) ===

@app.route('/api/auth/register', methods=['POST'])
def user_register():
    data = request.json
    student_id = data.get('student_id', '').strip()
    password = data.get('password', '').strip()
    display_name = data.get('display_name', '').strip()
    department = data.get('department', '').strip()
    stage = data.get('stage', '').strip()
    phone = data.get('phone', '').strip()
    
    if not student_id or not password or not phone:
        return jsonify({"success": False, "error": "يرجى إدخال الرقم الجامعي، كلمة السر، ورقم الهاتف."}), 400
    
    success, result = create_user_account(student_id, password, display_name or None, department or None, stage or None, phone or None)
    if success:
        return jsonify({"success": True, "user": result})
    return jsonify({"success": False, "error": result}), 409

@app.route('/api/auth/login', methods=['POST'])
def user_login():
    data = request.json
    student_id = data.get('student_id', '').strip()
    password = data.get('password', '').strip()
    
    if not student_id or not password:
        return jsonify({"success": False, "error": "يرجى إدخال البيانات."}), 400
    
    success, result = authenticate_user(student_id, password)
    if success:
        session['user_id'] = result['user_id']
        session['student_id'] = result['student_id']
        session['department'] = result['department']
        session['stage'] = result['stage']
        
        # تحديث معلومات الجلسة (V5)
        update_user_session_info(result['student_id'])
        
        return jsonify({"success": True, "user": result})
    return jsonify({"success": False, "error": result}), 401

# === الخدمات الطلابية الأكاديمية (V5) ===

@app.route('/api/student/lectures', methods=['GET'])
def student_lectures():
    student_id = session.get('student_id')
    dept = session.get('department')
    stage = session.get('stage')
    
    if not student_id or not dept or not stage:
        return jsonify({"error": "يرجى تسجيل الدخول للوصول للجدول"}), 401
    
    lectures = get_student_lectures(dept, stage)
    return jsonify(lectures)

@app.route('/api/student/attendance', methods=['GET'])
def student_attendance():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    attendance = get_student_attendance_record(student_id)
    return jsonify(attendance)

@app.route('/api/student/tuition', methods=['GET'])
def student_tuition_detailed():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    tuition = get_detailed_tuition(student_id)
    if tuition:
        return jsonify(tuition)
    return jsonify({"error": "بيانات الأقساط غير متوفرة لهذا الحساب"}), 404

@app.route('/api/auth/logout', methods=['POST'])
def user_logout():
    session.pop('user_id', None)
    session.pop('student_id', None)
    return jsonify({"success": True})

@app.route('/api/chat/history', methods=['GET'])
def get_chat_history():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify([]), 200
    history = get_user_chat_history(int(user_id))
    return jsonify(history)

def run_hourly_updater():
    """وظيفة تعمل في الخلفية لتحديث الأخبار عالمياً ومحلياً كل ساعة (V6)"""
    while True:
        try:
            print("🕒 [Magaly] بدء محرك الأخبار التلقائي...")
            run_magaly_engine() # جلب أخبار عالمية
            scrape_main()       # تحديث بيانات الكلية
            print("🕒 [Magaly] اكتملت دورة التحديث للساعة الحالية.")
        except Exception as e:
            print(f"🕒 [Magaly] خطأ في التحديث التلقائي: {e}")
        time.sleep(3600) # التحديث كل ساعة واحدة

if __name__ == "__main__":
    # تشغيل سحب البيانات في thread منفصل بعد تأخير بسيط لضمان تشغيل الخادم بسلاسة
    def delayed_updater():
        print("[System] سيبدأ محرك Magaly بعد 20 ثانية...")
        time.sleep(20)
        run_hourly_updater()
    
    updater_thread = threading.Thread(target=delayed_updater, daemon=True)
    updater_thread.start()
    
    print("Flask Server with Valdis AI Auto-Scraper is running on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
