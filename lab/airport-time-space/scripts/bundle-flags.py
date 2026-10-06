"""Bundle the checked-in FlagCDN SVGs for authenticated/offline image rendering."""
import base64,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
flags={file.stem.upper():'data:image/svg+xml;base64,'+base64.b64encode(file.read_bytes()).decode() for file in sorted((root/'dist/flags').glob('*.svg'))}
(root/'dist/flag-assets.js').write_text('// Bundled FlagCDN SVGs. No separate image requests are needed.\nexport const flagAssets='+json.dumps(flags,separators=(',',':'))+';\n')
print(f'Bundled {len(flags)} flags')
