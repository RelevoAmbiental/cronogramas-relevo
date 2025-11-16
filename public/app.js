// 🔧 URLs oficiais das suas Cloud Functions (Firebase 2ª geração)
const URL_EXTRair = "https://extrairtexto-zeq2hfaiea-uc.a.run.app";
const URL_INTERPRETAR = "https://processarproposta-zeq2hfaiea-uc.a.run.app";
const URL_CRONOGRAMA = "https://gerarcronograma-zeq2hfaiea-uc.a.run.app";

// 🔹 1. Extrair texto da proposta (PDF ou DOCX)
document.getElementById("btnExtrair").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) {
    alert("Selecione um arquivo para continuar.");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const res = await fetch(URL_EXTRair, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    document.getElementById("textoExtraido").value =
      data.texto || "Erro ao extrair texto.";
  } catch (err) {
    document.getElementById("textoExtraido").value =
      "Falha de conexão com o servidor.";
  }
});

// 🔹 2. Interpretar texto e gerar JSON da proposta
document.getElementById("btnInterpretar").addEventListener("click", async () => {
  const texto = document.getElementById("textoExtraido").value.trim();
  if (!texto) {
    alert("Extraia um texto primeiro.");
    return;
  }

  try {
    const res = await fetch(URL_INTERPRETAR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto })
    });

    const data = await res.json();
    document.getElementById("jsonInterpretado").value =
      JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("jsonInterpretado").value =
      "Erro ao interpretar a proposta.";
  }
});

// 🔹 3. Gerar cronograma estruturado
document.getElementById("btnCronograma").addEventListener("click", async () => {
  let estrutura;

  try {
    estrutura = JSON.parse(
      document.getElementById("jsonInterpretado").value.trim()
    );
  } catch (e) {
    alert("Estrutura JSON inválida. Corrija a formatação.");
    return;
  }

  try {
    const res = await fetch(URL_CRONOGRAMA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estrutura })
    });

    const data = await res.json();
    document.getElementById("cronogramaFinal").value =
      JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("cronogramaFinal").value =
      "Erro ao gerar cronograma.";
  }
});
