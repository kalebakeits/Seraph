#!/usr/bin/env python3
"""
Transforms component files to use buildStyles(theme) pattern:
1. Fixes `const { theme } = useTheme()` sitting inside destructured params
2. If StyleSheet.create references theme.*, converts to buildStyles(theme) pattern:
   - Renames `const styles = StyleSheet.create({...})` → `function buildStyles(theme: Theme) { return StyleSheet.create({...}); }`
   - Adds `const styles = useMemo(() => buildStyles(theme), [theme]);` inside the component body
   - Adds useMemo to imports if needed
   - Adds Theme type import if needed
"""

import re
import os
import sys

def fix_file(path: str) -> bool:
    with open(path, 'r', encoding='utf-8') as f:
        original = f.read()

    content = original

    # -------------------------------------------------------------------------
    # Step 1: Fix `const { theme } = useTheme()` inside destructured params.
    # Pattern: the arrow function has params like:
    #   ({ \n  const { theme } = useTheme();\n  param1,\n  param2,\n}) =>
    # We need to move it OUT of the params and into the function body.
    # -------------------------------------------------------------------------

    # Match: open paren of params, then the misplaced hook call, then the real params
    bad_hook_in_params = re.search(
        r'(\(\s*\{)\s*\n(\s*const \{ theme \} = useTheme\(\);\s*\n)(.*?)(\}\s*\)\s*=>)',
        content,
        re.DOTALL
    )

    if bad_hook_in_params:
        # Remove the hook line from params
        content = re.sub(
            r'(\(\s*\{)\s*\n(\s*const \{ theme \} = useTheme\(\);\s*\n)',
            r'\1\n',
            content,
            count=1
        )
        # Now find the opening brace of the function body and insert useTheme there
        # The function body starts after `) => {` or `) => (\n` (for JSX return)
        # We need to find the arrow function body opening
        # Look for `}) =>` followed by whitespace then `{` or `(`
        content = re.sub(
            r'(\}\s*\)\s*=>\s*\{)',
            r'\1\n  const { theme } = useTheme();',
            content,
            count=1
        )

    # -------------------------------------------------------------------------
    # Step 2: Check if StyleSheet.create references theme.*
    # If not, no transformation needed for the styles.
    # -------------------------------------------------------------------------

    # Find all StyleSheet.create blocks
    # Match: const styles = StyleSheet.create({...});
    # The block might be multiline, so we need to find balanced braces
    stylesheet_match = re.search(r'\nconst styles = StyleSheet\.create\(', content)
    if not stylesheet_match:
        if content != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False

    # Check if the StyleSheet.create block references theme.*
    # Find the block by tracking brace depth
    start_idx = stylesheet_match.start() + 1  # skip the leading \n
    paren_start = content.index('StyleSheet.create(', start_idx)

    # Find matching closing paren
    depth = 0
    i = paren_start + len('StyleSheet.create(')
    while i < len(content):
        if content[i] == '(':
            depth += 1
        elif content[i] == ')':
            if depth == 0:
                break
            depth -= 1
        i += 1

    stylesheet_block = content[paren_start:i+2]  # includes closing ");"

    if 'theme.' not in stylesheet_block:
        # No theme references — leave StyleSheet.create at module level
        if content != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False

    # -------------------------------------------------------------------------
    # Step 3: Has theme.* in StyleSheet — apply buildStyles pattern
    # -------------------------------------------------------------------------

    # Extract the full `const styles = StyleSheet.create({...});` declaration
    full_match = re.search(r'\nconst styles = StyleSheet\.create\(', content)
    block_start = full_match.start()

    # Find the end of the StyleSheet.create(...);
    paren_start2 = content.index('StyleSheet.create(', block_start)
    depth = 0
    i = paren_start2 + len('StyleSheet.create(')
    while i < len(content):
        if content[i] == '(':
            depth += 1
        elif content[i] == ')':
            if depth == 0:
                break
            depth -= 1
        i += 1
    # i is at closing paren, expect `;` after
    end_idx = i + 1
    if end_idx < len(content) and content[end_idx] == ';':
        end_idx += 1

    old_styles_decl = content[block_start:end_idx]
    inner = content[paren_start2 + len('StyleSheet.create('):i]  # the ({...})

    new_function = f'\nfunction buildStyles(theme: Theme) {{\n  return StyleSheet.create({inner});\n}}'
    content = content[:block_start] + new_function + content[end_idx:]

    # -------------------------------------------------------------------------
    # Step 4: Add `const styles = useMemo(() => buildStyles(theme), [theme]);`
    # inside the component body, after `const { theme } = useTheme();`
    # -------------------------------------------------------------------------

    content = re.sub(
        r'(const \{ theme \} = useTheme\(\);)',
        r'\1\n  const styles = useMemo(() => buildStyles(theme), [theme]);',
        content,
        count=1
    )

    # -------------------------------------------------------------------------
    # Step 5: Add useMemo to React import if not already there
    # -------------------------------------------------------------------------

    if 'useMemo' not in content:
        # Add useMemo to the React import
        content = re.sub(
            r"import React(,\s*\{([^}]*)\})? from 'react';",
            lambda m: (
                f"import React, {{{m.group(2)}, useMemo}} from 'react';"
                if m.group(2) and 'useMemo' not in m.group(2)
                else f"import React, {{ useMemo }} from 'react';"
                if not m.group(2)
                else m.group(0)
            ),
            content,
            count=1
        )

    # -------------------------------------------------------------------------
    # Step 6: Add Theme type import if not already there
    # -------------------------------------------------------------------------

    if 'Theme' not in content or 'type Theme' not in content and "import { theme }" not in content:
        # Check if theme is imported from theme module
        theme_import_match = re.search(r"import \{ useTheme \} from '([^']*theme[^']*)'", content)
        if theme_import_match:
            theme_path = theme_import_match.group(1)
            # Check if Theme type is already imported
            if 'Theme' not in re.search(r"from '" + re.escape(theme_path) + "'", content).group(0) if re.search(r"import[^;]+from '" + re.escape(theme_path) + "'", content) else '':
                # Add Theme to the import
                content = re.sub(
                    r"(import \{ )useTheme( \} from '" + re.escape(theme_path) + "')",
                    r"\1useTheme, type Theme\2",
                    content,
                    count=1
                )
                # If Theme already in import, don't duplicate
                content = re.sub(
                    r"import \{ useTheme, type Theme, type Theme \}",
                    r"import { useTheme, type Theme }",
                    content
                )

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


def main():
    src_dir = '/Users/kaleba/Projects/Seraph/Seraph.App/src'
    files = []
    for root, dirs, filenames in os.walk(src_dir):
        for fn in filenames:
            if fn.endswith('.tsx'):
                files.append(os.path.join(root, fn))

    changed = 0
    skipped = 0
    for path in sorted(files):
        try:
            if fix_file(path):
                print(f'CHANGED: {path}')
                changed += 1
            else:
                skipped += 1
        except Exception as e:
            print(f'ERROR: {path}: {e}')

    print(f'\nDone. {changed} changed, {skipped} unchanged.')


if __name__ == '__main__':
    main()
