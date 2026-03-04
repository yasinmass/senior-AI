import re

def fix_moca_text_v2():
    try:
        with open('MOCATest.jsx', 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()

        # Update timings mentioned in text
        content = content.replace('then again in 5 minutes.', 'then again in 30 seconds.')
        content = content.replace('Start 5-min Timer', 'Start 30-second Order')
        
        # Replace 'Next' with 'Order' as per request
        # (Case insensitive or specific phrases)
        
        # Phrases already covered by first script:
        # >Order Section 
        # >Order Trial
        # >Order: Delayed Recall
        
        # Additional:
        content = content.replace('Moving to next section...', 'Moving to order section...')
        
        # Check for any other 'Next' used in UI
        # We can use regex for more accuracy if needed
        
        with open('MOCATest.jsx', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("MOCATest.jsx text fully updated.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_moca_text_v2()
