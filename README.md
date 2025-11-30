# 🟢 Relevo • Assistente IA de Cronogramas

Aplicação web integrada ao Firebase Functions que automatiza o fluxo de:
1. **Extração de texto (PDF / DOCX)**
2. **Interpretação de propostas técnicas via IA**
3. **Geração automatizada de cronogramas estruturados**

Este projeto unifica interface web, backend em Cloud Functions e identidade visual Relevo.

---

## 🚀 Tecnologias Utilizadas

### **Frontend (pasta /public)**
- HTML5 + CSS3 (padrão visual Relevo)
- JavaScript Vanilla (`app.js`)
- Google Fonts (Montserrat)
- Hospedagem futura via GitHub Pages (opcional)

### **Backend (pasta /functions)**
- Node.js 20 (Cloud Functions 2nd gen)
- Firebase Functions
- Firebase Admin SDK
- OpenAI API
- pdf-parse
- Mammoth (DOCX → texto)
- Busboy (upload)

---

## 📦 Estrutura do Repositório

## ♻️ Como aplicar as mudanças propostas
1. **Atualize o código**: rode `git pull` (ou faça o merge/rebase do PR) para baixar todos os commits.
2. **Reinstale dependências**: execute `npm ci` na raiz do projeto para garantir versões limpas e alinhadas com o `package-lock`.
3. **Verifique a build**: rode `npm run build` para confirmar que o bundler transpila sem erros antes de publicar.
4. **Recarregue o app**: reinicie o servidor de desenvolvimento (`npm run dev`) ou faça o deploy conforme seu fluxo para que o frontend carregue o bundle atualizado.
5. **Limpe caches se preciso**: se o navegador continuar exibindo erros antigos, abra em aba anônima ou limpe o cache para baixar o novo bundle.

