import re

def refactor_moca_v4():
    path = r'c:\Users\rajna\OneDrive\Desktop\New folder\Dementia\demintia-screening-system\frontend\src\pages\patient\MOCATest.jsx'
    
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    # 1. Broad replacements for common encoding errors
    replacements = {
        'â†’': '→',
        'â† ': '←',
        'â€”': '—',
        'â€“': '–',
        'âœ“': '✓',
        'âœ—': '✗',
        'â€¦': '...',
        'ðŸŽ™': '🎙️',
        'ðŸŽ¤': '🎤',
        'ðŸ“„': '📄',
        'â ±ï¸ ': '⏳ ',
        'â€': '"',
        'â€˜': '‘',
        'â€™': '’',
        'ðŸ”´': '🔴',
        'âš ï¸': '⚠',
        'âœ…': '✅'
    }
    for old, new in replacements.items():
        content = content.replace(old, new)

    # Clean up any partial strings
    content = content.replace('â ±ï¸', '⏳')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("MOCATest.jsx encoding fixed completely.")

if __name__ == "__main__":
    refactor_moca_v4()
