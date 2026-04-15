import sqlite3
import os

DB_PATH = "kiosk.db"

def populate_news():
    if not os.path.exists(DB_PATH):
        print(f"❌ Database {DB_PATH} not found!")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Sample News Data
    news_items = [
        ("فتح باب التسجيل للدراسات المسائية", "تعلن عمادة كلية صدر العراق التقني عن فتح باب التقديم للدراسات المسائية للأقسام كافة للعام الدراسي 2026/2027.", None),
        ("تحديث جدول امتحانات الدور الأول", "تم تحديث جدول الامتحانات النهائية للدور الأول، يرجى مراجعة قسم شؤون الطلبة أو اللوحات الإعلانية.", None),
        ("ندوة حول الذكاء الاصطناعي في التعليم", "تقيم الكلية ندوة علمية بعنوان 'مستقبل الذكاء الاصطناعي في التعليم التقني' يوم الثلاثاء القادم.", None),
        ("إطلاق المسابقة الطلابية للابتكار", "ندعو جميع الطلبة المبدعين للمشاركة في مسابقة الابتكار السنوية، الجوائز قيمة والمشاركة مفتوحة للجميع.", None)
    ]

    try:
        # Check if news already exists to avoid duplicates
        c.execute("SELECT COUNT(*) FROM news")
        if c.fetchone()[0] == 0:
            c.executemany("INSERT INTO news (title, content, image_url) VALUES (?, ?, ?)", news_items)
            conn.commit()
            print("✅ Sample news populated successfully.")
        else:
            print("ℹ️ News table already has content, skipping population.")
    except Exception as e:
        print(f"❌ Error populating news: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    populate_news()
