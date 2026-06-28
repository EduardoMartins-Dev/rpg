#!/usr/bin/env bash
# Extrai o texto (limpo) do PDF em inglês — camada de texto OK, sem OCR — e fatia em
# partes de tamanho parecido (uploads curtos, evitam timeout do gateway na indexação
# síncrona). Exemplar legal do usuário; saída só no disco.
set -euo pipefail

PDF="${PDF:-/home/barbosa/portal-rpg/Vampire the Masquerade.pdf}"
OUT="${OUT:-/home/barbosa/portal-rpg/corpus-en}"
PARTS="${PARTS:-8}"

mkdir -p "$OUT"
raw="$(mktemp)"

# 1) extrai texto (reading order), sem form-feed
pdftotext -nopgbrk "$PDF" "$raw"

# 2) limpa + fatia em PARTS arquivos, cortando em fronteira de parágrafo (linha em branco)
python3 - "$raw" "$OUT" "$PARTS" <<'PY'
import re, sys
raw, out, parts = sys.argv[1], sys.argv[2], int(sys.argv[3])
text = open(raw, encoding="utf-8", errors="replace").read()

# tira linhas que são só número (nº de página) e junta hifenização de fim de linha
lines = [l for l in text.splitlines() if not re.fullmatch(r"\s*\d{1,4}\s*", l)]
text = "\n".join(lines)
text = re.sub(r"-\n(\w)", r"\1", text)          # exam-\nple -> example
text = re.sub(r"[ \t]+\n", "\n", text)
text = re.sub(r"\n{3,}", "\n\n", text)

paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
total = sum(len(p) for p in paras)
target = total / parts

buf, size, idx = [], 0, 1
def flush(buf, idx):
    open(f"{out}/v5-en-{idx:02d}.txt", "w", encoding="utf-8").write("\n\n".join(buf) + "\n")
    print(f"  v5-en-{idx:02d}.txt  {sum(len(x) for x in buf)} chars  {len(buf)} parágrafos")

for p in paras:
    buf.append(p); size += len(p)
    if size >= target and idx < parts:
        flush(buf, idx); idx += 1; buf, size = [], 0
if buf:
    flush(buf, idx)
print(f">> {total} chars em {idx} partes -> {out}")
PY

rm -f "$raw"
echo ">> pronto. Suba cada corpus-en/v5-en-NN.txt na aba de docs do sistema V5."
