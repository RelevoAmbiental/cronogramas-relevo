const Busboy = require("busboy");
const pdf = require("pdf-parse");
const { parseDocx } = require("docx-parser");

// =======================================================
// Lê PDF ou DOCX do upload e retorna texto bruto
// =======================================================
exports.extrairArquivo = (req) =>
  new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    let fileBuffer = Buffer.from([]);

    busboy.on("file", (fieldname, file, filename) => {
      file.on("data", (data) => {
        fileBuffer = Buffer.concat([fileBuffer, data]);
      });

      file.on("end", async () => {
        try {
          let texto = "";

          if (filename.endsWith(".pdf")) {
            const data = await pdf(fileBuffer);
            texto = data.text;
          } else if (filename.endsWith(".docx")) {
            texto = await parseDocx(fileBuffer);
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
