const Busboy = require("busboy");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");

// =======================================================
// Lê PDF ou DOCX do upload e retorna texto bruto
// =======================================================
exports.extrairArquivo = (req) =>
  new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    let fileBuffer = Buffer.from([]);
    let fileName = "";

    busboy.on("file", (fieldname, file, info) => {
      fileName = info.filename;

      file.on("data", (data) => {
        fileBuffer = Buffer.concat([fileBuffer, data]);
      });

      file.on("end", async () => {
        try {
          let texto = "";

          // PDF
          if (fileName.endsWith(".pdf")) {
            const data = await pdf(fileBuffer);
            texto = data.text;

          // DOCX
          } else if (fileName.endsWith(".docx")) {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            texto = result.value;

          } else {
            reject("Formato não suportado");
          }

          resolve(texto);
        } catch (err) {
          reject(err);
        }
      });
    });

    busboy.on("finish", () => {});

    req.pipe(busboy);
  });
