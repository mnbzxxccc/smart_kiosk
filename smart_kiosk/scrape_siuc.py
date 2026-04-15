import urllib.request
import urllib.error
import json
import os
import re
from html.parser import HTMLParser

# Helper class to extract text from HTML
class HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.result = []
        self.in_script = False

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.in_script = True

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.in_script = False

    def handle_data(self, data):
        if not self.in_script and data.strip():
            self.result.append(data.strip())

    def get_text(self):
        return '\n'.join(self.result)

def fetch_url(url):
    print(f"جاري جلب البيانات من: {url} ...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8', errors='ignore')
            extractor = HTMLTextExtractor()
            extractor.feed(html)
            
            # Simple cleanup: remove excessive newlines
            text = extractor.get_text()
            text = re.sub(r'\n{3,}', '\n\n', text)
            return text, html
    except Exception as e:
        print(f"خطأ أثناء تحميل {url}: {e}")
        return None, None

def extract_news_regex(html):
    news_items = []
    # Basic regex to find news links and titles on siuc.edu.iq/news.php
    # They usually have format like <a href="news-detail.php?nid=135"><h3>Title...</h3></a>
    # Or looking for news blocks. We'll extract raw text blocks representing news.
    # Since regex HTML parsing is flaky, we'll try to find <h[1-6]> or news item wrappers
    matches = re.findall(r'<a href="news-detail\.php\?nid=(\d+)"[^>]*>(.*?)</a>', html, re.DOTALL | re.IGNORECASE)
    for nid, inner in matches:
        extractor = HTMLTextExtractor()
        extractor.feed(inner)
        title = extractor.get_text().replace('\n', ' ').strip()
        if title and len(title) > 10:
            news_items.append({'id': nid, 'title': title})
    
    # Let's remove duplicates
    unique_news = []
    seen = set()
    for item in news_items:
        if item['title'] not in seen:
            seen.add(item['title'])
            unique_news.append(item)
            
    return unique_news

def inject_news_into_db(news_items):
    import sys
    sys.path.append(r'e:\my gpt v2\smart_kiosk')
    try:
        import db
        print(f"\nجاري حفظ {len(news_items)} خبراً في قاعدة بيانات الكشك...")
        
        # Connect to DB and clear old auto-scraped news, or just add new
        conn = db.get_connection()
        c = conn.cursor()
        # Create a new table or use the existing 'news' table
        for item in news_items:
            # Check if exists
            c.execute("SELECT id FROM news WHERE title = ?", (item['title'],))
            if not c.fetchone():
                c.execute("INSERT INTO news (title, content, image_url) VALUES (?, ?, ?)",
                          (item['title'], 'اقرأ التفاصيل على موقع الكلية', 'assets/default_news.png'))
        conn.commit()
        conn.close()
        print("تم تخزين الأخبار بنجاح.")
    except Exception as e:
        print(f"خطأ في حفظ الأخبار في القاعدة: {e}")

def main():
    base_dir = r"e:\my gpt v2\smart_kiosk\data"
    os.makedirs(base_dir, exist_ok=True)
    
    # قائمة الأهداف المحدثة لتشمل الرؤية والرسالة والنبذة
    targets = {
        "نبذة_عن_الكلية": "https://siuc.edu.iq/about.php",
        "الرؤية_والرسالة": "https://siuc.edu.iq/vision.php",
        "أهداف_الكلية": "https://siuc.edu.iq/goals.php",
        "قسم_القانون": "https://siuc.edu.iq/department.php?nid=9",
        "قسم_الاعلام": "https://siuc.edu.iq/department.php?nid=3",
        "قسم_ادارة_الاعمال": "https://siuc.edu.iq/department.php?nid=5",
        "العلوم_السياسية": "https://siuc.edu.iq/department.php?nid=6",
        "هندسة_الاجهزة_الطبية": "https://siuc.edu.iq/department.php?nid=8",
        "تكنولوجيا_المعلومات": "https://siuc.edu.iq/site.php?nid=7",
        "شروط_القبول_والدراسة": "https://siuc.edu.iq/terms.php",
        "مسار_بولونيا": "https://siuc.edu.iq/bologna.php"
    }

    print("====================================")
    print("🤖 جاري تحديث بيانات فالديس من الموقع الرسمي")
    print("====================================")
    
    updated_files = False
    for name, url in targets.items():
        filepath = os.path.join(base_dir, f"{name}.txt")
        try:
            text, _ = fetch_url(url)
            if text:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(f"--- بيانات كلية صدر العراق التقني: {name} ---\n")
                    f.write(f"المصدر والموقع الرسمي: {url}\n")
                    f.write(f"تاريخ التحديث: {json.dumps(os.popen('date /t').read().strip())}\n\n")
                    f.write(text)
                print(f"✅ تم تحديث: {name}.txt")
                updated_files = True
        except Exception as e:
            print(f"❌ فشل جلب {name}: {e}")

    # 2. Scrape News to inject into SQLite
    print("\n====================================")
    print("📰 سحب الأخبار والفعاليات الجارية")
    print("====================================")
    
    news_urls = [
        "https://siuc.edu.iq/news.php",
        "https://siuc.edu.iq/type.php?catid=2", # ورش عمل
        "https://siuc.edu.iq/type.php?catid=4", # مؤتمرات
        "https://siuc.edu.iq/type.php?catid=7", # نشاطات
    ]
    all_news = []
    
    for url in news_urls:
        _, html = fetch_url(url)
        if html:
            items = extract_news_regex(html)
            all_news.extend(items)
            
    if all_news:
        inject_news_into_db(all_news)

    # 3. Trigger Vector Room Refresh (Optional trigger if you want RAG to re-index)
    if updated_files:
        print("\n⏳ تنبيه: تم تحديث ملفات البيانات. سيتعين على نظام 'فالديس' إعادة الفهرسة عند التشغيل القادم.")

if __name__ == "__main__":
    main()
