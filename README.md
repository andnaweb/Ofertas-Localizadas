# Ofertas Localizadas — Site de Achadinhos

Loja de ofertas para divulgar no **Instagram**. O site mostra seus produtos e, ao clicar no botão, o cliente é direcionado para a **loja oficial** (seu link de afiliado).

- Os produtos são cadastrados numa **planilha do Google** (sem mexer em código)
- Publicação gratuita em Vercel, Netlify ou GitHub Pages
- Já vem com produtos de demonstração para você ver como fica

---

## 1. Criar a planilha de produtos

1. Acesse [sheets.new](https://sheets.new) e crie uma planilha.
2. Renomeie a primeira aba para **Produtos**.
3. Copie os cabeçalhos abaixo e cole na **linha 1**:

| Nome | Preco | Preco Original | Imagem | Link | Categoria | Badge | Avaliacao | Vendas |
|------|-------|----------------|--------|------|-----------|-------|-----------|--------|
| Fone Bluetooth | 49,90 | 149,90 | https://site.com/foto.jpg | https://shope.ee/SEU-LINK | Eletrônicos | Top 1 | 4.9 | 12.5 |

**Regras das colunas:**
- **Nome** — obrigatório. Nome do produto.
- **Preco** — preço promocional (ex.: `49,90` ou `49.90`).
- **Preco Original** — preço antigo, usado para calcular o desconto (opcional).
- **Imagem** — endereço (URL) da foto do produto. No app da Shopee, toque na foto e em "copiar endereço da imagem"; ou use o link da imagem no navegador.
- **Link** — seu **link de afiliado** da Shopee (obrigatório; sem ele o produto fica sem botão ativo).
- **Categoria** — ex.: Eletrônicos, Casa, Moda, Beleza, Pets. Criará os filtros automaticamente.
- **Badge** — etiqueta de destaque (ex.: `Top 1`, `Mais Vendido`). Vazio = sem etiqueta.
- **Avaliacao** — nota do produto, ex.: `4.9` (opcional).
- **Vendas** — vendas em milhares, ex.: `12.5` = 12,5 mil vendas (opcional).

> Coloque uma imagem **obrigatoriamente sem aspas** na coluna Imagem e um link que **comece com** `https://`.

Adicione um produto por linha. Ao salvar, o site já atualiza (leva alguns minutos por causa do cache).

## 2. Conectar o site à planilha (Google Apps Script)

1. Na planilha, abra **Extensões → Apps Script**.
2. Apague o conteúdo e cole todo o código do arquivo [`google-apps-script.gs`](google-apps-script.gs). Dê um nome ao projeto (ex.: "Ofertas Localizadas").
3. Clique em **Implantar → Nova implantação**.
4. Ao lado do ícone de engrenagem, selecione o tipo **Aplicativo da web**.
5. Em **Executar como** escolha **`Eu`**. Em **Quem tem acesso** escolha **`Qualquer pessoa`**.
6. Clique em **Implantar** e aceite as permissões (escolha a mesma conta da planilha).
7. Copie a **URL do aplicativo da web** (termina com `/exec`).
8. Abra o arquivo [`js/config.js`](js/config.js) e cole essa URL entre aspas em `apiUrl: ""`, ficando por exemplo:

```js
apiUrl: "https://script.google.com/macros/s/AKfycxxxxxxxx/exec",
```

9. Também em `js/config.js`, substitua `sua_conta` em `instagram` pelo seu usuário do Instagram.

Pronto: abrir o `index.html` já exibirá **seus produtos**.

> **Dica:** sempre que editar a planilha, o site reflete a mudança em poucos minutos (cache de 5 minutos). Não precisa republicar nada.

## 3. Usar a loja do Instagram para gerar os links

Na Shopee, o link de afiliado é criado **entre no produto → Compartilhar → Copiar link** dentro do seu painel de afiliados (Shopee Acompanhantes / "Shopeepartener"). Cole esse link na coluna **Link** da planilha. Em apps, ative "compartilhar pela web" se aparecer só a opção de mensagem.

## 4. Publicar o site (hospedagem gratuita)

### Opção A — Vercel (recomendada, mais rápida)
1. Crie um repositório no GitHub e envie os arquivos do site.
2. Entre no [vercel.com](https://vercel.com) com a conta do GitHub.
3. **Add New → Project**, selecione o repositório e clique em **Deploy**.
4. O Vercel gera um link como `https://seu-projeto.vercel.app`. Use esse link na bio do Instagram.

### Opção B — Netlify
1. Entre no [netlify.com](https://netlify.com) → **Add new site → Import an existing project**.
2. Conecte o repositório do GitHub (ou arraste a pasta do site em "Deploys").
3. O link gerado termina com `.netlify.app`.

### Opção C — GitHub Pages
1. Suba os arquivos para um repositório no GitHub.
2. **Settings → Pages** → em "Branch" escolha `main` e pasta `/ (root)` → Save.
3. Após alguns minutos seu site estará em `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`.

### Importante antes de divulgar
- O link gerado por Vercel/Netlify terá nome aleatório. Você pode configurar um **domínio próprio** ou manter o gratuito.
- Teste no celular: os clientes do Instagram vão abrir no aparelho.

## 5. Cadastrar produtos no dia a dia

1. Abra a planilha. 2. Edite/adicione linhas. 3. Salve. O site atualiza sozinho.

## Personalização rápida

- **Nome da loja / Instagram / link da planilha:** `js/config.js`
- **Cores:** variáveis no início do arquivo `css/style.css` (ex.: `--brand-1`, `--brand-2`, `--cta-grad`)
- **Texto do rodapé e aviso legal:** `index.html`

## Estrutura dos arquivos

```
index.html              → página principal
css/style.css           → estilos e cores do site
js/config.js            → configurações + produtos de demonstração
js/app.js               → lógica (planilha, filtros, busca, clique de afiliado)
google-apps-script.gs   → código que conecta a planilha ao site
README.md               → este guia
```

Se a Planilha não estiver conectada, o site abre em **modo demonstração** (com produtos de exemplo) e mostra um aviso — basta seguir o passo 2 para ativar de vez.