# Como enviar este repositório para nero2.0 no GitHub

Nesta máquina não há credenciais Git configuradas para o GitHub. O código já está **commitado**; falta apenas o **push** de um ambiente onde você tenha acesso.

## Opção 1: Push a partir do seu computador (recomendado)

Se você já tem este projeto clonado no seu PC (com Git e GitHub configurados):

```bash
cd /caminho/para/neuroapice   # ou nero2.0, conforme seu clone

# Adicionar o remote nero2 (se ainda não existir)
git remote add nero2 https://github.com/jbapex/nero2.0.git

# Enviar a branch main
git push nero2 main
```

Se o repositório no seu PC estiver desatualizado em relação a esta VPS, atualize primeiro (por exemplo via SCP/rsync da pasta `/root/neuroapice` para o seu PC) e depois rode o `git push nero2 main`.

## Opção 2: Push a partir desta VPS com token

1. No GitHub: **Settings → Developer settings → Personal access tokens**, crie um token com permissão `repo`.
2. Nesta máquina (sem colar o token na linha de comando):

```bash
cd /root/neuroapice
export GITHUB_TOKEN=seu_token_aqui   # só nesta sessão
git push https://jbapex:${GITHUB_TOKEN}@github.com/jbapex/nero2.0.git main
unset GITHUB_TOKEN
```

Ou em uma linha, substituindo `SEU_TOKEN`:  
`git push https://jbapex:SEU_TOKEN@github.com/jbapex/nero2.0.git main`

Não compartilhe o token e não o deixe em scripts versionados.

## Opção 3: Usar SSH nesta VPS

1. Gerar chave SSH: `ssh-keygen -t ed25519 -C "seu@email.com" -f ~/.ssh/id_ed25519 -N ""`
2. Adicionar o conteúdo de `~/.ssh/id_ed25519.pub` em **GitHub → Settings → SSH and GPG keys**.
3. Trocar o remote e dar push:

```bash
cd /root/neuroapice
git remote set-url nero2 git@github.com:jbapex/nero2.0.git
git push nero2 main
```
