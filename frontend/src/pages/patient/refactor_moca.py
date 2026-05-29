import re

def refactor_moca_v3():
    path = r'c:\Users\rajna\OneDrive\Desktop\New folder\Dementia\demintia-screening-system\frontend\src\pages\patient\MOCATest.jsx'
    
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    # 1. Global Encoding Fixes
    replacements = {
        'â†’': '→',
        'â€”': '—',
        'â€“': '–',
        'âœ“': '✓',
        'âœ—': '✗',
        'â€¦': '...',
        'ðŸŽ™': '🎙️',
        'ðŸŽ¤': '🎤',
        'ðŸ“„': '📄',
        'â ±ï¸': '⏳',
        'â€': '"',
        'â€˜': '‘',
        'â€™': '’'
    }
    for old, new in replacements.items():
        content = content.replace(old, new)

    # 2. Refactor the instruction string format in VisuospatialSection (around line 67)
    # Target: 
    # <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>
    #    Connect the dots in the correct alternating order: <strong>1 → A → 2 → B → 3 → C → 4 → D → 5 → E</strong>
    # </p>
    
    old_para = r'<p style=\{\{ fontSize: 14, color: \'var\(--gray-500\)\', marginBottom: 16 \}\}>\s*Connect the dots in the correct alternating order: <strong>1 → A → 2 → B → 3 → C → 4 → D → 5 → E</strong>\s*</p>'
    
    new_format = """<p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 12 }}>
                    Connect the dots in the correct alternating order:
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                    {['1','A','2','B','3','C','4','D','5','E'].map((node, i, arr) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ 
                                background: 'var(--primary-pale)', color: 'var(--primary)', 
                                padding: '4px 10px', borderRadius: 6, fontWeight: 800, fontSize: 14 
                            }}>{node}</span>
                            {i < arr.length-1 && <span style={{ color: 'var(--gray-300)', fontWeight: 800 }}>→</span>}
                        </div>
                    ))}
                </div>"""

    content = re.sub(old_para, new_format, content)

    # 3. Fix the "Moving to order section" encoding checkmark if any left
    content = content.replace('âœ“ Pattern', '✓ Pattern')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("MOCATest.jsx refactored and cleaned.")

if __name__ == "__main__":
    refactor_moca_v3()
