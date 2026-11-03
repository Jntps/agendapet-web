import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import mime from 'mime-types';

const raiz = resolve(fileURLToPath(new URL('../', import.meta.url)));
const porta = Number(process.env.PORT || 4173);

const servidor = createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end('Método não permitido');
    return;
  }

  let caminho;

  try {
    const url = new URL(req.url, 'http://localhost');
    const rota = decodeURIComponent(
      url.pathname === '/' ? '/index.html' : url.pathname
    );

    if (rota.includes('\0')) {
      throw new Error('Caminho inválido.');
    }

    caminho = resolve(raiz, `.${rota}`);

    if (caminho !== raiz && !caminho.startsWith(`${raiz}${sep}`)) {
      throw new Error('Acesso negado.');
    }
  } catch {
    res.writeHead(400);
    res.end('Solicitação inválida');
    return;
  }

  try {
    const conteudo = await readFile(caminho);

    res.writeHead(200, {
      'Content-Type': mime.lookup(caminho) || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });

    res.end(req.method === 'HEAD' ? undefined : conteudo);
  } catch (erro) {
    res.writeHead(
      erro.code === 'ENOENT' || erro.code === 'EISDIR' ? 404 : 500
    );
    res.end('Arquivo não encontrado');
  }
});

servidor.listen(porta, '127.0.0.1', () => {
  console.log(`🐾 AgendaPet pronto em http://localhost:${porta}`);
  console.log('Pressione Ctrl+C para encerrar.');
});