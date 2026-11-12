"""Create the optional source download without dependencies, build output or secrets."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[2]
target = root / 'dist' / 'lapenzer-social-lab-source.zip'
target.parent.mkdir(exist_ok=True)
ignored = {'node_modules', '.git', 'dist', 'build', '.venv', '.pytest_cache', '__pycache__', 'data'}
allowed = {'.ts', '.tsx', '.css', '.py', '.json', '.md', '.yaml', '.yml', '.html', '.txt'}
with ZipFile(target, 'w', compression=ZIP_DEFLATED) as archive:
    for path in sorted(root.rglob('*')):
        if not path.is_file():
            continue
        relative = path.relative_to(root)
        if any(part in ignored for part in relative.parts) or path.name.startswith('.env'):
            continue
        if path.suffix in allowed or path.name in {'Dockerfile', '.gitignore', '.dockerignore'}:
            archive.write(path, Path('lapenzer-social-network-laboratory') / relative)
print(f'Packaged {target.name} ({target.stat().st_size:,} bytes)')
