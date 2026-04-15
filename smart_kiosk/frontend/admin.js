// admin.js - إدارة أخبار الجامعة

document.getElementById('newsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. جلب البيانات من النموذج
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    const image_url = document.getElementById('image_url').value.trim();
    const submitBtn = document.getElementById('submitBtn');
    const statusDiv = document.getElementById('status');

    if (!title || !content) return;

    // 2. قفل النموذج مؤقتاً
    submitBtn.disabled = true;
    submitBtn.textContent = "جاري النشر...";
    statusDiv.style.display = 'none';

    try {
        // 3. إرسال الطلب لـ Backend (Flask)
        const response = await fetch('/api/news', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                content: content,
                image_url: image_url || null
            })
        });

        const result = await response.json();

        // 4. عرض النتيجة
        if (result.success) {
            statusDiv.textContent = "✅ تم نشر الخبر بنجاح! سيظهر الآن على الشاشة الرئيسية.";
            statusDiv.className = "status-msg status-success";
            statusDiv.style.display = 'block';
            document.getElementById('newsForm').reset();
        } else {
            throw new Error(result.error || "فشل النشر");
        }

    } catch (error) {
        statusDiv.textContent = "❌ خطأ في الاتصال: " + error.message;
        statusDiv.className = "status-msg status-error";
        statusDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "نشر الخبر الآن";
    }
});
