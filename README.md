# Voting Lists

Sistema de criação de listas para votação. Cada usuário pode criar listas, adicionar participantes, cadastrar candidatos (pessoas, objetos, filmes, etc.) e acompanhar os resultados em tempo real. As listas podem ter uma data de expiração ou permanecer abertas indefinidamente.

## Tecnologias

- [Next.js](https://nextjs.org)
- [TypeScript](https://www.typescriptlang.org)
- [Prisma](https://www.prisma.io)
- [PostgreSQL](https://www.postgresql.org)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [NextAuth.js](https://next-auth.js.org)

## Começando

1. Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

2. Inicie o banco de dados (opcional, requer Docker):

```bash
docker compose up -d
```

3. Instale as dependências:

```bash
npm install
```

4. Execute as migrations e o seed:

```bash
npm run db:migrate
npm run db:seed
```

5. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Funcionalidades

- Criação de listas de votação com nome, descrição e data de expiração opcional
- Convite de participantes por email
- Cadastro de candidatos
- Votação restrita aos participantes da lista
- Resultados com ranking e percentuais
- Suporte a temas claro e escuro

## Scripts úteis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera o build de produção
- `npm run db:migrate` - Executa as migrations do Prisma
- `npm run db:seed` - Popula o banco com dados iniciais
- `npm run db:studio` - Abre o Prisma Studio
