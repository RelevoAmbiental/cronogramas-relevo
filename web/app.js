const URL_EXTRAR = "https://extrairtexto-zeq2hfaiea-uc.a.run.app";
const URL_PROPOSTA = "https://processarproposta-zeq2hfaiea-uc.a.run.app";
const URL_CRONOGRAMA = "https://gerarcronograma-zeq2hfaiea-uc.a.run.app";

// -------------------------------
// Extrair texto
// -------------------------------
async function extrairTexto() {
  const fileInput = document.getElementById("fileExtrair");
  if (!fileInput.files.length) {
    alert("Selecione um arquivo");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  const resp = await fetch(URL_EXTRAR, {
    method: "POST",
    body: formData
  });

  const data = await resp.text();
  document.getElementById("resultadoExtrair").innerText = data;
}


// -------------------------------
// Processar Proposta
// -------------------------------
async function processarProposta() {
  const texto = document.getElementById("textoProposta").value;

  const resp = await fetch(URL_PROPOSTA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto })
  });

  const data = await resp.json();
  document.getElementById("resultadoProposta").innerText = JSON.stringify(data, null, 2);
}


// -------------------------------
// Gerar Cronograma
// -------------------------------
async function gerarCronograma() {
  const texto = document.getElementById("dadosCronograma").value;

  const resp = await fetch(URL_CRONOGRAMA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: texto
  });

  const data = await resp.json();
  document.getElementById("resultadoCronograma").innerText = JSON.stringify(data, null, 2);
}
