# Minha Rotina

Aplicação Next.js + React para organizar rotina diária, acompanhar progresso, criar reuniões recorrentes manuais e visualizar eventos do Google Calendar com links de reunião.

## Funcionalidades

- Rotina diária em português com blocos por horário.
- Dias úteis, sábado e domingo com rotinas diferentes.
- Checklist por seção.
- Progresso do dia e streak diário.
- Personalização local de tarefas da rotina.
- Edição de horário dos blocos.
- Exclusão de tarefas dos blocos.
- Reuniões recorrentes manuais com nome, horário, dias da semana e link.
- Integração com Google Calendar via OAuth.
- Leitura de múltiplos calendários Google.
- Detecção de links de reunião em eventos do calendário.
- Criação/atualização de notificações da rotina no Google Calendar.
- Logo e metadados configurados para deploy.

## Stack

- Next.js 15
- React 18
- TypeScript
- CSS puro
- Lucide React
- Google Calendar API

## Rodar localmente

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env.local`:

```bash
cp .env.example .env.local
```

Rode o projeto:

```bash
npm run dev
```

Abra:

```text
http://localhost:3000
```

## Variáveis de ambiente

Configuração recomendada para Google Calendar privado:

```bash
CALENDAR_TIMEZONE="America/Sao_Paulo"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

GOOGLE_CALENDAR_IDS="primary,vinicius.santos@cd2.com.br"
GOOGLE_CLIENT_ID="cole-o-client-id-aqui"
GOOGLE_CLIENT_SECRET="cole-o-client-secret-aqui"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

`GOOGLE_CALENDAR_IDS` aceita um ou mais calendários separados por vírgula. Use `primary` para o calendário principal da conta conectada.

## Google Calendar OAuth

No Google Cloud:

1. Crie ou selecione um projeto.
2. Ative a **Google Calendar API**.
3. Configure a tela de consentimento OAuth.
4. Crie um cliente OAuth do tipo **Aplicativo da Web**.
5. Para rodar localmente, adicione:

```text
Origem JavaScript autorizada:
http://localhost:3000

URI de redirecionamento autorizada:
http://localhost:3000/api/auth/google/callback
```

Depois coloque o `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env.local`.

## Calendários Google

Para usar mais de uma agenda, configure:

```bash
GOOGLE_CALENDAR_IDS="primary,id-do-calendario-2"
```

Para encontrar o ID de uma agenda:

1. Abra o Google Calendar.
2. Passe o mouse sobre a agenda.
3. Clique nos três pontos.
4. Acesse **Configurações e compartilhamento**.
5. Vá em **Integrar agenda**.
6. Copie o **ID da agenda**.

## Notificações da rotina

Depois de conectar o Google Calendar no app, use o botão **Criar notificações da rotina**.

O app cria ou atualiza eventos recorrentes no calendário com:

- título `Rotina: Nome do bloco`;
- horário configurado no app;
- dias da semana da seção;
- lembrete popup 10 minutos antes;
- lista de tarefas do bloco na descrição.

Se você alterar horários ou tarefas, clique novamente no botão para sincronizar.

## Reuniões recorrentes manuais

Use a seção **Reuniões recorrentes** para cadastrar reuniões que não vêm do Google Calendar.

Você informa:

- nome da reunião;
- horário de início;
- horário de fim;
- link;
- dias da semana.

As reuniões aparecem no painel **Agenda** do dia com botão **Entrar na reunião**.

## Persistência

Os dados de rotina personalizados ficam salvos no navegador via `localStorage`.

Chaves usadas:

- `rotina_preferences`
- `rotina_manual_meetings`
- `rotina_completed_dates`
- `rotina_next_YYYY-MM-DD`

## Deploy na Vercel

1. Suba o projeto para o GitHub.
2. Na Vercel, clique em **Add New Project**.
3. Importe o repositório.
4. Framework: **Next.js**.
5. Build command: `npm run build`.
6. Adicione as variáveis de ambiente:

```bash
CALENDAR_TIMEZONE="America/Sao_Paulo"
NEXT_PUBLIC_SITE_URL="https://seu-projeto.vercel.app"

GOOGLE_CALENDAR_IDS="primary,vinicius.santos@cd2.com.br"
GOOGLE_CLIENT_ID="cole-o-client-id-aqui"
GOOGLE_CLIENT_SECRET="cole-o-client-secret-aqui"
GOOGLE_REDIRECT_URI="https://seu-projeto.vercel.app/api/auth/google/callback"
```

7. Faça o deploy.

Depois do deploy, volte no Google Cloud e adicione:

```text
Origem JavaScript autorizada:
https://seu-projeto.vercel.app

URI de redirecionamento autorizada:
https://seu-projeto.vercel.app/api/auth/google/callback
```

Depois faça um novo deploy ou redeploy na Vercel.

## Alternativas de calendário

### API key

Funciona melhor para calendário público ou compartilhado para leitura.

```bash
GOOGLE_CALENDAR_IDS="primary"
GOOGLE_API_KEY="cole-sua-api-key-aqui"
CALENDAR_TIMEZONE="America/Sao_Paulo"
```

Para calendário privado, prefira OAuth.

### Feed `.ics`

Também é possível usar uma URL `.ics`:

```bash
CALENDAR_ICS_URL="cole-a-url-ics-aqui"
CALENDAR_TIMEZONE="America/Sao_Paulo"
```

## Logo

A logo do app fica em:

```text
public/minha-rotina-logo.png
```

Ela é usada no topo da interface, favicon e metadados sociais.

## Scripts

```bash
npm run dev
npm run build
npm run start
```

## Observações

O app não lê diretamente o Calendar do Mac nem aplicativos desktop quando publicado na web. Para deploy online, use Google Calendar, feed `.ics` ou reuniões recorrentes manuais.
