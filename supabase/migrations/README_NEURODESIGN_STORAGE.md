# NeuroDesign: upload de imagens no refinamento

Se ao **refinar imagem** (Referência de arte, Imagem para substituir, Imagem para adicionar na cena) aparecer erro ao enviar imagens, o Storage do Supabase precisa do bucket e das políticas corretas.

## O que fazer na sua VPS (Supabase self-hosted)

### 1. Criar o bucket e as políticas

No **Supabase** (na sua VPS: normalmente em **SQL Editor** ou executando o arquivo via `psql`), rode o conteúdo do arquivo:

**`neurodesign_storage_bucket.sql`**

Esse script:

- Cria o bucket **neurodesign** (se ainda não existir)
- Permite que usuários autenticados façam **INSERT** apenas na pasta `{seu_user_id}/projects/...`
- Permite **leitura pública** dos arquivos (para as URLs das imagens funcionarem)
- Permite **UPDATE** e **DELETE** apenas na própria pasta do usuário

### 2. Como executar

**Opção A – Pelo Dashboard do Supabase (se tiver)**

1. Abra o projeto no Supabase (na sua VPS).
2. Vá em **SQL Editor**.
3. Cole o conteúdo de `neurodesign_storage_bucket.sql`.
4. Execute (Run).

**Opção B – Pelo terminal na VPS (psql)**

```bash
# Ajuste usuário, banco e host conforme seu Supabase
psql -U postgres -d postgres -h localhost -f /caminho/para/supabase/migrations/neurodesign_storage_bucket.sql
```

### 3. Conferir

- Em **Storage**: deve existir o bucket **neurodesign**.
- Em **Storage > neurodesign > Policies**: devem aparecer as políticas de INSERT, SELECT, UPDATE e DELETE descritas no script.

Depois disso, tente de novo fazer o upload no refinamento (referência de arte, substituir, adicionar na cena). Se ainda der erro, a mensagem na tela (e no console do navegador, aba Rede) deve ajudar a ver se é bucket, política ou permissão.
