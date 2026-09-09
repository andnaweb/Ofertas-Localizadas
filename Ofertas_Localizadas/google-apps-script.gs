/* ============================================================
   OFERTAS LOCALIZADAS — Google Apps Script
   ------------------------------------------------------------
   PASSO A PASSO (veja o README para detalhes):
   1. Crie uma planilha no Google Sheets e renomeie a primeira
      aba para "Produtos".
   2. Adicione os cabeçalhos na linha 1:
      Nome | Preco | Preco Original | Imagem | Link | Categoria |
      Badge | Avaliacao | Vendas
   3. Abra: Extensões > Apps Script, apague o conteúdo e cole
      este código.
   4. Clique em "Implantar" > "Nova implantação" >
      tipo: "Aplicativo da web".
   5. Em "Executar como" escolha "Eu" e em "Quem tem acesso"
      escolha "Qualquer pessoa".
   6. Copie a URL gerada (final .exec) e cole no arquivo
      js/config.js em apiUrl.
   ============================================================ */

var SHEET_NAME = "Produtos";
var MAX_PRODUCTS = 500;
var CACHE_KEY = "ofertas_localizadas_v1";
var CACHE_MINUTES = 5;

function doGet() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(CACHE_KEY);
    if (cached) return sendJson_(cached, true);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];

    if (!sheet) {
      return sendJson_({ ok: false, error: "Planilha nao encontrada." }, false);
    }

    var values = sheet.getDataRange().getDisplayValues();
    if (values.length < 2) {
      return sendJson_({ ok: true, count: 0, products: [] }, false);
    }

    var headers = values[0].map(function (h) {
      return String(h || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    });

    var products = [];
    var cap = Math.min(values.length - 1, MAX_PRODUCTS);

    for (var i = 1; i <= cap; i++) {
      var row = values[i];
      if (!row || !row[0] || String(row[0]).trim() === "") continue;

      var obj = {};
      headers.forEach(function (h, j) {
        obj[h] = row[j] !== undefined ? row[j] : "";
      });
      products.push(obj);
    }

    var payload = JSON.stringify({ ok: true, count: products.length, products: products });

    if (cache) cache.put(CACHE_KEY, payload, CACHE_MINUTES * 60);

    return sendJson_(payload, true);
  } catch (err) {
    return sendJson_({ ok: false, error: String(err) }, false);
  } finally {
    lock.releaseLock();
  }
}

function sendJson_(payload, alreadyJson) {
  var text = alreadyJson ? payload : JSON.stringify(payload);
  var output = ContentService.createTextOutput(text);
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}