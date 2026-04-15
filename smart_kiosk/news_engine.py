import urllib.request
import re
import json
import sqlite3
import os
import sys
from html.parser import HTMLParser

import sys

# Reconfigure stdout/stderr for Unicode support
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Ensure we can import db.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import db

class RSSParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.items = []
        self.current_item = {}
        self.current_tag = None

    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        if tag == 'item':
            self.current_item = {}

    def handle_endtag(self, tag):
        if tag == 'item':
            self.items.append(self.current_item)
        self.current_tag = None

    def handle_data(self, data):
        if self.current_tag in ['title', 'link', 'description', 'pubDate']:
            self.current_item[self.current_tag] = self.current_item.get(self.current_tag, '') + data

def fetch_rss_news(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            xml = response.read().decode('utf-8', errors='ignore')
            parser = RSSParser()
            parser.feed(xml)
            return parser.items
    except Exception as e:
        print(f"Error fetching RSS {url}: {e}")
        return []

def beautify_text(title, description, source):
    """صياغة النص لإضفاء طابع أكاديمي مهني (محاكاة AI)"""
    templates = {
        "Harvard University": [
            f"في إنجاز أكاديمي جديد، كشف باحثون من جامعة هارفارد عن {title}. التقرير يشير إلى أن {description[:150]}... ويُعد هذا التحول خطوة استراتيجية في العلوم العالمية.",
            f"أعلنت جامعة هارفارد العريقة عن {title}. يسلط هذا التطور الضوء على {description[:100]}... مما يعزز ريادة الجامعة في الابتكار والبحث العلمي."
        ],
        "Oxford University": [
            f"ضمن سلسلة أبحاثها العالمية، أعلنت جامعة أكسفورد عن {title}. التفاصيل الواردة توضح {description[:150]}... وهو ما يفتح آفاقاً جديدة للتعاون الأكاديمي الدولي.",
            f"سجلت جامعة أكسفورد سبقاً علمياً جديداً بعنوان '{title}'. يركز البحث على {description[:120]}... مع التركيز على التأثير المجتمعي لهذه النتائج."
        ],
        "وزارة التعليم العالي": [
            f"أصدرت وزارة التعليم العالي والبحث العلمي توجيهاً بخصوص {title}. يأتي هذا في إطار سعي الوزارة لتطوير البيئة الجامعية، حيث أكدت أن {description[:150]}...",
            f"أعلنت وزارة التعليم العالي رسمياً عن {title}. يهدف هذا الإعلان إلى {description[:120]}... ضمن خارطة الطريق للتحول الرقمي والجودة الأكاديمية."
        ]
    }
    
    import random
    source_templates = templates.get(source, [f"{title}. {description[:200]}..."])
    return random.choice(source_templates)

def run_magaly_engine():
    print("🚀 [Magaly Engine] بدء تشغيل محرك الأخبار الذكي...")
    
    feeds = [
        {"url": "https://news.harvard.edu/gazette/feed/", "source": "Harvard University", "cat": "تقنية"},
        {"url": "https://www.ox.ac.uk/news-and-events/oxford-and-world/feed", "source": "Oxford University", "cat": "تقنية"},
    ]
    
    for feed in feeds:
        items = fetch_rss_news(feed['url'])
        print(f"📡 [Magaly] جلب {len(items)} خبراً من {feed['source']}")
        
        for item in items[:5]: # Take top 5
            title = item.get('title', '').strip()
            link = item.get('link', '').strip()
            desc = item.get('description', '').strip()
            # Clean HTML tags from desc
            desc = re.sub('<[^<]+?>', '', desc)
            
            # Check if exists in DB
            conn = db.get_connection()
            c = conn.cursor()
            c.execute("SELECT id FROM news WHERE title = ? OR link = ?", (title, link))
            if not c.fetchone():
                beautiful_content = beautify_text(title, desc, feed['source'])
                # Use a matching image or generic
                img = "https://images.unsplash.com/photo-152305085306e-8c3339709b30?auto=format&fit=crop&w=800&q=80"
                if "Harvard" in feed['source']: img = "https://images.unsplash.com/photo-1541339907198-e08756ebafe1?auto=format&fit=crop&w=800&q=80"
                
                db.add_news(
                    title=title,
                    content=beautiful_content,
                    image_url=img,
                    category=feed['cat'],
                    summary=title,
                    source=feed['source'],
                    link=link,
                    is_featured=0
                )
                print(f"✅ [Magaly] تم نشر خبر جديد: {title[:50]}...")
            conn.close()

if __name__ == "__main__":
    run_magaly_engine()
