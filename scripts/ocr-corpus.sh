#!/usr/bin/env bash
# OCR do exemplar local -> corpus por capítulo para alimentar o RAG.
# Exemplar legal do usuário; saída fica só no disco (não vai pra lugar nenhum).
#
# Etapas:
#   1) pdftoppm  : renderiza cada página do PDF em PNG 300dpi (paralelo)
#   2) tesseract : OCR por página (-l por)
#   3) split     : concatena faixas de páginas em arquivos por capítulo (sumário)
#   4) clean     : junta hifenização de fim de linha, tira nº de página, normaliza
#
# Uso:
#   scripts/ocr-corpus.sh render    # 1+2 (demorado, ~15-40min, 8 cores)
#   scripts/ocr-corpus.sh split     # 3+4 (rápido; rerode à vontade ajustando OFFSET)
#   scripts/ocr-corpus.sh calib N   # mostra OCR da página impressa N (acha o OFFSET)
#   scripts/ocr-corpus.sh all       # render depois split
set -euo pipefail

PDF="${PDF:-/home/barbosa/portal-rpg/vampiro-a-mascara-manual-basico-5a-edicao.pdf}"
WORK="${WORK:-/home/barbosa/portal-rpg/.ocr-work}"   # imagens + texto por página (gitignore)
OUT="${OUT:-/home/barbosa/portal-rpg/corpus}"         # .txt finais por capítulo
DPI="${DPI:-220}"
TLANG="${LANG_TESS:-por}"   # idioma do tesseract (NÃO sombrear $LANG do shell)
# Deslocamento: PDF_page = printed_page + OFFSET. Calibrar com `calib`.
OFFSET="${OFFSET:-2}"

IMG="$WORK/img"
TXT="$WORK/txt"

# Capítulos: "ARQUIVO|Título|primeira_pag_impressa|ultima_pag_impressa"
# Faixas derivadas do sumário (última = início do próximo - 1).
CHAPTERS=(
  "01-conceitos|Conceitos|33|46"
  "02-sociedade-dos-membros|A Sociedade dos Membros|47|62"
  "03-clas|Clãs|63|114"
  "04-regras|Regras|115|132"
  "05-personagens|Personagens|133|134"
  "06-criacao-de-personagens|Criação de Personagens|135|154"
  "07-caracteristicas-principais|Características Principais|155|171"
  "08-crencas|Crenças|172|174"
  "09-tipos-de-predador|Tipos de Predador|175|178"
  "10-vantagens|Vantagens|179|194"
  "11-criacao-de-coterie|Criação de Coterie|195|200"
  "12-vampiros|Vampiros|201|213"
  "13-o-sangue|O Sangue|214|224"
  "14-voce-e-o-que-voce-come|Você é o Que Você Come|225|232"
  "15-estados-de-condenacao|Estados de Condenação|233|235"
  "16-humanidade|Humanidade|236|242"
  "17-disciplinas|Disciplinas|243|288"
  "18-sistemas-avancados|Sistemas Avançados|289|316"
  "19-cidades|Cidades|317|336"
  "20-cronicas|Crônicas|337|368"
  "21-ferramentas-antagonistas|Ferramentas / Antagonistas|369|377"
  "22-itens|Itens|378|381"
  "23-fichas-de-conhecimento|Fichas de Conhecimento|382|406"
)

last_pdf_page() { pdfinfo "$PDF" | awk '/^Pages:/{print $2}'; }

cmd_render() {
  mkdir -p "$IMG" "$TXT"
  local total; total=$(last_pdf_page)
  echo ">> render+OCR ${DPI}dpi, $total páginas, $(nproc) workers (restartável) ..."
  # Cada worker: 1 página -> render PNG -> OCR -> remove PNG. Pula página já OCR'd.
  seq 1 "$total" | \
    xargs -P "$(nproc)" -I{} bash -c '
      pp="$1"; b=$(printf "p-%04d" "$pp")
      txt="'"$TXT"'/$b.txt"; png="'"$IMG"'/$b.png"
      [ -s "$txt" ] && exit 0                          # já feito
      pdftoppm -png -r '"$DPI"' -f "$pp" -l "$pp" "'"$PDF"'" "'"$IMG"'/$b-r" >/dev/null 2>&1
      src=$(ls "'"$IMG"'/$b-r"*.png 2>/dev/null | head -1)
      [ -z "$src" ] && { echo "  FAIL render $b"; exit 0; }
      tesseract "$src" "'"$TXT"'/$b" -l '"$TLANG"' --psm 3 >/dev/null 2>&1
      rm -f "$src"                                     # libera disco
      echo "  ok $b"
    ' _ {}
  echo ">> OCR completo: $(ls "$TXT"/*.txt 2>/dev/null | wc -l)/$total páginas em $TXT"
}

# nome do arquivo de texto p/ índice de página do PDF (1-based); zero-pad fixo de 4
page_txt() {
  printf "%s/p-%04d.txt" "$TXT" "$1"
}

cmd_calib() {
  local printed="${1:?uso: calib <pagina_impressa>}"
  local pdfpage=$(( printed + OFFSET ))
  local f; f=$(page_txt "$pdfpage")
  echo "página impressa $printed -> PDF $pdfpage (OFFSET=$OFFSET) -> $f"
  echo "----------------------------------------"
  sed -n '1,25p' "$f" 2>/dev/null || echo "(sem OCR; rode render antes)"
  echo "----------------------------------------"
  echo "Confere se o conteúdo bate. Se não, ajuste OFFSET=N e rode de novo."
}

# limpa texto OCR de um capítulo, lendo do stdin
clean() {
  # 1) tira linhas que são só número (nº de página)
  # 2) junta palavra hifenizada quebrada no fim da linha:  exem-\nplo -> exemplo
  # 3) colapsa espaços; mantém parágrafos (linhas em branco) p/ o chunker do backend
  awk '
    /^[[:space:]]*[0-9]{1,4}[[:space:]]*$/ { next }   # linha só com número
    { print }
  ' | \
  perl -0777 -pe 's/-\n([a-záàâãéêíóôõúç])/$1/g' | \
  perl -0777 -pe 's/[ \t]+\n/\n/g; s/\n{3,}/\n\n/g'
}

cmd_split() {
  mkdir -p "$OUT"
  if ! ls "$TXT"/p-*.txt >/dev/null 2>&1; then
    echo "!! sem OCR em $TXT — rode: $0 render" >&2; exit 1
  fi
  echo ">> montando capítulos (OFFSET=$OFFSET) em $OUT ..."
  for spec in "${CHAPTERS[@]}"; do
    IFS='|' read -r name title p0 p1 <<<"$spec"
    local out="$OUT/$name.txt"
    {
      echo "# $title"
      echo
      for ((pp=p0; pp<=p1; pp++)); do
        f=$(page_txt $(( pp + OFFSET )))
        [[ -f "$f" ]] && cat "$f"
        echo            # separador de página -> vira fronteira de parágrafo
      done
    } | clean > "$out"
    printf "  %-34s p%s-%s  %6s chars\n" "$name.txt" "$p0" "$p1" "$(wc -c <"$out")"
  done
  echo ">> pronto. Revise $OUT, depois suba cada .txt na aba de docs do sistema."
}

case "${1:-}" in
  render) cmd_render ;;
  split)  cmd_split ;;
  calib)  cmd_calib "${2:-}" ;;
  all)    cmd_render; cmd_split ;;
  *) echo "uso: $0 {render|split|calib N|all}"; exit 2 ;;
esac
