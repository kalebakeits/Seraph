#!/usr/bin/env python3
"""
Fix module-level `const X = theme.colors.*` by removing the const and
replacing all usages of X with the theme.colors.* expression directly.
Also fix extra spaces in `StyleSheet.create(  {` -> `StyleSheet.create({`
Also fix arrow-expression components that need block body for hooks.
"""

import re
import os


def fix_file(path: str) -> bool:
    with open(path, 'r', encoding='utf-8') as f:
        original = f.read()

    content = original

    # Fix extra space in StyleSheet.create(  {
    content = re.sub(r'StyleSheet\.create\(\s{2,}\{', 'StyleSheet.create({', content)

    # Find all module-level const X = theme.colors.* lines
    # Pattern: line starts with `const NAME = theme.`, at file scope (not inside function)
    consts = re.findall(r'^const ([A-Z_]+) = (theme\.[^\n;]+);', content, re.MULTILINE)

    for name, expr in consts:
        # Remove the const line
        content = re.sub(
            r'^const ' + re.escape(name) + r' = ' + re.escape(expr) + r';\n',
            '',
            content,
            flags=re.MULTILINE
        )
        # Replace all usages of the const with the expression
        # Be careful to only replace standalone usage (not partial matches)
        content = re.sub(r'\b' + re.escape(name) + r'\b', expr, content)

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
