import math

def calculate_loan(amount, interest_rate, years):
    """حساب القروض والأقساط الشهرية لمحاكاة الخدمات المصرفية."""
    try:
        # نسبة الفائدة الشهرية
        monthly_rate = (interest_rate / 100) / 12
        months = years * 12
        if months <= 0:
            return {"error": "Duration must be greater than 0"}
        
        if monthly_rate == 0:
            monthly_payment = amount / months
        else:
            monthly_payment = (amount * monthly_rate) / (1 - (1 + monthly_rate)**(-months))
            
        total_repayment = monthly_payment * months
        total_interest = total_repayment - amount
        
        return {
            "monthly_payment": round(monthly_payment, 2),
            "total_repayment": round(total_repayment, 2),
            "total_interest": round(total_interest, 2)
        }
    except Exception as e:
        print(f"Loan calculation error: {e}")
        return None

def currency_converter(amount, from_curr, to_curr):
    """محاكي بسيط لأسعار صرف العملات (أسعار افتراضية للتدريب)."""
    rates = {
        "USD_IQD": 1500, # 1 دولار = 1500 دينار
        "IQD_USD": 1 / 1500,
        "EUR_IQD": 1650,
        "IQD_EUR": 1 / 1650
    }
    
    pair = f"{from_curr}_{to_curr}"
    if pair in rates:
        return round(amount * rates[pair], 2)
    return None

def simulate_savings(initial_balance, monthly_deposit, interest_rate, years):
    """محاكاة حساب توفير استثماري."""
    monthly_rate = (interest_rate / 100) / 12
    months = years * 12
    
    balance = initial_balance
    total_deposited = initial_balance
    
    for _ in range(months):
        interest = balance * monthly_rate
        balance += interest + monthly_deposit
        total_deposited += monthly_deposit
        
    return {
        "final_balance": round(balance, 2),
        "total_deposited": round(total_deposited, 2),
        "total_profit": round(balance - total_deposited, 2)
    }
