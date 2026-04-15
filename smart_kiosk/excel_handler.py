import os
import pandas as pd

DATA_DIR = "data"
RESULTS_FILE = os.path.join(DATA_DIR, "results.xlsx")
SCHEDULES_FILE = os.path.join(DATA_DIR, "schedules.xlsx")

def init_excel_files():
    """Create default Excel files if they don't exist."""
    os.makedirs(DATA_DIR, exist_ok=True)
    
    if not os.path.exists(RESULTS_FILE):
        df_res = pd.DataFrame(columns=["student_id", "name", "subject", "grade", "semester"])
        df_res.to_excel(RESULTS_FILE, index=False)
        
    if not os.path.exists(SCHEDULES_FILE):
        df_sch = pd.DataFrame(columns=["department", "day", "time", "subject", "instructor", "room"])
        df_sch.to_excel(SCHEDULES_FILE, index=False)

def get_student_results(student_id):
    """Fetch results for a specific student_id from Excel."""
    try:
        df = pd.read_excel(RESULTS_FILE)
        # Ensure student_id is treated as a string for robust matching
        df['student_id'] = df['student_id'].astype(str)
        student_id_str = str(student_id).strip()
        
        results = df[df['student_id'] == student_id_str]
        
        if results.empty:
            return None
            
        student_name = results.iloc[0]['name'] if 'name' in results.columns else "الطالب"
        
        records = []
        for _, row in results.iterrows():
            records.append(f"- مادة {row['subject']}: {row['grade']} ({row['semester']})")
            
        return {
            "name": student_name,
            "records": "\n".join(records)
        }
    except Exception as e:
        print(f"Error reading results: {e}")
        return None

def get_department_schedule(department):
    """Fetch schedule for a specific department from Excel."""
    try:
        df = pd.read_excel(SCHEDULES_FILE)
        # Simple text matching (case insensitive, partial match)
        results = df[df['department'].astype(str).str.contains(str(department), case=False, na=False)]
        
        if results.empty:
            return None
            
        records = []
        for _, row in results.iterrows():
            records.append(f"- {row['day']} الساعة {row['time']}: {row['subject']} ({row['instructor']}) في قاعة {row['room']}")
            
        return "\n".join(records)
    except Exception as e:
        print(f"Error reading schedules: {e}")
        return None
