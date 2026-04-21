#!/usr/bin/env python3
"""
Pass 2: Fix issues left by fix_styles.py
1. Add useMemo to React import where buildStyles is used but useMemo isn't imported
2. Fix indentation of StyleSheet.create contents inside buildStyles function
"""

import re
import os


def fix_react_import(content: str) -> str:
    """Ensure useMemo is in the React import if buildStyles is used."""
    if 'useMemo' not in content:
        return content

    # Check if useMemo is already imported
    if re.search(r'import.*useMemo.*from .react.', content):
        return content

    # import React from 'react';  →  import React, { useMemo } from 'react';
    content = re.sub(
        r"^import React from 'react';",
        "import React, { useMemo } from 'react';",
        content,
        count=1,
        flags=re.MULTILINE
    )
    # import React, { Foo } from 'react';  →  import React, { Foo, useMemo } from 'react';
    content = re.sub(
        r"^(import React, \{)([^}]+)(\} from 'react';)",
        lambda m: f"{m.group(1)}{m.group(2).rstrip()}, useMemo{m.group(3)}"
        if 'useMemo' not in m.group(2) else m.group(0),
        content,
        count=1,
        flags=re.MULTILINE
    )
    return content


def fix_buildstyles_indentation(content: str) -> str:
    """
    Fix the indentation inside buildStyles function.
    The generated code looks like:
        function buildStyles(theme: Theme) {
          return StyleSheet.create({
          key: {    ← wrong, should be 2 more spaces
            ...
          },
        });
        }

    We want:
        function buildStyles(theme: Theme) {
          return StyleSheet.create({
            key: {
              ...
            },
          });
        }
    """
    # Find the buildStyles function block
    match = re.search(r'\nfunction buildStyles\(theme: Theme\) \{\n  return StyleSheet\.create\((\{.*?\})\);\n\}', content, re.DOTALL)
    if not match:
        return content

    # Get the inner content of StyleSheet.create({...})
    full_fn = match.group(0)
    inner = match.group(1)  # the { ... } block

    # Re-indent inner: add 2 spaces to each line
    inner_lines = inner.split('\n')
    reindented = []
    for line in inner_lines:
        if line.strip():
            reindented.append('  ' + line)
        else:
            reindented.append(line)
    new_inner = '\n'.join(reindented)

    new_fn = f'\nfunction buildStyles(theme: Theme) {{\n  return StyleSheet.create({new_inner});\n}}'
    content = content[:match.start()] + new_fn + content[match.end():]
    return content


def fix_file(path: str) -> bool:
    with open(path, 'r', encoding='utf-8') as f:
        original = f.read()

    content = original
    content = fix_react_import(content)
    content = fix_buildstyles_indentation(content)

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


def main():
    src_dir = '/Users/kaleba/Projects/Seraph/Seraph.App/src'
    changed = 0
    for root, dirs, filenames in os.walk(src_dir):
        for fn in sorted(filenames):
            if fn.endswith('.tsx'):
                path = os.path.join(root, fn)
                try:
                    if fix_file(path):
                        print(f'FIXED: {path}')
                        changed += 1
                except Exception as e:
                    print(f'ERROR: {path}: {e}')
    print(f'\nDone. {changed} files fixed.')


if __name__ == '__main__':
    main()
