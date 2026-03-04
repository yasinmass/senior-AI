import re

def fix_moca_text():
    try:
        with open('MOCATest.jsx', 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()

        # Replace 'Next Section' with 'Order Section' and 'Next Trial' with 'Order Trial' 
        # as requested ("change the text of next to order")
        
        # 1. Next Section -> Order Section
        # 2. Next Trial -> Order Trial
        # 3. Next: Delayed Recall -> Order: Delayed Recall
        
        content = content.replace('>Next Section ', '>Order Section ')
        content = content.replace('>Next Trial ', '>Order Trial ')
        content = content.replace('>Next: Delayed Recall ', '>Order: Delayed Recall ')
        
        # Just in case there are other combinations
        # We search specifically for the button text patterns 
        
        with open('MOCATest.jsx', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("MOCATest.jsx text updated.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_moca_text()
