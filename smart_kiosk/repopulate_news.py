import sqlite3
import os

def repopulate():
    db_path = r'e:\my gpt v2\smart_kiosk\kiosk.db'
    if not os.path.exists(db_path):
        print("Database not found")
        return

    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Migration check
    for col in ['summary TEXT', 'source TEXT']:
        try:
            c.execute(f"ALTER TABLE news ADD COLUMN {col}")
        except sqlite3.OperationalError:
            pass

    # Clear old news to ensure a fresh start with premium content
    c.execute("DELETE FROM news")

    sample_news = [
        ('وزارة التعليم تعلن بدء العام الدراسي الجديد', 
         'أعلنت وزارة التعليم العالي والبحث العلمي العراقية عن جداول القبول والبدء بالعام الدراسي الجديد لكافة الجامعات التقنية والحكومية. وأكد المتحدث الرسمي أن الوزارة تسعى لتوفير بيئة تعليمية متطورة تواكب المعايير الدولية، مع التركيز على التحول الرقمي في كافة المفاصل الإدارية.',
         'https://images.unsplash.com/photo-1541339907198-e08756ebafe1?auto=format&fit=crop&w=800&q=80',
         'الوزارة', 'رسمي', 'approved', 1, 'بدء القبول المركزي للعام الدراسي 2024-2025 في العراق', 'وزارة التعليم العالي'),
        
        ('جامعة هارفارد: ثورة جديدة في الذكاء الاصطناعي',
         'نشر باحثون من جامعة هارفارد ورقة بحثية حول الجيل الجديد من الشبكات العصبية التي تحاكي منطق العقل البشري بشكل أكثر دقة. هذه التقنية قد تفتح آفاقاً جديدة في تطوير الروبوتات الطبية وأنظمة التحليل المعقدة التي نستخدمها في حياتنا اليومية.',
         'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
         'GlobalDesk', 'تقنية', 'approved', 1, 'بحث رائد عالمي في هندسة الذكاء الاصطناعي من جامعة هارفارد', 'Harvard University'),
        
        ('اكتشاف أثري جديد لجامعة أكسفورد في العراق',
         'تعاون فريق من جامعة أكسفورد مع وزارة الثقافة العراقية في التنقيب عن آثار مدينة تاريخية مفقودة في جنوب ذي قار. الاكتشاف يسلط الضوء على فترات غير معروفة من الحضارة السومرية ويعزز مكانة العراق كوجهة عالمية للسياحة والآثار.',
         'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
         'CultureNews', 'تاريخ', 'approved', 0, 'تعاون دولي للكشف عن عمق التاريخ العراقي العظيم', 'Oxford University'),
        
        ('جامعة بغداد تحقق مركزاً متقدماً في تصنيف شنغهاي',
         'احتفلت جامعة بغداد بدخولها ضمن مراكز متقدمة في التصنيف العالمي الأخير، مما يعكس جودة البحث العلمي العراقي وتطور المناهج الأكاديمية. هذا الإنجاز يعد ثمرة جهود الكوادر التدريسية والطلاب المتميزين الذين يرفعون اسم العراق عالياً.',
         'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=800&q=80',
         'Admin', 'محلي', 'approved', 0, 'جامعة بغداد تتقدم بجدارة في التصنيفات العالمية الرصينة', 'جامعة بغداد'),
        
        ('كلية صدر العراق التقني تطلق المسابقة البرمجية الكبرى',
         'تستعد الكلية لاستضافة أكبر تجمع للمبرمجين الأوائل في بغداد للتنافس على حل المشكلات المعقدة باستخدام لغة بايثون. تهدف المسابقة إلى اكتشاف المواهب البرمجية الشابة وتأهيلهم لسوق العمل المحلي والدولي في مجالات التكنولوجيا.',
         'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
         'Internal', 'طلابي', 'approved', 1, 'فرصة للمبدعين: بدء التسجيل لمسابقة Valdis البرمجية الكبرى', 'كلية صدر العراق')
    ]

    c.executemany("""
        INSERT INTO news (title, content, image_url, author_id, category, status, is_featured, summary, source) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sample_news)

    conn.commit()
    conn.close()
    print("News repopulated successfully with premium content!")

if __name__ == "__main__":
    repopulate()
