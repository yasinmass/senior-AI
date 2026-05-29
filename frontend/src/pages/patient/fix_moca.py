import re

def fix_moca_content():
    try:
        with open('MOCATest.jsx', 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()

        # Fix the corrupted line 139 (or around there) in NamingSection
        # The goal is to replace the garbled expression with clean JSX.
        
        # We look for the pattern of the naming section results and replace it.
        # We use a non-raw string or better escape handling for the replacement.
        
        # This part targets line 139:
        # {score === 3 ? 'âœ“ Correct!' : score > 0 ? '~ Partially correct' : 'âœ— Incorrect'} â€” Answer: <em>{animal.answer}</em>
        # The previous attempt with re.sub(r'(\{score === 3 \? \').*?(<em>\{animal\.answer\}</em>)[^\n]*', ...)
        # had some issues with the replacement string.

        def replacement(match):
            return "{score === 3 ? 'Correct!' : score > 0 ? '~ Partially correct' : 'Incorrect'} - Answer: <em>{animal.answer}</em>"

        # Refined regex to find the problematic line and replace it
        new_content = re.sub(
            r"\{score === 3 \? '.*?Incorrect'\} .*? <em>\{animal\.answer\}</em>[^\n]*",
            replacement,
            content
        )

        # Another attempt just in case the garbled characters changed the regex match
        if new_content == content:
            new_content = re.sub(
                r"\{score === 3 \? '.*?\}.*?<em>\{animal\.answer\}</em>[^\n]*",
                replacement,
                content
            )

        with open('MOCATest.jsx', 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print("MOCATest.jsx has been processed.")
        
        # Check if the replacement worked
        if new_content != content:
            print("Substitution performed successfully.")
        else:
            print("No changes made. Pattern not found.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_moca_content()
