#!/usr/bin/env python3
"""
VIEWPOINT Background Real-Time Auto-Sync Daemon
Watches the workspace for file changes and automatically commits & pushes
to https://github.com/jagdishsakle29-creator/VIEWPOINT in real time.
"""

import os
import sys
import time
import subprocess
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
IGNORE_DIRS = {'.git', '__pycache__', 'node_modules', '.gemini', 'backups', 'data'}
IGNORE_FILES = {'dev_state.json', '.DS_Store'}

def get_dir_snapshot(dir_path):
    """Returns a dict mapping file path to its last modified timestamp."""
    snapshot = {}
    for root, dirs, files in os.walk(dir_path):
        # Filter ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for f in files:
            if f in IGNORE_FILES or f.endswith('.log') or f.endswith('.tmp'):
                continue
            fpath = os.path.join(root, f)
            try:
                snapshot[fpath] = os.path.getmtime(fpath)
            except OSError:
                pass
    return snapshot

def run_sync(commit_msg=None):
    """Executes the sync_github.sh script or git commands."""
    try:
        if not commit_msg:
            commit_msg = f"Auto-sync: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        script_path = os.path.join(ROOT_DIR, 'sync_github.sh')
        if os.path.exists(script_path):
            res = subprocess.run(['bash', script_path, commit_msg], cwd=ROOT_DIR, capture_output=True, text=True)
            print(res.stdout)
            if res.returncode != 0:
                print(f"[AutoSync Error]: {res.stderr}")
        else:
            subprocess.run(['git', 'add', '-A'], cwd=ROOT_DIR)
            subprocess.run(['git', 'commit', '-m', commit_msg], cwd=ROOT_DIR)
            subprocess.run(['git', 'push', 'origin', 'main'], cwd=ROOT_DIR)
    except Exception as e:
        print(f"[AutoSync Exception]: {e}")

def main():
    print(f"👀 [VIEWPOINT AutoSync] Watching {ROOT_DIR} for changes...")
    print("🚀 Any local edits will be automatically committed and pushed to:")
    print("   https://github.com/jagdishsakle29-creator/VIEWPOINT\n")

    last_snapshot = get_dir_snapshot(ROOT_DIR)

    while True:
        try:
            time.sleep(3)
            current_snapshot = get_dir_snapshot(ROOT_DIR)

            changed_files = []
            for fpath, mtime in current_snapshot.items():
                if fpath not in last_snapshot or last_snapshot[fpath] != mtime:
                    rel = os.path.relpath(fpath, ROOT_DIR)
                    changed_files.append(rel)

            deleted_files = [os.path.relpath(f, ROOT_DIR) for f in last_snapshot if f not in current_snapshot]

            if changed_files or deleted_files:
                sample = (changed_files + deleted_files)[:3]
                summary = ", ".join(sample)
                if len(changed_files) + len(deleted_files) > 3:
                    summary += f" and {len(changed_files) + len(deleted_files) - 3} more"

                print(f"⚡ [Change Detected] {summary}. Waiting for changes to settle...")
                time.sleep(2) # Debounce

                print(f"📦 [Auto-Syncing to GitHub VIEWPOINT]...")
                run_sync(f"Auto-sync: updated {summary} ({datetime.now().strftime('%H:%M:%S')})")
                last_snapshot = get_dir_snapshot(ROOT_DIR)

        except KeyboardInterrupt:
            print("\n👋 Auto-sync stopped.")
            break
        except Exception as e:
            print(f"[Watcher Error]: {e}")
            time.sleep(5)

if __name__ == '__main__':
    main()
